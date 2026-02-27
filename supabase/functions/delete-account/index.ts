/**
 * Supabase Edge Function: Delete Account
 *
 * Handles full account deletion with Stripe cleanup:
 * 1. Validates JWT (user can only delete their own account)
 * 2. Cancels active Stripe subscription at period end
 *    (user keeps access until end of billing period — they already paid)
 * 3. Deletes auth.users record — CASCADE DELETE automatically removes:
 *    profiles, memberships, user_modules, user_roles, kp_measurements,
 *    track_progress, challenge_progress, referral_codes, referral_events
 *
 * Stripe cancel errors are non-blocking — account deletion proceeds regardless.
 * This ensures the user can always delete their account even if Stripe is unreachable.
 *
 * @package DechBar
 * @since 2026-02-27
 */

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

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // ── 1. Validate JWT — user can only delete their own account ──────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    console.log(`[delete-account] Starting deletion for user: ${userId}`);

    // Admin client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── 2. Load Stripe subscription (if any) ──────────────────────────
    const { data: membership, error: membershipError } = await adminClient
      .from('memberships')
      .select('stripe_subscription_id, stripe_customer_id, status, plan')
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError) {
      console.warn('[delete-account] Could not load membership:', membershipError.message);
    }

    // ── 3. Cancel Stripe subscription at period end (non-blocking) ────
    // cancel_at_period_end = true: user keeps access until they paid for
    if (membership?.stripe_subscription_id && membership.status === 'active') {
      try {
        await stripe.subscriptions.update(membership.stripe_subscription_id, {
          cancel_at_period_end: true,
          metadata: { cancellation_reason: 'user_deleted_account' },
        });
        console.log(
          `[delete-account] Stripe subscription scheduled for cancellation: ${membership.stripe_subscription_id}`,
        );
      } catch (stripeError) {
        // Non-blocking: log and continue with account deletion
        console.error('[delete-account] Stripe cancel failed (continuing):', stripeError);
      }
    } else {
      console.log(
        `[delete-account] No active Stripe subscription to cancel (plan: ${membership?.plan ?? 'none'})`,
      );
    }

    // ── 4. Delete auth user — CASCADE handles all related data ────────
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('[delete-account] Failed to delete user:', deleteError.message);
      throw deleteError;
    }

    console.log(`[delete-account] User deleted successfully: ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[delete-account] Unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
