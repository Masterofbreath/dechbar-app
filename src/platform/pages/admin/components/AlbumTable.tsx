/**
 * AlbumTable Component
 * 
 * Table view of all albums with edit/delete actions.
 * Transforms to card layout on mobile (<768px).
 * 
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/Components
 * @since 2.47.0
 */

import type { Album } from '@/platform/components/AudioPlayer/types';
import { EmptyState } from '@/platform/components';
import './AlbumTable.css';

interface AlbumTableProps {
  albums: Album[];
  onEdit: (album: Album) => void;
  onDelete: (albumId: string) => void;
}

export function AlbumTable({ albums, onEdit, onDelete }: AlbumTableProps) {
  if (albums.length === 0) {
    return (
      <EmptyState
        icon="album"
        message="Žádná alba nenalezena"
        description="Začněte vytvořením prvního alba"
      />
    );
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      challenge: 'Výzva',
      course: 'Kurz',
      training: 'Trénink',
      decharna: 'Dechárna',
    };
    return labels[type] || type;
  };

  const getDifficultyBadge = (difficulty: string): string => {
    const badges: Record<string, string> = {
      easy: 'Snadné',
      medium: 'Střední',
      hard: 'Těžké',
      extreme: 'Extrémní',
    };
    return badges[difficulty] || difficulty;
  };

  return (
    <div className="album-table">
      <table className="album-table__table">
        <thead>
          <tr>
            <th>Cover</th>
            <th>Název</th>
            <th>Typ</th>
            <th>Obtížnost</th>
            <th>Status</th>
            <th>Vytvořeno</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {albums.map((album) => (
            <tr key={album.id} className="album-table__row">
              <td className="album-table__cover-cell">
                {album.cover_url ? (
                  <img
                    src={album.cover_url}
                    alt={album.name}
                    className="album-table__cover"
                  />
                ) : (
                  <div className="album-table__cover-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </td>
              <td className="album-table__name">{album.name}</td>
              <td>
                <span className={`album-table__type album-table__type--${album.type}`}>
                  {getTypeLabel(album.type)}
                </span>
              </td>
              <td>
                <span className={`album-table__difficulty album-table__difficulty--${album.difficulty}`}>
                  {getDifficultyBadge(album.difficulty)}
                </span>
              </td>
              <td>
                {album.is_locked ? (
                  <span className="album-table__status album-table__status--locked">
                    Zamčeno
                  </span>
                ) : (
                  <span className="album-table__status album-table__status--unlocked">
                    Odemčeno
                  </span>
                )}
              </td>
              <td>{formatDate(album.created_at)}</td>
              <td>
                <div className="album-table__actions">
                  <button
                    className="album-table__action-btn album-table__action-btn--edit"
                    onClick={() => onEdit(album)}
                  >
                    <svg className="album-table__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Edit
                  </button>
                  <button
                    className="album-table__action-btn album-table__action-btn--delete"
                    onClick={() => onDelete(album.id)}
                  >
                    <svg className="album-table__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
