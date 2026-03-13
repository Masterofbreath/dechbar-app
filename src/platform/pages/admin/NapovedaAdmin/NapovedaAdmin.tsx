/**
 * NapovedaAdmin — Admin panel pro Nápověda & Tour System
 *
 * Sekce v Admin sidebaru: KOMUNITA → Nápověda
 * Route: /app/admin/napoveda
 *
 * Funkce v MVP:
 * - Globální přepínač (zapnout/vypnout celý systém Nápovědy)
 * - Přehled úrovní, kapitol a kroků (read-only v MVP)
 * - Statistiky: kolik uživatelů projde Tour, drop-off (Later)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { useAuthStore } from '@/platform/auth';
import './NapovedaAdmin.css';

// ===================================================
// Types
// ===================================================

interface NapovedaSettings {
  id: number;
  is_enabled: boolean;
  disabled_by: string | null;
  disabled_at: string | null;
  disabled_reason: string | null;
  updated_at: string;
}

interface TourLevel {
  id: string;
  slug: string;
  order_index: number;
  title: Record<string, string>;
  requires_plan: string | null;
  reward_days: number;
  is_active: boolean;
  tour_chapters: TourChapter[];
}

interface TourChapter {
  id: string;
  slug: string;
  order_index: number;
  title: Record<string, string>;
  route_path: string | null;
  is_active: boolean;
  tour_steps: Array<{ id: string; is_active: boolean }>;
}

// ===================================================
// API helpers
// ===================================================

async function fetchNapovedaSettings(): Promise<NapovedaSettings> {
  const { data, error } = await supabase
    .from('napoveda_settings')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data as NapovedaSettings;
}

async function fetchTourLevels(): Promise<TourLevel[]> {
  const { data, error } = await supabase
    .from('tour_levels')
    .select(`
      id, slug, order_index, title, requires_plan, reward_days, is_active,
      tour_chapters(
        id, slug, order_index, title, route_path, is_active,
        tour_steps(id, is_active)
      )
    `)
    .order('order_index');
  if (error) throw error;
  return (data ?? []) as unknown as TourLevel[];
}

// ===================================================
// Component
// ===================================================

export function NapovedaAdmin() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const [disableReason, setDisableReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['napoveda-settings'],
    queryFn: fetchNapovedaSettings,
  });

  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ['tour-levels-admin'],
    queryFn: fetchTourLevels,
  });

  const toggleMutation = useMutation({
    mutationFn: async (enable: boolean) => {
      const { error } = await supabase
        .from('napoveda_settings')
        .update({
          is_enabled: enable,
          disabled_by: enable ? null : (userId ?? null),
          disabled_at: enable ? null : new Date().toISOString(),
          disabled_reason: enable ? null : (disableReason.trim() || 'Manuálně vypnuto adminem'),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['napoveda-settings'] });
      setShowReasonInput(false);
      setDisableReason('');
    },
  });

  const isEnabled = settings?.is_enabled ?? true;

  function handleToggle() {
    if (isEnabled) {
      // Vypínáme → chceme důvod
      setShowReasonInput(true);
    } else {
      // Zapínáme → rovnou
      toggleMutation.mutate(true);
    }
  }

  function handleConfirmDisable() {
    toggleMutation.mutate(false);
  }

  if (settingsLoading) {
    return (
      <div className="napoveda-admin">
        <div className="napoveda-admin__loading">Načítám nastavení Nápovědy…</div>
      </div>
    );
  }

  return (
    <div className="napoveda-admin">
      <div className="napoveda-admin__header">
        <h1 className="napoveda-admin__title">Nápověda & Tour System</h1>
        <p className="napoveda-admin__subtitle">
          Správa onboarding průvodce, kroků a globálního stavu systému.
        </p>
      </div>

      {/* ===== GLOBÁLNÍ PŘEPÍNAČ ===== */}
      <section className="napoveda-admin__section">
        <div className="napoveda-admin__toggle-card">
          <div className="napoveda-admin__toggle-info">
            <div className="napoveda-admin__toggle-header">
              <span
                className={`napoveda-admin__status-dot ${isEnabled ? 'napoveda-admin__status-dot--on' : 'napoveda-admin__status-dot--off'}`}
              />
              <h2 className="napoveda-admin__toggle-title">
                Nápověda je{' '}
                <strong>{isEnabled ? 'zapnuta' : 'vypnuta'}</strong>
              </h2>
            </div>

            <p className="napoveda-admin__toggle-desc">
              {isEnabled
                ? 'Žárovička je viditelná pro všechny uživatele. Tour se spouští standardně.'
                : 'Žárovička je skryta pro všechny uživatele. Tour nelze spustit.'}
            </p>

            {!isEnabled && settings?.disabled_at && (
              <div className="napoveda-admin__disabled-info">
                <span className="napoveda-admin__disabled-label">Vypnuto:</span>{' '}
                {new Date(settings.disabled_at).toLocaleString('cs-CZ')}
                {settings.disabled_reason && (
                  <>
                    {' '}—{' '}
                    <em>{settings.disabled_reason}</em>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            className={`napoveda-admin__toggle-btn ${isEnabled ? 'napoveda-admin__toggle-btn--disable' : 'napoveda-admin__toggle-btn--enable'}`}
            onClick={handleToggle}
            disabled={toggleMutation.isPending}
            type="button"
          >
            {toggleMutation.isPending
              ? 'Ukládám…'
              : isEnabled
                ? 'Vypnout Nápovědu'
                : 'Zapnout Nápovědu'}
          </button>
        </div>

        {/* Důvod vypnutí */}
        {showReasonInput && (
          <div className="napoveda-admin__reason-box">
            <label className="napoveda-admin__reason-label" htmlFor="disable-reason">
              Důvod vypnutí (volitelné — zobrazí se v logu)
            </label>
            <input
              id="disable-reason"
              className="napoveda-admin__reason-input"
              type="text"
              value={disableReason}
              onChange={(e) => setDisableReason(e.target.value)}
              placeholder="Např. PROD incident, A/B test, údržba…"
              autoFocus
            />
            <div className="napoveda-admin__reason-actions">
              <button
                className="napoveda-admin__reason-confirm"
                onClick={handleConfirmDisable}
                disabled={toggleMutation.isPending}
                type="button"
              >
                Potvrdit vypnutí
              </button>
              <button
                className="napoveda-admin__reason-cancel"
                onClick={() => setShowReasonInput(false)}
                type="button"
              >
                Zrušit
              </button>
            </div>
          </div>
        )}

        {toggleMutation.isError && (
          <p className="napoveda-admin__error">
            Chyba při ukládání:{' '}
            {toggleMutation.error instanceof Error
              ? toggleMutation.error.message
              : 'Neznámá chyba'}
          </p>
        )}
      </section>

      {/* ===== PŘEHLED ÚROVNÍ A KAPITOL ===== */}
      <section className="napoveda-admin__section">
        <h2 className="napoveda-admin__section-title">Struktura Tour</h2>
        <p className="napoveda-admin__section-note">
          Editor kroků (texty, selektory, pořadí) bude dostupný v Sprint 4.
        </p>

        {levelsLoading ? (
          <div className="napoveda-admin__loading">Načítám strukturu…</div>
        ) : (
          <div className="napoveda-admin__levels">
            {levels.map((level) => {
              const chapterCount = level.tour_chapters?.length ?? 0;
              const stepCount = level.tour_chapters?.reduce(
                (acc, ch) => acc + (ch.tour_steps?.length ?? 0),
                0
              ) ?? 0;

              return (
                <div key={level.id} className="napoveda-admin__level-card">
                  <div className="napoveda-admin__level-header">
                    <div className="napoveda-admin__level-meta">
                      <span className="napoveda-admin__level-badge">
                        Úroveň {level.order_index}
                      </span>
                      {level.requires_plan && (
                        <span className="napoveda-admin__plan-badge">
                          {level.requires_plan}
                        </span>
                      )}
                      <span
                        className={`napoveda-admin__active-badge ${level.is_active ? 'napoveda-admin__active-badge--on' : 'napoveda-admin__active-badge--off'}`}
                      >
                        {level.is_active ? 'aktivní' : 'neaktivní'}
                      </span>
                    </div>
                    <h3 className="napoveda-admin__level-title">
                      {level.title?.cs ?? level.slug}
                    </h3>
                    <p className="napoveda-admin__level-stats">
                      {chapterCount} kapitol · {stepCount} kroků · odměna {level.reward_days} d
                    </p>
                  </div>

                  <div className="napoveda-admin__chapters">
                    {(level.tour_chapters ?? [])
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((chapter) => (
                        <div key={chapter.id} className="napoveda-admin__chapter-row">
                          <span className="napoveda-admin__chapter-order">
                            {chapter.order_index}.
                          </span>
                          <span className="napoveda-admin__chapter-name">
                            {chapter.title?.cs ?? chapter.slug}
                          </span>
                          <span className="napoveda-admin__chapter-route">
                            {chapter.route_path ?? '—'}
                          </span>
                          <span className="napoveda-admin__chapter-steps">
                            {chapter.tour_steps?.length ?? 0} kroků
                          </span>
                          <span
                            className={`napoveda-admin__active-dot ${chapter.is_active ? 'napoveda-admin__active-dot--on' : 'napoveda-admin__active-dot--off'}`}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
