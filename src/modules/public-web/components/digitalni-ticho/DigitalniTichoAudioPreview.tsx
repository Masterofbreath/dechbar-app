/**
 * DigitalniTichoAudioPreview Component
 *
 * Custom HTML5 audio player — premium dark design, gold akcenty
 * Fallback placeholder pokud audio není ready
 *
 * Jak aktivovat: nastav AUDIO_SRC na URL audio souboru
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/platform/components';
import { MESSAGES } from '@/config/messages';

// Nastav URL audio souboru — nebo nech prázdné pro placeholder
const AUDIO_SRC = ''; // např. '/audio/digitalni-ticho-den-1-ukazka.mp3'

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const val = Number(e.target.value);
    audio.currentTime = val;
    setCurrentTime(val);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="digitalni-ticho-preview__audio-player">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="audio-player__track-info">
        <div className="audio-player__track-icon">
          <MusicIcon />
        </div>
        <div>
          <p className="audio-player__track-title">Den 1: Příběh — Úvod do ticha</p>
          <p className="audio-player__track-duration">Ukázka · 15 min</p>
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
            style={{
              background: `linear-gradient(to right, var(--color-accent) ${progress}%, rgba(255,255,255,0.1) ${progress}%)`
            }}
          />
          <div className="audio-player__time">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <p className="audio-player__note">
        Nasaď sluchátka pro nejlepší zážitek
      </p>
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

        {AUDIO_SRC ? (
          <AudioPlayer src={AUDIO_SRC} />
        ) : (
          <div className="digitalni-ticho-preview__placeholder">
            <p className="preview-placeholder__text">
              Ukázka bude dostupná brzy
            </p>
          </div>
        )}

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
