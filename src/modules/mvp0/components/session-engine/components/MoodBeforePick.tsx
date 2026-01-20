/**
 * MoodBeforePick - Quick emoji picker před cvičením
 * 
 * Rychlý výběr nálady PŘED cvičením (pre-session mood tracking)
 * Minimal UI - jen emoji + label, no friction
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import type { MoodType } from '../../../types/exercises';

interface MoodBeforePickProps {
  value: MoodType | null;
  onChange: (mood: MoodType) => void;
  onSkip?: () => void; // Optional skip callback
}

const MOOD_OPTIONS = [
  { value: 'stressed', emoji: '😰', label: 'Ve stresu' },
  { value: 'tired', emoji: '😴', label: 'Unaveně' },
  { value: 'neutral', emoji: '😐', label: 'Neutrálně' },
  { value: 'calm', emoji: '😌', label: 'Klidně' },
  { value: 'energized', emoji: '⚡', label: 'Energicky' },
] as const;

export function MoodBeforePick({ value, onChange, onSkip }: MoodBeforePickProps) {
  return (
    <div className="mood-before-pick">
      <h3 className="mood-before-pick__title">Jak se teď cítíš?</h3>
      
      {/* Emoji row - větší než "po cvičení" */}
      <div className="mood-before-pick__emojis">
        {MOOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`mood-before-pick__emoji-btn ${value === opt.value ? 'mood-before-pick__emoji-btn--selected' : ''}`}
            onClick={() => onChange(opt.value as MoodType)}
            aria-label={opt.label}
            title={opt.label}
          >
            <span className="mood-before-pick__emoji" aria-hidden="true">
              {opt.emoji}
            </span>
            <span className="mood-before-pick__label">{opt.label}</span>
          </button>
        ))}
      </div>
      
      {/* Optional skip text */}
      {onSkip && (
        <p className="mood-before-pick__skip">
          Nebo{' '}
          <button
            type="button"
            className="mood-before-pick__skip-btn"
            onClick={onSkip}
          >
            přeskoč a začni cvičit
          </button>
        </p>
      )}
    </div>
  );
}
