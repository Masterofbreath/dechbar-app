# 💳 Stripe Integration Guide - DechBar App

**Status:** 📝 Documentation (Implementation Later)  
**Date:** 2026-01-14  
**Author:** DechBar Team

---

## 📋 OVERVIEW

Tento dokument popisuje, jak integrovat Stripe platební systém s DechBar App pro podporu monthly/annual subscriptions.

**POZNÁMKA:** Tato integrace se provede později. Tento dokument slouží jako reference pro budoucí implementaci.

---

## 🎯 CÍL

Implementovat Stripe Checkout pro:
- ✅ **SMART Membership** - 249 Kč/měsíc nebo 1,499 Kč/rok
- ✅ **AI COACH Membership** - 490 Kč/měsíc nebo 2,940 Kč/rok
- ✅ **Lifetime Products** - DechBar STUDIO, Výzvy, Akademie

---

## 🔧 STRIPE SETUP

### 1. Vytvoření Products v Stripe Dashboard

#### SMART Membership

**Product:**
- Name: `SMART Membership`
- Description: `Inteligentní doporučení - BOLT tracking, smart tréninky, 50+ programů`
- ID: `prod_smart_membership`

**Prices:**

**Monthly:**
- Amount: `249 CZK`
- Billing period: `Monthly`
- ID: `price_smart_monthly_czk`

**Annual:**
- Amount: `1,499 CZK` (125 Kč/měsíc)
- Billing period: `Yearly`
- ID: `price_smart_annual_czk`

---

#### AI COACH Membership

**Product:**
- Name: `AI COACH Membership`
- Description: `Tvůj osobní AI trenér - AI personalizace, pokročilé analýzy, 100+ programů`
- ID: `prod_ai_coach_membership`

**Prices:**

**Monthly:**
- Amount: `490 CZK`
- Billing period: `Monthly`
- ID: `price_ai_monthly_czk`

**Annual:**
- Amount: `2,940 CZK` (245 Kč/měsíc)
- Billing period: `Yearly`
- ID: `price_ai_annual_czk`

---

### 2. Aktualizace DB s Reálnými Stripe IDs

Po vytvoření Products & Prices v Stripe Dashboard, aktualizuj `modules` table:

```sql
-- Update SMART with real Stripe IDs
UPDATE modules
SET 
  pricing = jsonb_set(
    jsonb_set(
      pricing, 
      '{monthly,stripe_price_id}', 
      '"price_1xxxxxxxxxxxxx"'  -- Replace with real ID
    ),
    '{annual,stripe_price_id}',
    '"price_1yyyyyyyyyyyyy"'  -- Replace with real ID
  )
WHERE id = 'membership-smart';

-- Update AI COACH with real Stripe IDs
UPDATE modules
SET 
  pricing = jsonb_set(
    jsonb_set(
      pricing, 
      '{monthly,stripe_price_id}', 
      '"price_1zzzzzzzzzzzz"'  -- Replace with real ID
    ),
    '{annual,stripe_price_id}',
    '"price_1aaaaaaaaaaaaa"'  -- Replace with real ID
  )
WHERE id = 'membership-ai-coach';
```

---

## 🔗 CHECKOUT FLOW

### Frontend (React)

```typescript
// src/platform/stripe/useCheckout.ts

import { useAuth } from '@/platform/auth/useAuth';
import { supabase } from '@/platform/supabase';

export function useCheckout() {
  const { user } = useAuth();

  const createCheckoutSession = async (
    priceId: string,
    interval: 'monthly' | 'annual'
  ) => {
    if (!user) throw new Error('User not authenticated');

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke(
      'create-checkout-session',
      {
        body: {
          price_id: priceId,
          interval,
          user_id: user.id,
          success_url: `${window.location.origin}/checkout/success`,
          cancel_url: `${window.location.origin}/checkout/cancel`,
        },
      }
    );

    if (error) throw error;

    // Redirect to Stripe Checkout
    window.location.href = data.url;
  };

  return { createCheckoutSession };
}
```

### Landing Page - Pricing Button

```typescript
// src/modules/public-web/components/landing/PricingCard.tsx

import { useCheckout } from '@/platform/stripe/useCheckout';
import { useModulePricing } from '@/platform/api/usePricing';

export function PricingCard({ moduleId, interval }) {
  const { data: module } = useModulePricing(moduleId);
  const { createCheckoutSession } = useCheckout();

  const handleCheckout = async () => {
    const priceId = interval === 'annual'
      ? module.pricing.annual.stripe_price_id
      : module.pricing.monthly.stripe_price_id;

    await createCheckoutSession(priceId, interval);
  };

  return (
    <Button onClick={handleCheckout}>
      {interval === 'annual' ? 'Roční předplatné' : 'Měsíční předplatné'}
    </Button>
  );
}
```

---

## ⚙️ BACKEND (Supabase Edge Functions)

