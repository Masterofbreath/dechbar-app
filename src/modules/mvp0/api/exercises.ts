/**
 * Exercise API - Supabase Hooks
 * 
 * React hooks for exercise CRUD operations with tier-based access control.
 * 
 * @package DechBar_App
 * @subpackage MVP0/API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { useAuth } from '@/platform/auth';
import { useMembership } from '@/platform/membership';
import type {
  Exercise,
  CreateExercisePayload,
  ExerciseSession,
  CompleteSessionPayload,
  SafetyFlags,
  SafetyQuestionnaireAnswers,
} from '../types/exercises';

// =====================================================
// QUERY KEYS (for cache management)
// =====================================================

export const exerciseKeys = {
  all: ['exercises'] as const,
  lists: () => [...exerciseKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...exerciseKeys.lists(), filters] as const,
  details: () => [...exerciseKeys.all, 'detail'] as const,
  detail: (id: string) => [...exerciseKeys.details(), id] as const,
  sessions: (userId: string) => ['exercise-sessions', userId] as const,
  safetyFlags: (userId: string) => ['safety-flags', userId] as const,
};

// =====================================================
// HOOKS: Exercise Queries
// =====================================================

/**
 * Fetch all available exercises for current user
 * 
 * Filters:
 * - Public presets (visible to all)
 * - User's own custom exercises
 * - Excludes deleted exercises
 * - Respects tier requirements
 */
export function useExercises() {
  const { user } = useAuth();
  const { plan } = useMembership();
  
  return useQuery({
    queryKey: exerciseKeys.list({ userId: user?.id, tier: plan }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filter by tier access client-side (RLS already filtered ownership)
      const accessibleExercises = data.filter((exercise: Exercise) => {
        // Public presets always visible
        if (exercise.is_public) return true;
        
        // User's own custom exercises
        if (exercise.created_by === user?.id) return true;
        
        return false;
      });
      
      return accessibleExercises as Exercise[];
    },
    enabled: !!user,
  });
}

/**
 * Fetch single exercise by ID
 */
export function useExercise(exerciseId: string | null) {
  return useQuery({
    queryKey: exerciseKeys.detail(exerciseId || ''),
    queryFn: async () => {
      if (!exerciseId) throw new Error('Exercise ID required');
      
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .is('deleted_at', null)
        .single();
      
      if (error) throw error;
      return data as Exercise;
    },
    enabled: !!exerciseId,
  });
}

/**
 * Count user's custom exercises (for tier limit check)
 */
export function useCustomExerciseCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['custom-exercise-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from('exercises')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('category', 'custom')
        .is('deleted_at', null);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

// =====================================================
// HOOKS: Exercise Mutations
// =====================================================

/**
 * Create custom exercise (with tier limit enforcement)
 */
export function useCreateExercise() {
  const { user } = useAuth();
  const { plan } = useMembership();
  const queryClient = useQueryClient();
  const { data: currentCount } = useCustomExerciseCount();
  
  return useMutation({
    mutationFn: async (payload: CreateExercisePayload) => {
      if (!user) throw new Error('Authentication required');
      
      // Tier limit enforcement (application layer)
      const limits = {
        ZDARMA: 3,
        SMART: 100, // soft-limit (displayed as "unlimited")
        AI_COACH: 100,
      };
      
      const maxAllowed = limits[plan as keyof typeof limits] || 3;
      
      if ((currentCount || 0) >= maxAllowed) {
        throw new Error(
          plan === 'ZDARMA'
            ? 'Dosáhl jsi limit 3 vlastních cvičení. Upgraduj na SMART pro unlimited.'
            : 'Dosáhl jsi limit vlastních cvičení.'
        );
      }
      
      // Calculate denormalized fields
      const totalDuration = payload.breathing_pattern.phases.reduce(
        (sum, phase) => sum + phase.duration_seconds,
        0
      );
      
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: payload.name,
          description: payload.description || null,
          category: 'custom',
          subcategory: payload.subcategory || null,
          created_by: user.id,
          is_public: false,
          required_tier: null,
          breathing_pattern: payload.breathing_pattern as any,
          total_duration_seconds: totalDuration,
          phase_count: payload.breathing_pattern.phases.length,
          difficulty: payload.breathing_pattern.metadata.difficulty,
          tags: payload.tags || [],
          contraindications: [],
          card_color: payload.card_color || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Exercise;
    },
    onSuccess: () => {
      // Invalidate exercises list to refetch
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['custom-exercise-count'] });
    },
  });
}

