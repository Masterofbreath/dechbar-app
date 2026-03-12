/**
 * SettingsPage - App Settings for Breathing Exercises
 *
 * User preferences for audio cues, haptics, background music, and walking mode.
 *
 * Layout: PageLayout (iOS sticky header — same as ProfilPage, UcetPage)
 * Design: Dark-first, CSS tokens, custom SVG icons (no emoji)
 *
 * Card structure:
 *   1. Cvičení & protokoly  — bells + hudba (conditional) + cue zvuky (conditional)
 *   2. Vibrace               — toggle + intensity + adaptive (conditional, native only)
 *   3. Doplňky               — walking toggle + keep screen on
 *   4. Hlasový průvodce      — toggle + voice pack + volume (conditional)
 *   5. SMART CVIČENÍ         — duration + bells + cues + hudba (locked for ZDARMA)
 *
 * @package DechBar_App
 * @subpackage MVP0/Pages
 * @since 0.2.1
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionSettings } from '../stores/sessionSettingsStore';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import { useSwipeBack } from '@/platform/hooks/useSwipeBack';
import { useWakeLock } from '../hooks/useWakeLock';
import { useMembership } from '@/platform/membership/useMembership';
import { useUserState } from '@/platform/user/userStateStore';
import { isNativeApp } from '@/platform/utils/environment';
import { PageLayout } from '@/platform/layouts/PageLayout';
import { useResetSmartProgress, useResetKPMeasurements } from '../api/exercises';
import '@/styles/components/smart-exercise.css';
import {
  SettingsCard,
  Toggle,
  VolumeSlider,
  IntensitySelector,
  TrackSelector,
  VoicePackSelector,
  CueSoundSelector,
} from '../components/settings';

/* ---- Inline SVG Icons (24×24, outline, 2px stroke, currentColor) ---- */

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

function SmartWaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M2 16 C4 8, 8 8, 10 16 C12 24, 16 24, 18 16 C20 8, 24 8, 26 16 C28 24, 30 24, 30 16" />
    </svg>
  );
}

function TronWalkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <circle cx="12" cy="4" r="1.5" />
      <path d="M9 9l1.5 5L9 18" />
      <path d="M15 9l-1.5 5L15 18" />
      <path d="M9 12h6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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
  const { isAdmin } = useUserState();
  const nativeApp = isNativeApp();

  // Data reset hooks
  const resetSmart = useResetSmartProgress();
  const resetKP = useResetKPMeasurements();

  // Confirm dialog state — null = hidden, 'full' = reset pending
  const [confirmReset, setConfirmReset] = useState<'full' | null>(null);

  async function handleConfirmReset() {
    if (confirmReset === 'full') await resetSmart.mutateAsync();
    setConfirmReset(null);
  }

  useEffect(() => {
    document.title = 'Základní nastavení | DechBar';
  }, []);

  return (
    <PageLayout title="Základní nastavení" onBack={() => navigate(-1)}>
      <div className="settings-page" ref={swipeRef}>
        <div className="settings-page__content">

          {/* Card 1: Cvičení & protokoly — bells + hudba + zvukové signály */}
          <SettingsCard title="Cvičení & protokoly" icon={<MusicIcon />}>
            {/* Bells toggle */}
            <Toggle
              label="Zvuk při startu a ukončení"
              checked={settings.bellsEnabled}
              onChange={settings.setBellsEnabled}
            />
            <p className="settings-card__info settings-card__info--indent">
              Tibetská mísa při startu cvičení a ukončení
            </p>

            <div className="settings-card__divider" />

            {/* Hudba na pozadí */}
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
                  smartMode={false}
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

            <div className="settings-card__divider" />

            {/* Zvukové signály rytmu */}
            <Toggle
              label="Zapnout zvukové signály rytmu"
              checked={settings.audioCuesEnabled}
              onChange={settings.setAudioCuesEnabled}
            />
            {settings.audioCuesEnabled && (
              <>
                <CueSoundSelector
                  selectedPack={settings.selectedCueSoundPack}
                  onChange={settings.setSelectedCueSoundPack}
                  userTier={userTier}
                />
                <VolumeSlider
                  label="Hlasitost"
                  value={settings.audioCueVolume}
                  onChange={settings.setAudioCueVolume}
                />
                {userTier === 'ZDARMA' && (
                  <p className="settings-card__info settings-card__info--premium">
                    Více sad zvuků dostupných s tarifem SMART
                  </p>
                )}
              </>
            )}
          </SettingsCard>

          {/* Card 2: SMART CVIČENÍ — kompletní audio profil (hned pod Cvičení & protokoly) */}
          <SettingsCard
            title="SMART CVIČENÍ"
            icon={<SmartWaveIcon />}
            locked={userTier === 'ZDARMA' && !isAdmin}
            lockedTooltip="Prémiová funkce dostupná s tarifem SMART"
          >
            {userTier !== 'ZDARMA' && (
              <>
                {/* Duration mode */}
                <div className="settings-card__label">Preferovaná délka cvičení</div>

                <div className="smart-duration-selector">
                  <label className="smart-duration-option">
                    <input
                      type="radio"
                      name="smartDurationType"
                      value="fixed"
                      checked={settings.smartDurationMode.type === 'fixed'}
                      onChange={() => settings.setSmartDurationMode({ type: 'fixed', seconds: 420 })}
                    />
                    <span>Pevný čas</span>
                  </label>

                  {settings.smartDurationMode.type === 'fixed' && (
                    <div className="smart-duration-slider-wrap">
                      <input
                        type="range"
                        min={300}
                        max={900}
                        step={60}
                        value={settings.smartDurationMode.seconds}
                        onChange={(e) =>
                          settings.setSmartDurationMode({ type: 'fixed', seconds: Number(e.target.value) })
                        }
                        className="smart-duration-slider"
                        aria-label="Délka cvičení v minutách"
                      />
                      <span className="smart-duration-value">
                        {Math.round(settings.smartDurationMode.seconds / 60)} min
                      </span>
                    </div>
                  )}

                  <label className="smart-duration-option">
                    <input
                      type="radio"
                      name="smartDurationType"
                      value="range"
                      checked={settings.smartDurationMode.type === 'range'}
                      onChange={() => settings.setSmartDurationMode({ type: 'range', preset: 'medium' })}
                    />
                    <span>Smart Time</span>
                  </label>

                  {settings.smartDurationMode.type === 'range' && (
                    <div className="smart-duration-presets">
                      {(['short', 'medium', 'long'] as const).map((preset) => {
                        const labels = { short: 'Krátké 5–8 min', medium: 'Střední 7–10 min', long: 'Delší 10–15 min' };
                        const isCurrent =
                          settings.smartDurationMode.type === 'range' &&
                          settings.smartDurationMode.preset === preset;
                        return (
                          <label key={preset} className={`smart-duration-preset${isCurrent ? ' smart-duration-preset--active' : ''}`}>
                            <input
                              type="radio"
                              name="smartDurationPreset"
                              value={preset}
                              checked={isCurrent}
                              onChange={() => settings.setSmartDurationMode({ type: 'range', preset })}
                            />
                            <span>{labels[preset]}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="settings-card__divider" />

                {/* SMART Audio — Bells & Cues */}
                <Toggle
                  label="Signální tóny (start & end bell)"
                  checked={settings.smartBellsEnabled}
                  onChange={settings.setSmartBellsEnabled}
                />
                <Toggle
                  label="Zvukové signály rytmu"
                  checked={settings.smartCuesEnabled}
                  onChange={settings.setSmartCuesEnabled}
                />
                {settings.smartCuesEnabled && (
                  <>
                    <CueSoundSelector
                      selectedPack={settings.smartCueSoundSlug}
                      onChange={settings.setSmartCueSoundSlug}
                      userTier={userTier}
                    />
                    <VolumeSlider
                      label="Hlasitost signálů"
                      value={settings.smartCueVolume}
                      onChange={settings.setSmartCueVolume}
                    />
                  </>
                )}

                <div className="settings-card__divider" />

                {/* SMART Audio — Hudba na pozadí */}
                <Toggle
                  label="Hudba na pozadí (SMART)"
                  checked={settings.smartMusicEnabled}
                  onChange={settings.setSmartMusicEnabled}
                />
                {settings.smartMusicEnabled && (
                  <>
                    <TrackSelector
                      tracks={backgroundMusic.tracks}
                      selectedSlug={settings.smartMusicSlug}
                      randomEnabled={settings.smartMusicRandomEnabled}
                      onChange={settings.setSmartMusicSlug}
                      onRandomChange={settings.setSmartMusicRandomEnabled}
                      userTier={userTier}
                      onFetchTracks={backgroundMusic.fetchTracks}
                      smartMode={true}
                    />
                    <VolumeSlider
                      label="Hlasitost hudby"
                      value={settings.smartMusicVolume}
                      onChange={settings.setSmartMusicVolume}
                    />
                    <p className="settings-card__info settings-card__info--indent">
                      Exkluzivní SMART tracky jsou dostupné jen zde
                    </p>
                  </>
                )}
              </>
            )}
          </SettingsCard>

          {/* Card 3: CESTA NA TRŮN — audio profil pro chůzi (hned pod SMART) */}
          <SettingsCard
            title="CESTA NA TRŮN"
            icon={<TronWalkIcon />}
            locked={userTier === 'ZDARMA' && !isAdmin}
            lockedTooltip="Prémiová funkce dostupná s tarifem SMART"
          >
            {(userTier !== 'ZDARMA' || isAdmin) && (
              <>
                {/* Duration mode */}
                <div className="settings-card__label">Preferovaná délka cesty</div>

                <div className="smart-duration-selector">
                  <label className="smart-duration-option">
                    <input
                      type="radio"
                      name="tronDurationType"
                      value="fixed"
                      checked={settings.tronDurationMode.type === 'fixed'}
                      onChange={() => settings.setTronDurationMode({ type: 'fixed', seconds: 420 })}
                    />
                    <span>Pevný čas</span>
                  </label>

                  {settings.tronDurationMode.type === 'fixed' && (
                    <div className="smart-duration-slider-wrap">
                      <input
                        type="range"
                        min={300}
                        max={900}
                        step={60}
                        value={settings.tronDurationMode.seconds}
                        onChange={(e) =>
                          settings.setTronDurationMode({ type: 'fixed', seconds: Number(e.target.value) })
                        }
                        className="smart-duration-slider"
                        aria-label="Délka cesty v minutách"
                      />
                      <span className="smart-duration-value">
                        {Math.round(settings.tronDurationMode.seconds / 60)} min
                      </span>
                    </div>
                  )}

                  <label className="smart-duration-option">
                    <input
                      type="radio"
                      name="tronDurationType"
                      value="range"
                      checked={settings.tronDurationMode.type === 'range'}
                      onChange={() => settings.setTronDurationMode({ type: 'range', preset: 'medium' })}
                    />
                    <span>Smart Time</span>
                  </label>

                  {settings.tronDurationMode.type === 'range' && (
                    <div className="smart-duration-presets">
                      {(['short', 'medium', 'long'] as const).map((preset) => {
                        const labels = { short: 'Krátké 5–8 min', medium: 'Střední 7–10 min', long: 'Delší 10–15 min' };
                        const isCurrent =
                          settings.tronDurationMode.type === 'range' &&
                          settings.tronDurationMode.preset === preset;
                        return (
                          <label key={preset} className={`smart-duration-preset${isCurrent ? ' smart-duration-preset--active' : ''}`}>
                            <input
                              type="radio"
                              name="tronDurationPreset"
                              value={preset}
                              checked={isCurrent}
                              onChange={() => settings.setTronDurationMode({ type: 'range', preset })}
                            />
                            <span>{labels[preset]}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="settings-card__divider" />

                {/* Trůn Audio — Bells & Cues */}
                <Toggle
                  label="Signální tóny (start & end bell)"
                  checked={settings.tronBellsEnabled}
                  onChange={settings.setTronBellsEnabled}
                />
                <Toggle
                  label="Zvukové signály rytmu"
                  checked={settings.tronCuesEnabled}
                  onChange={settings.setTronCuesEnabled}
                />
                {settings.tronCuesEnabled && (
                  <>
                    <CueSoundSelector
                      selectedPack={settings.tronCueSoundSlug}
                      onChange={settings.setTronCueSoundSlug}
                      userTier={userTier}
                    />
                    <VolumeSlider
                      label="Hlasitost signálů"
                      value={settings.tronCueVolume}
                      onChange={settings.setTronCueVolume}
                    />
                  </>
                )}

                <div className="settings-card__divider" />

                {/* Trůn Audio — Hudba na pozadí */}
                <Toggle
                  label="Hudba na pozadí (Trůn)"
                  checked={settings.tronMusicEnabled}
                  onChange={settings.setTronMusicEnabled}
                />
                {settings.tronMusicEnabled && (
                  <>
                    <TrackSelector
                      tracks={backgroundMusic.tracks}
                      selectedSlug={settings.tronMusicSlug}
                      randomEnabled={settings.tronMusicRandomEnabled}
                      onChange={settings.setTronMusicSlug}
                      onRandomChange={settings.setTronMusicRandomEnabled}
                      userTier={userTier}
                      onFetchTracks={backgroundMusic.fetchTracks}
                      smartMode={false}
                    />
                    <VolumeSlider
                      label="Hlasitost hudby"
                      value={settings.tronMusicVolume}
                      onChange={settings.setTronMusicVolume}
                      max={0.5}
                    />
                    <p className="settings-card__info settings-card__info--indent">
                      Max 50 % hlasitosti — zvukové signály rytmu musí být jasně slyšitelné
                    </p>
                  </>
                )}
              </>
            )}
          </SettingsCard>

          {/* Card 4: Haptics — zobrazit pouze v native iOS/Android app, vibrace nefungují v browseru */}
          {nativeApp && (
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
          )}

          {/* Card 4: Doplňky — walking + keep screen on */}
          <SettingsCard title="Doplňky" icon={<SlidersIcon />}>
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

          {/* Card 6: Správa dat — jedno tlačítko "Začít znovu" (soft reset) */}
          <SettingsCard title="Správa dat" icon={<TrashIcon />} className="settings-card--danger-zone">
            <p className="settings-card__info">
              Algoritmus se přizpůsobí znovu od začátku. Tvůj celkový přehled zůstane.
            </p>

            <button
              className="settings-data-reset-btn"
              type="button"
              onClick={() => setConfirmReset('full')}
              disabled={resetSmart.isPending}
            >
              {resetSmart.isPending ? 'Resetuji…' : 'Začít znovu'}
            </button>
          </SettingsCard>

        </div>

        {/* Reset settings button */}
        <div className="settings-page__footer">
          <button onClick={settings.reset} className="settings-reset-button">
            Obnovit výchozí nastavení
          </button>
        </div>

        {/* Confirm dialog overlay */}
        {confirmReset !== null && (
          <div className="settings-confirm-overlay" role="dialog" aria-modal="true"
            aria-label="Potvrdit začátek znovu">
            <div className="settings-confirm-modal">
              <p className="settings-confirm-modal__text">
                Algoritmus se vrátí na začátek a přizpůsobí se znovu. Tvůj celkový přehled a historická data zůstanou zachována.
              </p>
              <div className="settings-confirm-modal__actions">
                <button
                  className="settings-confirm-modal__btn settings-confirm-modal__btn--cancel"
                  type="button"
                  onClick={() => setConfirmReset(null)}
                >
                  Zrušit
                </button>
                <button
                  className="settings-confirm-modal__btn settings-confirm-modal__btn--confirm"
                  type="button"
                  onClick={handleConfirmReset}
                  disabled={resetSmart.isPending || resetKP.isPending}
                >
                  {resetSmart.isPending ? 'Resetuji…' : 'Začít znovu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
