/**
 * TrackSelector - Background Music Track Selector
 * 
 * Dropdown selector for background music tracks with tier filtering.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/Settings
 */

import React, { useEffect } from 'react';
import type { BackgroundTrack } from '../../types/audio';

export interface TrackSelectorProps {
  tracks: BackgroundTrack[];
  selectedSlug: string | null;
  onChange: (slug: string | null) => void;
  userTier: 'ZDARMA' | 'SMART' | 'AI_COACH';
  onFetchTracks: () => void;
  disabled?: boolean;
}

/**
 * TrackSelector - Background music track selection
 */
export const TrackSelector: React.FC<TrackSelectorProps> = ({
  tracks,
  selectedSlug,
  onChange,
  userTier,
  onFetchTracks,
  disabled = false,
}) => {
  // Fetch tracks on mount
  useEffect(() => {
    if (tracks.length === 0) {
      onFetchTracks();
    }
  }, [tracks.length, onFetchTracks]);
  
  // Check if user can access track
  const canAccessTrack = (track: BackgroundTrack): boolean => {
    if (track.required_tier === 'ZDARMA') return true;
    if (track.required_tier === 'SMART' && (userTier === 'SMART' || userTier === 'AI_COACH')) return true;
    if (track.required_tier === 'AI_COACH' && userTier === 'AI_COACH') return true;
    return false;
  };
  
  return (
    <div className="track-selector">
      <label className="track-selector__label">Vybrat track</label>
      <select
        value={selectedSlug || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className="track-selector__select"
      >
        <option value="">Bez hudby</option>
        {tracks.map((track) => {
          const accessible = canAccessTrack(track);
          return (
            <option 
              key={track.slug} 
              value={track.slug}
              disabled={!accessible}
            >
              {track.name} {!accessible && '🔒'}
            </option>
          );
        })}
      </select>
    </div>
  );
};
