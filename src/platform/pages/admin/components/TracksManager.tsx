/**
 * TracksManager Component
 * 
 * Wrapper component for tracks management (CRUD operations).
 * Orchestrates TrackTable, TrackForm, and SearchBar.
 * 
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/Components
 * @since 2.47.0
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import type { Track } from '@/platform/components/AudioPlayer/types';
import { Loader } from '@/platform/components';
import { SearchBar } from './SearchBar';
import { TrackTable } from './TrackTable';
import { TrackForm } from './TrackForm';
import './managers.css';

export function TracksManager() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load tracks on mount
  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await adminApi.tracks.getAll();
      setTracks(data);
    } catch (err) {
      console.error('Failed to load tracks:', err);
      setError('Nepodařilo se načíst tracky');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTrack(null);
    setIsFormOpen(true);
  };

  const handleEdit = (track: Track) => {
    setEditingTrack(track);
    setIsFormOpen(true);
  };

  const handleDelete = async (trackId: string) => {
    if (!confirm('Opravdu chceš smazat tento track?')) {
      return;
    }

    try {
      await adminApi.tracks.delete(trackId);
      await loadTracks();
      alert('Track byl úspěšně smazán!');
    } catch (err) {
      console.error('Failed to delete track:', err);
      alert('Nepodařilo se smazat track');
    }
  };

  const handleFormSubmit = async () => {
    setIsFormOpen(false);
    setEditingTrack(null);
    await loadTracks();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingTrack(null);
  };

  // Filter tracks by search query
  const filteredTracks = tracks.filter((track) => {
    const query = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(query) ||
      track.mood_category?.toLowerCase().includes(query) ||
      track.duration_category?.toLowerCase().includes(query) ||
      false
    );
  });

  return (
    <div className="tracks-manager">
      <div className="tracks-manager__toolbar">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Hledat track..."
        />
        
        <button 
          className="tracks-manager__create-btn"
          onClick={handleCreate}
        >
          + Nový track
        </button>
      </div>

      {isLoading && <Loader message="Načítám tracky..." />}

      {error && (
        <div className="tracks-manager__error">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <TrackTable
          tracks={filteredTracks}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {isFormOpen && (
        <TrackForm
          track={editingTrack}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}
