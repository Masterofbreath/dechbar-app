/**
 * useTourProgress — výpočet dokončení Tour
 *
 * Načítá z Supabase počty kroků a dokončené kroky pro aktuálního uživatele.
 * Vrací:
 * - totalSteps: celkový počet aktivních kroků v aktuální úrovni
 * - completedSteps: kolik jich uživatel dokončil
 * - progressPercent: 0–100
 * - currentChapterSlug: slug aktuální kapitoly (pro kontextové zobrazení)
 * - isLevelComplete: zda je aktuální úroveň plně dokončena
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { useAuthStore } from '@/platform/auth';

interface TourProgressData {
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;
  currentChapterSlug: string | null;
  isLevelComplete: boolean;
}

export function useTourProgress(levelId?: string): TourProgressData {
  const userId = useAuthStore((s) => s.user?.id);

  const { data } = useQuery({
    queryKey: ['tour-progress', userId, levelId],
    enabled: !!userId && !!levelId,
    staleTime: 30_000,
    queryFn: async () => {
      // Počet aktivních kroků v úrovni
      const { count: totalCount } = await supabase
        .from('tour_steps')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .in(
          'chapter_id',
          supabase
            .from('tour_chapters')
            .select('id')
            .eq('level_id', levelId!)
            .eq('is_active', true)
        );

      // Dokončené kroky uživatele v úrovni
      const { count: completedCount } = await supabase
        .from('user_tour_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .eq('level_id', levelId!)
        .eq('status', 'completed');

      // Aktuální stav — odkud pokračovat
      const { data: tourState } = await supabase
        .from('user_tour_state')
        .select('current_chapter_id, tour_chapters(slug)')
        .eq('user_id', userId!)
        .single();

      const total = totalCount ?? 0;
      const completed = completedCount ?? 0;

      return {
        totalSteps: total,
        completedSteps: completed,
        progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
        currentChapterSlug:
          (tourState as unknown as { tour_chapters?: { slug?: string } } | null)
            ?.tour_chapters?.slug ?? null,
        isLevelComplete: total > 0 && completed >= total,
      };
    },
  });

  return data ?? {
    totalSteps: 0,
    completedSteps: 0,
    progressPercent: 0,
    currentChapterSlug: null,
    isLevelComplete: false,
  };
}
