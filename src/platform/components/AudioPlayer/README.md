# 🎵 DechBar Audio Player - API Reference

**Version:** 2.43.0  
**Status:** ✅ MVP Implemented  
**Date:** 2026-02-05

---

## 📚 Quick Start

### Basic Usage (Fullscreen Mode)

```typescript
import { AudioPlayer } from '@/platform/components/AudioPlayer';

function MyComponent() {
  return (
    <AudioPlayer
      trackId="uuid-track-id"
      mode="fullscreen"
      autoplay={false}
      onClose={() => console.log('Player closed')}
    />
  );
}
```

### Sticky Player (Global)

```typescript
import { StickyAudioPlayer } from '@/platform/components/AudioPlayer';

function AppLayout({ children }) {
  return (
    <div>
      {children}
      <StickyAudioPlayer />
    </div>
  );
}
```

### Using Store Directly

```typescript
import { useAudioPlayerStore } from '@/platform/components/AudioPlayer';

function CustomControl() {
  const { currentTrack, isPlaying, play, pause } = useAudioPlayerStore();
  
  return (
    <button onClick={() => isPlaying ? pause() : play(currentTrack!)}>
      {isPlaying ? 'Pause' : 'Play'}
    </button>
  );
}
```

---

## 🎯 Components

### AudioPlayer (Main Component)

**Props:**
```typescript
interface AudioPlayerProps {
  trackId: string;           // UUID of track to play
  mode?: 'fullscreen' | 'sticky'; // Display mode (default: 'fullscreen')
  autoplay?: boolean;        // Auto-start playback (default: false)
  onComplete?: (trackId: string) => void; // Callback when 80% completed
  onClose?: () => void;      // Callback when player closed
}
```

**Usage:**
```typescript
<AudioPlayer
  trackId="123e4567-e89b-12d3-a456-426614174000"
  mode="fullscreen"
  autoplay={true}
  onComplete={(id) => console.log('Completed:', id)}
  onClose={() => router.back()}
/>
```

---

### FullscreenPlayer (Modal Player)

**Props:**
```typescript
interface FullscreenPlayerProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
}
```

**Usage:**
```typescript
<FullscreenPlayer
  track={myTrack}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
/>
```

---

### StickyAudioPlayer (Mini Player)

**Props:** None (uses global store)

**Usage:**
```typescript
// Add to AppLayout (renders automatically when track playing)
<StickyAudioPlayer />
```

**Behavior:**
- Shows when `currentTrack` exists and `mode === 'sticky'`
- Collapsed: 60px height
- Expanded: 400px height (tap to expand)
- Fixed position: 60px above bottom nav

---

## 🎛️ UI Components

### PlayPauseButton

**Props:**
```typescript
interface PlayPauseButtonProps {
  isPlaying: boolean;
  isLoading?: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg'; // 40px, 44px, 48px
  variant?: 'primary' | 'secondary';
}
```

**Usage:**
```typescript
<PlayPauseButton
  isPlaying={true}
  isLoading={false}
  onClick={handleToggle}
  size="lg"
  variant="primary"
/>
```

---

### WaveformProgress

**Props:**
```typescript
interface WaveformProgressProps {
  peaks: number[];      // 80 values (0-1 range)
  currentTime: number;  // Current position in seconds
  duration: number;     // Total duration in seconds
  onSeek: (time: number) => void;
}
```

**Usage:**
```typescript
<WaveformProgress
  peaks={track.waveform_peaks || []}
  currentTime={45}
  duration={300}
  onSeek={(time) => seek(time)}
/>
```

**Note:** If peaks not provided, generates simple visual waveform.

---

### TimeDisplay

**Props:**
```typescript
interface TimeDisplayProps {
  current: number;  // Current time in seconds
  total: number;    // Total duration in seconds
  variant?: 'default' | 'compact';
}
```

**Usage:**
```typescript
<TimeDisplay current={154} total={300} /> // "2:34 / 5:00"
<TimeDisplay current={90} total={180} variant="compact" /> // "1:30/3:00"
```

---

### FavouriteButton

**Props:**
```typescript
interface FavouriteButtonProps {
  trackId: string;
  isFavourite?: boolean;
  onToggle?: (isFavourite: boolean) => void;
}
```

