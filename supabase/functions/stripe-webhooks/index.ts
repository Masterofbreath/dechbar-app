/**
 * Supabase Edge Function: Stripe Webhooks Handler
 * 
 * Purpose: Handle Stripe webhook events (subscription lifecycle)
 * Events: customer.subscription.created, updated, deleted, invoice.payment_succeeded, etc.
 * Security: Validates webhook signature using STRIPE_WEBHOOK_SECRET
 * 
 * @package DechBar
 * @since 2026-01-20
 */

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

/**
 * Map Stripe Price ID to Module ID and Plan
 */
function getModuleFromPriceId(priceId: string): {
  module_id: string;
  plan: 'SMART' | 'AI_COACH';
  interval: 'monthly' | 'annual';
} | null {
  const priceMap: Record<string, any> = {
    // SMART Membership
    'price_1Sra65K7en1dcW6HC63iM7bf': { module_id: 'membership-smart', plan: 'SMART', interval: 'monthly' },
    'price_1SraCSK7en1dcW6HFkmAbdIL': { module_id: 'membership-smart', plan: 'SMART', interval: 'annual' },
    
    // AI COACH Membership
    'price_1SraHbK7en1dcW6HjYNfiXau': { module_id: 'membership-ai-coach', plan: 'AI_COACH', interval: 'monthly' },
    'price_1SraIaK7en1dcW6HsYyN0Aj9': { module_id: 'membership-ai-coach', plan: 'AI_COACH', interval: 'annual' },
  };

  return priceMap[priceId] || null;
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`🔔 Webhook received: ${event.type}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================
    // CHECKOUT SESSION COMPLETED
    // ============================================
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const isGuest = session.metadata?.is_guest === 'true';
      const email = session.metadata?.email;
      const moduleId = session.metadata?.module_id;
      const interval = session.metadata?.interval;

      console.log(`✅ Checkout completed - Guest: ${isGuest}, Email: ${email}`);

      // Guest checkout: Create Supabase user + send magic link
      if (isGuest && email) {
        try {
          // Create password-less user
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            email_confirm: true,  // Auto-confirm email
            user_metadata: {
              source: 'stripe_checkout',
              module_id: moduleId,
              checkout_session_id: session.id,
            },
          });

          if (createError) {
            console.error('❌ Failed to create user:', createError);
            throw createError;
          }

          const userId = newUser.user.id;
          console.log(`✅ Created guest user: ${userId}`);

          // Create membership record
          await supabase.from('memberships').insert({
            user_id: userId,
            plan: 'ZDARMA',  // Will be upgraded by subscription.created event
            status: 'pending',
            type: 'subscription',
            stripe_customer_id: session.customer as string,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Generate and send magic link
          const appUrl = Deno.env.get('VITE_APP_URL') || 'http://localhost:5173';
          const { data: magicLinkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
              redirectTo: `${appUrl}/app?welcome=true&guest=true`,
            },
          });

          if (linkError) {
            console.error('❌ Failed to generate magic link:', linkError);
          } else {
            console.log(`✅ Magic link sent to: ${email}`);
            // Note: Supabase automatically sends the email
          }

        } catch (err: any) {
          console.error('❌ Guest registration failed:', err);
          // Don't throw - payment was successful, we can retry later
        }
      }

      // Existing users: subscription.created event will handle tier upgrade
      if (!isGuest) {
        console.log(`✅ Checkout completed for existing user, awaiting subscription.created`);
      }
    }

    // ============================================
    // SUBSCRIPTION CREATED
    // ============================================
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0].price.id;
      const moduleInfo = getModuleFromPriceId(priceId);

      if (!moduleInfo) {
        console.error(`❌ Unknown price ID: ${priceId}`);
        return new Response('Unknown price', { status: 400 });
      }

      const userId = subscription.metadata.user_id;
      
      if (!userId) {
        console.error('❌ No user_id in subscription metadata');
        return new Response('No user_id', { status: 400 });
      }

      // Update membership
      const { error } = await supabase
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

      if (error) {
        console.error('❌ Failed to update membership:', error);
        throw error;
      }

      console.log(`✅ Subscription created: ${moduleInfo.plan} (${moduleInfo.interval}) for user ${userId}`);
    }

    // ============================================
    // SUBSCRIPTION UPDATED
    // ============================================
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0].price.id;
      const moduleInfo = getModuleFromPriceId(priceId);

      // Map Stripe status to our status
      let status: 'active' | 'cancelled' | 'past_due' | 'expired' = 'active';
      if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
        status = 'cancelled';
      } else if (subscription.status === 'past_due') {
        status = 'past_due';
      } else if (subscription.status === 'unpaid' || subscription.status === 'incomplete_expired') {
        status = 'expired';
      }

      const { error } = await supabase
        .from('memberships')
        .update({
          plan: moduleInfo?.plan || 'ZDARMA',
          billing_interval: moduleInfo?.interval || null,
          status: status,
          stripe_price_id: priceId,
          expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelled_at: subscription.canceled_at 
            ? new Date(subscription.canceled_at * 1000).toISOString() 
            : null,
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('❌ Failed to update subscription:', error);
        throw error;
      }

      console.log(`✅ Subscription updated: ${subscription.id} (status: ${status})`);
    }

    // ============================================
    // SUBSCRIPTION DELETED (Cancelled)
    // ============================================
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      const { error } = await supabase
        .from('memberships')
        .update({
          plan: 'ZDARMA',
          billing_interval: null,
          status: 'expired',
          type: 'lifetime',
          expires_at: new Date().toISOString(),
          cancelled_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('❌ Failed to delete subscription:', error);
        throw error;
      }

      console.log(`✅ Subscription deleted: ${subscription.id} - User downgraded to ZDARMA`);
    }

    // ============================================
    // INVOICE PAYMENT SUCCEEDED (Renewal)
    // ============================================
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const { error } = await supabase
          .from('memberships')
          .update({
            status: 'active',
            expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (error) {
          console.error('❌ Failed to update on payment success:', error);
          throw error;
        }

        console.log(`✅ Payment succeeded: ${subscriptionId} - Extended to ${new Date(subscription.current_period_end * 1000).toISOString()}`);
      }
    }

    // ============================================
    // INVOICE PAYMENT FAILED
    // ============================================
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        const { error } = await supabase
          .from('memberships')
          .update({
            status: 'past_due',
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (error) {
          console.error('❌ Failed to update on payment failure:', error);
          throw error;
        }

        console.log(`⚠️ Payment failed: ${subscriptionId} - Marked as past_due`);
      }
    }

    return new Response(
      JSON.stringify({ received: true, event: event.type }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (err: any) {
    console.error('❌ Webhook error:', err.message);
    
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
