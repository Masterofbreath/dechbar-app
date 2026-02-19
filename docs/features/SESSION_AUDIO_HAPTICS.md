# 🎵 Session Audio & Haptics System - Feature Guide

**Created:** 6. února 2026  
**Version:** 0.2.1  
**Status:** ✅ Implemented (pending audio files upload)

---

## 📊 Overview

### What is it?
Multi-sensory feedback systém pro breathing exercises poskytující:
- **Audio cues** - Solfeggio frekvence (963/639/396 Hz) pro změny rytmu dechu
- **Haptic feedback** - Vibrace synchronizované s INHALE/HOLD/EXHALE fázemi
- **Background music** - Ambient tracky s perfect loops pro dlouhé sessions

### Why do we have it?
- **Walking mode** - Telefon v kapse, sluchátka v uších → audio + haptics guide bez obrazovky
- **Accessibility** - Uživatelé se zrakovým postižením mohou cvičit bez vizuální kontroly
- **Premium experience** - Multi-sensory approach = hlubší prožitek cvičení
- **Meditation support** - Timer-only sessions s zvonky (start/end bells)

### When is it used?
- Všechny breathing sessions (protocols + exercises + custom)
- User může zapnout/vypnout v Settings → Základní nastavení → Dechové cvičení
- Default: Haptics ON (medium), Audio cues ON (60%), Background music OFF

---

## 🏗️ Architecture

### Component Overview

```
User Actions (Settings UI)
    ↓
sessionSettingsStore (Zustand + persist)
    ↓
Session Engine Modal
    ├── useHaptics() → Capacitor Haptics API → Native vibration
    ├── useBreathingCues() → Bunny.net CDN → IndexedDB cache → HTMLAudioElement
    └── useBackgroundMusic() → Supabase DB → Bunny.net CDN → IndexedDB cache → HTMLAudioElement
```

### Data Flow

1. **User opens Settings** → Toggles haptics/audio → Updates `sessionSettingsStore`
2. **User starts session** → `SessionEngineModal` reads settings from store
3. **Countdown phase (5s)** → Preload audio files (cues + bells + selected track)
4. **Session active** → On phase change:
   - `useHaptics.trigger('inhale')` → Vibrates device
   - `useBreathingCues.playCue('inhale')` → Plays 963 Hz tone
   - Circle animates (visual feedback)
5. **Session ends** → `useBreathingCues.playBell()` → End bell plays

---

## 📦 Components

### 1. Custom Hooks

#### `useHaptics()` - Vibration Feedback

**Location:** `src/modules/mvp0/hooks/useHaptics.ts`

**What it does:**
- Triggers native device vibration via Capacitor Haptics API
- 3 distinct patterns:
  - INHALE: 1× short tap (200ms)
  - HOLD: 2× taps with 100ms pause
  - EXHALE: 1× long heavy tap (400ms)
- Throttling: Min 100ms between triggers (prevent duplicate calls)

**Platform support:**
- ✅ iOS (real device only, not simulator)
- ✅ Android (real device only, not emulator)
- ❌ Web/PWA (no haptics API)

**Code example:**
```typescript
import { useHaptics } from '@/modules/mvp0/hooks/useHaptics';

function MyComponent() {
  const haptics = useHaptics();
  
  // Trigger vibration on phase change
  const handlePhaseChange = (phase: 'inhale' | 'hold' | 'exhale') => {
    haptics.trigger(phase); // ✅ That's it!
  };
  
  // Check if supported
  console.log('Haptics available:', haptics.isSupported);
}
```

---

#### `useBreathingCues()` - Solfeggio Audio Cues

**Location:** `src/modules/mvp0/hooks/useBreathingCues.ts`

**What it does:**
- Plays short solfeggio frequency tones on phase changes
- Plays bells at session start/end
- Cache-first strategy (IndexedDB → fallback to CDN stream)
- Preload during countdown (5s window)

