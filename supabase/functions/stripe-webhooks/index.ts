/**
 * Supabase Edge Function: Stripe Webhooks Handler
 *
 * Zpracovává Stripe webhook eventy:
 * - checkout.session.completed → one-time purchase → INSERT user_modules + Ecomail sync
 * - customer.subscription.created/updated/deleted → membership tier management
 * - invoice.payment_succeeded/failed → subscription renewal
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
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

// ============================================================
// MAP: Stripe Price ID → Module info
// ============================================================

function getModuleFromPriceId(priceId: string): {
  module_id: string;
  plan?: 'SMART' | 'AI_COACH';
  interval?: 'monthly' | 'annual';
  payment_type: 'one_time' | 'subscription';
} | null {
  const priceMap: Record<string, any> = {
    // ── One-time products ──────────────────────────────────────
    'price_1T2SBJK0OYr7u1q9HkiaSKYY': {
      module_id: 'digitalni-ticho',
      payment_type: 'one_time',
    },

    // ── Subscriptions (SMART Membership) ──────────────────────
    'price_1Sra65K7en1dcW6HC63iM7bf': {
      module_id: 'membership-smart',
      plan: 'SMART',
      interval: 'monthly',
      payment_type: 'subscription',
    },
    'price_1SraCSK7en1dcW6HFkmAbdIL': {
      module_id: 'membership-smart',
      plan: 'SMART',
      interval: 'annual',
      payment_type: 'subscription',
    },

    // ── Subscriptions (AI COACH Membership) ───────────────────
    'price_1SraHbK7en1dcW6HjYNfiXau': {
      module_id: 'membership-ai-coach',
      plan: 'AI_COACH',
      interval: 'monthly',
      payment_type: 'subscription',
    },
    'price_1SraIaK7en1dcW6HsYyN0Aj9': {
      module_id: 'membership-ai-coach',
      plan: 'AI_COACH',
      interval: 'annual',
      payment_type: 'subscription',
    },
  };

  return priceMap[priceId] ?? null;
}

// ============================================================
// HELPER: Add to Ecomail sync queue
// ============================================================

async function addToEcomailQueue(
  supabase: any,
  userId: string | null,
  email: string,
  eventType: string,
  payload: Record<string, unknown>,
) {
  try {
    await supabase.from('sync_queue').insert({
      user_id: userId,
      email,
      event_type: eventType,
      payload,
      status: 'pending',
    });
    console.log(`📧 Ecomail queue: ${eventType} for ${email}`);
  } catch (err) {
    console.error('⚠️ Failed to add to Ecomail queue:', err);
    // Don't throw — payment already succeeded
  }
}

// ============================================================
// HELPER: Grant module access to user
// ============================================================

async function grantModuleAccess(
  supabase: any,
  userId: string,
  moduleId: string,
  sessionId: string,
) {
  const { error } = await supabase.from('user_modules').upsert(
    {
      user_id: userId,
      module_id: moduleId,
      purchased_at: new Date().toISOString(),
      purchase_type: 'lifetime',
      subscription_status: null,
      current_period_end: null,
      payment_id: sessionId,
      payment_provider: 'stripe',
      stripe_session_id: sessionId,
    },
    { onConflict: 'user_id,module_id' },
  );

  if (error) {
    console.error(`❌ Failed to grant module access: ${moduleId} → user ${userId}`, error);
    throw error;
  }

  console.log(`✅ Module access granted: ${moduleId} → user ${userId}`);
}

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`🔔 Webhook: ${event.type}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ──────────────────────────────────────────────────────────
    // CHECKOUT SESSION COMPLETED
    // ──────────────────────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const isGuest = session.metadata?.is_guest === 'true';
      // Email: přednostně z customer_details (Stripe ho sbírá v checkoutu),
      // fallback na metadata (přihlášený uživatel)
      const email = session.customer_details?.email ?? session.metadata?.email;
      const moduleId = session.metadata?.module_id;
      const stripeCustomerId = session.customer as string;

      if (!email || !moduleId) {
        console.error('❌ Missing email or module_id in session metadata');
        return new Response('Missing metadata', { status: 400 });
      }

      // Určení payment type z price
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;
      const moduleInfo = priceId ? getModuleFromPriceId(priceId) : null;
      const isOneTime = session.mode === 'payment' || moduleInfo?.payment_type === 'one_time';

      console.log(`✅ Checkout completed — guest: ${isGuest}, module: ${moduleId}, one_time: ${isOneTime}`);

      // ── GUEST CHECKOUT: vytvoř Supabase uživatele ────────────
      if (isGuest) {
        try {
          // Zkontroluj, zda user s tímto emailem již existuje
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

          let userId: string;

          if (existingUser) {
            userId = existingUser.id;
            console.log(`ℹ️ User already exists: ${userId}`);
          } else {
            // Vytvoř nového uživatele bez hesla (magic link)
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email,
              email_confirm: true,
              user_metadata: {
                source: 'stripe_checkout',
                module_id: moduleId,
                checkout_session_id: session.id,
              },
            });

            if (createError) throw createError;
            userId = newUser.user.id;
            console.log(`✅ Created user: ${userId}`);

            // Vytvoř membership záznam (ZDARMA default)
            await supabase.from('memberships').insert({
              user_id: userId,
              plan: 'ZDARMA',
              status: 'active',
              type: 'lifetime',
              stripe_customer_id: stripeCustomerId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }).single();
          }

          // Přiřaď modul uživateli
          if (isOneTime && priceId) {
            await grantModuleAccess(supabase, userId, moduleId, session.id);
          }

          // Pošli magic link (přihlašovací email)
          const appUrl = Deno.env.get('VITE_APP_URL') || 'https://app.dechbar.cz';
          await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: {
              redirectTo: `${appUrl}/app?welcome=true&module=${moduleId}`,
            },
          });
          console.log(`✅ Magic link sent to: ${email}`);

          // Ecomail — přidat do PREMIUM listu
          await addToEcomailQueue(supabase, userId, email, 'product_purchased', {
            module_id: moduleId,
            price_czk: lineItems.data[0]?.amount_total ? lineItems.data[0].amount_total / 100 : 990,
            stripe_session_id: session.id,
            is_guest: true,
          });

        } catch (err: any) {
          console.error('❌ Guest registration failed:', err);
          // Neházet — platba proběhla, retry možný
        }
      }

      // ── AUTHENTICATED USER: přiřaď modul ────────────────────
      if (!isGuest) {
        const userId = session.metadata?.user_id;
        if (!userId || userId === 'guest') {
          console.error('❌ No valid user_id for authenticated checkout');
        } else if (isOneTime && priceId) {
          await grantModuleAccess(supabase, userId, moduleId, session.id);

          // Ecomail sync
          await addToEcomailQueue(supabase, userId, email, 'product_purchased', {
            module_id: moduleId,
            stripe_session_id: session.id,
            is_guest: false,
          });
        }
      }
    }

    // ──────────────────────────────────────────────────────────
    // SUBSCRIPTION CREATED
    // ──────────────────────────────────────────────────────────
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0].price.id;
      const moduleInfo = getModuleFromPriceId(priceId);

      if (!moduleInfo || moduleInfo.payment_type !== 'subscription') {
        console.log(`ℹ️ Skipping subscription.created for price ${priceId} (not a subscription or unknown)`);
        return new Response(JSON.stringify({ received: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const userId = subscription.metadata.user_id;
      if (!userId) {
        console.error('❌ No user_id in subscription metadata');
        return new Response('No user_id', { status: 400 });
      }

      await supabase
        .from('memberships')
        .update({
          plan: moduleInfo.plan,
          billing_interval: moduleInfo.interval,
          status: 'active',
          type: 'subscription',
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          purchased_at: new Date(subscription.start_date * 1000).toISOString(),
          expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('user_id', userId);

      console.log(`✅ Subscription created: ${moduleInfo.plan} (${moduleInfo.interval}) → user ${userId}`);
    }

    // ──────────────────────────────────────────────────────────
    // SUBSCRIPTION UPDATED
    // ──────────────────────────────────────────────────────────
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0].price.id;
      const moduleInfo = getModuleFromPriceId(priceId);

      let status: 'active' | 'cancelled' | 'past_due' | 'expired' = 'active';
      if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
        status = 'cancelled';
      } else if (subscription.status === 'past_due') {
        status = 'past_due';
      } else if (subscription.status === 'unpaid' || subscription.status === 'incomplete_expired') {
        status = 'expired';
      }

      await supabase
        .from('memberships')
        .update({
          plan: moduleInfo?.plan ?? 'ZDARMA',
          billing_interval: moduleInfo?.interval ?? null,
          status,
          stripe_price_id: priceId,
          expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
        })
        .eq('stripe_subscription_id', subscription.id);

      console.log(`✅ Subscription updated: ${subscription.id} (${status})`);
    }

    // ──────────────────────────────────────────────────────────
    // SUBSCRIPTION DELETED
    // ──────────────────────────────────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      await supabase
        .from('memberships')
        .update({
          plan: 'ZDARMA',
          billing_interval: null,
          status: 'expired',
          expires_at: new Date().toISOString(),
          cancelled_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      console.log(`✅ Subscription deleted: ${subscription.id} → downgraded to ZDARMA`);
    }

    // ──────────────────────────────────────────────────────────
    // INVOICE PAYMENT SUCCEEDED (Renewal)
    // ──────────────────────────────────────────────────────────
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await supabase
          .from('memberships')
          .update({
            status: 'active',
            expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        console.log(`✅ Invoice paid: ${subscriptionId}`);
      }
    }

    // ──────────────────────────────────────────────────────────
    // INVOICE PAYMENT FAILED
    // ──────────────────────────────────────────────────────────
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        await supabase
          .from('memberships')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subscriptionId);

        console.log(`⚠️ Invoice failed: ${subscriptionId} → past_due`);
      }
    }

    return new Response(
      JSON.stringify({ received: true, event: event.type }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 },
    );

  } catch (err: any) {
    console.error('❌ Webhook error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