**Usage:**
```typescript
<FavouriteButton
  trackId={track.id}
  isFavourite={false}
  onToggle={(liked) => console.log('Liked:', liked)}
/>
```

---

### VolumeControl

**Props:**
```typescript
interface VolumeControlProps {
  volume: number;       // 0 to 1
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  variant?: 'slider' | 'button'; // Auto-detects if not provided
}
```

**Usage:**
```typescript
<VolumeControl
  volume={0.7}
  isMuted={false}
  onVolumeChange={(vol) => setVolume(vol)}
  onMuteToggle={() => toggleMute()}
/>
```

---

## 🪝 Hooks

### useAudioPlayer

**Purpose:** HTML5 Audio element management

**Usage:**
```typescript
const {
  isPlaying,
  currentTime,
  duration,
  isLoading,
  error,
  play,
  pause,
  seek,
  setVolume,
  audioElement,
} = useAudioPlayer(track);
```

**Returns:**
```typescript
{
  isPlaying: boolean;
  currentTime: number;  // Seconds
  duration: number;     // Seconds
  isLoading: boolean;
  error: string | null;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  audioElement: HTMLAudioElement | null;
}
```

---

### useAudioTracking

**Purpose:** 80% completion tracking with segment merging

**Usage:**
```typescript
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
```

**Returns:**
```typescript
{
  listenedSegments: Array<[number, number]>; // [[start, end], ...]
  isCompleted: boolean;  // True when 80%+ listened
  calculateTotalListened: () => number; // Total unique seconds
  saveProgress: () => Promise<void>; // Save to DB
}
```

**80% Algorithm:**
- Tracks listened segments: `[[0, 50], [100, 150]]`
- Merges overlapping intervals: `[[0, 50], [30, 80]]` → `[[0, 80]]`
- Calculates unique listening time (prevents double-counting)
- Silent completion at 80% threshold (background DB save)

---

## 🗄️ Store (Zustand)

### useAudioPlayerStore

**Global state management for audio player**

**Usage:**
```typescript
const { 
  currentTrack, 
  isPlaying, 
  currentTime,
  play, 
  pause, 
  seek 
} = useAudioPlayerStore();
```

**State:**
```typescript
{
  // Current track
  currentTrack: Track | null;
  
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;          // 0 to 1
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  
  // UI state
  mode: 'fullscreen' | 'sticky' | null;
  isExpanded: boolean;     // Sticky player expanded?
  
  // Tracking (80% rule)
  listenedSegments: Array<[number, number]>;
  isCompleted: boolean;
}
```

**Actions:**
```typescript
{
  play: (track: Track) => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleFavourite: () => Promise<void>;
  close: () => void;
  expandSticky: () => void;
  collapseToSticky: () => void;
  reset: () => void;
}
```

---

## 📊 Types

### Track

```typescript
interface Track {
  id: string;
  album_id: string | null;
  title: string;
  duration: number;        // Seconds (e.g., 420 for 7min)
  audio_url: string;       // Bunny CDN URL
  cover_url: string | null;
  category: string | null; // "Ráno", "Klid", "Energie", "Večer"
  tags: string[];          // ["Funkční probuzení", "Wim Hof"]
  description: string | null;
  track_order: number;
  waveform_peaks?: number[]; // [0.5, 0.7, ...] (80 values, 0-1 range)
  created_at: string;
  updated_at: string;
}
```

### Album

```typescript
interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  type: 'challenge' | 'course' | 'decharna';
  difficulty: 'easy' | 'medium' | 'hard';
  is_locked: boolean;
  required_tier: 'FREE' | 'PREMIUM' | 'STUDENT';
  start_date: string | null; // ISO date
  end_date: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## 🎨 Design Tokens

### Colors (Apple Premium)

```css
--color-background: #121212;     /* Warm Black */
--color-surface: #1E1E1E;        /* Cards */
--color-surface-elevated: #2A2A2A; /* Modals */
--color-primary: #2CBEC6;        /* Teal (focus, unplayed) */
--color-accent: #D6A23A;         /* Gold (CTA, played) */
--color-text-primary: #E0E0E0;   /* 87% white */
--color-text-secondary: #A0A0A0; /* 60% white */
```

### Shadows

```css
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
--shadow-gold: 0 4px 12px rgba(214, 162, 58, 0.3);
```

### Animations

```css
--timing-apple: cubic-bezier(0.25, 0.1, 0.25, 1);
--duration-normal: 250ms;
```

---

## 📱 Mobile Considerations

### iOS Safari Autoplay

**CRITICAL:** Play button must trigger audio synchronously!

```typescript
// ✅ CORRECT (synchronous)
<button onClick={async () => {
  await audio.play(); // Direct user gesture
}}>