**Audio files:**
- `inhale-963hz.aac` - Nádech (963 Hz = probuzení)
- `hold-639hz.aac` - Zádrž (639 Hz = harmonie)
- `exhale-396hz.aac` - Výdech (396 Hz = uvolnění)
- `start-bell.aac` - Počáteční zvonek
- `end-bell.aac` - Koncový zvonek

**CDN location:** `https://cdn.dechbar.cz/audio/cues/` & `/bells/`

**Code example:**
```typescript
import { useBreathingCues } from '@/modules/mvp0/hooks/useBreathingCues';

function MyComponent() {
  const breathingCues = useBreathingCues();
  
  // Preload during countdown
  useEffect(() => {
    breathingCues.preloadAll();
  }, []);
  
  // Play cue on phase change
  const handlePhaseChange = (phase: 'inhale' | 'hold' | 'exhale') => {
    breathingCues.playCue(phase);
  };
  
  // Play bell at start
  const handleStart = () => {
    breathingCues.playBell();
  };
}
```

---

#### `useBackgroundMusic()` - Ambient Tracks

**Location:** `src/modules/mvp0/hooks/useBackgroundMusic.ts`

**What it does:**
- Fetches available tracks from Supabase `background_tracks` table
- Filters by user tier (ZDARMA = 3 tracks, SMART = všechny)
- Perfect loop playback (seamless, no crossfade)
- Cache-first strategy (IndexedDB)

**Available tracks:**
- `nature-forest` (Lesní zvuky) - ZDARMA
- `ocean-waves` (Oceánské vlny) - ZDARMA
- `tibetan-bowls` (Tibetské mísy) - ZDARMA

**CDN location:** `https://cdn.dechbar.cz/audio/ambient/`

**Code example:**
```typescript
import { useBackgroundMusic } from '@/modules/mvp0/hooks/useBackgroundMusic';

function MyComponent() {
  const backgroundMusic = useBackgroundMusic();
  
  // Set track and play
  const handleStart = async () => {
    await backgroundMusic.setTrack('nature-forest');
    await backgroundMusic.play();
  };
  
  // Stop on session end
  const handleEnd = () => {
    backgroundMusic.stop();
  };
}
```

---

### 2. State Management

#### `sessionSettingsStore` - User Preferences

**Location:** `src/modules/mvp0/stores/sessionSettingsStore.ts`

**What it does:**
- Zustand store with `persist` middleware (localStorage)
- Stores 11 user settings for audio/haptics
- Default values: Haptics ON (medium), Audio cues ON (60%), Background OFF

**Available settings:**
```typescript
interface SessionSettings {
  // Haptics
  hapticsEnabled: boolean;              // default: true
  hapticIntensity: 'light' | 'medium' | 'heavy'; // default: 'medium'
  
  // Audio Cues
  audioCuesEnabled: boolean;            // default: true
  audioCueVolume: number;               // 0-100, default: 60
  audioCueSound: 'solfeggio';           // default (future: 'tibetan', 'wood')
  
  // Bells
  bellsEnabled: boolean;                // default: true
  
  // Background Music
  backgroundMusicEnabled: boolean;      // default: false
  backgroundMusicVolume: number;        // 0-100, default: 40
  selectedBackgroundTrack: string | null; // default: null
  
  // Walking Mode
  walkingModeEnabled: boolean;          // default: false
  screenDimLevel: number;               // 0-100, default: 10
}
```

**Code example:**
```typescript
import { useSessionSettings } from '@/modules/mvp0/stores/sessionSettingsStore';

function MyComponent() {
  const { 
    hapticsEnabled, 
    setHapticsEnabled,
    audioCueVolume,
    setAudioCueVolume
  } = useSessionSettings();
  
  return (
    <div>
      <Toggle 
        checked={hapticsEnabled} 
        onChange={setHapticsEnabled} 
      />
      <Slider 
        value={audioCueVolume} 
        onChange={setAudioCueVolume} 
      />
    </div>
  );
}
```

