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
import type { Track } from '@/platform/components/AudioPlayer/types';
import type { TrackInput, TrackFilters } from './types';

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
        if (filters?.category) {
          query = query.eq('category', filters.category);
        }
        if (filters?.album_id) {
          query = query.eq('album_id', filters.album_id);
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
  },

  // Future: albums, playlists, gamification, users, analytics
};
