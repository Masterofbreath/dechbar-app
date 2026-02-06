/**
 * TrackTable Component
 * 
 * Table view of all tracks with edit/delete/play actions.
 * Transforms to card layout on mobile (<768px).
 * 
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/Components
 * @since 2.47.0
 */

import { useState, useEffect, useRef } from 'react';
import type { Track } from '@/platform/components/AudioPlayer/types';
import { EmptyState } from '@/platform/components';
import './TrackTable.css';

interface TrackTableProps {
  tracks: Track[];
  onEdit: (track: Track) => void;
  onDelete: (trackId: string) => void;
}

export function TrackTable({ tracks, onEdit, onDelete }: TrackTableProps) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement>(new Audio());

  // Cleanup audio on unmount
  useEffect(() => {
    const audio = audioElementRef.current;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const handlePlay = (track: Track) => {
    const audio = audioElementRef.current;
    if (playingTrackId === track.id) {
      audio.pause();
      setPlayingTrackId(null);
    } else {
      audio.src = track.audio_url;
      audio.play().catch((err) => {
        console.error('Playback error:', err);
        alert('Nepodařilo se přehrát audio');
      });
      setPlayingTrackId(track.id);
    }
  };

  // Listen for audio end
  useEffect(() => {
    const audio = audioElementRef.current;
    const handleEnded = () => setPlayingTrackId(null);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  if (tracks.length === 0) {
    return (
      <EmptyState
        icon="music"
        message="Žádné tracky nenalezeny"
        description="Začněte vytvořením prvního tracku"
      />
    );
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  return (
    <div className="track-table">
      <table className="track-table__table">
        <thead>
          <tr>
            <th>Cover</th>
            <th>Název</th>
            <th>Typ cvičení</th>
            <th>Intenzita</th>
            <th>Obtížnost</th>
            <th>KP</th>
            <th>Délka</th>
            <th>Status</th>
            <th>Vytvořeno</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => (
            <tr key={track.id} className="track-table__row">
              <td className="track-table__cover-cell">
                {track.cover_url ? (
                  <img
                    src={track.cover_url}
                    alt={track.title}
                    className="track-table__cover"
                  />
                ) : (
                  <div className="track-table__cover-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                )}
              </td>
              <td className="track-table__title">{track.title}</td>
              <td>
                {track.exercise_format && (
                  <span className={`track-table__badge track-table__badge--format-${track.exercise_format}`}>
                    {track.exercise_format === 'dechpresso' && 'Dechpresso'}
                    {track.exercise_format === 'meditace' && 'Meditace'}
                    {track.exercise_format === 'breathwork' && 'Breathwork'}
                  </span>
                )}
              </td>
              <td>
                {track.intensity_level && (
                  <span className={`track-table__badge track-table__badge--intensity-${track.intensity_level}`}>
                    {track.intensity_level === 'jemna' && 'Jemná'}
                    {track.intensity_level === 'stredni' && 'Střední'}
                    {track.intensity_level === 'vysoka' && 'Vysoká'}
                    {track.intensity_level === 'extremni' && 'Extrémní'}
                  </span>
                )}
              </td>
              <td>
                {track.difficulty_level && (
                  <span className={`track-table__badge track-table__badge--difficulty-${track.difficulty_level}`}>
                    {track.difficulty_level === 'easy' && 'Snadné'}
                    {track.difficulty_level === 'medium' && 'Střední'}
                    {track.difficulty_level === 'hard' && 'Náročné'}
                    {track.difficulty_level === 'extreme' && 'Extrémní'}
                  </span>
                )}
              </td>
              <td>
                {track.kp_suitability && (
                  <span className="track-table__badge track-table__badge--kp">
                    {track.kp_suitability}
                  </span>
                )}
              </td>
              <td>
                {formatDuration(track.duration)}
                {track.duration_category && (
                  <span className="track-table__duration-cat"> ({track.duration_category})</span>
                )}
              </td>
              <td>
                {track.is_published ? (
                  <span className="track-table__status track-table__status--published">
                    Publikováno
                  </span>
                ) : (
                  <span className="track-table__status track-table__status--draft">
                    Koncept
                  </span>
                )}
              </td>
              <td>{formatDate(track.created_at)}</td>
              <td>
                <div className="track-table__actions">
                  <button
                    className="track-table__action-btn track-table__action-btn--play"
                    onClick={() => handlePlay(track)}
                    title={playingTrackId === track.id ? 'Pauza' : 'Přehrát'}
                  >
                    {playingTrackId === track.id ? (
                      <svg className="track-table__icon" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg className="track-table__icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    className="track-table__action-btn track-table__action-btn--edit"
                    onClick={() => onEdit(track)}
                  >
                    <svg className="track-table__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Upravit
                  </button>
                  <button
                    className="track-table__action-btn track-table__action-btn--delete"
                    onClick={() => onDelete(track.id)}
                  >
                    <svg className="track-table__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Smazat
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
