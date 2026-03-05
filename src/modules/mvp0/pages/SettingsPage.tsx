/**
 * SettingsPage - App Settings for Breathing Exercises
 *
 * User preferences for audio cues, haptics, background music, and walking mode.
 *
 * Layout: PageLayout (iOS sticky header — same as ProfilPage, UcetPage)
 * Design: Dark-first, CSS tokens, custom SVG icons (no emoji)
 *
 * Card structure (5 → 4 cards):
 *   1. Zvuk při změně rytmu  — toggle + volume (conditional)
 *   2. Vibrace               — toggle + intensity + adaptive (conditional)
 *   3. Hudba na pozadí       — toggle + track + volume (conditional)
 *   4. Doplňky               — walking toggle + bells toggle (merged, compact)
 *
 * @package DechBar_App
 * @subpackage MVP0/Pages
 * @since 0.2.1
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionSettings } from '../stores/sessionSettingsStore';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { useSwipeBack } from '@/platform/hooks/useSwipeBack';
import { useWakeLock } from '../hooks/useWakeLock';
import { useMembership } from '@/platform/membership/useMembership';
import { PageLayout } from '@/platform/layouts/PageLayout';
import {
  SettingsCard,
  Toggle,
  VolumeSlider,
  IntensitySelector,
  TrackSelector,
  VoicePackSelector,
} from '../components/settings';

/* ---- Inline SVG Icons (24×24, outline, 2px stroke, currentColor) ---- */

function SoundIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function VibrateIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M6 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" />
      <path d="M18 5h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="3" width="12" height="18" rx="2" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const swipeRef = useSwipeBack<HTMLDivElement>();
  const settings = useSessionSettings();
  const backgroundMusic = useBackgroundMusic();
  const { isSupported: wakeLockSupported } = useWakeLock();
  const { plan: userTier } = useMembership();

  useEffect(() => {
    document.title = 'Základní nastavení | DechBar';
  }, []);

  return (
    <PageLayout title="Základní nastavení" onBack={() => navigate(-1)}>
      <div className="settings-page" ref={swipeRef}>
        <div className="settings-page__content">

          {/* Card 1: Audio Cues */}
          <SettingsCard title="Zvuk při změně rytmu" icon={<SoundIcon />}>
            <Toggle
              label="Zapnout zvukové signály"
              checked={settings.audioCuesEnabled}
              onChange={settings.setAudioCuesEnabled}
            />

            {settings.audioCuesEnabled && (
              <>
                <p className="settings-card__info">
                  Solfeggio frekvence (963 / 639 / 396 Hz)
                </p>
                <VolumeSlider
                  label="Hlasitost"
                  value={settings.audioCueVolume}
                  onChange={settings.setAudioCueVolume}
                />
              </>
            )}
          </SettingsCard>

          {/* Card 2: Haptics */}
          <SettingsCard title="Vibrace" icon={<VibrateIcon />}>
            <Toggle
              label="Zapnout vibrace"
              checked={settings.hapticsEnabled}
              onChange={settings.setHapticsEnabled}
            />

            {settings.hapticsEnabled && (
              <>
                <IntensitySelector
                  value={settings.hapticIntensity}
                  onChange={settings.setHapticIntensity}
                />
                <label className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={settings.hapticAdaptive}
                    onChange={(e) => settings.setHapticAdaptive(e.target.checked)}
                  />
                  <span>Adaptivní podle náročnosti cvičení</span>
                </label>
              </>
            )}
          </SettingsCard>

          {/* Card 3: Background Music */}
          <SettingsCard title="Hudba na pozadí" icon={<MusicIcon />}>
            <Toggle
              label="Zapnout hudbu na pozadí"
              checked={settings.backgroundMusicEnabled}
              onChange={settings.setBackgroundMusicEnabled}
            />

            {settings.backgroundMusicEnabled && (
              <>
                <TrackSelector
                  tracks={backgroundMusic.tracks}
                  selectedSlug={settings.selectedTrackSlug}
                  randomEnabled={settings.backgroundMusicRandomEnabled}
                  onChange={(slug) => {
                    settings.setSelectedTrack(slug);
                    if (slug) backgroundMusic.setTrack(slug);
                  }}
                  onRandomChange={settings.setBackgroundMusicRandomEnabled}
                  userTier={userTier}
                  onFetchTracks={backgroundMusic.fetchTracks}
                />
                <VolumeSlider
                  label="Hlasitost hudby"
                  value={settings.backgroundMusicVolume}
                  onChange={settings.setBackgroundMusicVolume}
                />
                {userTier === 'ZDARMA' && (
                  <p className="settings-card__info settings-card__info--premium">
                    Více tracků dostupných s tarifem SMART
                  </p>
                )}
              </>
            )}
          </SettingsCard>

          {/* Card 4: Doplňky — walking + bells merged (both are toggle-only) */}
          <SettingsCard title="Doplňky" icon={<SlidersIcon />}>
            <Toggle
              label="Zvuk při startu a ukončení"
              checked={settings.bellsEnabled}
              onChange={settings.setBellsEnabled}
            />
            <p className="settings-card__info settings-card__info--indent">
              Tibetská mísa při startu cvičení a ukončení
            </p>

            <div className="settings-card__divider" />

            <Toggle
              label="Režim při chůzi"
              checked={settings.walkingModeEnabled}
              onChange={settings.setWalkingMode}
            />
            <p className="settings-card__info settings-card__info--indent">
              Ztlumí displej, posílí zvuk a vibrace při cvičení za chůze
            </p>

            <div className="settings-card__divider" />

            <Toggle
              label="Displej nezhasínat"
              checked={settings.keepScreenOn}
              onChange={settings.setKeepScreenOn}
              disabled={!wakeLockSupported}
            />
            <p className="settings-card__info settings-card__info--indent">
              {wakeLockSupported
                ? 'Obrazovka zůstane zapnutá po celou dobu cvičení'
                : 'Tato funkce není v tomto prohlížeči dostupná'}
            </p>
          </SettingsCard>

          {/* Card 5: Vocal Guidance */}
          <SettingsCard title="Hlasový průvodce" icon={<MicIcon />}>
            <Toggle
              label="Zapnout hlasového průvodce"
              checked={settings.vocalGuidanceEnabled}
              onChange={settings.setVocalGuidanceEnabled}
            />

            {settings.vocalGuidanceEnabled && (
              <>
                <p className="settings-card__info">
                  Hlasový průvodce přehrává krátké instrukce během cvičení v závislosti na tvém pokroku.
                </p>

                <VoicePackSelector
                  selectedId={settings.selectedVoicePackId}
                  onChange={settings.setSelectedVoicePack}
                  userTier={userTier}
                />

                {settings.selectedVoicePackId && (
                  <VolumeSlider
                    label="Hlasitost průvodce"
                    value={settings.vocalVolume}
                    onChange={settings.setVocalVolume}
                  />
                )}

                {userTier === 'ZDARMA' && (
                  <p className="settings-card__info settings-card__info--premium">
                    Hlasové průvodce dostupné s tarifem SMART
                  </p>
                )}
              </>
            )}
          </SettingsCard>

        </div>

        {/* Reset button */}
        <div className="settings-page__footer">
          <button onClick={settings.reset} className="settings-reset-button">
            Obnovit výchozí nastavení
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
