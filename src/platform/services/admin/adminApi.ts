/**
 * Admin API Service
 * 
 * Abstraction layer for admin operations on tracks, albums, playlists.
 * Provides CRUD methods with error handling and TypeScript type safety.
 * 
 * This abstraction allows easy migration to REST API in future by only changing this file.
 * 
 * @package DechBar_App
 * @subpackage Platform/Services/Admin
 * @since 2.44.0
 */

import { supabase } from '@/platform/api/supabase';
import type { Track, Album } from '@/platform/components/AudioPlayer/types';
import type { TrackInput, TrackFilters, AlbumInput, AlbumFilters } from './types';

/**
 * Admin API - Tracks Management
 */
export const adminApi = {
  tracks: {
    /**
     * Get all tracks with optional filters
     * @param filters - Optional filters (category, album_id, search)
     * @returns Promise with array of tracks
     */
    async getAll(filters?: TrackFilters): Promise<Track[]> {
      try {
        let query = supabase
          .from('tracks')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.duration_category) {
          query = query.eq('duration_category', filters.duration_category);
        }
        if (filters?.mood_category) {
          query = query.eq('mood_category', filters.mood_category);
        }
        if (filters?.album_id) {
          query = query.eq('album_id', filters.album_id);
        }
        if (filters?.is_published !== undefined) {
          query = query.eq('is_published', filters.is_published);
        }
        if (filters?.search) {
          query = query.ilike('title', `%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching tracks:', error);
          throw new Error(`Failed to fetch tracks: ${error.message}`);
        }

        return data || [];
      } catch (error) {
        console.error('Admin API error (tracks.getAll):', error);
        throw error;
      }
    },

    /**
     * Get single track by ID
     * @param id - Track ID
     * @returns Promise with track data
     */
    async getById(id: string): Promise<Track> {
      try {
        const { data, error } = await supabase
          .from('tracks')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching track:', error);
          throw new Error(`Failed to fetch track: ${error.message}`);
        }

        if (!data) {
          throw new Error('Track not found');
        }

        return data;
      } catch (error) {
        console.error('Admin API error (tracks.getById):', error);
        throw error;
      }
    },

    /**
     * Create new track
     * @param input - Track data
     * @returns Promise with created track
     */
    async create(input: TrackInput): Promise<Track> {
      try {
        const { data, error } = await supabase
          .from('tracks')
          .insert(input)
          .select()
          .single();

        if (error) {
          console.error('Error creating track:', error);
          throw new Error(`Failed to create track: ${error.message}`);
        }

        if (!data) {
          throw new Error('Failed to create track: No data returned');
        }

        return data;
      } catch (error) {
        console.error('Admin API error (tracks.create):', error);
        throw error;
      }
    },

    /**
     * Update existing track
     * @param id - Track ID
     * @param input - Partial track data to update
     * @returns Promise with updated track
     */
    async update(id: string, input: Partial<TrackInput>): Promise<Track> {
      try {
        const { data, error } = await supabase
          .from('tracks')
          .update(input)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating track:', error);
          throw new Error(`Failed to update track: ${error.message}`);
        }

        if (!data) {
          throw new Error('Track not found');
        }

        return data;
      } catch (error) {
        console.error('Admin API error (tracks.update):', error);
        throw error;
      }
    },

    /**
     * Delete track
     * @param id - Track ID
     * @returns Promise<void>
     */
    async delete(id: string): Promise<void> {
      try {
        const { error } = await supabase
          .from('tracks')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting track:', error);
          throw new Error(`Failed to delete track: ${error.message}`);
        }
      } catch (error) {
        console.error('Admin API error (tracks.delete):', error);
        throw error;
      }
    },

    /**
     * Bulk update track order
     * @param updates - Array of {id, track_order} objects
     * @returns Promise<void>
     */
    async bulkUpdateOrder(updates: { id: string; track_order: number }[]): Promise<void> {
      try {
        const promises = updates.map(({ id, track_order }) =>
          supabase.from('tracks').update({ track_order }).eq('id', id)
        );
        await Promise.all(promises);
      } catch (error) {
        console.error('Admin API error (tracks.bulkUpdateOrder):', error);
        throw error;
      }
    },
  },

  /**
   * Admin API - Albums Management
   */
  albums: {
    /**
     * Get all albums with optional filters
     * @param filters - Optional filters (type, difficulty, search)
     * @returns Promise with array of albums
     */
    async getAll(filters?: AlbumFilters): Promise<Album[]> {
      try {
        let query = supabase
          .from('albums')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.type) {
          query = query.eq('type', filters.type);
        }
        if (filters?.difficulty) {
          query = query.eq('difficulty', filters.difficulty);
        }
        if (filters?.is_locked !== undefined) {
          query = query.eq('is_locked', filters.is_locked);
        }
        if (filters?.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching albums:', error);
          throw new Error(`Failed to fetch albums: ${error.message}`);
        }

        return data || [];
      } catch (error) {
        console.error('Admin API error (albums.getAll):', error);
        throw error;
      }
    },

    /**
     * Get single album by ID
     * @param id - Album ID
     * @returns Promise with album data
     */
    async getById(id: string): Promise<Album> {
      try {
        const { data, error } = await supabase
          .from('albums')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching album:', error);
          throw new Error(`Failed to fetch album: ${error.message}`);
        }

        if (!data) {
          throw new Error('Album not found');
        }

        return data;
      } catch (error) {
        console.error('Admin API error (albums.getById):', error);
        throw error;
      }
    },

    /**
     * Create new album
     * @param input - Album data
     * @returns Promise with created album
     */
    async create(input: AlbumInput): Promise<Album> {
      try {
        const { data, error } = await supabase
          .from('albums')
          .insert(input)
          .select()
          .single();

        if (error) {
          console.error('Error creating album:', error);
          throw new Error(`Failed to create album: ${error.message}`);
        }

        if (!data) {
          throw new Error('Failed to create album: No data returned');
        }

        return data;
      } catch (error) {
        console.error('Admin API error (albums.create):', error);
        throw error;
      }
    },

    /**
     * Update existing album
     * @param id - Album ID
     * @param input - Partial album data to update
     * @returns Promise with updated album
     */
    async update(id: string, input: Partial<AlbumInput>): Promise<Album> {
      try {
        const { data, error } = await supabase
          .from('albums')
          .update(input)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating album:', error);
          throw new Error(`Failed to update album: ${error.message}`);
        }

        if (!data) {
          throw new Error('Album not found');
        }

        return data;
      } catch (error) {
        console.error('Admin API error (albums.update):', error);
        throw error;
      }
    },

    /**
     * Delete album
     * @param id - Album ID
     * @returns Promise<void>
     */
    async delete(id: string): Promise<void> {
      try {
        const { error } = await supabase
          .from('albums')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting album:', error);
          throw new Error(`Failed to delete album: ${error.message}`);
        }
      } catch (error) {
        console.error('Admin API error (albums.delete):', error);
        throw error;
      }
    },

    /**
     * Get track count for album
     * @param albumId - Album ID
     * @returns Promise with track count
     */
    async getTrackCount(albumId: string): Promise<number> {
      try {
        const { count, error } = await supabase
          .from('tracks')
          .select('*', { count: 'exact', head: true })
          .eq('album_id', albumId);

        if (error) {
          console.error('Error getting track count:', error);
          throw new Error(`Failed to get track count: ${error.message}`);
        }

        return count || 0;
      } catch (error) {
        console.error('Admin API error (albums.getTrackCount):', error);
        throw error;
      }
    },
  },
};
