/**
 * TrackTable Component
 * 
 * Table view of all tracks with edit/delete actions.
 * Transforms to card layout on mobile (<768px).
 * 
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/Components
 * @since 2.44.0
 */

import type { Track } from '@/platform/components/AudioPlayer/types';
import { EmptyState } from '@/platform/components';
import './TrackTable.css';

interface TrackTableProps {
  tracks: Track[];
  onEdit: (track: Track) => void;
  onDelete: (trackId: string) => void;
}

export function TrackTable({ tracks, onEdit, onDelete }: TrackTableProps) {
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
            <th>Kategorie</th>
            <th>Délka</th>
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
                  <div className="track-table__cover-placeholder">🎵</div>
                )}
              </td>
              <td className="track-table__title">{track.title}</td>
              <td>
                {track.category && (
                  <span className="track-table__category">{track.category}</span>
                )}
              </td>
              <td>{formatDuration(track.duration)}</td>
              <td>{formatDate(track.created_at)}</td>
              <td>
                <div className="track-table__actions">
                  <button
                    className="track-table__action-btn track-table__action-btn--edit"
                    onClick={() => onEdit(track)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="track-table__action-btn track-table__action-btn--delete"
                    onClick={() => onDelete(track.id)}
                  >
                    🗑️ Smazat
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