// ❌ WRONG (blocked by Safari)
<button onClick={() => {
  setTimeout(() => audio.play(), 100); // Async - blocked!
}}>
```

### Wake Lock

```typescript
import { useWakeLock } from '@/modules/mvp0/hooks/useWakeLock';

const { request, release } = useWakeLock();

useEffect(() => {
  if (isPlaying) request(); // Keep screen on
  else release();           // Allow sleep
}, [isPlaying]);
```

### Safe Areas

```css
.sticky-player {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

---

## 🧪 Testing

### Unit Tests (80% Algorithm)

```typescript
// Test continuous play
expect(calculateCompletion([0, 240], 300)).toBe(80); // ✅ Completed

// Test seek forward (no double-count)
expect(calculateCompletion([[0, 50], [100, 150]], 300)).toBe(33); // ❌ Not completed

// Test overlapping (merge intervals)
expect(mergeIntervals([[0, 50], [30, 80]])).toEqual([[0, 80]]); // 80s, not 100s
```

### Mobile Testing

**ngrok URL:** https://cerebellar-celestine-debatingly.ngrok-free.dev

**Checklist:**
- [ ] Audio plays on iOS Safari (tap play button)
- [ ] Continues when screen locks
- [ ] Wake Lock keeps screen on
- [ ] Touch targets ≥ 44px
- [ ] Swipe down to minimize (sticky)
- [ ] Safe areas respected (notch)

---

## 🚀 Implementation Status

### ✅ Completed (MVP)

- [x] `types.ts` - All TypeScript interfaces
- [x] `store.ts` - Zustand global state
- [x] `hooks/useAudioPlayer.ts` - HTML5 Audio wrapper
- [x] `hooks/useAudioTracking.ts` - 80% completion algorithm
- [x] `components/PlayPauseButton.tsx` - Gold CTA button
- [x] `components/WaveformProgress.tsx` - 80-bar seekable waveform
- [x] `components/TimeDisplay.tsx` - MM:SS format
- [x] `components/FavouriteButton.tsx` - Heart toggle
- [x] `components/VolumeControl.tsx` - Slider/mute
- [x] `FullscreenPlayer.tsx` - Fullscreen modal player
- [x] `StickyPlayer.tsx` - Mini player (60px/400px)
- [x] `audio-player.css` - Apple Premium styles

### 🚧 TODO (Phase 2)

- [ ] Database integration (Supabase queries)
- [ ] Wake Lock integration (useWakeLock hook)
- [ ] Real waveform analysis (audio peaks)
- [ ] Swipe gestures (collapse sticky)
- [ ] Media Session API (lock screen controls)
- [ ] Offline support (Service Worker)
- [ ] Unit tests (Vitest)
- [ ] E2E tests (Playwright)

---

## 📝 Notes

### Memory Leak Prevention

Always cleanup audio element:
```typescript
useEffect(() => {
  return () => {
    audio.pause();
    audio.src = '';
    audio.load();
    audioRef.current = null;
  };
}, [track?.id]);
```

### 80% Completion Psychology

- Industry benchmark for "meaningful engagement"
- Reduces perfectionist anxiety (no punishment for 85% completion)
- Silent tracking (no jarring modals during meditation)

### Březnová Výzva (21-day Challenge)

- Strict sequence unlock (Day 1 → 2 → 21)
- Daily unlock at 4:00 AM (cron job)
- 80% completion required to unlock next day
- Late start: User starts at Day 1 (not calendar day)

---

## 🔗 Related Documentation

- [SPECIFICATION.md](./SPECIFICATION.md) - Master specification (100+ pages)
- [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) - 3-day plan
- [Visual Brand Book](/docs/brand/VISUAL_BRAND_BOOK.md) - Design guidelines
- [Design System](/docs/design-system/00_OVERVIEW.md) - Design tokens

---

**Built with Apple Premium Style 🎨**  
**Dark-first, Teal+Gold, Inter typography, Glassmorphism**
