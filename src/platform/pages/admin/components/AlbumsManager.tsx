/**
 * AlbumsManager Component
 * 
 * Wrapper component for albums management (CRUD operations).
 * Orchestrates AlbumTable, AlbumForm, and SearchBar.
 * 
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/Components
 * @since 2.47.0
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import type { Album } from '@/platform/components/AudioPlayer/types';
import { Loader } from '@/platform/components';
import { SearchBar } from './SearchBar';
import { AlbumTable } from './AlbumTable';
import { AlbumForm } from './AlbumForm';
import './managers.css';

export function AlbumsManager() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load albums on mount
  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await adminApi.albums.getAll();
      setAlbums(data);
    } catch (err) {
      console.error('Failed to load albums:', err);
      setError('Nepodařilo se načíst alba');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAlbum(null);
    setIsFormOpen(true);
  };

  const handleEdit = (album: Album) => {
    setEditingAlbum(album);
    setIsFormOpen(true);
  };

  const handleDelete = async (albumId: string) => {
    if (!confirm('Opravdu chceš smazat toto album? Tracky v albu zůstanou zachovány.')) {
      return;
    }

    try {
      await adminApi.albums.delete(albumId);
      await loadAlbums();
      alert('Album bylo úspěšně smazáno!');
    } catch (err) {
      console.error('Failed to delete album:', err);
      alert('Nepodařilo se smazat album');
    }
  };

  const handleFormSubmit = async () => {
    setIsFormOpen(false);
    setEditingAlbum(null);
    await loadAlbums();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingAlbum(null);
  };

  // Filter albums by search query
  const filteredAlbums = albums.filter((album) => {
    const query = searchQuery.toLowerCase();
    return (
      album.name.toLowerCase().includes(query) ||
      album.type.toLowerCase().includes(query) ||
      album.description?.toLowerCase().includes(query) ||
      false
    );
  });

  return (
    <div className="albums-manager">
      <div className="albums-manager__toolbar">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Hledat album..."
        />
        
        <button 
          className="albums-manager__create-btn"
          onClick={handleCreate}
        >
          + Nové album
        </button>
      </div>

      {isLoading && <Loader message="Načítám alba..." />}

      {error && (
        <div className="albums-manager__error">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <AlbumTable
          albums={filteredAlbums}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {isFormOpen && (
        <AlbumForm
          album={editingAlbum}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}
