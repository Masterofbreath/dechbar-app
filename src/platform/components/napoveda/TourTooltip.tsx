/**
 * TourTooltip — custom design tooltip pro Tour průvodce
 *
 * Zobrazuje se vedle spotlight elementu driver.js.
 * Design: výhradně CSS tokeny z design-tokens/, BEM naming.
 *
 * Layout:
 * ┌─────────────────────────────────────┐
 * │  Krok 3 / 7          [Kapitola: KP] │
 * │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
 * │  Titulek kroku (bold, 16px)         │
 * │                                     │
 * │  Popis — max 2-3 věty               │
 * │─────────────────────────────────────│
 * │  [← Zpět]    [Odložit]  [Další →]  │
 * └─────────────────────────────────────┘
 */

import { createPortal } from 'react-dom';
import type { TourStep } from './NapovedaProvider';

interface TourTooltipProps {
  step: TourStep;
  stepNumber: number;
  totalSteps: number;
  progress: number;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  onDefer: () => void;
}

const LANG = 'cs';

function getStepText(
  field: Record<string, string> | undefined,
  fallback = ''
): string {
  if (!field) return fallback;
  return field[LANG] ?? field['en'] ?? Object.values(field)[0] ?? fallback;
}

function TooltipContent({
  step,
  stepNumber,
  totalSteps,
  progress,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onDefer,
}: TourTooltipProps) {
  const title = getStepText(step.title);
  const description = getStepText(step.description);
  const chapterName = getStepText(step.chapterTitle);
  const isInteractive = step.stepType === 'interactive';
  const showRewardHint = step.isRequiredForReward;

  return (
    <div className="tour-tooltip" role="dialog" aria-label={title}>
      {/* Header: progress + chapter label */}
      <div className="tour-tooltip__header">
        <span className="tour-tooltip__progress-label">
          Krok {stepNumber} / {totalSteps}
        </span>
        {chapterName && (
          <span className="tour-tooltip__chapter-label">{chapterName}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="tour-tooltip__progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="tour-tooltip__progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Titulek */}
      <h3 className="tour-tooltip__title">{title}</h3>

      {/* Popis */}
      {description && (
        <p className="tour-tooltip__description">{description}</p>
      )}

      {/* Hint pro povinné kroky */}
      {showRewardHint && (
        <div className="tour-tooltip__reward-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Tento krok je potřeba pro získání odměny
        </div>
      )}

      {/* Interaktivní kroky — info */}
      {isInteractive && (
        <div className="tour-tooltip__reward-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Proveď akci — pak klikni Další
        </div>
      )}

      {/* Akční tlačítka */}
      <div className="tour-tooltip__actions">
        {!isFirst && (
          <button
            className="tour-tooltip__btn-back"
            onClick={onPrev}
            type="button"
            aria-label="Předchozí krok"
          >
            ← Zpět
          </button>
        )}

        <button
          className="tour-tooltip__btn-defer"
          onClick={onDefer}
          type="button"
          aria-label="Odložit Nápovědu na později"
        >
          Odložit
        </button>

        <button
          className={`tour-tooltip__btn-next${isLast ? ' tour-tooltip__btn-next--finish' : ''}`}
          onClick={onNext}
          type="button"
          aria-label={isLast ? 'Dokončit Nápovědu' : 'Další krok'}
        >
          {isLast ? 'Hotovo' : 'Další →'}
        </button>
      </div>
    </div>
  );
}

/**
 * TourTooltip se renderuje přes portal do document.body
 * aby byl nad driver.js overlayem (z-index > driver overlay).
 */
export function TourTooltip(props: TourTooltipProps) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <TooltipContent {...props} />,
    document.body
  );
}
