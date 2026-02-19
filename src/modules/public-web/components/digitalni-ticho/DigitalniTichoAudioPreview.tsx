/**
 * DigitalniTichoAudioPreview Component
 *
 * Custom HTML5 audio player — premium dark design, gold akcenty
 * Podporuje přehrávání při zamčené obrazovce (MediaSession API)
 * Desktop: volume slider | Mobile: mute toggle
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/platform/components';
import { MESSAGES } from '@/config/messages';

const AUDIO_SRC = 'https://dechbar-cdn.b-cdn.net/audio/program%20RE%C5%BDIM%20-%20ochutn%C3%A1vky/Digita%CC%81lni%CC%81%20ticho%20-%20ochutna%CC%81vka%20-%20Zavr%CC%8Ci%20za%CC%81loz%CC%8Cky.mp3';

function scrollToPricing() {
  document.querySelector('.digitalni-ticho-pricing__card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const MusicIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <polygon points="5,3 19,12 5,21"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="4" height="16" rx="1"/>
    <rect x="14" y="4" width="4" height="16" rx="1"/>
  </svg>
);

const VolumeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MuteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => {
      setPlaying(false);
      scrollToPricing();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Zavři záložky',
        artist: 'Program REŽIM · DechBar',
        album: 'Digitální ticho',
      });
      navigator.mediaSession.setActionHandler('play', () => {
        audio.play();
        setPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
        setPlaying(false);
      });
    }

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = playing ? 'paused' : 'playing';
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const val = Number(e.target.value);
    audio.currentTime = val;
    setCurrentTime(val);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setVolume(val);
    if (val > 0) setMuted(false);
  }

  function toggleMute() {
    setMuted(prev => !prev);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const effectiveVolume = muted ? 0 : volume;
  const volumePercent = effectiveVolume * 100;
  const isMutedOrSilent = muted || volume === 0;

  return (
    <div className="digitalni-ticho-preview__audio-player">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="audio-player__track-info">
        <div className="audio-player__track-icon">
          <MusicIcon />
        </div>
        <div className="audio-player__track-text">
          <p className="audio-player__track-title">Digitální ticho</p>
          <p className="audio-player__track-duration">DEN 1 · Zavři záložky</p>
        </div>
      </div>

      <div className="audio-player__controls">
        <button
          className="audio-player__play-btn"
          onClick={togglePlay}
          aria-label={playing ? 'Pauza' : 'Přehrát'}
          type="button"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div className="audio-player__progress-wrapper">
          <input
            type="range"
            className="audio-player__progress"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Pozice přehrávání"
            style={{
              background: `linear-gradient(to right, var(--color-accent) ${progress}%, rgba(255,255,255,0.1) ${progress}%)`
            }}
          />
          <div className="audio-player__time">
            <span>{formatTime(currentTime)}</span>
            <span className="audio-player__time-duration">{formatTime(duration)}</span>

            <div className="audio-player__volume-wrapper">
              <button
                className="audio-player__volume-icon-btn"
                onClick={toggleMute}
                aria-label={isMutedOrSilent ? 'Zapnout zvuk' : 'Ztlumit'}
                type="button"
              >
                {isMutedOrSilent ? <MuteIcon /> : <VolumeIcon />}
              </button>
              <input
                type="range"
                className="audio-player__volume"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Hlasitost"
                style={{
                  background: `linear-gradient(to right, rgba(255,255,255,0.5) ${volumePercent}%, rgba(255,255,255,0.1) ${volumePercent}%)`
                }}
              />
            </div>

            <button
              className="audio-player__mute-btn"
              onClick={toggleMute}
              aria-label={isMutedOrSilent ? 'Zapnout zvuk' : 'Ztlumit'}
              type="button"
            >
              {isMutedOrSilent ? <MuteIcon /> : <VolumeIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DigitalniTichoAudioPreview() {
  const { title } = MESSAGES.digitalniTicho.audioPreview;

  return (
    <section className="digitalni-ticho-preview">
      <div className="digitalni-ticho-preview__container">
        <h2 className="digitalni-ticho-preview__title">
          {title}
        </h2>

        <AudioPlayer src={AUDIO_SRC} />

        <div className="digitalni-ticho-preview__cta-wrapper">
          <Button
            variant="primary"
            size="lg"
            onClick={scrollToPricing}
          >
            Odemkni program →
          </Button>
        </div>
      </div>
    </section>
  );
}
