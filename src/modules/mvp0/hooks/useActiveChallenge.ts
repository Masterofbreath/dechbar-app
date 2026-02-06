/**
 * useActiveChallenge Hook
 * 
 * Hook for loading and managing active challenge state.
 * Checks:
 * - User's challenge registration
 * - Current day (1-21) based on challenge start date
 * - Completed days count
 * - Visibility for admin/CEO users (hardcoded list)
 * 
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 * @since 0.3.0
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/platform/auth';
import { 
  getChallengeRegistration,
  checkChallengeAccess 
} from '@/platform/api/challenge';
import { supabase } from '@/platform/api/supabase';
import type { ActiveChallengeStatus, ChallengeDayData } from '../types/challenge.types';

const CHALLENGE_ID = 'challenge-2026-03';
const CHALLENGE_START = new Date('2026-03-01T00:00:00+01:00');
const CHALLENGE_END = new Date('2026-03-21T23:59:59+01:00');

// ✅ Hardcoded admin users (no DB dependency)
const ADMIN_EMAILS = [
  'jakub.pelik@gmail.com',
  // Add more admin emails here if needed
];

/**
 * Check if user is admin (simple email-based check)
 */
function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Calculate current day of challenge (1-21)
 * Returns 0 if challenge hasn't started or has ended
 */
function calculateCurrentDay(): number {
  const now = new Date();
  
  // Challenge hasn't started yet
  if (now < CHALLENGE_START) {
    return 0;
  }
  
  // Challenge has ended
  if (now > CHALLENGE_END) {
    return 0;
  }
  
  // Calculate day number (1-21)
  const diffTime = now.getTime() - CHALLENGE_START.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentDay = diffDays + 1; // Day 1 starts on March 1st
  
  // Clamp to 1-21 range
  return Math.min(Math.max(currentDay, 1), 21);
}

/**
 * Hook for active challenge management
 */
export function useActiveChallenge(): ActiveChallengeStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<ActiveChallengeStatus>({
    challenge: null,
    isActive: false,
    currentDay: 0,
    completedDays: 0,
    progress: [],
    isVisible: false,
    isLoading: true,
    error: null,
  });
  
  useEffect(() => {
    if (!user) {
      setStatus({
        challenge: null,
        isActive: false,
        currentDay: 0,
        completedDays: 0,
        progress: [],
        isVisible: false,
        isLoading: false,
        error: null,
      });
      return;
    }
    
    loadChallengeStatus();
  }, [user]);
  
  async function loadChallengeStatus() {
    if (!user) return;
    
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check if user is admin (hardcoded email check)
      const isAdminUser = isAdmin(user.email);
      
      // Get challenge registration
      const registration = await getChallengeRegistration(user.id);
      
      // If no registration and not admin, hide button
      if (!registration && !isAdminUser) {
        setStatus({
          challenge: null,
          isActive: false,
          currentDay: 0,
          completedDays: 0,
          progress: [],
          isVisible: false,
          isLoading: false,
          error: null,
        });
        return;
      }
      
      // Check challenge access (time-based)
      const access = await checkChallengeAccess(user.id);
      const isActive = access.hasAccess && access.accessType === 'during_challenge';
      
      // Calculate current day
      const currentDay = calculateCurrentDay();
      
      // Load progress (completed days)
      let progress: ChallengeDayData[] = [];
      let completedDays = 0;
      
      if (registration) {
        const { data: progressData, error: progressError } = await supabase
          .from('challenge_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('challenge_id', CHALLENGE_ID)
          .order('day_number', { ascending: true });
        
        if (!progressError && progressData) {
          progress = progressData;
          completedDays = progressData.filter(p => p.completed_at !== null).length;
        }
      }
      
      // Button is visible if:
      // 1. User is admin/CEO (always visible)
      // 2. User has active challenge
      const isVisible = isAdminUser || isActive;
      
      setStatus({
        challenge: registration,
        isActive,
        currentDay,
        completedDays,
        progress,
        isVisible,
        isLoading: false,
        error: null,
      });
      
    } catch (err) {
      console.error('[useActiveChallenge] Error loading challenge:', err);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: 'Nepodařilo se načíst výzvu',
      }));
    }
  }
  
  return status;
}
