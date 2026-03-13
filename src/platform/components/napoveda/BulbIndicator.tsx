/**
 * BulbIndicator — žárovička v TopNav
 *
 * 3 stavy (z user_tour_state.bulb_state):
 * - lit    → zlatá, pulzující animace (3s cyklus) — kapitola na aktuální route NEBYLA projita
 * - dim    → šedá, bez animace, kliknutelná — projito, ale Tour nedokončena
 * - hidden → display: none (zachovává layout prostor přes visibility: hidden)
 *
 * Klik → startTour() (otevře Tour od aktuálního/prvního neprojitého kroku)
 */

import { useNapoveda } from './hooks/useNapoveda';

/**
 * SVG ikona žárovičky — custom, 2px stroke, currentColor
 * Outline styl, viewBox 24x24 (projektový standard)
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Žárovička — tělo */}
      <path d="M9 21h6" />
      <path d="M10 21v-2a4 4 0 0 1-2.46-3.64A5 5 0 1 1 16 12a4 4 0 0 1-2 3.36V21" />
      {/* Vlnky záření — jen pro lit stav (vždy v DOM, opacity řízena CSS) */}
    </svg>
  );
}

export function BulbIndicator() {
  const { bulbState, startTour } = useNapoveda();

  // hidden → element je v DOM ale neviditelný (layout neposkočí)
  const isHidden = bulbState === 'hidden';
  const isLit = bulbState === 'lit';
  const isDim = bulbState === 'dim';

  const label = isLit
    ? 'Nápověda — klikni pro spuštění průvodce'
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
      onClick={isHidden ? undefined : startTour}
      aria-label={label}
      aria-pressed={false}
      type="button"
      tabIndex={isHidden ? -1 : 0}
    >
      <BulbIcon className="bulb-indicator__icon" />
    </button>
  );
}