---

### 3. Settings UI Components

**Location:** `src/modules/mvp0/components/settings/`

**Available components:**
- `SettingsCard` - Glassmorphism card wrapper (grouped cards)
- `Toggle` - iOS-style switch (haptics/audio on/off)
- `VolumeSlider` - 0-100% range slider
- `IntensitySelector` - Radio group (off/light/medium/heavy)
- `TrackSelector` - Dropdown with tier filtering

**Settings Page:** `/app/settings` (accessible via TopNav → Settings Drawer → "Základní nastavení")

---

### 4. Utility Functions

#### `audioCache.ts` - IndexedDB Wrapper

**Location:** `src/modules/mvp0/utils/audioCache.ts`

**What it does:**
- Caches audio files in IndexedDB for offline use
- API: `getCachedAudioFile(url)`, `cacheAudioFile(url, blob)`

---

#### `capacitorUtils.ts` - Platform Detection

**Location:** `src/modules/mvp0/utils/capacitorUtils.ts`

**What it does:**
- Detects platform: iOS / Android / Web
- Helper: `isNativePlatform` (true = iOS/Android, false = Web)

---

### 5. Type Definitions

**Location:** `src/modules/mvp0/types/audio.ts`

**Available types:**
- `BreathingPhaseAudio` - 'inhale' | 'hold' | 'exhale'
- `HapticIntensity` - 'off' | 'light' | 'medium' | 'heavy'
- `BackgroundTrack` - Supabase table schema
- `SessionSettings` - Store interface
- `CachedAudioFile` - IndexedDB cache schema

---

## 💡 How to Integrate (Usage Examples)

### Example 1: Add haptics to custom component

```typescript
import { useHaptics } from '@/modules/mvp0/hooks/useHaptics';

function CustomBreathingComponent() {
  const haptics = useHaptics();
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  
  const changePhase = (newPhase: typeof phase) => {
    setPhase(newPhase);
    haptics.trigger(newPhase); // ✅ Vibrate on phase change
  };
  
  return (
    <div>
      <button onClick={() => changePhase('inhale')}>Nádech</button>
      <button onClick={() => changePhase('hold')}>Zádrž</button>
      <button onClick={() => changePhase('exhale')}>Výdech</button>
    </div>
  );
}
```

---

### Example 2: Modify haptic patterns

**File:** `src/modules/mvp0/hooks/useHaptics.ts`

Find the `trigger()` function and modify patterns:

```typescript
// Current pattern (EXHALE)
if (phase === 'exhale') {
  await Haptics.impact({ style: ImpactStyle.Heavy }); // 1× heavy
}

// New pattern (2× heavy taps)
if (phase === 'exhale') {
  await Haptics.impact({ style: ImpactStyle.Heavy });
  await new Promise(resolve => setTimeout(resolve, 150));
  await Haptics.impact({ style: ImpactStyle.Heavy });
}
```

---

### Example 3: Add new audio cue sound pack

1. Update `SessionSettings` type:
```typescript
// src/modules/mvp0/types/audio.ts
audioCueSound: 'solfeggio' | 'tibetan' | 'wood'; // Add 'tibetan'
```

2. Update CDN URLs:
```typescript
// src/modules/mvp0/hooks/useBreathingCues.ts
const CUES = {
  inhale: audioCueSound === 'tibetan' 
    ? `${CDN_BASE}/cues/tibetan-inhale.aac`
    : `${CDN_BASE}/cues/inhale-963hz.aac`,
  // ... rest
};
```

3. Add radio option in Settings UI:
```typescript
// src/modules/mvp0/components/settings/IntensitySelector.tsx
<Radio value="tibetan">Tibetské mísy</Radio>
```

4. Upload files to Bunny.net CDN: `cdn.dechbar.cz/audio/cues/tibetan-*.aac`

