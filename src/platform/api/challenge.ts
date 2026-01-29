/**
 * Challenge API - Březnová Dechová Výzva 2026
 * 
 * Funkce pro registraci, magic link a access control
 * Primární vstup: Landing page /vyzva
 * 
 * @package DechBar_App
 * @subpackage Platform/API
 */

import { supabase } from './supabase';

// =====================================================
// TYPES
// =====================================================

export interface ChallengeMagicLinkResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export interface ChallengeAccessStatus {
  hasAccess: boolean;
  accessType: 'during_challenge' | 'after_challenge' | 'no_access';
  requiresUpgrade: boolean;
  message?: string;
}

// =====================================================
// CONSTANTS
// =====================================================

const CHALLENGE_ID = 'challenge-2026-03';
const REGISTRATION_DEADLINE = new Date('2026-02-28T23:59:59+01:00');
const CHALLENGE_START = new Date('2026-03-01T00:00:00+01:00');
const CHALLENGE_END = new Date('2026-03-21T23:59:59+01:00');

// =====================================================
// FUNCTIONS
// =====================================================

/**
 * Send magic link for challenge registration
 * Používá se na landing page /vyzva
 * 
 * @param email - Email uživatele
 * @param kpValue - Naměřená KP hodnota (volitelné, může být 0)
 * @param source - Conversion source (volitelné, default: 'hero_cta')
 * @returns Response s success/error
 */
export async function sendChallengeMagicLink(
  email: string, 
  kpValue: number,
  source?: string
): Promise<ChallengeMagicLinkResponse> {
  try {
    // 1. Check registration deadline (28.2. 23:59)
    const now = new Date();
    
    if (now > REGISTRATION_DEADLINE) {
      return {
        success: false,
        error: 'Registrace do výzvy již skončila. Deadline byl 28. února 2026.'
      };
    }
    
    // 2. Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Zadej prosím platný email'
      };
    }
    
    // 3. KP value is optional (can be 0 if registering without measurement)
    // If KP = 0, we'll use it as "not measured yet"
    const finalKpValue = kpValue > 0 ? kpValue : 0; // Allow 0
    
    // 4. Send magic link (creates or gets existing user)
    const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // 🚀 SOFT LAUNCH: Redirect na děkovnou stránku (ne onboarding)
        emailRedirectTo: `${window.location.origin}/vyzva/dekujeme`,
        // Metadata (použijeme později při full launch)
        data: {
          kp_value: finalKpValue,
          challenge_id: CHALLENGE_ID,
          magic_link_sent_at: now.toISOString(),
          source: 'landing-vyzva' // Tracking odkud přišel
        }
      }
    });
    
    if (authError) {
      console.error('Magic link error:', authError);
      
      // Rate limit error (429)
      if (authError.message?.includes('rate limit') || authError.status === 429) {
        return {
          success: false,
          error: 'Příliš mnoho pokusů. Zkus to za hodinu nebo použij jiný email.'
        };
      }
      
      // SMTP error (500) - email service is down or misconfigured
      if (authError.status === 500 || authError.message?.includes('sending confirmation email')) {
        return {
          success: false,
          error: 'Email se nepodařilo odeslat. Kontaktuj nás přímo na info@dechbar.cz'
        };
      }
      
      // Generic error with contact info
      return {
        success: false,
        error: 'Něco se pokazilo. Zkus to za chvíli znovu nebo nás kontaktuj na info@dechbar.cz'
      };
    }
    
    // 5. Handle challenge registration for BOTH existing and new users
    console.log('[Challenge] Step 5: Checking for existing user profile...');
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();
    
    console.log('[Challenge] Existing user:', existingUser);
    
    // Use existing 'now' from line 57
    const isBeforeDeadline = now <= REGISTRATION_DEADLINE;
    
    if (existingUser) {
      console.log('[Challenge] Path: EXISTING USER');
      // EXISTING USER - check if already registered
      const { data: existingReg } = await supabase
        .from('challenge_registrations')
        .select('id')
        .eq('user_id', existingUser.user_id)
        .eq('challenge_id', CHALLENGE_ID)
        .maybeSingle();
      
      if (existingReg) {
        // Already registered - just resend magic link
        await supabase
          .from('challenge_registrations')
          .update({ 
            magic_link_sent_at: now.toISOString()
          })
          .eq('user_id', existingUser.user_id)
          .eq('challenge_id', CHALLENGE_ID);
      } else {
        // User exists but not registered for challenge - create registration
        await supabase
          .from('challenge_registrations')
          .insert({
            user_id: existingUser.user_id,
            email: email, // ← FIXED: Added for Ecomail trigger
            challenge_id: CHALLENGE_ID,
            kp_value: finalKpValue, // ← FIXED: Added for Ecomail trigger
            conversion_source: source || 'hero_cta', // ← FIXED: Added for Ecomail trigger
            magic_link_sent_at: now.toISOString(),
            smart_trial_eligible: isBeforeDeadline,
            smart_trial_expires_at: isBeforeDeadline ? CHALLENGE_END.toISOString() : null,
            metadata: {
              kp_value: finalKpValue,
              source: 'landing-vyzva',
              registered_before_deadline: isBeforeDeadline
            }
          });
      }
    } else {
      console.log('[Challenge] Path: NEW USER - creating registration with user_id=null');
      // NEW USER - create registration WITHOUT user_id (will be updated in onboarding)
      // This ensures Ecomail tags are sent immediately!
      const { error: insertError } = await supabase
        .from('challenge_registrations')
        .insert({
          user_id: null, // Will be set during onboarding
          email: email,
          challenge_id: CHALLENGE_ID,
          kp_value: finalKpValue,
          conversion_source: source || 'hero_cta',
          magic_link_sent_at: now.toISOString(),
          smart_trial_eligible: isBeforeDeadline,
          smart_trial_expires_at: isBeforeDeadline ? CHALLENGE_END.toISOString() : null,
          metadata: {
            kp_value: finalKpValue,
            source: 'landing-vyzva',
            registered_before_deadline: isBeforeDeadline
          }
        });
      
      if (insertError) {
        console.error('[Challenge] ❌ Failed to create challenge_registration:', insertError);
        // Don't fail the whole flow - user still gets magic link
        // But log the error for debugging
      } else {
        console.log('[Challenge] ✅ Successfully created challenge_registration');
      }
    }
    
    return {
      success: true,
      message: 'Magic link odeslán! Zkontroluj svůj email.'
    };
    
  } catch (error) {
    console.error('sendChallengeMagicLink error:', error);
    return {
      success: false,
      error: 'Neočekávaná chyba. Zkus to prosím znovu.'
    };
  }
}

