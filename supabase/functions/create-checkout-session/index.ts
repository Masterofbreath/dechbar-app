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
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecret) {
      console.error('❌ STRIPE_SECRET_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: STRIPE_SECRET_KEY missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

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
    console.log('📥 Request body:', JSON.stringify(body));
    const priceId: string | undefined = body.priceId ?? body.price_id;
    const moduleId: string | undefined = body.moduleId ?? body.module_id;
    const emailFromBody: string | undefined = body.email;
    const uiMode: string | undefined = body.uiMode ?? body.ui_mode ?? body.uimode;
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
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (membershipError) {
        console.error('❌ memberships select error:', membershipError);
        throw new Error(`Memberships lookup failed: ${membershipError.message}`);
      }

      customerId = membership?.stripe_customer_id ?? undefined;

      // Ochrana proti live/test mode nesouladu:
      // live customers (bez '_test_') nefungují s test klíčem a naopak.
      // Stripe test customers mají formát cus_xxx ale v test mode odpovídají jen test objekty.
      // Jednodušší řešení: pokud customer neexistuje v aktuálním mode, vytvoříme nového.
      if (customerId) {
        try {
          await stripe.customers.retrieve(customerId);
        } catch {
          console.warn(`⚠️ Customer ${customerId} neexistuje v aktuálním Stripe mode — vytváříme nového`);
          customerId = undefined;
        }
      }

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { supabase_user_id: userId },
        });
        customerId = customer.id;
        await supabase
          .from('memberships')
          .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      }
    }
    // Guest: customerId zůstane undefined — Stripe sbírá email v checkoutu

    // ── Determine payment mode ────────────────────────────────────
    // Zkontroluje Stripe price object — one_time vs recurring
    const priceObject = await stripe.prices.retrieve(priceId);
    const paymentMode = priceObject.type === 'recurring' ? 'subscription' : 'payment';

    // ── URL defaults ──────────────────────────────────────────────
    // APP_BASE_URL (bez VITE_ prefixu — nefunguje v Deno Edge Runtime)
    const baseUrl = Deno.env.get('APP_BASE_URL') || Deno.env.get('VITE_APP_URL') || 'https://www.dechbar.cz';
    const isEmbedded = uiMode === 'embedded';

    // ── Session config ────────────────────────────────────────────
    const sessionConfig: Record<string, unknown> = {
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: paymentMode,
      metadata: {
        user_id: String(userId ?? 'guest'),
        module_id: String(moduleId),
        email: String(userEmail ?? ''),
        is_guest: userId ? 'false' : 'true',
      },
    };

    // customer_creation: POUZE pro payment mode bez zákazníka.
    // Pro subscription mode je ZAKÁZÁNO — Stripe vytvoří zákazníka automaticky.
    if (paymentMode === 'payment' && !customerId) {
      sessionConfig.customer_creation = 'always';
    }

    // Přiřaď existujícího zákazníka jen pokud ho máme
    if (customerId) {
      sessionConfig.customer = customerId;
    }

    // Pre-fill email v Stripe checkout formuláři (z email-first flow)
    if (!customerId && userEmail) {
      sessionConfig.customer_email = userEmail;
    }

    // Subscription-specific data:
    // - trial_period_days: 3 → uživatel má 3 dny zdarma
    // - payment_method_collection: 'always' → karta povinná hned při checkoutu,
    //   platba proběhne až po uplynutí trialu (ne při registraci)
    if (paymentMode === 'subscription') {
      sessionConfig.subscription_data = {
        trial_period_days: 3,
        metadata: {
          user_id: String(userId ?? 'guest'),
          module_id: String(moduleId),
          email: String(userEmail ?? ''),
          is_guest: userId ? 'false' : 'true',
        },
      };
      sessionConfig.payment_method_collection = 'always';
    }

    // Default return/success path per module (no query params — prevents double-? in URL)
    const moduleReturnPath = (() => {
      if (moduleId === 'digitalni-ticho') return '/digitalni-ticho/dekujeme';
      if (paymentMode === 'subscription') return '/muj-ucet';
      return '/';
    })();

    // Embedded vs Hosted checkout
    if (isEmbedded) {
      sessionConfig.ui_mode = 'embedded';
      // Subscription mode s triialem: 'never' — žádný redirect, Stripe potvrdí přímo v embedded formuláři.
      //   V tomto případě NESMÍ být return_url (Stripe to odmítne).
      // Payment mode: 'if_required' — redirect jen pokud platební metoda vyžaduje (3DS apod.)
      //   V tomto případě return_url potřebujeme.
      const redirectMode = paymentMode === 'subscription' ? 'never' : 'if_required';
      sessionConfig.redirect_on_completion = redirectMode;
      if (redirectMode !== 'never') {
        sessionConfig.return_url = successUrl
          ?? `${baseUrl}${moduleReturnPath}?session_id={CHECKOUT_SESSION_ID}`;
      }
    } else {
      sessionConfig.success_url = successUrl
        ?? `${baseUrl}${moduleReturnPath}?session_id={CHECKOUT_SESSION_ID}`;
      sessionConfig.cancel_url = cancelUrl
        ?? `${baseUrl}/`;
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
    const errMsg = (error as any)?.message || 'Failed to create checkout session';
    const errType = (error as any)?.type || '';
    const errCode = (error as any)?.code || '';
    const errParam = (error as any)?.param || '';
    const errStack = (error as any)?.stack || '';
    console.error('❌ Checkout session error:', errMsg);
    console.error('❌ Stripe type:', errType, '| code:', errCode, '| param:', errParam);
    console.error('❌ Stack:', errStack);
    return new Response(
      JSON.stringify({ error: errMsg, stripe_type: errType, stripe_code: errCode, stripe_param: errParam }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
