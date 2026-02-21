/**
 * Supabase Edge Function: Stripe Webhooks Handler
 *
 * Zpracovává Stripe webhook eventy:
 * - checkout.session.completed → one-time purchase → INSERT user_modules + přímý Ecomail sync
 * - customer.subscription.created/updated/deleted → membership tier management
 * - invoice.payment_succeeded/failed → subscription renewal
 *
 * Ecomail fast-path: API voláme přímo (ne přes frontu) → delivery <15s od platby.
 * Fronta (ecomail_sync_queue) slouží jako audit trail a fallback pro CRON.
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
// ECOMAIL: Přímé volání API (fast-path, bypass fronty)
// ============================================================

const ECOMAIL_BASE = 'https://api2.ecomailapp.cz';

// Mapování module_id → Ecomail list IDs
// IN  = zákazníci, kteří zaplatili → uvítací autoresponder
// BEFORE = zadali email, nezaplatili → abandoned cart remarketing
const ECOMAIL_LISTS: Record<string, { in: string; before: string }> = {
  'digitalni-ticho': {
    in:     Deno.env.get('ECOMAIL_LIST_DIGITALNI_TICHO') || '10',
    before: Deno.env.get('ECOMAIL_LIST_DIGITALNI_TICHO_BEFORE') || '11',
  },
};

const ECOMAIL_LIST_UNREG = Deno.env.get('ECOMAIL_LIST_UNREG') || '5';

/**
 * Přihlásí kontakt přímo do Ecomail listu.
 * Volá se synchronně ze stripe-webhooks → delivery <15s od platby.
 */