/**
 * Check if user has access to challenge
 * Time-based access control:
 * - 1.3. - 21.3.: FREE přístup (všichni registrovaní)
 * - 22.3.+: PREMIUM (pouze SMART/AI_COACH)
 * 
 * @param userId - ID uživatele
 * @returns Access status
 */
export async function checkChallengeAccess(
  userId: string
): Promise<ChallengeAccessStatus> {
  try {
    const now = new Date();
    
    // 1. Check if user has challenge module
    const { data: userModule, error: moduleError } = await supabase
      .from('user_modules')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', CHALLENGE_ID)
      .eq('subscription_status', 'active')
      .single();
    
    if (moduleError || !userModule) {
      return {
        hasAccess: false,
        accessType: 'no_access',
        requiresUpgrade: false,
        message: 'Nejsi zaregistrovaný do výzvy'
      };
    }
    
    // 2. BĚHEM VÝZVY (1.3. - 21.3.) - FREE přístup
    if (now >= CHALLENGE_START && now <= CHALLENGE_END) {
      return {
        hasAccess: true,
        accessType: 'during_challenge',
        requiresUpgrade: false,
        message: 'Máš přístup k výzvě (FREE)'
      };
    }
    
    // 3. PO VÝZVĚ (22.3.+) - vyžaduje SMART/AI_COACH
    if (now > CHALLENGE_END) {
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('plan, status')
        .eq('user_id', userId)
        .single();
      
      if (membershipError) {
        return {
          hasAccess: false,
          accessType: 'after_challenge',
          requiresUpgrade: true,
          message: 'Chyba při načítání členství'
        };
      }
      
      const isPremium = membership?.plan === 'SMART' || membership?.plan === 'AI_COACH';
      const isActive = membership?.status === 'active';
      
      if (isPremium && isActive) {
        return {
          hasAccess: true,
          accessType: 'after_challenge',
          requiresUpgrade: false,
          message: 'Máš přístup k záznamu výzvy (SMART/AI_COACH)'
        };
      }
      
      return {
        hasAccess: false,
        accessType: 'after_challenge',
        requiresUpgrade: true,
        message: 'Záznam výzvy je dostupný pouze pro SMART/AI_COACH členy'
      };
    }
    
    // 4. PŘED VÝZVOU (registrace fáze)
    return {
      hasAccess: false,
      accessType: 'no_access',
      requiresUpgrade: false,
      message: 'Výzva začíná 1. března 2026'
    };
    
  } catch (error) {
    console.error('checkChallengeAccess error:', error);
    return {
      hasAccess: false,
      accessType: 'no_access',
      requiresUpgrade: false,
      message: 'Chyba při kontrole přístupu'
    };
  }
}

/**
 * Check if user is registered for challenge
 * Quick check bez time-based logiky
 * 
 * @param userId - ID uživatele
 * @returns boolean
 */
export async function isRegisteredForChallenge(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_modules')
      .select('id')
      .eq('user_id', userId)
      .eq('module_id', CHALLENGE_ID)
      .single();
    
    return !error && !!data;
  } catch (error) {
    console.error('isRegisteredForChallenge error:', error);
    return false;
  }
}

/**
 * Get challenge registration details
 * Vrátí detaily registrace z challenge_registrations table
 * 
 * @param userId - ID uživatele
 * @returns Registration details nebo null
 */
export async function getChallengeRegistration(userId: string) {
  try {
    const { data, error } = await supabase
      .from('challenge_registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', CHALLENGE_ID)
      .single();
    
    if (error) {
      console.error('getChallengeRegistration error:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('getChallengeRegistration error:', error);
    return null;
  }
}
