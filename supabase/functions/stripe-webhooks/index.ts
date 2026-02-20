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
    // LIVE price (990 CZK)
    'price_1T2SBJK0OYr7u1q9HkiaSKYY': {
      module_id: 'digitalni-ticho',
      payment_type: 'one_time',
    },
    // TEST price (990 CZK) — používá se v .env.local / DEV prostředí
    'price_1T2asNK0OYr7u1q9VEmHDEme': {
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
// HELPER: Debug log to DB (pro diagnostiku)
// ============================================================

async function dbLog(
  supabase: any,
  step: string,
  message: string,
  data?: Record<string, unknown>,
  eventId?: string,
  eventType?: string,
  errorMessage?: string,
) {
  try {
    await supabase.from('webhook_debug_logs').insert({
      event_id: eventId,
      event_type: eventType,
      step,
      message,
      data: data ?? null,
      error_message: errorMessage ?? null,
    });
  } catch {
    // Logging failure nesmí zastavit zpracování
  }
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
    await supabase.from('ecomail_sync_queue').insert({
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
// HELPER: Find user by email (handles pagination)
// ============================================================

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
    // constructEventAsync je nutný v Deno/Edge Runtime (SubtleCrypto = async Web Crypto API)
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    console.log(`🔔 Webhook: ${event.type} | ${event.id}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await dbLog(supabase, 'received', `Webhook received: ${event.type}`, {
      event_type: event.type,
      api_version: event.api_version,
    }, event.id, event.type);

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

      await dbLog(supabase, 'session_parsed', 'Session metadata parsed', {
        session_id: session.id,
        session_status: session.status,
        payment_status: session.payment_status,
        is_guest: isGuest,
        email,
        module_id: moduleId,
        customer_id: stripeCustomerId,
        metadata: session.metadata,
        customer_details: session.customer_details,
      }, event.id, event.type);

      if (!email || !moduleId) {
        console.error('❌ Missing email or module_id in session metadata');
        await dbLog(supabase, 'error', 'Missing email or module_id', {
          email,
          module_id: moduleId,
        }, event.id, event.type, 'Missing email or module_id in session metadata');
        return new Response('Missing metadata', { status: 400 });
      }

      // Určení payment type z price
      let priceId: string | undefined;
      let lineItemAmount: number | undefined;
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        priceId = lineItems.data[0]?.price?.id;
        lineItemAmount = lineItems.data[0]?.amount_total ?? undefined;
        await dbLog(supabase, 'line_items', 'Line items fetched', {
          price_id: priceId,
          amount: lineItemAmount,
        }, event.id, event.type);
      } catch (lineItemsErr: any) {
        console.warn(`⚠️ Could not fetch line items (synthetic event?): ${lineItemsErr.message}`);
        await dbLog(supabase, 'line_items_warn', 'Could not fetch line items', {}, event.id, event.type, lineItemsErr.message);
      }
      const moduleInfo = priceId ? getModuleFromPriceId(priceId) : null;
      const isOneTime = session.mode === 'payment' || moduleInfo?.payment_type === 'one_time';

      console.log(`✅ Checkout completed — guest: ${isGuest}, module: ${moduleId}, one_time: ${isOneTime}, price: ${priceId}`);

      // ── GUEST CHECKOUT: vytvoř Supabase uživatele via DB RPC ────────────
      // POZOR: admin.createUser() selhává kvůli trigger chain v Supabase Auth HTTP API
      // Používáme přímou DB funkci create_user_for_purchase (SQL INSERT do auth.users)
      if (isGuest) {
        try {
          await dbLog(supabase, 'guest_start', 'Starting guest user flow', { email, module_id: moduleId }, event.id, event.type);

          const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_for_purchase', {
            p_email: email,
            p_module_id: moduleId,
            p_session_id: session.id,
            p_stripe_customer_id: stripeCustomerId ?? null,
          });

          if (rpcError) {
            await dbLog(supabase, 'rpc_error', 'create_user_for_purchase RPC failed', { email }, event.id, event.type, rpcError.message);
            throw rpcError;
          }

          if (rpcResult?.error) {
            await dbLog(supabase, 'rpc_db_error', 'DB function returned error', { email }, event.id, event.type, rpcResult.error);
            throw new Error(rpcResult.error);
          }

          const userId: string = rpcResult.user_id;
          const isNew: boolean = rpcResult.is_new;
          console.log(`✅ User ready: ${userId} (new: ${isNew})`);
          await dbLog(supabase, 'user_ready', isNew ? 'New user + module access created' : 'Existing user, module access granted', {
            user_id: userId, is_new: isNew, module_id: moduleId,
          }, event.id, event.type);

          // Magic link pro přihlášení uživatele
          const appUrl = Deno.env.get('VITE_APP_URL') || 'https://app.dechbar.cz';
          const { error: magicLinkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: {
              redirectTo: `${appUrl}/app?welcome=true&module=${moduleId}`,
            },
          });
          if (magicLinkError) {
            console.warn(`⚠️ Magic link failed (non-critical): ${magicLinkError.message}`);
            await dbLog(supabase, 'magic_link_warn', 'Magic link failed (non-critical)', {}, event.id, event.type, magicLinkError.message);
          } else {
            console.log(`✅ Magic link sent to: ${email}`);
            await dbLog(supabase, 'magic_link_sent', 'Magic link sent', { email }, event.id, event.type);
          }

          // Ecomail: Tier 2 — zaplatil, čeká na verifikaci emailu
          // contact_add do UNREG (sync-to-ecomail zná tento event type)
          const moduleTag = `PRODUCT_${moduleId.toUpperCase().replace(/-/g, '_')}`;
          const purchaseDate = new Date().toISOString().split('T')[0];
          await addToEcomailQueue(supabase, userId, email, 'contact_add', {
            list_name: 'UNREG',
            contact: {
              email,
              custom_fields: {
                PURCHASE_DATE: purchaseDate,
                PRODUCT_ID: moduleId,
                PRICE_CZK: lineItemAmount ? lineItemAmount / 100 : 990,
              },
            },
            tags: [
              'PRODUCT_PURCHASED',
              moduleTag,
              'STRIPE_BUYER',
              'AWAITING_VERIFICATION',
              'MAGIC_LINK_SENT',
            ],
          });

          await dbLog(supabase, 'guest_done', 'Guest flow completed successfully', { user_id: userId }, event.id, event.type);

        } catch (err: any) {
          console.error('❌ Guest registration failed:', err);
          await dbLog(supabase, 'guest_error', 'Guest registration FAILED', {}, event.id, event.type, err.message ?? String(err));
          // Neházet — platba proběhla, Stripe bude opakovat webhook
        }
      }

      // ── AUTHENTICATED USER: přiřaď modul ────────────────────
      if (!isGuest) {
        const userId = session.metadata?.user_id;
        if (!userId || userId === 'guest') {
          console.error('❌ No valid user_id for authenticated checkout');
          await dbLog(supabase, 'auth_error', 'No valid user_id for authenticated checkout', { user_id: userId }, event.id, event.type);
        } else if (isOneTime) {
          await grantModuleAccess(supabase, userId, moduleId, session.id);

          // Ecomail: authenticated user purchase — přidáme tagy k existujícímu kontaktu
          const moduleTag = `PRODUCT_${moduleId.toUpperCase().replace(/-/g, '_')}`;
          await addToEcomailQueue(supabase, userId, email, 'contact_update', {
            add_tags: ['PRODUCT_PURCHASED', moduleTag, 'STRIPE_BUYER'],
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
