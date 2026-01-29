/**
 * Challenge Hooks
 * 
 * React hooks pro práci s výzvou
 * Používají se v landing page /vyzva a v aplikaci
 * 
 * @package DechBar_App
 * @subpackage Hooks
 */

import { useState, useEffect } from 'react';
import { 
  sendChallengeMagicLink,
  checkChallengeAccess,
  isRegisteredForChallenge,
  getChallengeRegistration,
  type ChallengeAccessStatus
} from '@/platform/api/challenge';
import { 
  completeChallengeOnboarding,
  getOnboardingMetadata,
  canStillRegister,
  getDaysUntilDeadline,
  type CompleteChallengeOnboardingData,
  type CompleteChallengeOnboardingResponse
} from '@/platform/api/onboarding';
import { supabase } from '@/platform/api/supabase';

// =====================================================
// HOOK: useChallengeMagicLink
// =====================================================

/**
 * Hook pro odeslání magic linku
 * Používá se na landing page /vyzva
 * 
 * @example
 * const { sendLink, loading, error, success } = useChallengeMagicLink();
 * 
 * const handleSubmit = async () => {
 *   await sendLink('user@example.com', 4);
 * };
 */
export function useChallengeMagicLink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const sendLink = async (email: string, kpValue: number, source?: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    const result = await sendChallengeMagicLink(email, kpValue, source);
    
    setLoading(false);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Neznámá chyba');
    }
    
    return result;
  };
  
  const reset = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  };
  
  return {
    sendLink,
    loading,
    error,
    success,
    reset
  };
}

// =====================================================
// HOOK: useChallengeAccess
// =====================================================

/**
 * Hook pro kontrolu přístupu k výzvě
 * Time-based access control
 * 
 * @example
 * const { hasAccess, accessType, requiresUpgrade, loading } = useChallengeAccess();
 * 
 * if (hasAccess && accessType === 'during_challenge') {
 *   // Zobraz tlačítko "Spustit výzvu"
 * }
 */
export function useChallengeAccess() {
  const [status, setStatus] = useState<ChallengeAccessStatus>({
    hasAccess: false,
    accessType: 'no_access',
    requiresUpgrade: false
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setStatus({
          hasAccess: false,
          accessType: 'no_access',
          requiresUpgrade: false,
          message: 'Nejsi přihlášen'
        });
        setLoading(false);
        return;
      }
      
      const result = await checkChallengeAccess(user.id);
      setStatus(result);
      setLoading(false);
    };
    
    checkAccess();
  }, []);
  
  return {
    ...status,
    loading
  };
}

// =====================================================
// HOOK: useChallengeRegistration
// =====================================================

/**
 * Hook pro získání detailů registrace
 * 
 * @example
 * const { registration, loading, isRegistered } = useChallengeRegistration();
 * 
 * if (isRegistered) {
 *   console.log('KP hodnota:', registration?.metadata?.kp_value);
 * }
 */
export function useChallengeRegistration() {
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRegistration = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      const data = await getChallengeRegistration(user.id);
      setRegistration(data);
      setLoading(false);
    };
    
    fetchRegistration();
  }, []);
  
  return {
    registration,
    loading,
    isRegistered: !!registration
  };
}

// =====================================================
// HOOK: useChallengeOnboarding
// =====================================================

/**
 * Hook pro dokončení onboardingu
 * Používá se na /onboarding page
 * 
 * @example
 * const { completeOnboarding, loading, error, metadata } = useChallengeOnboarding();
 * 
 * const handleSubmit = async (data) => {
 *   const result = await completeOnboarding(data);
 *   if (result.success) {
 *     router.push('/dekujeme-za-registraci');
 *   }
 * };
 */
export function useChallengeOnboarding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  
  // Load metadata na začátku
  useEffect(() => {
    const loadMetadata = async () => {
      const data = await getOnboardingMetadata();
      setMetadata(data);
    };
    
    loadMetadata();
  }, []);
  
  const completeOnboarding = async (
    data: CompleteChallengeOnboardingData
  ): Promise<CompleteChallengeOnboardingResponse> => {
    setLoading(true);
    setError(null);
    
    const result = await completeChallengeOnboarding(data);
    
    setLoading(false);
    
    if (!result.success) {
      setError(result.error || 'Neznámá chyba');
    }
    
    return result;
  };
  
  return {
    completeOnboarding,
    loading,
    error,
    metadata
  };
}

// =====================================================
// HOOK: useChallengeDeadline
// =====================================================

/**
 * Hook pro countdown do deadline
 * Zobrazuje kolik dní zbývá do konce registrace
 * 
 * @example
 * const { canRegister, daysLeft } = useChallengeDeadline();
 * 
 * if (canRegister) {
 *   return <p>Ještě {daysLeft} dní do konce registrace!</p>;
 * }
 */
export function useChallengeDeadline() {
  const [daysLeft, setDaysLeft] = useState(0);
  const [canRegister, setCanRegister] = useState(false);
  
  useEffect(() => {
    const updateDeadline = () => {
      setCanRegister(canStillRegister());
      setDaysLeft(getDaysUntilDeadline());
    };
    
    updateDeadline();
    
    // Update každou minutu
    const interval = setInterval(updateDeadline, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    canRegister,
    daysLeft
  };
}

// =====================================================
// HOOK: useIsRegisteredForChallenge
// =====================================================

/**
 * Hook pro rychlý check jestli je user zaregistrovaný
 * 
 * @example
 * const { isRegistered, loading } = useIsRegisteredForChallenge();
 * 
 * if (isRegistered) {
 *   return <p>Už jsi zaregistrovaný!</p>;
 * }
 */
export function useIsRegisteredForChallenge() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkRegistration = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      const registered = await isRegisteredForChallenge(user.id);
      setIsRegistered(registered);
      setLoading(false);
    };
    
    checkRegistration();
  }, []);
  
  return {
    isRegistered,
    loading
  };
}
