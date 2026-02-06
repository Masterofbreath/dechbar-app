/**
 * Activate SMART Trial - Edge Function
 * 
 * Aktivuje SMART trial pro všechny eligible uživatele
 * Spouští se CRON JOBem: 1. března 2026 v 00:00
 * 
 * Flow:
 * 1. Najde všechny eligible users (smart_trial_eligible = true)
 * 2. Vytvoří trial membership v `memberships` table
 * 3. Označí jako aktivované v `challenge_registrations`
 * 
 * @package DechBar_App
 * @subpackage Supabase/Functions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// =====================================================
// CONSTANTS
// =====================================================

const CHALLENGE_ID = 'challenge-2026-03';
const SMART_PLAN = 'SMART';
const TRIAL_TYPE = 'subscription';  // ✅ ZMĚNĚNO: subscription místo trial (kvůli DB constraint)
const TRIAL_EXPIRES_AT = '2026-03-21T23:59:59+01:00';

// =====================================================
// TYPES
// =====================================================

interface EligibleUser {
  user_id: string;
  challenge_id: string;
  smart_trial_eligible: boolean;
  smart_trial_activated_at: string | null;
  metadata: any;
}

interface ActivationResult {
  success: boolean;
  userId: string;
  error?: string;
}

interface FunctionResponse {
  success: boolean;
  activated: number;
  failed: number;
  results: ActivationResult[];
  timestamp: string;
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req: Request) => {
  try {
    // 1. Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Initialize Supabase client (ADMIN)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🚀 Starting SMART trial activation...');

    // 3. Find all eligible users
    const { data: eligibleUsers, error: fetchError } = await supabase
      .from('challenge_registrations')
      .select('user_id, challenge_id, smart_trial_eligible, smart_trial_activated_at, metadata')
      .eq('challenge_id', CHALLENGE_ID)
      .eq('smart_trial_eligible', true)
      .is('smart_trial_activated_at', null) as { data: EligibleUser[] | null; error: any };

    if (fetchError) {
      console.error('❌ Error fetching eligible users:', fetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch eligible users',
          details: fetchError 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      console.log('ℹ️  No eligible users found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          activated: 0,
          failed: 0,
          results: [],
          message: 'No eligible users found',
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Found ${eligibleUsers.length} eligible users`);

    // 4. Activate trial for each user
    const results: ActivationResult[] = [];
    const activatedAt = new Date().toISOString();

    for (const user of eligibleUsers) {
      try {
        // Check if membership already exists
        const { data: existingMembership } = await supabase
          .from('memberships')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('type', TRIAL_TYPE)
          .single();

        if (existingMembership) {
          console.log(`⚠️  User ${user.user_id} already has trial membership`);
          results.push({
            success: false,
            userId: user.user_id,
            error: 'Trial membership already exists'
          });
          continue;
        }

        // Create trial membership
        const { error: membershipError } = await supabase
          .from('memberships')
          .insert({
            user_id: user.user_id,
            plan: SMART_PLAN,
            type: TRIAL_TYPE,  // 'subscription' (ne 'trial' kvůli DB constraint)
            status: 'active',
            purchased_at: activatedAt,
            expires_at: TRIAL_EXPIRES_AT,
            billing_interval: 'monthly',  // ✅ REQUIRED by constraint
            metadata: {
              is_trial: true,  // ✅ Označíme jako trial v metadata
              trial_reason: 'challenge-2026-03-early-registration',
              challenge_id: CHALLENGE_ID,
              activated_by: 'cron-job',
              auto_created: true
            }
          });

        if (membershipError) {
          console.error(`❌ Error creating membership for ${user.user_id}:`, membershipError);
          results.push({
            success: false,
            userId: user.user_id,
            error: membershipError.message
          });
          continue;
        }

        // Update challenge_registrations
        const { error: updateError } = await supabase
          .from('challenge_registrations')
          .update({
            smart_trial_activated_at: activatedAt,
            metadata: {
              ...user.metadata,
              smart_trial_activated: true,
              smart_trial_activated_by: 'cron-job'
            }
          })
          .eq('user_id', user.user_id)
          .eq('challenge_id', CHALLENGE_ID);

        if (updateError) {
          console.error(`❌ Error updating registration for ${user.user_id}:`, updateError);
          // Membership created but registration not updated - log but continue
        }

        console.log(`✅ Activated SMART trial for ${user.user_id}`);
        results.push({
          success: true,
          userId: user.user_id
        });

      } catch (error) {
        console.error(`❌ Unexpected error for ${user.user_id}:`, error);
        results.push({
          success: false,
          userId: user.user_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // 5. Summary
    const activated = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`🎉 Activation complete: ${activated} activated, ${failed} failed`);

    const response: FunctionResponse = {
      success: true,
      activated,
      failed,
      results,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error in activate-smart-trial:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