async function ecomailSubscribe(
  listId: string,
  email: string,
  tags: string[],
  customFields?: Record<string, unknown>,
  triggerAutoresponders = true,
): Promise<void> {
  const apiKey = Deno.env.get('ECOMAIL_API_KEY');
  if (!apiKey) {
    console.warn('⚠️ ECOMAIL_API_KEY not set — skipping direct Ecomail call');
    return;
  }
  const subscriberData: any = { email, tags };
  if (customFields && Object.keys(customFields).length > 0) {
    subscriberData.custom_fields = customFields;
  }
  const resp = await fetch(`${ECOMAIL_BASE}/lists/${listId}/subscribe`, {
    method: 'POST',
    headers: { 'key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscriber_data: subscriberData,
      update_existing: true,
      resubscribe: true,
      trigger_autoresponders: triggerAutoresponders,
      skip_confirmation: true,
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Ecomail subscribe to list ${listId} failed: ${err}`);
  }
}

/**
 * Odhlásí kontakt ze seznamu (pro přesun BEFORE → IN).
 * Neblokující — chyba 404 (kontakt není v listu) je OK.
 */
async function ecomailUnsubscribe(listId: string, email: string): Promise<void> {
  const apiKey = Deno.env.get('ECOMAIL_API_KEY');
  if (!apiKey) return;
  const resp = await fetch(`${ECOMAIL_BASE}/lists/${listId}/unsubscribe`, {
    method: 'POST',
    headers: { 'key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!resp.ok && resp.status !== 404) {
    console.warn(`⚠️ Ecomail unsubscribe from ${listId} failed (non-critical): ${resp.status}`);
  }
}

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
// HELPER: Audit log do Ecomail sync fronty (bez fire-and-forget)
// Fronta slouží jako audit trail a CRON fallback — NE jako primární delivery.
// Primární delivery = přímé volání ecomailSubscribe() výše.
// ============================================================

async function auditEcomailQueue(
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
      status: 'completed', // Označíme jako completed — přímé volání již proběhlo
    });
  } catch (err) {
    // Audit selhání nesmí zastavit zpracování
    console.warn('⚠️ Ecomail audit queue insert failed (non-critical):', err);
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
      // Email: pro guesta preferujeme metadata.email (vědomě zadaný v EmailInputModal),
      // aby Apple Pay / Google Pay email nepřepsal registrační email.
      // Pro přihlášeného uživatele preferujeme customer_details (Stripe ho ověřil).
      const email = isGuest
        ? (session.metadata?.email || session.customer_details?.email)
        : (session.customer_details?.email ?? session.metadata?.email);
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

          // Ecomail fast-path: přímé volání API → delivery <15s od platby
          // 1. Přidej do IN listu produktu (spustí uvítací autoresponder)
          // 2. Odeber z BEFORE listu (pokud tam byl — abandoned cart cleanup)
          // 3. Odeber z UNREG (obecný cleanup)
          const moduleTag = `PRODUCT_${moduleId.toUpperCase().replace(/-/g, '_')}`;
          const purchaseDate = new Date().toISOString().split('T')[0];
          const productLists = ECOMAIL_LISTS[moduleId];
          const inListId = productLists?.in ?? ECOMAIL_LIST_UNREG;
          const beforeListId = productLists?.before;

          try {
            await ecomailSubscribe(
              inListId,
              email,
              ['PRODUCT_PURCHASED', moduleTag, 'STRIPE_BUYER', 'MAGIC_LINK_SENT'],
              { PURCHASE_DATE: purchaseDate, PRODUCT_ID: moduleId, PRICE_CZK: lineItemAmount ? lineItemAmount / 100 : 990 },
              true, // trigger_autoresponders → spustí uvítací sekvenci
            );
            console.log(`✅ Ecomail: ${email} přidán do IN listu ${inListId}`);

            // Odeber z BEFORE listu (abandoned cart) — fire-and-forget, non-critical
            if (beforeListId) {
              ecomailUnsubscribe(beforeListId, email).catch(() => {});
            }
            // Odeber z UNREG — fire-and-forget, non-critical
            ecomailUnsubscribe(ECOMAIL_LIST_UNREG, email).catch(() => {});

            // Audit záznam
            await auditEcomailQueue(supabase, userId, email, 'list_move', {
              from_list_name: 'UNREG', to_list_name: moduleId === 'digitalni-ticho' ? 'DIGITALNI_TICHO' : 'PREMIUM',
              tags: ['PRODUCT_PURCHASED', moduleTag, 'STRIPE_BUYER', 'MAGIC_LINK_SENT'],
            });
          } catch (ecomailErr: any) {
            console.error('❌ Ecomail fast-path failed:', ecomailErr.message);
            // Fallback: vložit do fronty jako pending → CRON doručí do 5 minut
            try {
              await supabase.from('ecomail_sync_queue').insert({
                user_id: userId, email, event_type: 'list_move', status: 'pending',
                payload: {
                  from_list_name: 'UNREG', to_list_name: moduleId === 'digitalni-ticho' ? 'DIGITALNI_TICHO' : 'PREMIUM',
                  contact: { email, custom_fields: { PURCHASE_DATE: purchaseDate, PRODUCT_ID: moduleId } },
                  tags: ['PRODUCT_PURCHASED', moduleTag, 'STRIPE_BUYER'],
                },
              });
            } catch { /* non-critical */ }
          }

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

          // Ecomail fast-path pro přihlášeného uživatele
          const moduleTag = `PRODUCT_${moduleId.toUpperCase().replace(/-/g, '_')}`;
          const purchaseDate = new Date().toISOString().split('T')[0];
          const productLists = ECOMAIL_LISTS[moduleId];
          const inListId = productLists?.in ?? ECOMAIL_LIST_UNREG;
          const beforeListId = productLists?.before;

          try {
            await ecomailSubscribe(
              inListId,
              email,
              ['PRODUCT_PURCHASED', moduleTag, 'STRIPE_BUYER'],
              { PURCHASE_DATE: purchaseDate, PRODUCT_ID: moduleId, PRICE_CZK: lineItemAmount ? lineItemAmount / 100 : 990 },
              true,
            );
            if (beforeListId) ecomailUnsubscribe(beforeListId, email).catch(() => {});
            ecomailUnsubscribe(ECOMAIL_LIST_UNREG, email).catch(() => {});
            await auditEcomailQueue(supabase, userId, email, 'contact_add', {
              list_name: moduleId === 'digitalni-ticho' ? 'DIGITALNI_TICHO' : 'PREMIUM',
              tags: ['PRODUCT_PURCHASED', moduleTag, 'STRIPE_BUYER'],
            });
          } catch (ecomailErr: any) {
            console.error('❌ Ecomail fast-path (auth user) failed:', ecomailErr.message);
            try {
              await supabase.from('ecomail_sync_queue').insert({
                user_id: userId, email, event_type: 'contact_add', status: 'pending',
                payload: {
                  list_name: moduleId === 'digitalni-ticho' ? 'DIGITALNI_TICHO' : 'PREMIUM',
                  contact: { email, custom_fields: { PURCHASE_DATE: purchaseDate, PRODUCT_ID: moduleId } },
                  tags: ['PRODUCT_PURCHASED', moduleTag, 'STRIPE_BUYER'],
                },
              });
            } catch { /* non-critical */ }
          }
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
