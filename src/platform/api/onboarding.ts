/**
 * Onboarding API - Challenge Registration Completion
 * 
 * Funkce pro dokončení onboardingu po kliknutí na magic link
 * Zapíše registraci do DB a přiřadí challenge modul
 * 
 * @package DechBar_App
 * @subpackage Platform/API
 */

import { supabase } from './supabase';

// =====================================================
// TYPES
// =====================================================

export interface CompleteChallengeOnboardingData {
  name: string;
  motivations: string[];
  password: string;
}

export interface CompleteChallengeOnboardingResponse {
  success: boolean;
  error?: string;
  userId?: string;
}

// =====================================================
// CONSTANTS
// =====================================================

const CHALLENGE_ID = 'challenge-2026-03';
const REGISTRATION_DEADLINE = new Date('2026-02-28T23:59:59+01:00');
const SMART_TRIAL_EXPIRES_AT = new Date('2026-03-21T23:59:59+01:00');

// =====================================================
// FUNCTIONS
// =====================================================

/**
 * Complete challenge onboarding
 * Volá se po kliknutí na magic link a vyplnění onboarding formu
 * 
 * Flow:
 * 1. Získá user metadata z magic linku
 * 2. Zapíše do challenge_registrations
 * 3. Přiřadí challenge modul (user_modules)
 * 4. Nastaví heslo
 * 5. Aktualizuje profil
 * 
 * @param data - Onboarding data (jméno, motivace, heslo)
 * @returns Response s success/error
 */
export async function completeChallengeOnboarding(
  data: CompleteChallengeOnboardingData
): Promise<CompleteChallengeOnboardingResponse> {
  try {
    // 1. Get current user (z magic link session)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Nejsi přihlášen. Klikni znovu na magic link.'
      };
    }
    
    const userId = user.id;
    const email = user.email!;
    
    // 2. Get metadata z magic linku
    const kpValue = user.user_metadata?.kp_value;
    const magicLinkSentAt = user.user_metadata?.magic_link_sent_at;
    const source = user.user_metadata?.source || 'unknown';
    
    if (!kpValue) {
      return {
        success: false,
        error: 'Chybí KP hodnota. Registruj se znovu.'
      };
    }
    
    // 3. Check if already completed
    const { data: existingRegistration } = await supabase
      .from('challenge_registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_id', CHALLENGE_ID)
      .single();
    
    if (existingRegistration) {
      return {
        success: false,
        error: 'Onboarding už byl dokončen'
      };
    }
    
    // 4. Check if still eligible for SMART trial
    const clickedAt = new Date();
    const isEligibleForSmartTrial = clickedAt <= REGISTRATION_DEADLINE;
    
    // 5. Update existing challenge registration (created during magic link) or create new
    const { data: existingReg } = await supabase
      .from('challenge_registrations')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();
    
    if (existingReg) {
      // UPDATE existing registration with user_id + onboarding data
      const { error: updateError } = await supabase
        .from('challenge_registrations')
        .update({
          user_id: userId, // Set user_id now
          magic_link_clicked_at: clickedAt.toISOString(),
          onboarding_completed_at: clickedAt.toISOString(),
          metadata: {
            ...(existingReg as any).metadata, // Preserve existing metadata
            name: data.name,
            motivations: data.motivations
          }
        })
        .eq('id', existingReg.id);
      
      if (updateError) {
        console.error('Registration update error:', updateError);
        return {
          success: false,
          error: 'Chyba při aktualizaci registrace'
        };
      }
    } else {
      // FALLBACK: Create new registration (shouldn't happen normally)
      const { error: registrationError } = await supabase
        .from('challenge_registrations')
        .insert({
          user_id: userId,
          email: user.email,
          challenge_id: CHALLENGE_ID,
          kp_value: kpValue,
          conversion_source: source || 'hero_cta',
          magic_link_sent_at: magicLinkSentAt || clickedAt.toISOString(),
          magic_link_clicked_at: clickedAt.toISOString(),
          onboarding_completed_at: clickedAt.toISOString(),
          smart_trial_eligible: isEligibleForSmartTrial,
          smart_trial_expires_at: SMART_TRIAL_EXPIRES_AT.toISOString(),
          metadata: {
            kp_value: kpValue,
            source: source,
            registered_before_deadline: isEligibleForSmartTrial,
            name: data.name,
            motivations: data.motivations
          }
        });
      
      if (registrationError) {
        console.error('Registration error:', registrationError);
        return {
          success: false,
          error: 'Chyba při záznamu registrace'
        };
      }
    }
    
    // 6. Assign challenge module
    const { error: moduleError } = await supabase
      .from('user_modules')
      .insert({
        user_id: userId,
        module_id: CHALLENGE_ID,
        purchase_type: 'lifetime',
        purchased_at: clickedAt.toISOString(),
        expires_at: null, // Lifetime, ale s time-based access
        subscription_status: 'active',
        metadata: {
          challenge_access_start: '2026-03-01T00:00:00+01:00',
          challenge_access_end: '2026-03-21T23:59:59+01:00',
          smart_trial_eligible: isEligibleForSmartTrial,
          kp_value: kpValue
        }
      });
    
    if (moduleError) {
      console.error('Module assignment error:', moduleError);
      // Nebudeme failovat, user je zaregistrovaný
    }
    
    // 7. Set password
    const { error: passwordError } = await supabase.auth.updateUser({
      password: data.password
    });
    
    if (passwordError) {
      console.error('Password set error:', passwordError);
      return {
        success: false,
        error: 'Chyba při nastavení hesla'
      };
    }
    
    // 8. Update/Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        full_name: data.name,
        updated_at: clickedAt.toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (profileError) {
      console.error('Profile update error:', profileError);
      // Nebudeme failovat
    }
    
    console.log('✅ Challenge onboarding completed:', {
      userId,
      email,
      challengeId: CHALLENGE_ID,
      smartTrialEligible: isEligibleForSmartTrial
    });
    
    return {
      success: true,
      userId: userId
    };
    
  } catch (error) {
    console.error('completeChallengeOnboarding error:', error);
    return {
      success: false,
      error: 'Neočekávaná chyba. Zkus to prosím znovu.'
    };
  }
}

/**
 * Get onboarding metadata from current user
 * Helper pro získání KP hodnoty z magic link metadata
 * 
 * @returns Metadata nebo null
 */
export async function getOnboardingMetadata() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    return {
      kpValue: user.user_metadata?.kp_value,
      magicLinkSentAt: user.user_metadata?.magic_link_sent_at,
      challengeId: user.user_metadata?.challenge_id,
      source: user.user_metadata?.source
    };
  } catch (error) {
    console.error('getOnboardingMetadata error:', error);
    return null;
  }
}

/**
 * Check if user can still register (before deadline)
 * 
 * @returns boolean
 */
export function canStillRegister(): boolean {
  const now = new Date();
  return now <= REGISTRATION_DEADLINE;
}

/**
 * Get days until registration deadline
 * 
 * @returns number of days
 */
export function getDaysUntilDeadline(): number {
  const now = new Date();
  const diff = REGISTRATION_DEADLINE.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}
