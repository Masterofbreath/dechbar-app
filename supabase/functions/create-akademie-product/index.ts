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

async function createEcomailList(name: string): Promise<{ id: string | null; error: string | null }> {
  const key = (Deno.env.get('ECOMAIL_API_KEY') || '').trim();
  if (!key) {
    return { id: null, error: 'ECOMAIL_API_KEY není nastavený v Supabase secrets' };
  }

  const body = {
    name,
    from_name: 'DechBar',
    from_email: 'info@dechbar.cz',
    reply_to: 'info@dechbar.cz',
  };

  console.log(`📧 Creating Ecomail list: "${name}", key prefix: ${key.substring(0, 8)}...`);

  try {
    const resp = await fetch(`${ecmailBaseUrl}/lists`, {
      method: 'POST',
      headers: {
        'key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const respText = await resp.text();
    console.log(`📧 Ecomail response for "${name}": status=${resp.status}, body=${respText.substring(0, 500)}`);

    if (!resp.ok) {
      return { id: null, error: `Ecomail HTTP ${resp.status}: ${respText.substring(0, 200)}` };
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(respText);
    } catch {
      return { id: null, error: `Ecomail invalid JSON: ${respText.substring(0, 200)}` };
    }

    // Ecomail vrací { id: number, ... }
    const listId = data?.id ? String(data.id) : null;
    if (!listId) {
      return { id: null, error: `Ecomail: list created but no id in response: ${respText.substring(0, 200)}` };
    }
    console.log(`✅ Ecomail list created: "${name}" → id=${listId}`);
    return { id: listId, error: null };
  } catch (err: any) {
    return { id: null, error: `Ecomail fetch exception: ${err?.message || String(err)}` };
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
    // ── Auth: ověřit uživatele + admin roli ─────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ✅ Správný Supabase Deno pattern:
    // 1) User client (anon key + Authorization header) → pro getUser()
    // 2) Admin client (service role key) → pro DB operace
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (!user || authError) {
      console.error('❌ auth.getUser failed:', authError?.message, '| authHeader present:', !!authHeader);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`✅ Auth OK: user ${user.id}`);

    // Ověřit admin roli přes user_roles tabulku
    const { data: roleData } = await adminClient
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

    console.log(`📥 create-akademie-product called: name=${name}, priceCzk=${priceCzk}, moduleId=${moduleId}`);
    console.log(`🔑 STRIPE_SECRET_KEY present: ${!!Deno.env.get('STRIPE_SECRET_KEY')}, ECOMAIL_API_KEY present: ${!!ecmailApiKey}`);

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
      const { error: stripeUpdateError } = await adminClient
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
      const listInResult = await createEcomailList(`${name} — Zákazníci`);
      const listBeforeResult = await createEcomailList(`${name} — Předobjednávky`);

      result.ecmailListInId = listInResult.id;
      result.ecmailListBeforeId = listBeforeResult.id;

      if (listInResult.id || listBeforeResult.id) {
        const { error: ecmailUpdateError } = await adminClient
          .from('modules')
          .update({
            ...(listInResult.id ? { ecomail_list_in: listInResult.id } : {}),
            ...(listBeforeResult.id ? { ecomail_list_before: listBeforeResult.id } : {}),
          })
          .eq('id', moduleId);

        if (ecmailUpdateError) {
          console.error('❌ Failed to save ecomail list IDs to modules:', ecmailUpdateError);
          result.ecmailError = `Ecomail lists created but failed to save to DB: ${ecmailUpdateError.message}`;
        } else {
          console.log(`✅ Ecomail lists saved: IN=${listInResult.id}, BEFORE=${listBeforeResult.id}`);
        }
      } else {
        // Vrátit přesnou chybu z API
        const errIn = listInResult.error || 'unknown';
        const errBefore = listBeforeResult.error || 'unknown';
        result.ecmailError = errIn === errBefore
          ? errIn
          : `IN: ${errIn} | BEFORE: ${errBefore}`;
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
