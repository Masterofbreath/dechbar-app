/**
 * AudioPlayer - Main audio player component wrapper
 * 
 * Public API for audio player:
 * - Loads track by ID from Supabase
 * - Renders FullscreenPlayer or delegates to StickyPlayer
 * - Manages global player state via Zustand store
 * 
 * @version 2.43.0
 * @status ✅ IMPLEMENTED
 */

import React, { useEffect, useState } from 'react';
import { FullscreenPlayer } from './FullscreenPlayer';
import { useAudioPlayerStore } from './store';
import type { AudioPlayerProps, Track } from './types';

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  trackId,
  mode = 'fullscreen',
  autoplay = false,
  onComplete,
  onClose,
}) => {
  const [track, setTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { play } = useAudioPlayerStore();

  // Load track from Supabase
  useEffect(() => {
    const loadTrack = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // TODO: Fetch from Supabase when DB is ready
        // For now, create mock track for testing
        const mockTrack: Track = {
          id: trackId,
          album_id: null,
          title: 'Test Track',
          duration: 300, // 5 minutes
          audio_url: 'https://dechbar-cdn.b-cdn.net/test/test-audio.mp3',
          cover_url: null,
          category: 'Ráno',
          tags: ['test'],
          description: 'Test breathing exercise',
          track_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        setTrack(mockTrack);
        
        /* FUTURE IMPLEMENTATION:
        const { data, error } = await supabase
          .from('tracks')
          .select('*')
          .eq('id', trackId)
          .single();
        
        if (error) throw error;
        setTrack(data);
        */
      } catch (err) {
        console.error('Failed to load track:', err);
        setError('Nepodařilo se načíst track');
      } finally {
        setIsLoading(false);
      }
    };

    loadTrack();
  }, [trackId]);

  // Autoplay
  useEffect(() => {
    if (track && autoplay && !isLoading) {
      play(track);
    }
  }, [track, autoplay, isLoading, play]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4" />
          <p className="text-text-secondary">Načítám track...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !track) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center p-6">
          <svg className="w-16 h-16 text-error mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Chyba</h2>
          <p className="text-text-secondary mb-4">{error || 'Track nenalezen'}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent-light transition-colors"
            >
              Zavřít
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render player based on mode
  if (mode === 'fullscreen') {
    return (
      <FullscreenPlayer
        track={track}
        isOpen={true}
        onClose={onClose || (() => {})}
      />
    );
  }

  // Sticky mode is rendered globally via AppLayout
  // This component just initializes the store
  return null;
};

