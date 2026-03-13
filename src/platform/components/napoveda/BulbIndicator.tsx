/**
 * BulbIndicator — žárovička v TopNav
 *
 * 3 stavy (z user_tour_state.bulb_state):
 * - lit    → zlatá, pulzující animace (3s cyklus) — kapitola na aktuální route NEBYLA projita
 * - dim    → šedá, bez animace, kliknutelná — projito, ale Tour nedokončena
 * - hidden → visibility: hidden (zachovává layout prostor)
 *
 * Kontextová logika:
 * - Klik spustí Tour KAPITOLY pro aktuální route (ne vždy od začátku)
 * - Pokud žádná kapitola neodpovídá route → standardní startTour()
 */

import { useCallback } from 'react';
import { useNapoveda } from './hooks/useNapoveda';
import { useContextualChapter } from './hooks/useContextualChapter';
import { supabase } from '@/platform/api/supabase';
import { useAuthStore } from '@/platform/auth';

/**
 * SVG žárovička — detailní outline design, 2px stroke, currentColor
 * Základ: klasická Edison žárovička se závojovým vláknem a základnou
 * viewBox 24x24, projektový standard
 */
function BulbIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Horní část žárovičky — kulatá baňka */}
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      {/* Spodní základna (krk) */}
      <path d="M10 18v-2.5c0-.8-.4-1.5-1-2A6 6 0 1 1 15 13.5c-.6.5-1 1.2-1 2V18" />
      {/* Vlákno uvnitř — záře */}
      <path
        className="bulb-indicator__filament"
        d="M12 8v3M10.5 9.5l3 3"
        strokeWidth="1.25"
        strokeOpacity="0.6"
      />
    </svg>
  );
}

export function BulbIndicator() {
  const { bulbState, startTour } = useNapoveda();
  const contextualChapter = useContextualChapter();
  const userId = useAuthStore((s) => s.user?.id);

  const isHidden = bulbState === 'hidden';
  const isLit = bulbState === 'lit';
  const isDim = bulbState === 'dim';

  // Kontextový klik — nastaví current_chapter_id a spustí Tour
  const handleClick = useCallback(async () => {
    if (isHidden) return;

    if (contextualChapter && userId) {
      // Navigujeme uživatele ke kapitole pro aktuální route
      await supabase
        .from('user_tour_state')
        .update({
          current_chapter_id: contextualChapter.id,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    startTour();
  }, [isHidden, contextualChapter, userId, startTour]);

  const contextualLabel = contextualChapter?.title?.cs;
  const label = isLit
    ? contextualLabel
      ? `Nápověda — spustit průvodce pro ${contextualLabel}`
      : 'Nápověda — klikni pro spuštění průvodce'
    : isDim
      ? 'Nápověda — klikni pro pokračování v průvodci'
      : 'Nápověda dokončena';

  return (
    <button
      className={[
        'bulb-indicator',
        isLit && 'bulb-indicator--lit',
        isDim && 'bulb-indicator--dim',
        isHidden && 'bulb-indicator--hidden',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => void handleClick()}
      aria-label={label}
      type="button"
      tabIndex={isHidden ? -1 : 0}
    >
      <BulbIcon className="bulb-indicator__icon" />
    </button>
  );
}
