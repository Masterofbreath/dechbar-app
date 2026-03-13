/**
 * NapovedaCentrum — Centrum pomoci v Settings
 *
 * Dostupné z: /app/napoveda-centrum
 * Odkaz v: SettingsPage → sekce "Pomoc & Nápověda"
 *
 * Zobrazuje:
 * - Progress uživatele (úrovně, kapitoly, % dokončení)
 * - Možnost spustit libovolnou kapitolu znovu
 * - Stav žárovičky (zapnout/vypnout zobrazení)
 *
 * Design: PageLayout (stejný jako Settings, Profil)
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { useAuthStore } from '@/platform/auth';
import { useNapoveda } from '@/platform/components/napoveda/hooks/useNapoveda';
import { PageLayout } from '@/platform/layouts/PageLayout';
import './NapovedaCentrum.css';

// ===================================================
// Types
// ===================================================

interface ChapterWithProgress {
  id: string;
  slug: string;
  order_index: number;
  title: Record<string, string>;
  route_path: string | null;
  is_active: boolean;
  levelSlug: string;
  levelTitle: Record<string, string>;
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;
}

// ===================================================
// Data fetching
// ===================================================

async function fetchChaptersWithProgress(userId: string): Promise<ChapterWithProgress[]> {
  const [{ data: levels }, { data: progress }] = await Promise.all([
    supabase
      .from('tour_levels')
      .select(`
        id, slug, title, order_index,
        tour_chapters(
          id, slug, order_index, title, route_path, is_active,
          tour_steps(id, is_active)
        )
      `)
      .eq('is_active', true)
      .order('order_index'),
    supabase
      .from('user_tour_progress')
      .select('step_id, chapter_id, status')
      .eq('user_id', userId)
      .eq('status', 'completed'),
  ]);

  if (!levels) return [];


  const result: ChapterWithProgress[] = [];

  for (const level of levels) {
    const lv = level as {
      id: string;
      slug: string;
      title: Record<string, string>;
      order_index: number;
      tour_chapters: Array<{
        id: string;
        slug: string;
        order_index: number;
        title: Record<string, string>;
        route_path: string | null;
        is_active: boolean;
        tour_steps: Array<{ id: string; is_active: boolean }>;
      }>;
    };

    for (const ch of lv.tour_chapters ?? []) {
      const totalSteps = ch.tour_steps.filter((s) => s.is_active).length;
      const completedSteps = (progress ?? []).filter(
        (p: { chapter_id: string }) => p.chapter_id === ch.id
      ).length;

      result.push({
        id: ch.id,
        slug: ch.slug,
        order_index: ch.order_index,
        title: ch.title,
        route_path: ch.route_path,
        is_active: ch.is_active,
        levelSlug: lv.slug,
        levelTitle: lv.title,
        totalSteps,
        completedSteps,
        progressPercent: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      });
    }
  }

  return result.sort((a, b) => a.order_index - b.order_index);
}

// ===================================================
// Components
// ===================================================

function ProgressRing({
  percent,
  size = 36,
}: {
  percent: number;
  size?: number;
}) {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="2"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={percent >= 100 ? 'var(--color-success, #22c55e)' : 'var(--color-primary, #2CBEC6)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {percent >= 100 && (
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          fill="var(--color-success, #22c55e)"
          fontWeight="700"
        >
          ✓
        </text>
      )}
    </svg>
  );
}

// ===================================================
// Main Component
// ===================================================

export function NapovedaCentrum() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const { startTour } = useNapoveda();
  const [restartingChapterId, setRestartingChapterId] = useState<string | null>(null);

  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['napoveda-centrum', userId],
    queryFn: () => fetchChaptersWithProgress(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const totalSteps = chapters.reduce((acc, ch) => acc + ch.totalSteps, 0);
  const completedSteps = chapters.reduce((acc, ch) => acc + ch.completedSteps, 0);
  const overallPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const handleRestartChapter = useCallback(
    async (chapter: ChapterWithProgress) => {
      if (!userId) return;
      setRestartingChapterId(chapter.id);
      try {
        // Smaž progress pro tuto kapitolu → umožní projít znovu
        await supabase
          .from('user_tour_progress')
          .delete()
          .eq('user_id', userId)
          .eq('chapter_id', chapter.id);

        // Aktualizuj current_chapter_id v user_tour_state
        await supabase
          .from('user_tour_state')
          .update({
            current_chapter_id: chapter.id,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        // Naviguj na route kapitoly (pokud existuje) a spusť Tour
        if (chapter.route_path) {
          navigate(chapter.route_path);
        }
        startTour();
      } finally {
        setRestartingChapterId(null);
      }
    },
    [userId, navigate, startTour]
  );

  // Seskupení kapitol podle úrovně
  const levelGroups = chapters.reduce<Record<string, ChapterWithProgress[]>>((acc, ch) => {
    const key = ch.levelSlug;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ch);
    return acc;
  }, {});

  return (
    <PageLayout
      title="Centrum nápovědy"
      onBack={() => navigate(-1)}
    >
      <div className="napoveda-centrum">

        {/* Overall progress */}
        {!isLoading && totalSteps > 0 && (
          <div className="napoveda-centrum__overall">
            <div className="napoveda-centrum__overall-ring">
              <ProgressRing percent={overallPercent} size={56} />
              <span className="napoveda-centrum__overall-percent">{overallPercent}%</span>
            </div>
            <div className="napoveda-centrum__overall-text">
              <strong className="napoveda-centrum__overall-title">
                {overallPercent >= 100 ? 'Průvodce dokončen!' : 'Tvůj postup v průvodci'}
              </strong>
              <span className="napoveda-centrum__overall-sub">
                {completedSteps} z {totalSteps} kroků dokončeno
              </span>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="napoveda-centrum__loading">Načítám postup…</div>
        )}

        {/* Kapitoly podle úrovní */}
        {Object.entries(levelGroups).map(([levelSlug, levelChapters]) => {
          const levelTitle = levelChapters[0]?.levelTitle?.cs ?? levelSlug;

          return (
            <section key={levelSlug} className="napoveda-centrum__level-section">
              <h2 className="napoveda-centrum__level-title">{levelTitle}</h2>

              <div className="napoveda-centrum__chapters">
                {levelChapters.map((chapter) => {
                  const isDone = chapter.progressPercent >= 100;
                  const isRestarting = restartingChapterId === chapter.id;

                  return (
                    <div
                      key={chapter.id}
                      className={`napoveda-centrum__chapter ${isDone ? 'napoveda-centrum__chapter--done' : ''} ${!chapter.is_active ? 'napoveda-centrum__chapter--locked' : ''}`}
                    >
                      <ProgressRing percent={chapter.progressPercent} />

                      <div className="napoveda-centrum__chapter-info">
                        <span className="napoveda-centrum__chapter-title">
                          {chapter.title?.cs ?? chapter.slug}
                        </span>
                        <span className="napoveda-centrum__chapter-meta">
                          {chapter.completedSteps}/{chapter.totalSteps} kroků
                          {chapter.route_path && (
                            <> · <span className="napoveda-centrum__chapter-route">{chapter.route_path}</span></>
                          )}
                        </span>
                      </div>

                      {chapter.is_active && (
                        <button
                          className={`napoveda-centrum__chapter-btn ${isDone ? 'napoveda-centrum__chapter-btn--redo' : 'napoveda-centrum__chapter-btn--start'}`}
                          onClick={() => void handleRestartChapter(chapter)}
                          disabled={isRestarting}
                          type="button"
                        >
                          {isRestarting
                            ? '…'
                            : isDone
                              ? 'Znovu'
                              : chapter.completedSteps > 0
                                ? 'Pokračovat'
                                : 'Spustit'}
                        </button>
                      )}

                      {!chapter.is_active && (
                        <span className="napoveda-centrum__chapter-locked-badge">
                          Uzamčeno
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {!isLoading && chapters.length === 0 && (
          <div className="napoveda-centrum__empty">
            <p>Žádné kapitoly Nápovědy nejsou dostupné.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
