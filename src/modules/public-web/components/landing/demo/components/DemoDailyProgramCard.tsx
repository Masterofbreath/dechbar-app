/**
 * DemoDailyProgramCard — Static demo version of TodaysChallengeButton
 *
 * Reuses the .todays-challenge-button CSS classes for visual consistency
 * with the real app. Shows a hardcoded featured program — no API calls.
 *
 * On click → triggers the conversion modal (same as exercise click).
 *
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

import '@/modules/mvp0/components/TodaysChallengeButton/TodaysChallengeButton.css';

interface DemoDailyProgramCardProps {
  onClick: () => void;
}

export function DemoDailyProgramCard({ onClick }: DemoDailyProgramCardProps) {
  return (
    <button
      className="todays-challenge-button todays-challenge-button--active todays-challenge-button--featured"
      type="button"
      onClick={onClick}
      aria-label="Zjistit více o programu Digitální ticho"
    >
      {/* Cover placeholder — music icon */}
      <div className="todays-challenge-button__cover" aria-hidden="true">
        <div className="todays-challenge-button__cover-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
          </svg>
        </div>
      </div>

      {/* Program info */}
      <div className="todays-challenge-button__content">
        <h3 className="todays-challenge-button__title">Digitální ticho</h3>
        <p className="todays-challenge-button__subtitle">21 dní · 15 min/den</p>
      </div>

      {/* CTA */}
      <div className="todays-challenge-button__cta">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: 14, height: 14 }}>
          <path d="M8 5v14l11-7z" />
        </svg>
        <span>Zjistit více</span>
      </div>
    </button>
  );
}
