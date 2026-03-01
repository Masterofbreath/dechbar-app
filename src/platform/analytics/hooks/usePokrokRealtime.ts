/**
 * usePokrokRealtime — Real-time invalidace Pokrok statistik
 *
 * Naslouchá Supabase Realtime změnám v audio_sessions a exercise_sessions
 * pro aktuálního uživatele. Při každé změně okamžitě invaliduje React Query cache
 * → Pokrok view se aktualizuje bez refreshe stránky.
 *
 * Použití: vložit do PokrokPage (nebo výše v layout stromu).
 *
 * @package DechBar_App
 * @subpackage Platform/Analytics/Hooks
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';

export function usePokrokRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Jeden kanál pro oba typy sessions (audio + exercise)
    const channel = supabase
      .channel(`pokrok-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audio_sessions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Invaliduj všechny Pokrok queries pro tohoto uživatele
          queryClient.invalidateQueries({ queryKey: ['analytics', 'pokrok', 'audio', userId] });
          queryClient.invalidateQueries({ queryKey: ['analytics', 'pokrok', 'audioGraph', userId] });
          queryClient.invalidateQueries({ queryKey: ['analytics', 'allTimeMinutes'] });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercise_sessions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['analytics', 'pokrok', 'exercise', userId] });
          queryClient.invalidateQueries({ queryKey: ['analytics', 'pokrok', 'exerciseGraph', userId] });
          queryClient.invalidateQueries({ queryKey: ['analytics', 'allTimeMinutes'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