/**
 * Update exercise (ownership check)
 */
export function useUpdateExercise() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      exerciseId,
      updates,
    }: {
      exerciseId: string;
      updates: Partial<CreateExercisePayload>;
    }) => {
      if (!user) throw new Error('Authentication required');
      
      // Recalculate denormalized fields if breathing_pattern changed
      let denormalizedUpdates = {};
      if (updates.breathing_pattern) {
        const totalDuration = updates.breathing_pattern.phases.reduce(
          (sum, phase) => sum + phase.duration_seconds,
          0
        );
        denormalizedUpdates = {
          total_duration_seconds: totalDuration,
          phase_count: updates.breathing_pattern.phases.length,
          difficulty: updates.breathing_pattern.metadata.difficulty,
        };
      }
      
      const { data, error} = await supabase
        .from('exercises')
        .update({
          ...updates,
          ...denormalizedUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', exerciseId)
        .eq('created_by', user.id) // ownership check
        .select()
        .single();
      
      if (error) throw error;
      return data as Exercise;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
    },
  });
}

/**
 * Delete exercise (soft delete)
 */
export function useDeleteExercise() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (exerciseId: string) => {
      if (!user) throw new Error('Authentication required');
      
      // Soft delete (set deleted_at timestamp)
      const { error } = await supabase
        .from('exercises')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', exerciseId)
        .eq('created_by', user.id); // ownership check
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['custom-exercise-count'] });
    },
  });
}

// =====================================================
// HOOKS: Session History
// =====================================================

/**
 * Fetch user's exercise sessions (history)
 * 
 * Filters by tier:
 * - ZDARMA: Last 7 days only
 * - SMART: Last 90 days
 * - AI_COACH: Unlimited
 */
export function useExerciseSessions() {
  const { user } = useAuth();
  const { plan } = useMembership();
  
  return useQuery({
    queryKey: exerciseKeys.sessions(user?.id || ''),
    queryFn: async () => {
      if (!user) throw new Error('Authentication required');
      
      // Calculate date cutoff based on tier
      let cutoffDate: Date | null = null;
      if (plan === 'ZDARMA') {
        cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (plan === 'SMART') {
        cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);
      }
      // AI_COACH = no cutoff (unlimited history)
      
      let query = supabase
        .from('exercise_sessions')
        .select(`
          *,
          exercise:exercises(id, name, total_duration_seconds, difficulty)
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });
      
      if (cutoffDate) {
        query = query.gte('started_at', cutoffDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as any[]; // SessionWithExercise[]
    },
    enabled: !!user,
  });
}

/**
 * Complete exercise session (save to history)
 */
export function useCompleteSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: CompleteSessionPayload) => {
      if (!user) throw new Error('Authentication required');
      
      const { data, error } = await supabase
        .from('exercise_sessions')
        .insert({
          user_id: user.id,
          exercise_id: payload.exercise_id,
          started_at: payload.started_at.toISOString(),
          completed_at: payload.completed_at.toISOString(),
          was_completed: payload.was_completed,
          mood_before: payload.mood_before || null,
          mood_after: payload.mood_after || null,
          quality_rating: payload.quality_rating || null,
          notes: payload.notes || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ExerciseSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.sessions(user?.id || '') });
    },
  });
}

// =====================================================
// HOOKS: Safety Flags
// =====================================================

/**
 * Get user's safety flags from profile
 */
export function useSafetyFlags() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: exerciseKeys.safetyFlags(user?.id || ''),
    queryFn: async () => {
      if (!user) throw new Error('Authentication required');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('safety_flags')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return (data?.safety_flags || {
        questionnaire_completed: false,
        epilepsy: false,
        pregnancy: false,
        cardiovascular: false,
        asthma: false,
      }) as SafetyFlags;
    },
    enabled: !!user,
  });
}

/**
 * Update safety flags (after questionnaire)
 */
export function useUpdateSafetyFlags() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (answers: SafetyQuestionnaireAnswers) => {
      if (!user) throw new Error('Authentication required');
      
      const safetyFlags: SafetyFlags = {
        questionnaire_completed: true,
        ...answers,
      };
      
      const { error } = await supabase
        .from('profiles')
        .update({ safety_flags: safetyFlags as any })
        .eq('id', user.id);
      
      if (error) throw error;
      return safetyFlags;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.safetyFlags(user?.id || '') });
    },
  });
}
