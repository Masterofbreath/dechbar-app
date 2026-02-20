/**
 * Supabase Edge Function: Create Stripe Checkout Session
 *
 * Podporuje:
 * - One-time payment (mode: 'payment') pro jednorázové produkty (Digitální ticho, série)
 * - Embedded Checkout (ui_mode: 'embedded') → vrací clientSecret
 * - Hosted Checkout (výchozí) → vrací url
 * - Authenticated i guest checkout
 *
 * @package DechBar
 * @since 2026-02-19
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Auth (optional — guest checkout supported) ──────────────
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (authHeader) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      });
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      if (user && !authError) {
        userId = user.id;
        userEmail = user.email ?? null;
      }
    }

    // ── Parse body ────────────────────────────────────────────────
    // Přijímáme camelCase (z frontendu) i snake_case (pro zpětnou kompatibilitu)
    const body = await req.json();
    const priceId: string | undefined = body.priceId ?? body.price_id;
    const moduleId: string | undefined = body.moduleId ?? body.module_id;
    const emailFromBody: string | undefined = body.email;
    const uiMode: string | undefined = body.uiMode ?? body.ui_mode;
    const successUrl: string | undefined = body.successUrl ?? body.success_url;
    const cancelUrl: string | undefined = body.cancelUrl ?? body.cancel_url;

    // ── Validace ──────────────────────────────────────────────────
    if (!priceId || !moduleId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: priceId, moduleId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!userEmail && emailFromBody) {
      userEmail = emailFromBody;
    }

    // ── Stripe Customer ────────────────────────────────────────────
    // Pro přihlášeného uživatele: najdeme/vytvoříme zákazníka
    // Pro hosta: email sbírá Stripe sám v checkoutu — customer vytvoří webhook
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let customerId: string | undefined;

    if (userId && userEmail) {
      const { data: membership } = await supabase
        .from('memberships')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      customerId = membership?.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { supabase_user_id: userId },
        });
        customerId = customer.id;

        await supabase
          .from('memberships')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', userId);
      }
    }
    // Guest: customerId zůstane undefined — Stripe sbírá email v checkoutu

    // ── Determine payment mode ────────────────────────────────────
    // Zkontroluje Stripe price object — one_time vs recurring
    const priceObject = await stripe.prices.retrieve(priceId);
    const paymentMode = priceObject.type === 'recurring' ? 'subscription' : 'payment';

    // ── URL defaults ──────────────────────────────────────────────
    const baseUrl = Deno.env.get('VITE_APP_URL') || 'https://app.dechbar.cz';
    const isEmbedded = uiMode === 'embedded';

    // ── Session config ────────────────────────────────────────────
    const sessionConfig: Record<string, unknown> = {
      payment_method_types: ['card'],  // Apple Pay & Google Pay se zobrazí automaticky v embedded checkoutu (domain registration)
      line_items: [{ price: priceId, quantity: 1 }],
      mode: paymentMode,
      // Stripe sbírá email v checkoutu pro guest — ulož ho v session
      customer_creation: customerId ? undefined : 'always',
      metadata: {
        user_id: userId ?? 'guest',
        module_id: moduleId,
        email: userEmail ?? '',
        is_guest: userId ? 'false' : 'true',
      },
    };

    // Přiřaď existujícího zákazníka jen pokud ho máme
    if (customerId) {
      sessionConfig.customer = customerId;
    }

    // Pre-fill email v Stripe checkout formuláři (z email-first flow)
    if (!customerId && userEmail) {
      sessionConfig.customer_email = userEmail;
    }

    // Subscription-specific data
    if (paymentMode === 'subscription') {
      sessionConfig.subscription_data = {
        metadata: {
          user_id: userId ?? 'guest',
          module_id: moduleId,
          email: userEmail,
          is_guest: userId ? 'false' : 'true',
        },
      };
    }

    // Embedded vs Hosted checkout
    if (isEmbedded) {
      sessionConfig.ui_mode = 'embedded';
      // 'if_required' = platba proběhne v embedded checkoutu, redirect jen pokud platební metoda vyžaduje
      sessionConfig.redirect_on_completion = 'if_required';
      sessionConfig.return_url = successUrl
        ?? `${baseUrl}/digitalni-ticho/dekujeme?session_id={CHECKOUT_SESSION_ID}`;
    } else {
      sessionConfig.success_url = successUrl
        ?? `${baseUrl}/digitalni-ticho/dekujeme?session_id={CHECKOUT_SESSION_ID}`;
      sessionConfig.cancel_url = cancelUrl
        ?? `${baseUrl}/digitalni-ticho`;
    }

    // ── Create session ────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create(sessionConfig as any);

    console.log(
      `✅ Checkout session created: ${session.id} | mode: ${paymentMode} | user: ${userId ?? 'guest:' + userEmail}`,
    );

    // ── Ecomail: Tier 1 — checkout zahájen ────────────────────────
    // Zachytíme email ihned při otevření Stripe formuláře.
    // Pokud uživatel nezaplatí, můžeme cílit remarketing sekvenci.
    if (userEmail) {
      try {
        const moduleTag = `CHECKOUT_STARTED_${(moduleId ?? 'unknown').toUpperCase().replace(/-/g, '_')}`;
        await supabase.from('ecomail_sync_queue').insert({
          user_id: userId ?? null,
          email: userEmail,
          event_type: 'contact_add',
          payload: {
            list_name: 'UNREG',
            contact: {
              email: userEmail,
              custom_fields: {
                CHECKOUT_SOURCE: 'landing_page',
              },
            },
            tags: ['CHECKOUT_STARTED', moduleTag],
          },
        });
        console.log(`📧 Ecomail Tier 1: CHECKOUT_STARTED for ${userEmail}`);
      } catch (ecomailErr) {
        // Non-critical — neblokujeme checkout
        console.warn(`⚠️ Ecomail Tier 1 queue failed (non-critical): ${ecomailErr}`);
      }
    }

    if (isEmbedded) {
      return new Response(
        JSON.stringify({ clientSecret: session.client_secret, session_id: session.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    } else {
      return new Response(
        JSON.stringify({ url: session.url, session_id: session.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

  } catch (error: unknown) {
    console.error('❌ Checkout session error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Failed to create checkout session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
