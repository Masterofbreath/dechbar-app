/**
 * CueSoundSelector - Breathing Cue Sound Pack Selector
 *
 * Collapsed dropdown pro výběr sady zvuků dechových signálů.
 * Stejný vizuální styl jako TrackSelector — collapsed trigger + rozbalovací panel.
 *
 * Sady jsou zatím hardcoded; v budoucnu lze napojit na DB (breathing_cues.sound_pack).
 *
 * @package DechBar_App
 * @subpackage MVP0/Components/Settings
 */

import React, { useEffect, useRef, useState } from 'react';

export interface CueSoundPack {
  id: string;
  name: string;
  description: string;
  requiredTier: 'ZDARMA' | 'SMART' | 'AI_COACH';
}

export interface CueSoundSelectorProps {
  selectedPack: string;
  onChange: (packId: string) => void;
  userTier: 'ZDARMA' | 'SMART' | 'AI_COACH';
  disabled?: boolean;
}

// ─── Dostupné sady zvuků ──────────────────────────────────────────────────────
// Zatím generované tóny (Web Audio API). Budoucí sady budou CDN audio.

const CUE_PACKS: CueSoundPack[] = [
  {
    id: 'solfeggio',
    name: 'Solfeggio frekvence',
    description: '963 / 639 / 396 Hz',
    requiredTier: 'ZDARMA',
  },
  {
    id: 'tibetan-bowls',
    name: 'Tibetské mísy',
    description: 'Hluboké rezonující tóny',
    requiredTier: 'SMART',
  },
  {
    id: 'birds',
    name: 'Ptáci v přírodě',
    description: 'Jemné přírodní zvuky',
    requiredTier: 'SMART',
  },
];

const TIER_LEVEL: Record<string, number> = { ZDARMA: 0, SMART: 1, AI_COACH: 2 };

export const CueSoundSelector: React.FC<CueSoundSelectorProps> = ({
  selectedPack,
  onChange,
  userTier,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const currentPack = CUE_PACKS.find(p => p.id === selectedPack) ?? CUE_PACKS[0];
  const canAccess = (pack: CueSoundPack): boolean =>
    (TIER_LEVEL[userTier] ?? 0) >= (TIER_LEVEL[pack.requiredTier] ?? 0);

  const handleSelect = (packId: string) => {
    onChange(packId);
    setIsOpen(false);
  };

  return (
    <div className="track-selector" ref={dropdownRef}>
      <span className="track-selector__label">Sada zvuků</span>

      {/* Collapsed trigger */}
      <button
        type="button"
        className={`track-selector__trigger ${isOpen ? 'track-selector__trigger--open' : ''}`}
        onClick={() => !disabled && setIsOpen(v => !v)}
        disabled={disabled}
        aria-expanded={isOpen}
      >
        <span className="track-selector__trigger-label">
          {currentPack.name}
        </span>
        <svg
          className={`track-selector__chevron ${isOpen ? 'track-selector__chevron--up' : ''}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="track-selector__dropdown">
          {CUE_PACKS.map(pack => {
            const accessible = canAccess(pack);
            const isSelected = selectedPack === pack.id;
            const tierLabel = pack.requiredTier !== 'ZDARMA' ? pack.requiredTier : null;

            return (
              <button
                key={pack.id}
                type="button"
                className={[
                  'track-selector__option',
                  isSelected ? 'track-selector__option--selected' : '',
                  !accessible ? 'track-selector__option--locked' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => accessible && handleSelect(pack.id)}
                disabled={!accessible}
              >
                <span className="track-selector__option-name">{pack.name}</span>
                {pack.description && (
                  <span className="track-selector__option-hint">{pack.description}</span>
                )}
                {tierLabel && (
                  <span className={`track-selector__option-badge ${!accessible ? 'track-selector__option-badge--locked' : ''}`}>
                    {tierLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
