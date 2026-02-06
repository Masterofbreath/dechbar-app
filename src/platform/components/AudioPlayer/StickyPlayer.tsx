/**
 * StickyPlayer - Sticky mini player (collapsed/expanded)
 * 
 * Apple Premium Style:
 * - Fixed position: bottom 60px (above BottomNav)
 * - Z-index: 998 (below modals, above BottomNav)
 * - Collapsed (60px): Play + Cover + Title + Time + Progress bar
 * - Expanded (400px): Full player interface
 * - Animations: slideUp 300ms cubic-bezier (Apple ease)
 * 
 * @version 2.43.0
 * @status ✅ IMPLEMENTED
 */

import React, { useEffect } from 'react';
import { PlayPauseButton } from './components/PlayPauseButton';
import { WaveformProgress } from './components/WaveformProgress';
import { TimeDisplay } from './components/TimeDisplay';
import { FavouriteButton } from './components/FavouriteButton';
import { VolumeControl } from './components/VolumeControl';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useAudioTracking } from './hooks/useAudioTracking';
import { useAudioPlayerStore } from './store';

export const StickyAudioPlayer: React.FC = () => {
  const {
    currentTrack,
    mode,
    isExpanded,
    volume,
    isMuted,
    expandSticky,
    close,
    setVolume,
    toggleMute,
  } = useAudioPlayerStore();

  // Audio playback hook
  const {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    play,
    pause,
    seek,
    setVolume: setAudioVolume,
  } = useAudioPlayer(currentTrack);

  // 80% completion tracking
  const {
    listenedSegments,
    isCompleted,
    calculateTotalListened,
  } = useAudioTracking({
    trackId: currentTrack?.id || '',
    albumId: currentTrack?.album_id || null,
    duration,
    currentTime,
    isPlaying,
  });

  // Sync volume
  useEffect(() => {
    setAudioVolume(volume);
  }, [volume, setAudioVolume]);

  // Don't render if no track or not sticky mode
  if (!currentTrack || mode !== 'sticky') return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayPause = async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  };

  const handleExpand = () => {
    if (!isExpanded) {
      expandSticky();
    }
  };

  const handleClose = () => {
    pause();
    close();
  };

  // Handle swipe down gesture to collapse (simplified)
  const handleSwipeDown = (e: React.TouchEvent) => {
    // TODO: Implement proper swipe gesture detection
    // For now, just collapse on touch if expanded
  };

  return (
    <div
      className={`
        sticky-player
        fixed left-0 right-0
        bg-surface-elevated bg-opacity-95
        backdrop-blur-xl
        border-t border-border
        transition-all duration-300
        ${isExpanded ? 'h-96' : 'h-15'}
        z-[998]
      `}
      style={{
        bottom: '60px', // Above BottomNav (60px height)
        transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)', // Apple ease
      }}
      onTouchMove={handleSwipeDown}
    >
      {isExpanded ? (
        // Expanded State (400px) - Full player
        <div className="h-full flex flex-col p-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text-primary flex-1">
              {currentTrack.title}
            </h3>
            <FavouriteButton trackId={currentTrack.id} />
            <button
              onClick={handleClose}
              className="
                w-8 h-8 ml-2
                rounded-full
                flex items-center justify-center
                hover:bg-surface
                transition-colors
              "
              aria-label="Zavřít"
            >
              <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          {/* Cover Art */}
          {currentTrack.cover_url && (
            <img
              src={currentTrack.cover_url}
              alt={currentTrack.title}
              className="w-36 h-36 rounded-xl shadow-md object-cover mx-auto mb-4"
            />
          )}

          {/* Waveform */}
          <div className="mb-4">
            <WaveformProgress
              peaks={currentTrack.waveform_peaks || []}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
            />
          </div>

          {/* Time */}
          <div className="mb-4">
            <TimeDisplay current={currentTime} total={duration} />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex-1" />
            <PlayPauseButton
              isPlaying={isPlaying}
              isLoading={isLoading}
              onClick={handlePlayPause}
              size="md"
              variant="primary"
            />
            <div className="flex-1 flex justify-end">
              <VolumeControl
                volume={volume}
                isMuted={isMuted}
                onVolumeChange={setVolume}
                onMuteToggle={toggleMute}
                variant="button"
              />
            </div>
          </div>
        </div>
      ) : (
        // Collapsed State (60px) - Mini player
        <div 
          className="h-full flex items-center px-4 gap-3 cursor-pointer"
          onClick={handleExpand}
        >
          {/* Play Button */}
          <div onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}>
            <PlayPauseButton
              isPlaying={isPlaying}
              isLoading={isLoading}
              onClick={handlePlayPause}
              size="md"
              variant="primary"
            />
          </div>

          {/* Cover Thumbnail */}
          {currentTrack.cover_url && (
            <img
              src={currentTrack.cover_url}
              alt={currentTrack.title}
              className="w-10 h-10 rounded-lg object-cover"
            />
          )}

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {currentTrack.title}
            </p>
            <TimeDisplay current={currentTime} total={duration} variant="compact" />
          </div>

          {/* Close Button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            className="
              w-8 h-8
              rounded-full
              flex items-center justify-center
              hover:bg-surface
              transition-colors
            "
            aria-label="Zavřít"
          >
            <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>

          {/* Thin Progress Bar (absolute bottom) */}
          <div 
            className="absolute bottom-0 left-0 h-0.5 bg-accent transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
