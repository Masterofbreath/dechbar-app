/**
 * Supabase Edge Function: Create Akademie Product
 *
 * Serverová funkce pro tvorbu nového programu/produktu v Akademii.
 * Zajišťuje, že Stripe API klíče nikdy neopustí server.
 *
 * Flow:
 *   1. Ověří admin roli z user_roles tabulky
 *   2. Vytvoří Stripe product + price
 *   3. Uloží stripe_price_id do modules
 *   4. Vytvoří 2 Ecomail listy (IN + BEFORE)
 *   5. Uloží ecomail_list_in + ecomail_list_before do modules
 *
 * Atomicita:
 *   - DB INSERT (modules + akademie_programs) proběhne PŘED voláním této funkce
 *   - Stripe + Ecomail chyby jsou non-fatal → vrátí se v response, admin může retry
 *
 * @package DechBar
 * @since 2026-02-27
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
const ecmailApiKey = Deno.env.get('ECOMAIL_API_KEY') || '';
const ecmailBaseUrl = 'https://api2.ecomailapp.cz';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// HELPER: Create Ecomail list
// ============================================================

async function createEcomailList(name: string): Promise<string | null> {
  if (!ecmailApiKey) {
    console.warn('⚠️ ECOMAIL_API_KEY not set — skipping list creation');
    return null;
  }

  try {
    const resp = await fetch(`${ecmailBaseUrl}/lists`, {
      method: 'POST',
      headers: {
        'key': ecmailApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replyto: 'info@dechbar.cz',
        name,
        from_name: 'DechBar',
        from_email: 'info@dechbar.cz',
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error(`❌ Ecomail list creation failed for "${name}": ${err}`);
      return null;
    }

    const data = await resp.json();
    // Ecomail vrací { id: number, ... }
    return data?.id ? String(data.id) : null;
  } catch (err) {
    console.error(`❌ Ecomail API error for "${name}":`, err);
    return null;
  }
}

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Auth: ověřit admin roli ─────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (!user || authError) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Ověřit admin roli přes user_roles tabulku
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', user.id)
      .in('role_id', ['admin', 'ceo']);

    if (!roleData || roleData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── Parse body ──────────────────────────────────────────
    const body = await req.json();
    const name: string = body.name;
    const description: string | undefined = body.description;
    const priceCzk: number = body.priceCzk;
    const moduleId: string = body.moduleId;

    if (!name || !priceCzk || !moduleId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, priceCzk, moduleId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const result: {
      stripeProductId: string | null;
      stripePriceId: string | null;
      ecmailListInId: string | null;
      ecmailListBeforeId: string | null;
      stripeError: string | null;
      ecmailError: string | null;
    } = {
      stripeProductId: null,
      stripePriceId: null,
      ecmailListInId: null,
      ecmailListBeforeId: null,
      stripeError: null,
      ecmailError: null,
    };

    // ── Stripe: Vytvoř product + price ─────────────────────
    try {
      const product = await stripe.products.create({
        name,
        ...(description ? { description } : {}),
        metadata: { module_id: moduleId, platform: 'dechbar' },
      });
      result.stripeProductId = product.id;
      console.log(`✅ Stripe product created: ${product.id}`);

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(priceCzk * 100), // CZK → haléře
        currency: 'czk',
        metadata: { module_id: moduleId },
      });
      result.stripePriceId = price.id;
      console.log(`✅ Stripe price created: ${price.id}`);

      // Uložit stripe_price_id do modules
      const { error: stripeUpdateError } = await supabase
        .from('modules')
        .update({ stripe_price_id: price.id })
        .eq('id', moduleId);

      if (stripeUpdateError) {
        console.error('❌ Failed to save stripe_price_id to modules:', stripeUpdateError);
        result.stripeError = `Stripe product created (${price.id}) but failed to save to DB: ${stripeUpdateError.message}`;
      }
    } catch (stripeErr: any) {
      console.error('❌ Stripe error:', stripeErr);
      result.stripeError = stripeErr?.message || 'Stripe API error';
    }

    // ── Ecomail: Vytvoř 2 listy ─────────────────────────────
    try {
      const listInId = await createEcomailList(`${name} — Zákazníci`);
      const listBeforeId = await createEcomailList(`${name} — Předobjednávky`);

      result.ecmailListInId = listInId;
      result.ecmailListBeforeId = listBeforeId;

      if (listInId || listBeforeId) {
        const { error: ecmailUpdateError } = await supabase
          .from('modules')
          .update({
            ...(listInId ? { ecomail_list_in: listInId } : {}),
            ...(listBeforeId ? { ecomail_list_before: listBeforeId } : {}),
          })
          .eq('id', moduleId);

        if (ecmailUpdateError) {
          console.error('❌ Failed to save ecomail list IDs to modules:', ecmailUpdateError);
          result.ecmailError = `Ecomail lists created but failed to save to DB: ${ecmailUpdateError.message}`;
        } else {
          console.log(`✅ Ecomail lists created: IN=${listInId}, BEFORE=${listBeforeId}`);
        }
      } else {
        result.ecmailError = 'Ecomail lists not created — check ECOMAIL_API_KEY and API availability';
      }
    } catch (ecmailErr: any) {
      console.error('❌ Ecomail error:', ecmailErr);
      result.ecmailError = ecmailErr?.message || 'Ecomail API error';
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err: any) {
    console.error('❌ create-akademie-product error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
