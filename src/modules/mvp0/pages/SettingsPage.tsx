/**
 * SettingsPage - App Settings for Breathing Exercises
 * 
 * User preferences for audio cues, haptics, background music, and walking mode.
 * 
 * Layout: Flat grouped cards (5 sections)
 * Design: Glassmorphism, mobile-first
 * 
 * @package DechBar_App
 * @subpackage MVP0/Pages
 * @since 0.2.1
 */

import { useSessionSettings } from '../stores/sessionSettingsStore';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';
import {
  SettingsCard,
  Toggle,
  VolumeSlider,
  IntensitySelector,
  TrackSelector,
} from '../components/settings';

/**
 * SettingsPage - Breathing exercise settings
 */
export function SettingsPage() {
  const settings = useSessionSettings();
  const backgroundMusic = useBackgroundMusic();
  
  // TODO: Get user tier from auth context (for now: ZDARMA)
  const userTier = 'ZDARMA';
  
  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1 className="settings-page__title">Dechové cvičení</h1>
        <p className="settings-page__subtitle">
          Přizpůsob si cvičení podle svých preferencí
        </p>
      </div>
      
      <div className="settings-page__content">
        {/* Card 1: Audio Cues */}
        <SettingsCard title="🔊 Zvuk při změně rytmu">
          <Toggle
            label="Zapnout zvukové signály"
            checked={settings.audioCuesEnabled}
            onChange={settings.setAudioCuesEnabled}
          />
          
          {settings.audioCuesEnabled && (
            <>
              <div className="settings-card__section">
                <p className="settings-card__info">
                  Zvuk: Solfeggio frekvence (963/639/396 Hz)
                </p>
                {/* TODO: Add preview button when audio files available */}
              </div>
              
              <VolumeSlider
                label="Hlasitost"
                value={settings.audioCueVolume}
                onChange={settings.setAudioCueVolume}
              />
            </>
          )}
        </SettingsCard>
        
        {/* Card 2: Haptics */}
        <SettingsCard title="📳 Vibrace">
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
        
        {/* Card 3: Walking Mode */}
        <SettingsCard title="🚶 Režim při chúzi">
          <Toggle
            label="Zapnout režim při chůzi"
            checked={settings.walkingModeEnabled}
            onChange={settings.setWalkingMode}
          />
          
          <p className="settings-card__info">
            Optimalizuje pro cvičení při chůzi (ztlumí displej, posílí zvuk a vibrace)
          </p>
        </SettingsCard>
        
        {/* Card 4: Background Music */}
        <SettingsCard title="🎵 Hudba na pozadí">
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
                onChange={(slug) => {
                  settings.setSelectedTrack(slug);
                  if (slug) {
                    backgroundMusic.setTrack(slug);
                  }
                }}
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
                  💎 Více tracků dostupných s tarifem SMART
                </p>
              )}
            </>
          )}
        </SettingsCard>
        
        {/* Card 5: Bells */}
        <SettingsCard title="🔔 Zvuk při startu a ukončení">
          <Toggle
            label="Zapnout zvukové zvonky"
            checked={settings.bellsEnabled}
            onChange={settings.setBellsEnabled}
          />
          
          <p className="settings-card__info">
            Tibetská mísa při startu cvičení a ukončení
          </p>
        </SettingsCard>
      </div>
      
      {/* Reset button */}
      <div className="settings-page__footer">
        <button
          onClick={settings.reset}
          className="settings-reset-button"
        >
          Obnovit výchozí nastavení
        </button>
      </div>
    </div>
  );
}
