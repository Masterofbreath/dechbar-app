/**
 * TourTooltip — fixní bottom bar průvodce
 *
 * Vždy viditelný na dolním okraji obrazovky během Tour.
 * Design: gold accent, progress bar, navigace.
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────┐
 * │  Kapitola · Krok 2 / 7        ████████░░░░  25%    │
 * │  Titulek kroku                                       │
 * │  Popis kroku (max 2–3 věty)                          │
 * │  [← Zpět]            [Odložit]          [Další →]   │
 * └─────────────────────────────────────────────────────┘
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

function getStepText(field: Record<string, string> | undefined, fallback = ''): string {
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

  return (
    <div className="tour-bar" role="complementary" aria-label={`Průvodce: ${title}`}>
      {/* Gold progress bar — plná šířka nahoře */}
      <div
        className="tour-bar__progress"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="tour-bar__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="tour-bar__inner">
        {/* Meta řádek */}
        <div className="tour-bar__meta">
          {chapterName && (
            <span className="tour-bar__chapter">{chapterName}</span>
          )}
          <span className="tour-bar__step-count">
            {stepNumber} / {totalSteps}
          </span>
        </div>

        {/* Obsah */}
        <div className="tour-bar__body">
          <h3 className="tour-bar__title">{title}</h3>
          {description && (
            <p className="tour-bar__description">{description}</p>
          )}

          {/* Interaktivní hint */}
          {isInteractive && (
            <div className="tour-bar__hint">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Proveď akci výše — pak pokračuj
            </div>
          )}

          {/* Reward hint */}
          {step.isRequiredForReward && (
            <div className="tour-bar__hint tour-bar__hint--reward">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Povinný pro získání odměny
            </div>
          )}
        </div>

        {/* Navigace */}
        <div className="tour-bar__actions">
          <button
            className="tour-bar__btn-back"
            onClick={onPrev}
            disabled={isFirst}
            type="button"
            aria-label="Předchozí krok"
          >
            ← Zpět
          </button>

          <button
            className="tour-bar__btn-defer"
            onClick={onDefer}
            type="button"
            aria-label="Odložit průvodce"
          >
            Odložit
          </button>

          <button
            className={`tour-bar__btn-next${isLast ? ' tour-bar__btn-next--finish' : ''}`}
            onClick={onNext}
            type="button"
            aria-label={isLast ? 'Dokončit průvodce' : 'Další krok'}
          >
            {isLast ? 'Hotovo ✓' : 'Další →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TourTooltip(props: TourTooltipProps) {
  if (typeof document === 'undefined') return null;
  return createPortal(<TooltipContent {...props} />, document.body);
}
