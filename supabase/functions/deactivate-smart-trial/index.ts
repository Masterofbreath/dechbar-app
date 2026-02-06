/**
 * Deactivate SMART Trial - Edge Function
 * 
 * Deaktivuje SMART trial pro všechny trial uživatele
 * Spouští se CRON JOBem: 22. března 2026 v 00:00
 * 
 * Flow:
 * 1. Najde všechny active SMART trial memberships
 * 2. Označí jako expired
 * 3. Users se vrátí na FREE tier
 * 
 * Note: Challenge záznam zůstane dostupný jen pro platící SMART/AI_COACH
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

// =====================================================
// TYPES
// =====================================================

interface TrialMembership {
  id: string;
  user_id: string;
  plan: string;
  type: string;
  status: string;
  expires_at: string;
  metadata: any;
}

interface DeactivationResult {
  success: boolean;
  userId: string;
  membershipId: string;
  error?: string;
}

interface FunctionResponse {
  success: boolean;
  deactivated: number;
  failed: number;
  results: DeactivationResult[];
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

    console.log('🚀 Starting SMART trial deactivation...');

    // 3. Find all active trial memberships for this challenge
    const { data: trialMemberships, error: fetchError } = await supabase
      .from('memberships')
      .select('id, user_id, plan, type, status, expires_at, metadata')
      .eq('plan', SMART_PLAN)
      .eq('type', TRIAL_TYPE)  // 'subscription'
      .eq('status', 'active')
      .eq('metadata->>is_trial', 'true')  // ✅ Filtr na trial v metadata
      .like('metadata->>trial_reason', '%challenge-2026-03%') as { data: TrialMembership[] | null; error: any };

    if (fetchError) {
      console.error('❌ Error fetching trial memberships:', fetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch trial memberships',
          details: fetchError 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!trialMemberships || trialMemberships.length === 0) {
      console.log('ℹ️  No active trial memberships found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          deactivated: 0,
          failed: 0,
          results: [],
          message: 'No active trial memberships found',
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Found ${trialMemberships.length} active trial memberships`);

    // 4. Deactivate each trial
    const results: DeactivationResult[] = [];
    const deactivatedAt = new Date().toISOString();

    for (const membership of trialMemberships) {
      try {
        // Check if user has paid SMART/AI_COACH membership
        const { data: paidMembership } = await supabase
          .from('memberships')
          .select('id, plan, status')
          .eq('user_id', membership.user_id)
          .eq('status', 'active')
          .eq('type', 'subscription')
          .in('plan', ['SMART', 'AI_COACH'])
          .neq('metadata->>is_trial', 'true')  // ✅ NE trial
          .single();

        if (paidMembership) {
          console.log(`ℹ️  User ${membership.user_id} has paid membership, keeping trial inactive`);
          // User má platící membership, jen označíme trial jako expired
          const { error: updateError } = await supabase
            .from('memberships')
            .update({
              status: 'expired',
              metadata: {
                ...membership.metadata,
                expired_at: deactivatedAt,
                expired_by: 'cron-job',
                reason: 'trial-ended-user-has-paid-membership'
              }
            })
            .eq('id', membership.id);

          if (updateError) {
            console.error(`❌ Error updating trial for ${membership.user_id}:`, updateError);
            results.push({
              success: false,
              userId: membership.user_id,
              membershipId: membership.id,
              error: updateError.message
            });
          } else {
            results.push({
              success: true,
              userId: membership.user_id,
              membershipId: membership.id
            });
          }
          continue;
        }

        // User nemá platící membership - deaktivovat trial
        const { error: deactivateError } = await supabase
          .from('memberships')
          .update({
            status: 'expired',
            metadata: {
              ...membership.metadata,
              expired_at: deactivatedAt,
              expired_by: 'cron-job',
              reason: 'trial-ended'
            }
          })
          .eq('id', membership.id);

        if (deactivateError) {
          console.error(`❌ Error deactivating trial for ${membership.user_id}:`, deactivateError);
          results.push({
            success: false,
            userId: membership.user_id,
            membershipId: membership.id,
            error: deactivateError.message
          });
          continue;
        }

        console.log(`✅ Deactivated SMART trial for ${membership.user_id}`);
        results.push({
          success: true,
          userId: membership.user_id,
          membershipId: membership.id
        });

      } catch (error) {
        console.error(`❌ Unexpected error for ${membership.user_id}:`, error);
        results.push({
          success: false,
          userId: membership.user_id,
          membershipId: membership.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // 5. Summary
    const deactivated = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`🎉 Deactivation complete: ${deactivated} deactivated, ${failed} failed`);

    const response: FunctionResponse = {
      success: true,
      deactivated,
      deactivated,
      failed,
      results,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error in deactivate-smart-trial:', error);
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
