/**
 * StickyPlayer - Sticky mini player (collapsed only)
 *
 * Apple Premium Style — self-contained, bez závislosti na Tailwind utility třídách.
 * Všechna tlačítka a ikony stylována přes audio-player.css CSS třídy.
 *
 * Layout:
 *   [♪ icon] [▶ play] [title + subtitle · times] — flex 1 —
 *   desktop: [vol icon + slider] | mobile: [mute btn]
 *   [❤ fav] [✕ close (desktop only)]
 *
 * Swipe doleva → zavření přehrávače (mobile)
 * Pozice: fixed, bottom = 72px (desktop) / 72px + safe-area (mobile)
 * Z-index: 998 (pod BottomNavem 1000)
 *
 * @version 2.46.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useAudioTracking } from './hooks/useAudioTracking';
import { useAudioPlayerStore } from './store';
import { useAuthStore } from '@/platform/auth';
import { useNavigation } from '@/platform/hooks';
import { useAkademieNav } from '@/modules/akademie/hooks/useAkademieNav';
import { useToggleLessonFavorite } from '@/modules/akademie/api/useAkademieProgram';
import { supabase } from '@/platform/api/supabase';

/* ─── Inline SVG icons (explicitní width/height — bez Tailwindu) ─── */

function MusicNoteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="sticky-player__spinner">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function MuteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function HeartFilledIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function HeartOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

/* ─── Time formatters ─── */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatRemaining(currentSec: number, durationSec: number): string {
  if (!isFinite(durationSec) || durationSec <= 0) return '-0:00';
  const remaining = Math.max(0, durationSec - currentSec);
  return `-${formatTime(remaining)}`;
}

/* ─── Hlavní komponenta ─── */

const SWIPE_THRESHOLD = 80; // px doleva → close

