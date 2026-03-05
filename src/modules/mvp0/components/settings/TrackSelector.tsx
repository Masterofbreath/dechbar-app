/**
 * TrackSelector - Background Music Track Selector
 *
 * Radio-button výběr background tracku s tier-gating a live re-fetchem.
 * Pokud nejsou tracky načteny, automaticky fetchuje při mount.
 *
 * @package DechBar_App
 * @subpackage MVP0/Components/Settings
 */

import React, { useEffect, useRef } from 'react';
import type { BackgroundTrack } from '../../types/audio';

export interface TrackSelectorProps {
  tracks: BackgroundTrack[];
  selectedSlug: string | null;
  onChange: (slug: string | null) => void;
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

/**
 * TrackSelector — background music track selection with tier badges
 */
export const TrackSelector: React.FC<TrackSelectorProps> = ({
  tracks,
  selectedSlug,
  onChange,
  userTier,
  onFetchTracks,
  disabled = false,
}) => {
  const fetchCalledRef = useRef(false);

  // Fetch on mount if empty — ref prevents double-invoke in StrictMode
  useEffect(() => {
    if (tracks.length === 0 && !fetchCalledRef.current) {
      fetchCalledRef.current = true;
      onFetchTracks();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const canAccess = (track: BackgroundTrack): boolean =>
    (TIER_LEVEL[userTier] ?? 0) >= (TIER_LEVEL[track.required_tier] ?? 0);

  const tierBadgeLabel = (tier: string) => {
    if (tier === 'SMART')    return 'SMART';
    if (tier === 'AI_COACH') return 'AI Coach';
    return null;
  };

  if (tracks.length === 0) {
    return <p className="track-selector__loading">Načítám tracky...</p>;
  }

  return (
    <div className="track-selector">
      <span className="track-selector__label">Vybrat track</span>

      <div className="track-selector__list">
        {/* "Bez hudby" option */}
        <label className={`track-selector__item ${!selectedSlug ? 'track-selector__item--selected' : ''}`}>
          <input
            type="radio"
            name="background-track"
            value=""
            checked={!selectedSlug}
            onChange={() => onChange(null)}
            disabled={disabled}
            className="track-selector__radio"
          />
          <span className="track-selector__item-name">Bez hudby</span>
        </label>

        {tracks.map(track => {
          const accessible = canAccess(track);
          const badge = tierBadgeLabel(track.required_tier);
          const isSelected = selectedSlug === track.slug;

          return (
            <label
              key={track.slug}
              className={[
                'track-selector__item',
                isSelected ? 'track-selector__item--selected' : '',
                !accessible ? 'track-selector__item--locked' : '',
              ].filter(Boolean).join(' ')}
            >
              <input
                type="radio"
                name="background-track"
                value={track.slug}
                checked={isSelected}
                onChange={() => accessible && onChange(track.slug)}
                disabled={disabled || !accessible}
                className="track-selector__radio"
              />
              <span className="track-selector__item-info">
                <span className="track-selector__item-name">{track.name}</span>
                <span className="track-selector__item-meta">
                  {CATEGORY_LABELS[track.category] ?? track.category}
                </span>
              </span>
              {badge && !accessible && (
                <span className="track-selector__item-badge track-selector__item-badge--locked">
                  {badge}
                </span>
              )}
              {badge && accessible && (
                <span className="track-selector__item-badge">
                  {badge}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
};
