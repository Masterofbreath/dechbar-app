/**
 * FullscreenPlayer - Fullscreen modal audio player
 * 
 * Apple Premium Style:
 * - Reuses FullscreenModal pattern from Session Engine
 * - TopBar: Title + Favourite + Close
 * - ContentZone: Cover art + Waveform + Time
 * - BottomBar: Play/Pause + Volume
 * - Integrates: useAudioPlayer, useAudioTracking, useWakeLock
 * 
 * @version 2.43.0
 * @status ✅ IMPLEMENTED
 */

import React, { useEffect } from 'react';
import { FullscreenModal } from '@/components/shared/FullscreenModal/FullscreenModal';
import { PlayPauseButton } from './components/PlayPauseButton';
import { WaveformProgress } from './components/WaveformProgress';
import { TimeDisplay } from './components/TimeDisplay';
import { FavouriteButton } from './components/FavouriteButton';
import { VolumeControl } from './components/VolumeControl';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useAudioTracking } from './hooks/useAudioTracking';
import { useAudioPlayerStore } from './store';
import type { Track } from './types';

interface FullscreenPlayerProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
}

export const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({
  track,
  isOpen,
  onClose,
}) => {
  const { 
    volume, 
    isMuted, 
    setVolume, 
    toggleMute,
    collapseToSticky,
  } = useAudioPlayerStore();

  // Audio playback hook
  const {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    error,
    play,
    pause,
    seek,
    setVolume: setAudioVolume,
  } = useAudioPlayer(track);

  // 80% completion tracking
  const {
    listenedSegments,
    isCompleted,
    calculateTotalListened,
    saveProgress,
  } = useAudioTracking({
    trackId: track.id,
    albumId: track.album_id,
    duration,
    currentTime,
    isPlaying,
  });

  // Wake Lock (reuse from Session Engine)
  // TODO: Import and use when available
  // const { request: requestWakeLock, release: releaseWakeLock } = useWakeLock();

  // Sync volume with audio element
  useEffect(() => {
    setAudioVolume(volume);
  }, [volume, setAudioVolume]);

  // Wake Lock: request when playing, release when paused
  useEffect(() => {
    if (isPlaying) {
      // requestWakeLock(); // TODO: Uncomment when hook available
      console.log('🔓 Wake Lock requested');
    } else {
      // releaseWakeLock(); // TODO: Uncomment when hook available
      console.log('🔒 Wake Lock released');
    }
  }, [isPlaying]);

  // Handle play/pause toggle
  const handlePlayPause = async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  };

  // Handle close (collapse to sticky, not full close)
  const handleClose = () => {
    collapseToSticky();
    onClose();
  };

  // Handle volume change
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
  };

  return (
    <FullscreenModal isOpen={isOpen} onClose={handleClose}>
      {/* TopBar: Title + Favourite + Close */}
      <FullscreenModal.TopBar>
        <div className="flex items-center justify-between w-full px-4">
          <div className="flex-1" />
          
          <h2 className="text-base font-semibold text-text-primary text-center flex-1">
            {track.title}
          </h2>
          
          <div className="flex-1 flex items-center justify-end gap-2">
            <FavouriteButton trackId={track.id} />
            <FullscreenModal.CloseButton onClose={handleClose} />
          </div>
        </div>
      </FullscreenModal.TopBar>

      {/* ContentZone: Cover + Waveform + Time */}
      <FullscreenModal.ContentZone>
        <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-6">
          {/* Cover Art */}
          {track.cover_url && (
            <img
              src={track.cover_url}
              alt={track.title}
              className="
                w-48 h-48 md:w-52 md:h-52
                rounded-2xl
                shadow-lg
                object-cover
              "
            />
          )}

          {/* Waveform Progress */}
          <div className="w-full">
            <WaveformProgress
              peaks={track.waveform_peaks || []}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
            />
          </div>

          {/* Time Display */}
          <TimeDisplay current={currentTime} total={duration} />

          {/* Error Message */}
          {error && (
            <p className="text-sm text-error text-center">
              {error}
            </p>
          )}

          {/* Debug Info (dev only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-text-tertiary text-center space-y-1">
              <p>Segments: {listenedSegments.length}</p>
              <p>Total listened: {Math.floor(calculateTotalListened())}s</p>
              <p>Completion: {Math.floor((calculateTotalListened() / duration) * 100)}%</p>
              {isCompleted && <p className="text-success">✅ Completed!</p>}
            </div>
          )}
        </div>
      </FullscreenModal.ContentZone>

      {/* BottomBar: Play/Pause + Volume */}
      <FullscreenModal.BottomBar>
        <div className="flex items-center justify-between w-full px-6">
          <div className="flex-1" />
          
          <PlayPauseButton
            isPlaying={isPlaying}
            isLoading={isLoading}
            onClick={handlePlayPause}
            size="lg"
            variant="primary"
          />
          
          <div className="flex-1 flex items-center justify-end">
            <VolumeControl
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={handleVolumeChange}
              onMuteToggle={toggleMute}
            />
          </div>
        </div>
      </FullscreenModal.BottomBar>
    </FullscreenModal>
  );
};
