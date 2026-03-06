/**
 * TrackSelector - Background Music Track Selector
 *
 * Collapsed dropdown zobrazující aktuálně vybraný track.
 * Po rozbalení zobrazuje tracky seskupené podle kategorií.
 * Podpora "Náhodný výběr" — systém vybere náhodný dostupný track před každou session.
 *
 * @package DechBar_App
 * @subpackage MVP0/Components/Settings
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { BackgroundTrack } from '../../types/audio';

export interface TrackSelectorProps {
  tracks: BackgroundTrack[];
  selectedSlug: string | null;
  randomEnabled: boolean;
  onChange: (slug: string | null) => void;
  onRandomChange: (enabled: boolean) => void;
  userTier: 'ZDARMA' | 'SMART' | 'AI_COACH';
  onFetchTracks: () => Promise<BackgroundTrack[]>;
  disabled?: boolean;
}

const TIER_LEVEL: Record<string, number> = { ZDARMA: 0, SMART: 1, AI_COACH: 2 };

const CATEGORY_LABELS: Record<string, string> = {
  nature:   'Příroda',
  binaural: 'Binaurální',
  tibetan:  'Tibetské',
  yogic:    'Jógické',
};

const CATEGORY_ORDER = ['nature', 'binaural', 'tibetan', 'yogic'];

/**
 * TrackSelector — collapsed dropdown s kategoriemi + náhodný výběr
 */
export const TrackSelector: React.FC<TrackSelectorProps> = ({
  tracks,
  selectedSlug,
  randomEnabled,
  onChange,
  onRandomChange,
  userTier,
  onFetchTracks,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fetchCalledRef = useRef(false);

  // Fetch on mount if empty
  useEffect(() => {
    if (tracks.length === 0 && !fetchCalledRef.current) {
      fetchCalledRef.current = true;
      onFetchTracks();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const canAccess = useCallback((track: BackgroundTrack): boolean =>
    (TIER_LEVEL[userTier] ?? 0) >= (TIER_LEVEL[track.required_tier] ?? 0),
  [userTier]);

  // Selected track label for collapsed state
  const selectedTrack = tracks.find(t => t.slug === selectedSlug);
  const collapsedLabel = randomEnabled
    ? 'Náhodný výběr'
    : selectedTrack
      ? selectedTrack.name
      : 'Bez hudby';

  // Group tracks by category
  const grouped = CATEGORY_ORDER
    .map(cat => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      tracks: tracks.filter(t => t.category === cat),
    }))
    .filter(g => g.tracks.length > 0);

  const handleSelect = (slug: string | null) => {
    onChange(slug);
    onRandomChange(false);
    setIsOpen(false);
  };

  const handleRandom = () => {
    onRandomChange(true);
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div className="track-selector" ref={dropdownRef}>
      <span className="track-selector__label">Skladba na pozadí</span>

      {/* Collapsed trigger */}
      <button
        type="button"
        className={`track-selector__trigger ${isOpen ? 'track-selector__trigger--open' : ''}`}
        onClick={() => !disabled && setIsOpen(v => !v)}
        disabled={disabled}
        aria-expanded={isOpen}
      >
        <span className="track-selector__trigger-label">
          {randomEnabled && (
            <span className="track-selector__random-dot" aria-hidden="true" />
          )}
          {collapsedLabel}
        </span>
        {tracks.length === 0 ? (
          <span className="track-selector__trigger-hint">Načítám…</span>
        ) : (
          <svg className={`track-selector__chevron ${isOpen ? 'track-selector__chevron--up' : ''}`}
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="track-selector__dropdown">
          {/* Random option */}
          <button
            type="button"
            className={`track-selector__option track-selector__option--special ${randomEnabled ? 'track-selector__option--selected' : ''}`}
            onClick={handleRandom}
          >
            <span className="track-selector__option-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
              </svg>
            </span>
            <span className="track-selector__option-name">Náhodný výběr</span>
            <span className="track-selector__option-hint">Z dostupných tracků</span>
          </button>

          {/* "Bez hudby" */}
          <button
            type="button"
            className={`track-selector__option ${!selectedSlug && !randomEnabled ? 'track-selector__option--selected' : ''}`}
            onClick={() => handleSelect(null)}
          >
            <span className="track-selector__option-name">Bez hudby</span>
          </button>

          {/* Grouped tracks */}
          {grouped.map(group => (
            <div key={group.category} className="track-selector__group">
              <span className="track-selector__group-label">{group.label}</span>
              {group.tracks.map(track => {
                const accessible = canAccess(track);
                const isSelected = selectedSlug === track.slug && !randomEnabled;
                const tierLabel = track.required_tier === 'SMART'
                  ? 'SMART'
                  : track.required_tier === 'AI_COACH'
                    ? 'AI Coach'
                    : null;

                return (
                  <button
                    key={track.slug}
                    type="button"
                    className={[
                      'track-selector__option',
                      isSelected ? 'track-selector__option--selected' : '',
                      !accessible ? 'track-selector__option--locked' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => accessible && handleSelect(track.slug)}
                    disabled={!accessible}
                  >
                    <span className="track-selector__option-name">{track.name}</span>
                    {tierLabel && (
                      <span className={`track-selector__option-badge ${!accessible ? 'track-selector__option-badge--locked' : ''}`}>
                        {tierLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
