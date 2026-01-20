/**
 * MoodSlider - Horizontal mood slider with gradient
 * 
 * Space-saving slider design (replaces 5 button grid)
 * Red (stressed) → Green (energized) gradient
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import type { MoodType } from '../../../../types/exercises';

interface MoodSliderProps {
  value: MoodType | null;
  onChange: (mood: MoodType) => void;
}

const MOOD_OPTIONS = [
  { value: 'stressed', emoji: '😰', label: 'Ve stresu' },
  { value: 'tired', emoji: '😴', label: 'Unaveně' },
  { value: 'neutral', emoji: '😐', label: 'Neutrálně' },
  { value: 'calm', emoji: '😌', label: 'Klidně' },
  { value: 'energized', emoji: '⚡', label: 'Energicky' },
] as const;

export function MoodSlider({ value, onChange }: MoodSliderProps) {
  const moodToValue = (mood: MoodType | null): number => {
    if (!mood) return 3; // Default: neutral
    const index = MOOD_OPTIONS.findIndex(opt => opt.value === mood);
    return index + 1;
  };
  
  const valueToMood = (val: number): MoodType => {
    return MOOD_OPTIONS[val - 1].value as MoodType;
  };
  
  return (
    <div className="mood-check">
      <h3 className="mood-check__title">Jak se teď cítíš?</h3>
      
      <div className="mood-slider">
        {/* Emoji row above slider - CLICKABLE */}
        <div className="mood-slider__emojis">
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="mood-slider__emoji-btn"
              onClick={() => onChange(opt.value as MoodType)}
              aria-label={opt.label}
              title={opt.label}
            >
              <span aria-hidden="true">{opt.emoji}</span>
            </button>
          ))}
        </div>
        
        {/* Range input with gradient track */}
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={moodToValue(value)}
          onChange={(e) => onChange(valueToMood(Number(e.target.value)))}
          className="mood-slider__input"
          aria-label="Jak se cítíš"
        />
        
        {/* Labels below slider */}
        <div className="mood-slider__labels">
          {MOOD_OPTIONS.map(opt => (
            <span key={opt.value}>{opt.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