### Create Checkout Session

```typescript
// supabase/functions/create-checkout-session/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  const { price_id, interval, user_id, success_url, cancel_url } = await req.json();

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url,
      cancel_url,
      metadata: {
        user_id,
        interval,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
});
```

---

### Stripe Webhooks Handler

```typescript
// supabase/functions/stripe-webhooks/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

/**
 * Map Stripe Price ID to Plan & Interval
 */
function getPlanFromPriceId(priceId: string): {
  plan: 'SMART' | 'AI_COACH';
  interval: 'monthly' | 'annual';
} | null {
  // Update with your real Price IDs
  const priceMap: Record<string, any> = {
    'price_smart_monthly_czk': { plan: 'SMART', interval: 'monthly' },
    'price_smart_annual_czk': { plan: 'SMART', interval: 'annual' },
    'price_ai_monthly_czk': { plan: 'AI_COACH', interval: 'monthly' },
    'price_ai_annual_czk': { plan: 'AI_COACH', interval: 'annual' },
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
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );

    console.log(`🔔 Webhook: ${event.type}`);

    // ============================================
    // SUBSCRIPTION CREATED
    // ============================================
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0].price.id;
      const planInfo = getPlanFromPriceId(priceId);

      if (!planInfo) {
        console.error('Unknown price ID:', priceId);
        return new Response('Unknown price', { status: 400 });
      }

      const userId = subscription.metadata.user_id;
      if (!userId) {
        console.error('No user_id in metadata');
        return new Response('No user_id', { status: 400 });
      }

      // Update membership
      const { error } = await supabase
        .from('memberships')
        .update({
          plan: planInfo.plan,
          billing_interval: planInfo.interval,
          status: 'active',
          type: 'subscription',
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          purchased_at: new Date(subscription.start_date * 1000).toISOString(),
          expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      console.log(`✅ Subscription created: ${planInfo.plan} (${planInfo.interval})`);
    }

    // ============================================
    // SUBSCRIPTION UPDATED
    // ============================================
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0].price.id;
      const planInfo = getPlanFromPriceId(priceId);

      const { error } = await supabase
        .from('memberships')
        .update({
          plan: planInfo?.plan,
          billing_interval: planInfo?.interval,
          status: subscription.status === 'active' ? 'active' :
                 subscription.status === 'canceled' ? 'cancelled' :
                 subscription.status === 'past_due' ? 'past_due' : 'expired',
          stripe_price_id: priceId,
          expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) throw error;

      console.log(`✅ Subscription updated: ${subscription.id}`);
    }

    // ============================================
    // SUBSCRIPTION DELETED
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

      if (error) throw error;

      console.log(`✅ Subscription deleted: ${subscription.id}`);
    }

    // ============================================
    // INVOICE PAYMENT SUCCEEDED
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

        if (error) throw error;

        console.log(`✅ Payment succeeded: ${subscriptionId}`);
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

        if (error) throw error;

        console.log(`⚠️ Payment failed: ${subscriptionId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400 }
    );
  }
});
```

---

## 🔑 ENVIRONMENT VARIABLES

Add to `.env.local` (DEV) and Supabase Edge Functions (PROD):

```bash
# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx  # For frontend
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx       # For backend/webhooks
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx    # For webhook verification

# Supabase
SUPABASE_URL=https://iqyahebbteiwzwyrtmns.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Stripe Setup
- [ ] Create Stripe account (or use existing)
- [ ] Create Products in Stripe Dashboard (SMART, AI COACH)
- [ ] Create Prices (monthly + annual for each)
- [ ] Copy Price IDs and update DB

### Phase 2: Backend
- [ ] Deploy `create-checkout-session` Edge Function
- [ ] Deploy `stripe-webhooks` Edge Function
- [ ] Add Webhook endpoint to Stripe Dashboard
- [ ] Test webhooks with Stripe CLI

### Phase 3: Frontend
- [ ] Implement `useCheckout` hook
- [ ] Update `PricingCard` component with checkout buttons
- [ ] Create success/cancel pages
- [ ] Test full checkout flow

### Phase 4: Testing
- [ ] Test monthly subscription
- [ ] Test annual subscription
- [ ] Test subscription renewal
- [ ] Test subscription cancellation
- [ ] Test failed payments
- [ ] Verify DB updates

### Phase 5: Production
- [ ] Switch to live Stripe keys
- [ ] Update webhook URL to production
- [ ] Monitor first transactions
- [ ] Set up Stripe alerts

---

## 📚 RELATED DOCS

- **Stripe Docs:** https://stripe.com/docs/billing/subscriptions/overview
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Database Schema:** `/docs/architecture/03_DATABASE.md`
- **Migration Guide:** `/docs/DATABASE_MIGRATION_20260114.md`

---

**Ready for future implementation!** 🚀

*Last updated: 2026-01-14*
