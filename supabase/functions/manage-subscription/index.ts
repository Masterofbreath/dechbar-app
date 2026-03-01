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
    if (!action || !['cancel', 'reactivate', 'get_invoices'].includes(action)) {
      return jsonResponse({ error: 'Invalid action. Must be: cancel, reactivate, get_invoices' }, 400);
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

    // ── cancel / reactivate: fetch subscription IDs ────────────────────
    const { data: membership, error: fetchError } = await adminClient
      .from('memberships')
      .select('stripe_subscription_id, status, plan')
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

      // Stripe update — blocking error
      await stripe.subscriptions.update(membership.stripe_subscription_id, {
        cancel_at_period_end: true,
        metadata: { cancellation_source: 'user_self_service' },
      });
      console.log(`[manage-subscription] cancel: Stripe scheduled cancellation for ${membership.stripe_subscription_id}`);

      // DB update — non-blocking
      const { error: dbError } = await adminClient
        .from('memberships')
        .update({ status: 'cancelled' })
        .eq('user_id', userId);

      if (dbError) {
        console.error('[manage-subscription] cancel: DB update failed (non-blocking):', dbError.message);
      } else {
        console.log('[manage-subscription] cancel: DB status updated to cancelled');
      }

      return jsonResponse({ success: true, newStatus: 'cancelled' });
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

      // DB update — non-blocking
      const { error: dbError } = await adminClient
        .from('memberships')
        .update({ status: 'active' })
        .eq('user_id', userId);

      if (dbError) {
        console.error('[manage-subscription] reactivate: DB update failed (non-blocking):', dbError.message);
      } else {
        console.log('[manage-subscription] reactivate: DB status updated to active');
      }

      return jsonResponse({ success: true, newStatus: 'active' });
    }

    return jsonResponse({ error: 'Unknown action' }, 400);

  } catch (err: any) {
    const message = err?.message || 'Internal server error';
    console.error('[manage-subscription] unhandled error:', message);
    return jsonResponse({ error: message }, 500);
  }
});
