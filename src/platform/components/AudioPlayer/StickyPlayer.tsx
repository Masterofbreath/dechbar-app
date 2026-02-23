/**
 * StickyPlayer - Sticky mini player (collapsed/expanded)
 *
 * Apple Premium Style — shodný vizuál s landing page audio přehrávačem:
 * - Gold musik ikona vlevo (čtvercová, zlatý tón)
 * - Round zlaté play/pause tlačítko
 * - Tenký zlatý progress bar dole
 * - Glassmorphism tmavé pozadí
 *
 * @version 2.44.0
 */

import React, { useEffect, useRef } from 'react';
import { PlayPauseButton } from './components/PlayPauseButton';
import { WaveformProgress } from './components/WaveformProgress';
import { TimeDisplay } from './components/TimeDisplay';
import { FavouriteButton } from './components/FavouriteButton';
import { VolumeControl } from './components/VolumeControl';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useAudioTracking } from './hooks/useAudioTracking';
import { useAudioPlayerStore } from './store';

function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

export const StickyAudioPlayer: React.FC = () => {
  const {
    currentTrack,
    mode,
    isExpanded,
    volume,
    isMuted,
    isPlaying: storeIsPlaying,
    expandSticky,
    close,
    setVolume,
    toggleMute,
  } = useAudioPlayerStore();

  const pendingAutoPlayRef = useRef(false);

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

  useAudioTracking({
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

  // Auto-play: playSticky() nastaví isPlaying=true v store, ale useAudioPlayer
  // spravuje vlastní state. Tento effect zajistí spuštění po načtení tracku.
  useEffect(() => {
    if (storeIsPlaying) {
      pendingAutoPlayRef.current = true;
    }
  }, [currentTrack?.id, storeIsPlaying]);

  useEffect(() => {
    if (pendingAutoPlayRef.current && !isLoading && currentTrack) {
      pendingAutoPlayRef.current = false;
      play();
    }
  }, [isLoading, currentTrack, play]);

  if (!currentTrack || mode !== 'sticky') return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayPause = async () => {
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  };

  const handleClose = () => {
    pause();
    close();
  };

  return (
    <div
      className={`sticky-player sticky-player--positioned${isExpanded ? ' sticky-player--expanded' : ''}`}
    >
      {isExpanded ? (
        /* ── Expanded State ── */
        <div className="sticky-player__expanded-inner">
          <div className="sticky-player__expanded-top">
            <h3 className="sticky-player__expanded-title">{currentTrack.title}</h3>
            <FavouriteButton trackId={currentTrack.id} />
            <button
              onClick={handleClose}
              className="sticky-player__close-btn"
              aria-label="Zavřít přehrávač"
              type="button"
            >
              <CloseIcon />
            </button>
          </div>

          {currentTrack.cover_url && (
            <img
              src={currentTrack.cover_url}
              alt={currentTrack.title}
              className="sticky-player__cover"
            />
          )}

          <div className="sticky-player__waveform">
            <WaveformProgress
              peaks={currentTrack.waveform_peaks || []}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
            />
          </div>

          <TimeDisplay current={currentTime} total={duration} />

          <div className="sticky-player__expanded-controls">
            <div className="sticky-player__expanded-controls-spacer" />
            <PlayPauseButton
              isPlaying={isPlaying}
              isLoading={isLoading}
              onClick={handlePlayPause}
              size="md"
              variant="primary"
            />
            <div className="sticky-player__expanded-controls-end">
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
        /* ── Collapsed State — Apple Premium tmavý styl ── */
        <div
          className="sticky-player__collapsed"
          onClick={expandSticky}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') expandSticky(); }}
          aria-label={`${currentTrack.title} — kliknutím rozbalíš přehrávač`}
        >
          {/* Gold music icon */}
          <span className="sticky-player__music-icon">
            <MusicNoteIcon />
          </span>

          {/* Track info */}
          <div className="sticky-player__track-info">
            <p className="sticky-player__track-title">{currentTrack.title}</p>
            <TimeDisplay current={currentTime} total={duration} variant="compact" />
          </div>

          {/* Play/Pause — round gold button */}
          <div
            className="sticky-player__play-wrap"
            onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                handlePlayPause();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={isPlaying ? 'Pozastavit' : 'Přehrát'}
          >
            <PlayPauseButton
              isPlaying={isPlaying}
              isLoading={isLoading}
              onClick={handlePlayPause}
              size="sm"
              variant="primary"
            />
          </div>

          {/* Close */}
          <button
            className="sticky-player__close-btn sticky-player__close-btn--collapsed"
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            aria-label="Zavřít přehrávač"
            type="button"
          >
            <CloseIcon />
          </button>

          {/* Gold progress bar — absolute bottom */}
          <div
            className="sticky-player__progress-bar"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
