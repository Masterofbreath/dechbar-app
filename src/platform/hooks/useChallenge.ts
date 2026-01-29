/**
 * useChallenge Hook
 * 
 * Hook pro práci s dechovými výzvami (email registrace, validation)
 * 
 * @package DechBar_App
 * @subpackage Platform/Hooks
 */

import { useState } from 'react';
import { supabase } from '@/platform/api/supabase';
import { MESSAGES } from '@/config/messages';

interface EmailSubmitResult {
  success: boolean;
  duplicate?: boolean;
  message: string;
  error?: string;
}

/**
 * Email validation helper
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Hook for challenge operations
 */
export function useChallenge() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Submit email for challenge pre-registration
   * 
   * @param email - User email
   * @param challengeId - Challenge identifier (default: 'march_2026')
   * @param source - Conversion source (default: 'landing_page')
   */
  async function submitEmail(
    email: string,
    challengeId: string = 'march_2026',
    source: string = 'landing_page'
  ): Promise<EmailSubmitResult> {
    // Validation
    if (!email || email.trim() === '') {
      return {
        success: false,
        message: MESSAGES.error.requiredFields,
        error: 'empty_email'
      };
    }

    if (!isValidEmail(email)) {
      return {
        success: false,
        message: MESSAGES.challenge.emailInvalid,
        error: 'invalid_email'
      };
    }

    setIsSubmitting(true);

    try {
      // This function is DEPRECATED - don't use it
      // Real registration happens via sendChallengeMagicLink in DemoApp
      console.warn('[DEPRECATED] submitEmail() - Use useChallengeMagicLink() instead');
      
      setIsSubmitting(false);
      
      return {
        success: true,
        message: 'Email odeslán. Zkontroluj svou schránku.'
      };

    } catch (err) {
      setIsSubmitting(false);
      console.error('Challenge email submission exception:', err);
      return {
        success: false,
        message: MESSAGES.error.networkError,
        error: 'network_error'
      };
    }
  }

  /**
   * Check if user is already registered for challenge
   * 
   * @param email - User email
   * @param challengeId - Challenge identifier
   */
  async function checkRegistration(
    email: string,
    challengeId: string = 'march_2026'
  ): Promise<boolean> {
    if (!email || !isValidEmail(email)) {
      return false;
    }

    const { data, error } = await supabase
      .from('challenge_registrations')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .eq('challenge_id', challengeId)
      .maybeSingle();

    return !error && data !== null;
  }

  return {
    submitEmail,
    checkRegistration,
    isSubmitting
  };
}
