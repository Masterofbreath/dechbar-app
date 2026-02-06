/**
 * Batch Sync Engagement - Edge Function
 * 
 * Aktualizuje engagement metriky pro všechny uživatele (bulk).
 * Spouští se CRON JOBem každých 6 hodin.
 * 
 * Flow:
 * 1. Calculate metrics for all users (hours, exercises, streak)
 * 2. Queue updates do sync_queue
 * 3. Update KP categories and engagement tiers
 * 
 * @package DechBar_App
 * @subpackage Supabase/Functions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// =====================================================
// TYPES
// =====================================================

interface UserMetrics {
  user_id: string;
  email: string;
  hours_breathed: number;
  exercises_completed: number;
  last_exercise_date: string | null;
  current_streak: number;
  longest_streak: number;
  kp_value: number | null;
  kp_first: number | null;
  kp_improvement: number | null;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Categorize KP value into tag
 */
function categorizeKP(kpValue: number | null): string {
  if (kpValue === null) return 'KP_NOT_MEASURED';
  if (kpValue <= 10) return 'KP_CRITICAL';
  if (kpValue <= 20) return 'KP_POOR';
  if (kpValue <= 30) return 'KP_AVERAGE';
  if (kpValue <= 40) return 'KP_GOOD';
  return 'KP_EXCELLENT';
}

/**
 * Categorize engagement tier
 */
function categorizeEngagement(hoursBreathed: number): string {
  if (hoursBreathed === 0) return 'ENGAGEMENT_NONE';
  if (hoursBreathed < 5) return 'ENGAGEMENT_LOW';
  if (hoursBreathed < 20) return 'ENGAGEMENT_MEDIUM';
  return 'ENGAGEMENT_HIGH';
}

/**
 * Calculate user metrics from database
 */
async function calculateUserMetrics(supabase: any, userId: string): Promise<UserMetrics | null> {
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, metadata')
    .eq('user_id', userId)
    .single();
  
  if (profileError || !profile) {
    return null;
  }
  
  // Get email from auth.users
  const { data: authUser, error: authError } = await supabase
    .from('auth.users')
    .select('email')
    .eq('id', userId)
    .single();
  
  if (authError || !authUser) {
    return null;
  }
  
  // Calculate hours breathed (sum of all exercise durations)
  // Note: This is a placeholder - adjust based on your actual schema
  const { data: exercises } = await supabase
    .from('exercise_sessions')
    .select('duration_minutes')
    .eq('user_id', userId);
  
  const hoursBreathed = exercises
    ? exercises.reduce((sum: number, ex: any) => sum + (ex.duration_minutes || 0), 0) / 60
    : 0;
  
  const exercisesCompleted = exercises ? exercises.length : 0;
  
  // Get last exercise date
  const { data: lastExercise } = await supabase
    .from('exercise_sessions')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  // Get KP metrics
  const kpValue = profile.metadata?.kp_value || null;
  const kpFirst = profile.metadata?.kp_first || kpValue;
  const kpImprovement = (kpValue && kpFirst) ? (kpValue - kpFirst) : null;
  
  return {
    user_id: userId,
    email: authUser.email,
    hours_breathed: hoursBreathed,
    exercises_completed: exercisesCompleted,
    last_exercise_date: lastExercise?.created_at || null,
    current_streak: 0, // TODO: Calculate streak
    longest_streak: 0, // TODO: Calculate streak
    kp_value: kpValue,
    kp_first: kpFirst,
    kp_improvement: kpImprovement
  };
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
    
    console.log('[Batch Sync] 🚀 Starting engagement metrics sync...');
    
    // 3. Get all active users (registered for challenge or have exercises)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id')
      .not('user_id', 'is', null);
    
    if (usersError) {
      throw usersError;
    }
    
    if (!users || users.length === 0) {
      console.log('[Batch Sync] ℹ️ No users to process');
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: 'No users found'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[Batch Sync] 📦 Processing ${users.length} users`);
    
    // 4. Process each user
    let queued = 0;
    let errors = 0;
    
    for (const user of users) {
      try {
        // Calculate metrics
        const metrics = await calculateUserMetrics(supabase, user.user_id);
        
        if (!metrics) {
          errors++;
          continue;
        }
        
        // Queue metrics update
        await supabase.from('ecomail_sync_queue').insert({
          user_id: metrics.user_id,
          email: metrics.email,
          event_type: 'metrics_update',
          payload: {
            custom_fields: {
              HOURS_BREATHED: metrics.hours_breathed,
              EXERCISES_COMPLETED: metrics.exercises_completed,
              LAST_EXERCISE_DATE: metrics.last_exercise_date?.split('T')[0] || null,
              CURRENT_STREAK: metrics.current_streak,
              LONGEST_STREAK: metrics.longest_streak,
              KP_VALUE: metrics.kp_value,
              KP_IMPROVEMENT: metrics.kp_improvement
            },
            update_tags: {
              remove: ['KP_*', 'ENGAGEMENT_*'], // Pattern for removing old tags
              add: [
                categorizeKP(metrics.kp_value),
                categorizeEngagement(metrics.hours_breathed)
              ]
            }
          }
        });
        
        queued++;
      } catch (error) {
        console.error(`[Batch Sync] ❌ Failed to process user ${user.user_id}:`, error);
        errors++;
      }
    }
    
    console.log(`[Batch Sync] ✅ Completed: ${queued} queued, ${errors} errors`);
    
    // 5. Return response
    return new Response(
      JSON.stringify({
        success: true,
        total_users: users.length,
        queued,
        errors,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Batch Sync] ❌ Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/* =====================================================
 * DEPLOYMENT
 * =====================================================
 * 
 * supabase functions deploy batch-sync-engagement
 * 
 * CRON SETUP:
 * SELECT cron.schedule(
 *   'ecomail-batch-sync',
 *   '0 */6 * * *', -- Every 6 hours
 *   $$SELECT net.http_post(
 *     url:='https://YOUR_PROJECT.supabase.co/functions/v1/batch-sync-engagement',
 *     headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
 *   )$$
 * );
 * 
 * ===================================================== */
