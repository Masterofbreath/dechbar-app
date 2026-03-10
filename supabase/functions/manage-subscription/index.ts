/**
 * Supabase Edge Function: Manage Subscription
 *
 * Handles subscription lifecycle actions for the /muj-ucet web account page:
 *   - cancel:       schedule cancellation at period end (cancel_at_period_end: true)
 *   - reactivate:   undo cancellation (cancel_at_period_end: false)
 *   - get_invoices: fetch last 5 paid invoices for the customer
 *
 * Auth pattern: userClient (anon key + JWT) for getUser(), adminClient (service role) for DB.
 * Stripe errors in cancel/reactivate are blocking. DB update errors are non-blocking.
 *
 * @package DechBar
 * @since 2026-03-01
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // ── Auth: validate JWT ─────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Missing authorization' }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const userId = user.id;

    // ── Parse action ───────────────────────────────────────────────────
    let body: { action?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const action = body?.action;
    if (!action || !['cancel', 'reactivate', 'get_invoices', 'change_interval'].includes(action)) {
      return jsonResponse({ error: 'Invalid action. Must be: cancel, reactivate, get_invoices, change_interval' }, 400);
    }

    console.log(`[manage-subscription] action=${action}, userId=${userId}`);

    // ── get_invoices ───────────────────────────────────────────────────
    if (action === 'get_invoices') {
      const { data: membership, error: membershipError } = await adminClient
        .from('memberships')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (membershipError) {
        console.warn('[manage-subscription] get_invoices: could not fetch membership:', membershipError.message);
        return jsonResponse({ invoices: [] });
      }

      if (!membership?.stripe_customer_id) {
        console.log('[manage-subscription] get_invoices: no stripe_customer_id, returning empty');
        return jsonResponse({ invoices: [] });
      }

      try {
        const invoiceList = await stripe.invoices.list({
          customer: membership.stripe_customer_id,
          limit: 5,
          status: 'paid',
        });

        const invoices = invoiceList.data.map((inv: any) => ({
          id: inv.id,
          date: new Date(inv.created * 1000).toISOString(),
          amount_czk: inv.amount_paid / 100,
          description: inv.lines?.data?.[0]?.description ?? inv.metadata?.plan ?? 'Předplatné DechBar',
          pdf_url: inv.invoice_pdf ?? null,
          status: inv.status,
        }));

        console.log(`[manage-subscription] get_invoices: found ${invoices.length} invoices`);
        return jsonResponse({ invoices });
      } catch (stripeErr: any) {
        // Non-blocking: invoice fetch failure should not break the page
        console.error('[manage-subscription] get_invoices Stripe error (non-blocking):', stripeErr?.message);
        return jsonResponse({ invoices: [] });
      }
    }

    // ── cancel / reactivate / change_interval: fetch subscription IDs ─
    const { data: membership, error: fetchError } = await adminClient
      .from('memberships')
      .select('stripe_subscription_id, status, plan, billing_interval')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('[manage-subscription] failed to fetch membership:', fetchError.message);
      return jsonResponse({ error: 'Nepodařilo se načíst data předplatného' }, 500);
    }

    if (!membership?.stripe_subscription_id) {
      return jsonResponse({ error: 'Nemáš aktivní předplatné se Stripe ID' }, 400);
    }

    // ── cancel ─────────────────────────────────────────────────────────
    if (action === 'cancel') {
      if (membership.status !== 'active') {
        return jsonResponse({ error: 'Předplatné již není aktivní' }, 400);
      }

      // Stripe update — blocking error; cancel_at_period_end=true = zruší se na konci periody
      const updatedSub = await stripe.subscriptions.update(membership.stripe_subscription_id, {
        cancel_at_period_end: true,
        metadata: { cancellation_source: 'user_self_service' },
      });
      console.log(`[manage-subscription] cancel: Stripe scheduled cancellation for ${membership.stripe_subscription_id}`);

      // Stripe vrátí cancel_at = timestamp konce periody — uložíme jako expires_at do DB
      const cancelAt = updatedSub.cancel_at
        ? new Date(updatedSub.cancel_at * 1000).toISOString()
        : null;

      // DB update — non-blocking; filtrujeme na stripe_subscription_id abychom nepřepsali historické záznamy
      const { error: dbError } = await adminClient
        .from('memberships')
        .update({
          status: 'cancelled',
          ...(cancelAt ? { expires_at: cancelAt } : {}),
        })
        .eq('user_id', userId)
        .eq('stripe_subscription_id', membership.stripe_subscription_id);

      if (dbError) {
        console.error('[manage-subscription] cancel: DB update failed (non-blocking):', dbError.message);
      } else {
        console.log('[manage-subscription] cancel: DB status=cancelled, expires_at=', cancelAt);
      }

      return jsonResponse({ success: true, newStatus: 'cancelled', expiresAt: cancelAt });
    }

    // ── reactivate ─────────────────────────────────────────────────────
    if (action === 'reactivate') {
      if (membership.status !== 'cancelled') {
        return jsonResponse({ error: 'Předplatné není ve stavu zrušeno' }, 400);
      }

      // Stripe update — blocking error
      await stripe.subscriptions.update(membership.stripe_subscription_id, {
        cancel_at_period_end: false,
      });
      console.log(`[manage-subscription] reactivate: Stripe reactivated ${membership.stripe_subscription_id}`);

      // DB update — non-blocking; filtrujeme na stripe_subscription_id
      const { error: dbError } = await adminClient
        .from('memberships')
        .update({ status: 'active' })
        .eq('user_id', userId)
        .eq('stripe_subscription_id', membership.stripe_subscription_id);

      if (dbError) {
        console.error('[manage-subscription] reactivate: DB update failed (non-blocking):', dbError.message);
      } else {
        console.log('[manage-subscription] reactivate: DB status updated to active');
      }

      return jsonResponse({ success: true, newStatus: 'active' });
    }

    // ── change_interval ────────────────────────────────────────────────
    // Přepne předplatné z monthly na annual (nebo naopak).
    // Stripe okamžitě vystaví poměrnou fakturu (proration_behavior: 'always_invoice').
    if (action === 'change_interval') {
      const newInterval: string | undefined = (body as any)?.new_interval;
      if (!newInterval || !['monthly', 'annual'].includes(newInterval)) {
        return jsonResponse({ error: 'Chybí nebo neplatný parametr new_interval (monthly | annual)' }, 400);
      }

      if (membership.status !== 'active') {
        return jsonResponse({ error: 'Předplatné není aktivní' }, 400);
      }

      if (membership.billing_interval === newInterval) {
        return jsonResponse({ error: `Předplatné je již na intervalu ${newInterval}` }, 400);
      }

      // Načti Price IDs z DB (single source of truth)
      const { data: moduleData, error: moduleError } = await adminClient
        .from('modules')
        .select('stripe_price_id_monthly, stripe_price_id_annual')
        .eq('id', membership.plan === 'AI_COACH' ? 'membership-ai-coach' : 'membership-smart')
        .single();

      if (moduleError || !moduleData) {
        console.error('[manage-subscription] change_interval: DB lookup selhal:', moduleError?.message);
        return jsonResponse({ error: 'Nelze načíst Price ID z databáze' }, 503);
      }

      const priceIdMap: Record<string, string | null> = {
        monthly: moduleData.stripe_price_id_monthly,
        annual:  moduleData.stripe_price_id_annual,
      };

      const newPriceId = priceIdMap[newInterval];
      if (!newPriceId) {
        return jsonResponse({ error: 'Nenalezeno Price ID pro nový interval v DB' }, 400);
      }

      // Načti aktuální subscription item ID
      const subscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id);
      const itemId = subscription.items.data[0]?.id;
      if (!itemId) {
        return jsonResponse({ error: 'Stripe subscription neobsahuje žádné položky' }, 500);
      }

      // Aktualizuj subscription — Stripe vystaví poměrnou fakturu okamžitě
      await stripe.subscriptions.update(membership.stripe_subscription_id, {
        items: [{ id: itemId, price: newPriceId }],
        proration_behavior: 'always_invoice',
      });
      console.log(`[manage-subscription] change_interval: ${membership.billing_interval} → ${newInterval} (${newPriceId})`);

      // DB update — non-blocking; filtrujeme na stripe_subscription_id
      const { error: dbError } = await adminClient
        .from('memberships')
        .update({
          billing_interval: newInterval,
          stripe_price_id: newPriceId,
        })
        .eq('user_id', userId)
        .eq('stripe_subscription_id', membership.stripe_subscription_id);

      if (dbError) {
        console.error('[manage-subscription] change_interval: DB update failed (non-blocking):', dbError.message);
      } else {
        console.log('[manage-subscription] change_interval: DB billing_interval updated');
      }

      return jsonResponse({ success: true, newInterval });
    }

    return jsonResponse({ error: 'Unknown action' }, 400);

  } catch (err: any) {
    const message = err?.message || 'Internal server error';
    console.error('[manage-subscription] unhandled error:', message);
    return jsonResponse({ error: message }, 500);
  }
});