---

### Example 4: Add new background track

1. Insert into Supabase `background_tracks` table:
```sql
INSERT INTO background_tracks (name, slug, category, cdn_url, required_tier)
VALUES ('Ranní ptáci', 'morning-birds', 'nature', 'https://cdn.dechbar.cz/audio/ambient/morning-birds.aac', 'ZDARMA');
```

2. Upload file to CDN: `cdn.dechbar.cz/audio/ambient/morning-birds.aac`

3. ✅ Done! Track will appear in Settings → Background Music selector

---

## 🧪 Testing Guide

### Platform-Specific Testing

#### iOS (Real Device Required)

**Why real device?**
- iOS Simulator **DOES NOT** support haptics
- Haptics require physical Taptic Engine

**Steps:**
1. Connect iPhone via USB
2. Open XCode → Open `ios/App/App.xcworkspace`
3. Select real device (not simulator!)
4. Build & Run (Cmd+R)
5. Navigate to Settings → Enable Haptics (medium)
6. Start breathing session
7. ✅ Feel vibrations on phase changes

**Expected behavior:**
- INHALE: 1× short tap
- HOLD: 2× taps (bap-bap)
- EXHALE: 1× heavy tap

---

#### Android (Real Device Required)

**Why real device?**
- Android Emulator **DOES NOT** support haptics

**Steps:**
1. Enable USB Debugging on Android device
2. Connect via USB
3. `npx cap run android --target=<device-id>`
4. Same testing steps as iOS

---

#### Web/PWA (No Haptics)

**Expected behavior:**
- ✅ Audio cues work
- ✅ Background music works
- ❌ Haptics silently fail (no vibration)
- Console: `[Haptics] Not supported on web`

---

### Audio Testing

**Steps:**
1. Open Settings → Enable Audio Cues (60% volume)
2. Start breathing session
3. Listen for tones on phase changes:
   - INHALE: High-pitched tone (963 Hz)
   - HOLD: Mid-pitched tone (639 Hz)
   - EXHALE: Low-pitched tone (396 Hz)

**Troubleshooting:**
- No sound? Check device volume (not muted)
- Crackling? Check CDN connection (slow network)
- Wrong frequency? Check audio files uploaded correctly

---

### Background Music Testing

**Steps:**
1. Open Settings → Enable Background Music (40% volume)
2. Select track: "Lesní zvuky"
3. Start breathing session
4. ✅ Music starts after countdown
5. ✅ Loops seamlessly (no gaps/clicks)
6. Complete session
7. ✅ Music stops automatically

**Troubleshooting:**
- Gap in loop? Check audio file (must be perfect loop 120s)
- Music continues after session? Check `useBackgroundMusic` cleanup

---

## 🔧 Troubleshooting

### Issue 1: Haptics not working

**Symptoms:**
- No vibration on phase changes
- Console: `[Haptics] Not supported`

**Solutions:**
1. Check platform:
   ```typescript
   import { isNativePlatform } from '@/modules/mvp0/utils/capacitorUtils';
   console.log('Native?', isNativePlatform); // Must be true
   ```
2. Check settings: `Settings → Haptics → ON`
3. Test on **real device** (not simulator/emulator)
4. Check iOS permissions: Settings → DechBar → Haptics (allow)

---

### Issue 2: Audio not playing

**Symptoms:**
- No sound on phase changes
- Console errors: `Failed to load audio`

**Solutions:**
1. Check CDN connection:
   ```bash
   curl https://cdn.dechbar.cz/audio/cues/inhale-963hz.aac
   # Should return audio file (200 OK)
   ```
2. Check cache:
   ```typescript
   import { getCachedAudioFile } from '@/modules/mvp0/utils/audioCache';
   const cached = await getCachedAudioFile('https://cdn.dechbar.cz/audio/cues/inhale-963hz.aac');
   console.log('Cached?', !!cached);
   ```