export const StickyAudioPlayer: React.FC = () => {
  const {
    currentTrack,
    mode,
    volume,
    isMuted,
    isPlaying: storeIsPlaying,
    close,
    setVolume,
    toggleMute,
  } = useAudioPlayerStore();

  const userId = useAuthStore((s) => s.user?.id);

  const { setCurrentTab } = useNavigation();
  const openProgram = useAkademieNav((s) => s.openProgram);
  const selectCategory = useAkademieNav((s) => s.selectCategory);

  const pendingAutoPlayRef = useRef(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  // Swipe-to-close: přímá DOM manipulace pro 60fps bez React re-renderů
  const playerRef = useRef<HTMLDivElement>(null);
  const swipeTouchStartX = useRef(0);
  const swipeTouchStartY = useRef(0);
  const swipeStartTime = useRef(0);
  const swipeOffsetRef = useRef(0);
  const isSwipingRef = useRef(false);

  const qc = useQueryClient();

  // DB dotaz na aktuální stav oblíbené lekce — syncuje se s LessonRow
  const favQueryKey = ['player-lesson-fav', currentTrack?.id, userId];
  const { data: isFavourite = false } = useQuery({
    queryKey: favQueryKey,
    queryFn: async () => {
      if (!currentTrack?.id || !userId) return false;
      const { data } = await supabase
        .from('user_lesson_favorites')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('lesson_id', currentTrack.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!currentTrack?.id && !!userId,
    staleTime: 60_000,
  });

  const toggleFavoriteMutation = useToggleLessonFavorite();

  const {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    play,
    pause,
    seek: seekAudio,
    setVolume: setAudioVolume,
  } = useAudioPlayer(currentTrack);

  useAudioTracking({
    trackId: currentTrack?.id || '',
    albumId: currentTrack?.album_id || null,
    duration,
    currentTime,
    isPlaying,
    userId,
  });

  // Sync hlasitosti do audio elementu (respektuje mute)
  useEffect(() => {
    setAudioVolume(isMuted ? 0 : volume);
  }, [volume, isMuted, setAudioVolume]);

  // Auto-play: spustí přehrávání jakmile je audio připraveno.
  // KRITICKÉ — play() je voláno z useEffect (mimo user gesture), ale iOS Safari
  // odemkne audio po prvním user gestu. Druhý render (skutečné spuštění) projde.
  // Správné řešení by bylo volat play() přímo ve store akci, ale to vyžaduje
  // přístup k audio elementu ze store (refaktorace pro budoucí sprint).
  useEffect(() => {
    if (storeIsPlaying && currentTrack) {
      pendingAutoPlayRef.current = true;
    }
  // currentTrack objekt záměrně vyloučen — sledujeme pouze změnu ID
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id, storeIsPlaying]);

  useEffect(() => {
    if (pendingAutoPlayRef.current && !isLoading && currentTrack) {
      pendingAutoPlayRef.current = false;
      play();
    }
  }, [isLoading, currentTrack, play]);

  // KRITICKÉ: useCallback musí být před early return — Rules of Hooks
  const handleClose = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    pause();
    // Reset přímého DOM stylu + refů — žádný ghost při příštím otevření
    if (playerRef.current) {
      playerRef.current.style.transform = '';
      playerRef.current.style.opacity = '';
      playerRef.current.style.transition = '';
    }
    swipeOffsetRef.current = 0;
    isSwipingRef.current = false;
    close();
  }, [pause, close]);

  if (!currentTrack || mode !== 'sticky') return null;

  const displayTime = isSeeking ? seekPosition : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;
  const isMutedOrSilent = isMuted || volume === 0;

  // ── Handlers (čisté funkce, ne hooks — mohou být za early return) ──

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) { pause(); } else { await play(); }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleFavourite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTrack || !userId) return;
    // Optimisticky updatujeme player cache
    qc.setQueryData<boolean>(favQueryKey, !isFavourite);
    // Mutace: aktualizuje DB + invaliduje LessonRow cache přes akademieKeys.lessons
    toggleFavoriteMutation.mutate({
      userId,
      lessonId: currentTrack.id,
      seriesId: currentTrack.source_series_id ?? '',
      isFavorite: isFavourite,
    });
  };

  // Klik na cover/ikonu — navigace na zdrojový program
  const handleCoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { source_program_id, source_category_slug } = currentTrack ?? {};
    if (!source_program_id || !source_category_slug) return;
    selectCategory(source_category_slug);
    openProgram(source_program_id);
    setCurrentTab('akademie');
  };

  const hasCoverLink = Boolean(currentTrack?.source_program_id && currentTrack?.source_category_slug);

  // Scrubber handlers
  const handleSeekStart = () => {
    setIsSeeking(true);
    setSeekPosition(currentTime);
  };
  const handleSeekMove = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekPosition(parseFloat(e.target.value));
  };
  const handleSeekEnd = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSeeking(false);
    seekAudio(parseFloat(e.target.value));
  };

  // ── Swipe-to-close handlers (přímá DOM manipulace = 60fps, bez React re-renderů) ──

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeTouchStartX.current = e.touches[0].clientX;
    swipeTouchStartY.current = e.touches[0].clientY;
    swipeStartTime.current = Date.now();
    isSwipingRef.current = false;
    // Odstranit transition při startu nového tachu
    if (playerRef.current) {
      playerRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - swipeTouchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - swipeTouchStartY.current);
    // Ignorovat vertikální pohyb (scroll)
    if (!isSwipingRef.current && dy > 8 && dy > Math.abs(dx)) return;
    if (dx >= 0) return; // pouze doleva
    isSwipingRef.current = true;
    const offset = Math.abs(dx);
    swipeOffsetRef.current = offset;
    if (playerRef.current) {
      playerRef.current.style.transform = `translateX(-${offset}px)`;
      playerRef.current.style.opacity = String(Math.max(0.25, 1 - offset / 180));
    }
  };

  const handleTouchEnd = () => {
    if (!isSwipingRef.current) return;
    const elapsed = Date.now() - swipeStartTime.current;
    const velocity = swipeOffsetRef.current / elapsed; // px/ms
    // Uzavřít: překročen threshold NEBO rychlý flick (> 0.45 px/ms)
    if (swipeOffsetRef.current >= SWIPE_THRESHOLD || velocity > 0.45) {
      // Dokončit slide-out animací před close()
      if (playerRef.current) {
        const finalOffset = Math.max(swipeOffsetRef.current, window.innerWidth);
        playerRef.current.style.transition = 'transform 0.22s cubic-bezier(0.4, 0, 1, 1), opacity 0.22s ease';
        playerRef.current.style.transform = `translateX(-${finalOffset}px)`;
        playerRef.current.style.opacity = '0';
      }
      setTimeout(handleClose, 200);
    } else {
      // Snap-back: spring animace zpět na původní pozici
      if (playerRef.current) {
        playerRef.current.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease';
        playerRef.current.style.transform = 'translateX(0)';
        playerRef.current.style.opacity = '1';
      }
      swipeOffsetRef.current = 0;
      isSwipingRef.current = false;
    }
  };

  return (
    <div
      ref={playerRef}
      className="sticky-player sticky-player--positioned"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="sticky-player__collapsed">

        {/* Cover image nebo gold music note ikona */}
        <span
          className={[
            'sticky-player__music-icon',
            hasCoverLink ? 'sticky-player__music-icon--link' : '',
          ].filter(Boolean).join(' ')}
          onClick={hasCoverLink ? handleCoverClick : undefined}
          role={hasCoverLink ? 'button' : undefined}
          tabIndex={hasCoverLink ? 0 : undefined}
          aria-label={hasCoverLink ? 'Přejít na detail programu' : undefined}
          onKeyDown={hasCoverLink ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCoverClick(e as unknown as React.MouseEvent);
            }
          } : undefined}
        >
          {currentTrack.cover_url
            ? <img src={currentTrack.cover_url} alt={currentTrack.title} className="sticky-player__cover-img" />
            : <MusicNoteIcon />
          }
        </span>

        {/* Play/Pause — hned vedle ikony */}
        <button
          className="sticky-player__play-btn"
          onClick={handlePlayPause}
          disabled={isLoading}
          aria-label={isPlaying ? 'Pozastavit' : 'Přehrát'}
          type="button"
        >
          {isLoading ? <SpinnerIcon /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Track info: title + subtitle (desktop) — bez času */}
        <div className="sticky-player__track-info">
          <p className="sticky-player__track-title">{currentTrack.title}</p>
          {currentTrack.source_program_title && (
            <span className="sticky-player__track-subtitle">
              {currentTrack.source_program_title}
            </span>
          )}
        </div>

        {/* Čas — přímý flex sibling → vždy na stejné horizontální úrovni jako buttony */}
        <div className="sticky-player__time-block">
          {/* Elapsed — jen desktop */}
          <span className="sticky-player__track-time sticky-player__track-time--elapsed">
            {formatTime(displayTime)}
          </span>
          <span className="sticky-player__track-time-sep">·</span>
          {/* Remaining — vždy */}
          <span className="sticky-player__track-time">
            {formatRemaining(displayTime, duration)}
          </span>
        </div>

        {/* Volume — desktop: icon + slider, mobile: mute button */}
        <div className="sticky-player__vol-desktop">
          <button
            className={`sticky-player__icon-btn sticky-player__icon-btn--dim${isMutedOrSilent ? ' sticky-player__icon-btn--muted' : ''}`}
            onClick={handleMuteToggle}
            aria-label={isMutedOrSilent ? 'Zapnout zvuk' : 'Ztlumit'}
            type="button"
          >
            {isMutedOrSilent ? <MuteIcon /> : <VolumeIcon />}
          </button>
          <input
            type="range"
            className="sticky-player__vol-slider"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            aria-label="Hlasitost"
            style={{
              background: `linear-gradient(to right, var(--color-accent) ${volumePercent}%, rgba(255,255,255,0.12) ${volumePercent}%)`,
            }}
          />
        </div>

        <button
          className={`sticky-player__icon-btn sticky-player__icon-btn--dim sticky-player__vol-mobile${isMutedOrSilent ? ' sticky-player__icon-btn--muted' : ''}`}
          onClick={handleMuteToggle}
          aria-label={isMutedOrSilent ? 'Zapnout zvuk' : 'Ztlumit'}
          type="button"
        >
          {isMutedOrSilent ? <MuteIcon /> : <VolumeIcon />}
        </button>

        {/* Favourite */}
        <button
          className={`sticky-player__icon-btn sticky-player__icon-btn--dim${isFavourite ? ' sticky-player__icon-btn--fav-active' : ''}`}
          onClick={handleFavourite}
          aria-label={isFavourite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
          type="button"
        >
          {isFavourite ? <HeartFilledIcon /> : <HeartOutlineIcon />}
        </button>

        {/* Close — desktop only (na mobile: swipe doleva) */}
        <button
          className="sticky-player__close-btn sticky-player__close-btn--collapsed"
          onClick={handleClose}
          aria-label="Zavřít přehrávač"
          type="button"
        >
          <CloseIcon />
        </button>

        {/* Progress bar + invisible scrubber overlay */}
        <div
          className="sticky-player__progress-wrap"
          style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}
        >
          <div
            className="sticky-player__progress-bar"
            style={{ width: `${progressPercent}%` }}
          />
          {duration > 0 && (
            <input
              type="range"
              className="sticky-player__progress-scrubber"
              min={0}
              max={duration}
              step={1}
              value={isSeeking ? seekPosition : currentTime}
              onMouseDown={handleSeekStart}
              onTouchStart={handleSeekStart}
              onChange={handleSeekMove}
              onMouseUp={handleSeekEnd}
              onTouchEnd={handleSeekEnd}
              aria-label="Posun v nahrávce"
            />
          )}
        </div>
      </div>
    </div>
  );
};
