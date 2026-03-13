/**
 * useContextualChapter — zjistí kapitolu Tour pro aktuální route
 *
 * Logika:
 * - Vezme aktuální pathname z React Router
 * - Porovná s route_path v tour_chapters
 * - Vrátí ID kapitoly a slug (nebo null pokud žádná neodpovídá)
 *
 * Žárovička pak při kliknutí spustí přímo tuto kapitolu místo začátku celé Tour.
 * Pokud kapitola neexistuje → spustí Tour od aktuálního bodu.
 *
 * Příklady mapování:
 *   /app           → chapter: welcome
 *   /app/cvicit    → chapter: kp-measurement nebo exercise-intro
 *   /app/pokrok    → chapter: progress-intro
 */

import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';

interface ContextualChapter {
  id: string;
  slug: string;
  title: Record<string, string>;
}

async function fetchChaptersByRoute(): Promise<
  Array<{ id: string; slug: string; title: Record<string, string>; route_path: string | null }>
> {
  const { data } = await supabase
    .from('tour_chapters')
    .select('id, slug, title, route_path')
    .eq('is_active', true);
  return (data ?? []) as Array<{
    id: string;
    slug: string;
    title: Record<string, string>;
    route_path: string | null;
  }>;
}

export function useContextualChapter(): ContextualChapter | null {
  const { pathname } = useLocation();

  const { data: chapters = [] } = useQuery({
    queryKey: ['tour-chapters-routes'],
    queryFn: fetchChaptersByRoute,
    staleTime: 5 * 60 * 1000,
  });

  if (!chapters.length) return null;

  // Exact match nejprve, pak prefix match
  const exact = chapters.find((ch) => ch.route_path === pathname);
  if (exact) return { id: exact.id, slug: exact.slug, title: exact.title };

  // Prefix match — /app/cvicit/session → cvicit kapitola
  const prefix = chapters
    .filter((ch) => ch.route_path && pathname.startsWith(ch.route_path))
    .sort((a, b) => (b.route_path?.length ?? 0) - (a.route_path?.length ?? 0))[0];

  if (prefix) return { id: prefix.id, slug: prefix.slug, title: prefix.title };

  return null;
}