3. Check device volume (not muted)
4. Check settings: `Settings → Audio Cues → ON`

---

### Issue 3: Battery drain

**Symptoms:**
- Battery drops 15%+ during 10min session

**Expected behavior:**
- Normal drain: 4-5% per 10min session
- Audio preload: ~300 KB negligible
- Haptics: Minimal impact (efficient Taptic Engine)

**If excessive drain:**
- Check background music volume (lower = less CPU)
- Check screen brightness (dimming saves battery)
- Disable walking mode (screen dimming helps)

---

### Issue 4: Audio cache not working

**Symptoms:**
- Audio loads slowly every time
- Network requests on every session

**Solutions:**
1. Check IndexedDB:
   - Open DevTools → Application → IndexedDB → `audio-cache`
   - Should contain cached files
2. Clear cache and re-preload:
   ```typescript
   // In DevTools Console
   indexedDB.deleteDatabase('audio-cache');
   location.reload();
   ```
3. Check storage quota (browser limit ~50 MB)

---

## 📚 Related Documentation

### Core Documentation
- **Implementation Log:** `docs/development/implementation-logs/2026-02-06-session-audio-haptics.md`
  - Detailed implementation steps
  - Known issues & resolutions
  - Architecture decisions
  - Future roadmap (Phase 2/3)

- **Audio Production Specs:** `docs/audio/AUDIO_PRODUCTION_SPECS.md`
  - Technical specs (AAC, bitrate, duration)
  - CDN structure
  - Looping requirements
  - Testing checklist

- **Solfeggio Frequencies:** `docs/audio/SOLFEGGIO_FREQUENCIES.md`
  - Frequency meanings (396/639/963 Hz)
  - Digital sum rule (3/6/9)
  - DechBar choices rationale

### Related Systems
- **Session Engine:** `docs/development/SESSION_ENGINE_MAINTENANCE.md`
  - Session lifecycle
  - Integration points for audio/haptics

- **CDN Integration:** `docs/infrastructure/BUNNYNET_CDN_INTEGRATION.md`
  - Bunny.net setup
  - CDN base URL: `cdn.dechbar.cz`

---

## 🚀 Future Roadmap

### Phase 2 (v0.3) - Premium Features
- [ ] Multiple sound packs (Tibetské mísy, Dřívka)
- [ ] Preview sounds (inline play button)
- [ ] Cache management UI (clear cache, download all)
- [ ] Adaptive haptics (based on heart rate variability)

### Phase 3 (v0.4) - AI Voice Guidance
- [ ] TTS voice guidance (Czech + English)
- [ ] Personalized voice coaching
- [ ] Binaural beats library (alpha/theta/delta)

### Phase 4 (v1.0) - Multi-Platform
- [ ] Apple Watch companion app
- [ ] Android Wear OS support
- [ ] Community sound packs (curated, legal)

---

## ❓ FAQ

**Q: Proč Solfeggio frekvence, ne klasické zvuky?**  
A: Solfeggio frequencies (396/639/963 Hz) jsou scientificky studované a mají wellbeing účinky. Premium feel aligned with DechBar brand.

**Q: Fungují haptics v PWA?**  
A: Ne. Haptics vyžadují native Capacitor wrapper (iOS/Android). PWA v browseru nemá přístup k Haptics API.

**Q: Kolik místa zabírá audio cache?**  
A: ~11 MB max (3 background tracks + cues/bells). Cues/bells jsou ~300 KB celkem.

**Q: Můžu použít vlastní audio soubory?**  
A: Zatím ne. Plánované v Phase 2 (user upload + moderation).

**Q: Jak často se aktualizují background tracks?**  
A: Supabase fetch při otevření Settings → Background Music. Cache TTL: 7 dní.

---

**Last Updated:** 6. února 2026  
**Maintained by:** DechBar Team  
**Questions?** Contact Martin (martin@dechbar.cz)
