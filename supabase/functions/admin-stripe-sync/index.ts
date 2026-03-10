/**
 * Supabase Edge Function: Admin Stripe Sync
 *
 * Vytvoří produkt + price v Stripe a uloží IDs do DB (tabulka modules).
 * Používá se z admin panelu při přidání nového produktu.
 *
 * Auth: vyžaduje platný Supabase JWT s admin rolí (zkontroluje profiles.role = 'admin').
 *
 * Request body:
 * {
 *   moduleId: string,           // ID v tabulce modules
 *   name: string,               // název produktu ve Stripe
 *   description?: string,
 *   priceCzk: number,           // cena v CZK (jako celé číslo = haléře = priceCzk * 100)
 *   priceType: 'lifetime' | 'subscription',
 *   billingInterval?: 'month' | 'year',  // pro subscription
 * }
 *
 * Response:
 * {
 *   stripeProductId: string,
 *   stripePriceId: string,      // pro lifetime
 *   stripePriceIdMonthly?: string,  // pro subscription month
 *   stripePriceIdAnnual?: string,   // pro subscription year
 * }
 *
 * @since 2026-03-10
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── Auth — ověř že volající je admin ─────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Chybí autorizace' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Neplatný token' }, 401);
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return jsonResponse({ error: 'Přístup odepřen — vyžaduje admin roli' }, 403);
    }

    // ── Parse body ───────────────────────────────────────────────
    const body = await req.json();
    const { moduleId, name, description, priceCzk, priceType } = body as {
      moduleId: string;
      name: string;
      description?: string;
      priceCzk: number;
      priceType: 'lifetime' | 'subscription';
    };

    if (!moduleId || !name || !priceCzk || !priceType) {
      return jsonResponse({ error: 'Chybí povinné parametry: moduleId, name, priceCzk, priceType' }, 400);
    }

    // ── Ověř že module existuje ──────────────────────────────────
    const { data: module, error: moduleError } = await adminClient
      .from('modules')
      .select('id, stripe_product_id')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return jsonResponse({ error: `Modul ${moduleId} nenalezen v DB` }, 404);
    }

    // ── Vytvoř Stripe Product ────────────────────────────────────
    let stripeProductId = module.stripe_product_id;

    if (!stripeProductId) {
      const stripeProduct = await stripe.products.create({
        name,
        description: description ?? undefined,
        metadata: { module_id: moduleId },
      });
      stripeProductId = stripeProduct.id;
      console.log(`[admin-stripe-sync] Created Stripe product: ${stripeProductId}`);
    }

    // ── Vytvoř Stripe Price(s) ───────────────────────────────────
    const dbUpdates: Record<string, string> = { stripe_product_id: stripeProductId };

    if (priceType === 'lifetime') {
      const price = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: priceCzk * 100,
        currency: 'czk',
      });
      dbUpdates.stripe_price_id = price.id;
      console.log(`[admin-stripe-sync] Created lifetime price: ${price.id}`);

      // Ulož do DB
      const { error: dbError } = await adminClient
        .from('modules')
        .update(dbUpdates)
        .eq('id', moduleId);

      if (dbError) {
        console.error('[admin-stripe-sync] DB update failed:', dbError.message);
        // Zapíš do webhook_debug_logs jako fallback
        await adminClient.from('webhook_debug_logs').insert({
          step: 'admin_stripe_sync_db_fail',
          message: 'Stripe OK ale DB update selhal',
          data: { moduleId, stripeProductId, stripePriceId: price.id },
          error_message: dbError.message,
        });
        return jsonResponse({
          error: 'Stripe produkt vytvořen, ale DB update selhal. Viz webhook_debug_logs.',
          stripeProductId,
          stripePriceId: price.id,
        }, 500);
      }

      return jsonResponse({ stripeProductId, stripePriceId: price.id });
    }

    // subscription — vytvoř monthly i annual price
    if (priceType === 'subscription') {
      const [monthlyPrice, annualPrice] = await Promise.all([
        stripe.prices.create({
          product: stripeProductId,
          unit_amount: priceCzk * 100,
          currency: 'czk',
          recurring: { interval: 'month' },
        }),
        stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(priceCzk * 100 * 10),  // ≈ 10× monthly (~ 2 měsíce zdarma)
          currency: 'czk',
          recurring: { interval: 'year' },
        }),
      ]);

      dbUpdates.stripe_price_id_monthly = monthlyPrice.id;
      dbUpdates.stripe_price_id_annual = annualPrice.id;
      console.log(`[admin-stripe-sync] Created subscription prices: monthly=${monthlyPrice.id}, annual=${annualPrice.id}`);

      const { error: dbError } = await adminClient
        .from('modules')
        .update(dbUpdates)
        .eq('id', moduleId);

      if (dbError) {
        console.error('[admin-stripe-sync] DB update failed:', dbError.message);
        await adminClient.from('webhook_debug_logs').insert({
          step: 'admin_stripe_sync_db_fail',
          message: 'Stripe OK ale DB update selhal',
          data: { moduleId, stripeProductId, monthlyPriceId: monthlyPrice.id, annualPriceId: annualPrice.id },
          error_message: dbError.message,
        });
        return jsonResponse({
          error: 'Stripe produkt vytvořen, ale DB update selhal. Viz webhook_debug_logs.',
          stripeProductId,
          stripePriceIdMonthly: monthlyPrice.id,
          stripePriceIdAnnual: annualPrice.id,
        }, 500);
      }

      return jsonResponse({
        stripeProductId,
        stripePriceIdMonthly: monthlyPrice.id,
        stripePriceIdAnnual: annualPrice.id,
      });
    }

    return jsonResponse({ error: `Neznámý priceType: ${priceType}` }, 400);
  } catch (err) {
    console.error('[admin-stripe-sync] Unexpected error:', err);
    return jsonResponse({ error: 'Neočekávaná chyba serveru' }, 500);
  }
});
