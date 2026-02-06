# 🎵 DECHBAR AUDIO PLAYER - Master Specification v2.43.0

**Date:** 2026-02-04  
**Status:** 📋 DESIGN COMPLETE - Ready for Implementation  
**Phase:** MVP Design (Pre-Development)  
**Target:** 3 days to MVP for marketing video  
**Sources:** GPT Technical Analysis + Gemini UX Research

---

## 🎯 EXECUTIVE SUMMARY

**What we're building:**

Profesionální audio player pro guided breathing exercises s focus na **"Pusť a nech běžet"** (hands-free, eyes-closed) experience. Core feature pro Březnovou Dechovou Výzvu (21 days, 1150+ users expected).

**Key Principles:**
- ✅ **Zero Distraction:** No completion modals, minimal UI, silent tracking
- ✅ **Apple Premium Style:** Glassmorphism, Warm Black (#121212), Gold accent (#D6A23A)
- ✅ **80% Completion Rule:** Track = completed when 80%+ listened (psychological sweet spot)
- ✅ **Strict Sequence Unlock:** Výzva Day 1 → Day 2 → ... → Day 21 (consistency > speed)
- ✅ **Bunny.net CDN:** Audio files hosted on Bunny (cheaper, scalable, no URL expiration)
- ✅ **"Bio-Pilot" Paradigm:** User as active regulator of autonomic nervous system (not passive consumer)

**NOT in MVP:**
- ❌ Speed control (0.5x, 1x, 1.5x)
- ❌ Skip buttons (±5s, ±15s)
- ❌ XP/Gamification UI (Phase 2)
- ❌ Animated waveform visualizer (Phase 2)
- ❌ Completion screen modal
- ❌ Playlist queue (auto-next)

---

## 📊 UNIFIED INSIGHTS (GPT + Gemini Synthesis)

### **From Gemini (UX Research - 17 pages):**

**Key Concepts:**

1. **"Bio-Pilot" Paradigm**
   - User acts as active regulator of autonomic nervous system
   - Not passive content consumer (unlike Spotify/Apple Music)
   - Interface supports physiological state change (sympathetic → parasympathetic)

2. **"Calm Technology" Principles**
   - Interface informs without demanding attention
   - Moves seamlessly between periphery and center of user's focus
   - Supports eyes-closed, hands-free workflow

3. **Zero Distraction Player Modality**
   - Unlike music apps (discovery-first), wellness apps prioritize stillness
   - Fullscreen player = sanctuary (not engagement engine)
   - Visual elements reduced to minimal "Breath Pacer"

4. **80% Completion Psychology**
   - Industry benchmark for "meaningful engagement" (e-learning, podcasts)
   - Mitigates perfectionist anxiety (no punishment for stopping at 85%)
   - Balances intrinsic motivation (feel calmer) vs extrinsic (streak)
   - **Silent completion:** No jarring "Ding!" during alpha/theta brainwave state

5. **Circular Progress Ring > Linear Bar**
   - Circular ring implies cycle, whole, journey (not linear race)
   - Reduces "watched pot" effect (time perception psychology)
   - Aligns with cyclical nature of breathing
   - Apple Fitness + Oura Ring pattern

6. **Warm Black (#121212) Science**
   - Reduces halation (eye strain from high contrast)
   - Allows shadows to create depth (impossible on pure black)
   - Preserves circadian rhythm + melatonin production (evening protocols)
   - Prevents OLED black smearing

7. **Sticky Player Dimensions**
   - Industry sweet spot: 60-64px height
   - Balances accessibility (44px touch targets) + screen real estate
   - Above bottom nav (z-index strategy)

**Competitor Analysis:**

| App | Strategy | Sticky Player | Progress UI | Visual Tone |
|-----|----------|---------------|-------------|-------------|
| **Apple Music** | Library-first, high-fidelity | Yes, 60px, tap to expand | Interactive scrub bar | Light, airy, blurred |
| **Spotify** | Discovery, social | Yes, swipe up | Interactive scrub bar | Dark, neon accents |
| **Calm** | Immersion, sleep | No (focus single session) | Minimal/Hidden | Blue, nature gradients |
| **Headspace** | Education, progression | Context-dependent | Progress ring | Orange/Pastel, playful |
| **DechBar** | **Physiology-focused** | **Yes, 60px + live breath** | **Minimal ring** | **Warm Black + Gold** |

**Critical UX Findings:**
- **Fade-to-black:** Calm hides UI after inactivity (reduces visual stimulus)
- **Scrubbing discouraged:** Meditation apps hide/disable seek (prevents anxiety)
- **Haptics essential:** Breathing apps use vibration as breath pacing cues
- **Background audio priority:** Wake Lock + native audio session critical

---

### **From GPT (Technical Spec - 9 pages):**

**Component Architecture:**
```
src/platform/components/AudioPlayer/
├── AudioPlayer.tsx              # Main wrapper (exports public API)
├── FullscreenPlayer.tsx         # Fullscreen modal mode
├── StickyPlayer.tsx             # Mini player (collapsed/expanded)
├── components/
│   ├── AudioControls.tsx        # Play/Pause, Volume
│   ├── WaveformProgress.tsx     # 80 bars, seekable
│   ├── TrackMetadata.tsx        # Title, cover, duration
│   ├── FavouriteButton.tsx      # Like/unlike (TopBar)
│   └── TimeDisplay.tsx          # MM:SS format
├── hooks/
│   ├── useAudioPlayer.ts        # HTML5 Audio abstraction
│   ├── useAudioTracking.ts      # 80% completion logic
│   └── useWaveform.ts           # Waveform generation (optional)
├── types.ts                     # TypeScript interfaces
├── SPECIFICATION.md             # This document
└── README.md                    # Quick start guide (create later)
```

**State Management (Zustand):**
```typescript
// Recommended: Zustand over Context (performance for frequent updates)
// Global store for player state (accessible from anywhere in app)

interface AudioPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  listenedSegments: Array<[number, number]>; // For 80% calculation
  // ... actions
}
```

**80% Completion Algorithm:**
```typescript
// Key insight: Track listened segments, merge overlapping intervals
// Handle seeks/skips without double-counting

const listenedSegments: Array<[start, end]> = [];

function calculateTotalListened(segments) {
  const merged = mergeIntervals(segments); // Merge overlaps
  return merged.reduce((sum, [start, end]) => sum + (end - start), 0);
}

// Completion check
if ((totalListened / duration) * 100 >= 80) {
  markAsCompleted(); // Silent, background
}
```

**Database Schema:**
- `tracks` (audio metadata, Bunny CDN URL)
- `albums` (playlists, type: challenge/course/decharna)
- `track_progress` (real-time position, for resume)
- `track_completions` (80% rule, historical)
- `track_favourites` (like/unlike)
- `challenge_progress` (21-day strict sequence)

**RLS Policies:** User can only see/edit own progress/completions/favourites

---

## 🏗️ COMPONENT ARCHITECTURE (Finalized)

### **File Structure:**

```
src/platform/components/AudioPlayer/
│
├── index.ts                     # Export { AudioPlayer, StickyAudioPlayer }
│
├── AudioPlayer.tsx              # Main component (fullscreen + sticky modes)
│   └── Props: { trackId, mode?, onComplete? }
│
├── FullscreenPlayer.tsx         # Fullscreen modal (FullscreenModal pattern)
│   ├── TopBar: Title + Favourite ❤️ + Close ✕
│   ├── ContentZone: Cover art + Waveform + Time
│   └── BottomBar: Play/Pause + Volume
│
├── StickyPlayer.tsx             # Fixed bottom player (60px collapsed, 400px expanded)
│   ├── Collapsed: Play + Title + Time (60px)
│   └── Expanded: Full player (tap to expand)
│
├── components/
│   ├── PlayPauseButton.tsx      # Large gold button (48px desktop, 44px mobile)
│   ├── WaveformProgress.tsx     # 80 bars, seekable, gold progress
│   ├── VolumeControl.tsx        # Slider (desktop), Mute button (mobile)
│   ├── TimeDisplay.tsx          # "2:34 / 5:00" (mono font)
│   ├── TrackCover.tsx           # Cover art (200x200 desktop, 150x150 mobile)
│   └── FavouriteButton.tsx      # ❤️ TopBar right, toggle like/unlike
│
├── hooks/
│   ├── useAudioPlayer.ts        # HTML5 Audio management
│   │   └── Returns: { play, pause, seek, isPlaying, currentTime, duration }
│   │
│   ├── useAudioTracking.ts      # 80% completion logic
│   │   └── Returns: { addSegment, checkCompletion, isCompleted }
│   │
│   └── useWaveform.ts           # Waveform peaks generation (Phase 2)
│
├── types.ts                     # TypeScript interfaces
│   ├── Track, Album, TrackProgress, TrackCompletion
│   └── AudioPlayerProps, AudioPlayerState
│
├── SPECIFICATION.md             # This document (master spec)
│
└── README.md                    # API reference (create after implementation)
```

---

### **Component Hierarchy (Visual):**

```
AudioPlayerController (Zustand store)
│
├─ StickyPlayer (60px, fixed bottom: 60px above BottomNav)
│  ├─ PlayPauseButton (44px touch target)
│  ├─ CoverThumbnail (40x40px)
│  ├─ TrackTitle (truncated, 1 line)
│  ├─ TimeDisplay (2:34 / 5:00, small)
│  └─ ThinProgress (2px gold bar, 100% width)
│  
│  [Tap anywhere → Expand to 400px]
│  
│  ├─ Expanded Sticky (400px)
│     ├─ TopBar: Title + ❤️ + ✕
│     ├─ ContentZone: Cover (150x150) + Waveform + Time
│     └─ BottomBar: Play/Pause (44px) + Volume
│
└─ FullscreenModal (max-width: 480px desktop, fullscreen mobile)
   └─ FullscreenPlayer
      │
      ├─ TopBar (60px)
      │  ├─ TrackTitle (centered, 16px, semibold)
      │  ├─ FavouriteButton ❤️ (absolute right, 44px)
      │  └─ CloseButton ✕ (absolute right, 44px)
      │
      ├─ ContentZone
      │  ├─ CoverArt (200x200 desktop, 150x150 mobile, centered)
      │  ├─ WaveformProgress (80 bars, seekable, gold)
      │  └─ TimeDisplay (2:34 / 5:00, 14px mono)
      │
      └─ BottomBar (80px)
         ├─ PlayPauseButton (48px desktop, 44px mobile, gold)
         └─ VolumeControl (slider desktop, mute mobile)
```

---

## 🎨 VISUAL DESIGN SPECIFICATION

### **1. Fullscreen Player (Desktop):**

```
┌────────────────────────────────────────────┐
│  Ranní Dech - 7 minut        ❤️  ✕         │ TopBar (60px)
│  #121212 background                        │
├────────────────────────────────────────────┤
│                                            │
│                                            │
│           [Cover Art 200x200]              │ ContentZone
│         Glassmorphism shadow               │
│                                            │
│  ━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━ │ Waveform (80 bars)
│  Gold played (#D6A23A), Teal unplayed     │
│                                            │
│  2:34                               5:00   │ Time (mono, 14px)
│                                            │
├────────────────────────────────────────────┤
│            ▶️ (48px)          🔇           │ BottomBar (80px)
│         Gold #D6A23A                       │
└────────────────────────────────────────────┘
   Max-width: 480px, centered
   Border-radius: 24px
   Background: #121212 (Warm Black)
   Box-shadow: 0 24px 48px rgba(0,0,0,0.6)
```

---

### **2. Sticky Player (Collapsed - 60px):**

```
┌────────────────────────────────────────────┐
│ ▶️ [40x40] Ranní Dech - 7 minut   2:34/5:00 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ Thin progress (2px gold)
└────────────────────────────────────────────┘
   Position: fixed
   Bottom: 60px (above BottomNav)
   Z-index: 998 (below modals 10000, above BottomNav 1000)
   Background: rgba(30, 30, 30, 0.95)
   Backdrop-filter: blur(20px)
   
   Tap anywhere → Expand to 400px
```

---

### **3. Sticky Player (Expanded - 400px):**

```
┌────────────────────────────────────────────┐
│  Ranní Dech - 7 minut        ❤️  ✕         │ TopBar
├────────────────────────────────────────────┤
│                                            │
│           [Cover Art 150x150]              │ ContentZone
│                                            │
│  ━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━ │ Waveform
│  2:34                               5:00   │
│                                            │
├────────────────────────────────────────────┤
│            ▶️ (44px)          🔇           │ BottomBar
└────────────────────────────────────────────┘
   Position: fixed
   Bottom: 60px
   Height: 400px
   Transition: slideUp 300ms cubic-bezier(0.25, 0.1, 0.25, 1)
   
   Swipe down → Collapse to 60px
```

---

### **Design Tokens (Reference):**

```css
/* Already defined in src/styles/design-tokens/ */

/* Colors */
--color-background: #121212;     /* Warm Black */
--color-surface: #1E1E1E;        /* Surface layer */
--color-primary: #2CBEC6;        /* Teal */
--color-accent: #D6A23A;         /* Gold */
--color-text-primary: #FFFFFF;
--color-text-secondary: #E0E0E0;

/* Glassmorphism */
--glass-card: rgba(30, 30, 30, 0.85);
backdrop-filter: blur(20px);

/* Shadows */
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 24px 48px rgba(0, 0, 0, 0.6);
--shadow-gold: 0 4px 12px rgba(214, 162, 58, 0.3);

/* Spacing (4px base unit) */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-xxl: 48px;

/* Typography */
--font-family: 'Inter', sans-serif;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--letter-spacing-tight: -0.02em;

/* Animations */
--transition-spring: 300ms cubic-bezier(0.25, 0.1, 0.25, 1);
--transition-bounce: 200ms cubic-bezier(0.68, -0.55, 0.27, 1.55);

/* Z-index Layers */
--z-bottom-nav: 1000;
--z-sticky-player: 998;
--z-modal-overlay: 10000;
--z-modal-container: 10001;
```

---

## 🎮 VÝZVA FLOW (21-Day Challenge - Strict Sequence)

### **Business Logic:**

**Challenge Concept:**
- 21 audio tracks (1 per day)
- Strict sequence unlock (cannot skip days)
- Daily unlock at 4:00 AM (server cron job)
- 80% completion required to unlock next day
- **Consistency > Speed:** One track per day (habit formation)

---

### **User Flow (Step-by-Step):**

**Phase 1: Registration (before 28.2. 23:59:59)**
```
1. User registers for "Březnová Dechová Výzva"
2. Database record created:
   
   challenge_progress:
   - user_id: <uuid>
   - challenge_id: <uuid> (Březnová Výzva album)
   - current_day: 0 (waiting for start)
   - last_completed_day: 0
   - started_at: NULL
   - completed_at: NULL
```

**Phase 2: Day 1 Unlock (1.3. 4:00 AM - Cron job runs)**
```
3. Cron checks all active challenges:
   
   FOR EACH challenge_progress WHERE started_at IS NULL:
     IF (today >= challenge.start_date):
       UPDATE challenge_progress SET:
         - started_at = NOW()
         - current_day = 1

4. User opens app on 1.3.:
   
   "Dnešní dýchačka" button shows:
   - Title: "Den 1 - Ranní Dech"
   - Badge: "🔥 Výzva" (gold accent)
   - Subtitle: "7 minut"
   
   Tap → Opens FullscreenPlayer with Day 1 track
```

**Phase 3: User Completes Day 1 (80%+ listened)**
```
5. User listens to track:
   - Audio plays (eyes closed, hands-free)
   - 80% tracking runs in background
   - At 5:36 (80% of 7:00) → silent completion
   
6. Silent completion (NO modal, NO toast):
   
   Database updates:
   
   track_completions INSERT:
   - user_id, track_id (Day 1), album_id (Výzva)
   - completion_count: 1 (first listen)
   - listen_time: 336s (5:36)
   - completed_at: NOW()
   
   challenge_progress UPDATE:
   - last_completed_day = 1
   
   UI: No visual feedback during session
   User: Closes player naturally when audio ends

7. User sees completion (later, on Dnes view):
   
   "Dnešní dýchačka" button shows:
   - Status: ✅ "Den 1 hotovo" (checkmark)
   - Subtitle: "Další den zítra v 4:00"
   - Locked until 2.3. 4:00
```

**Phase 4: Day 2 Unlock (2.3. 4:00 AM - Cron job runs)**
```
8. Cron checks challenge progress:
   
   FOR EACH challenge_progress WHERE current_day = 1:
     IF (last_completed_day >= current_day):
       UPDATE challenge_progress SET:
         - current_day = 2
     ELSE:
       # User didn't complete Day 1, stays locked
       current_day stays 1

9. User opens app on 2.3.:
   
   IF (last_completed_day >= 1):
     "Dnešní dýchačka" → "Den 2 - Odpolední Klid"
   ELSE:
     "Dnešní dýchačka" → still "Den 1" (must complete first)
```

**Phase 5: Edge Case - Late Start (e.g., user joins 10.3.)**
```
10. User registered 15.2., but first opens app on 10.3. (9 days late)

11. Challenge progress shows:
    - current_day: 1 (NOT 10!)
    - last_completed_day: 0
    
12. User must complete Day 1 first:
    - "Dnešní dýchačka" → "Den 1"
    - After completion → unlocks Day 2
    - One track per day (consistency)
    
13. Challenge extends beyond 21 calendar days:
    - Started: 1.3.
    - User starts: 10.3.
    - Completes Day 1: 10.3.
    - Completes Day 2: 11.3.
    - ...
    - Completes Day 21: 30.3. (29 days total)
    
14. Principle: Consistency > Speed
    - No catch-up mode (cannot complete 5 days in 1 day)
    - No calendar skip (cannot jump to Day 10)
    - Strict sequence ensures habit formation
```

**Phase 6: Challenge Completion (21/21 days)**
```
15. User completes Day 21:
    - challenge_progress UPDATE:
      - last_completed_day = 21
      - completed_at = NOW()

16. Challenge unlocked in Akademie:
    - Section: "Výzvy"
    - Album: "Březnová Výzva 2026" (unlocked)
    - Free navigation: User can replay any day

17. [Phase 2] Share Screen appears:
    - "Skvěle! Dokončil jsi výzvu!"
    - Visual: 21/21 days, total minutes, streak
    - CTA: "Chceš sdílet svůj úspěch?"
    - Buttons: [📸 Sdílet] [Zavřít]
```

---

### **Button Label: "Dnešní dýchačka" 🎯**

**Tone of Voice Analysis:**

| Criterion | "Dnešní výzva" | "Dnes dýchej" | **"Dnešní dýchačka"** ✅ |
|-----------|----------------|---------------|-------------------------|
| **Tykání** | ✅ | ✅ | ✅ |
| **Neformálnost** | ❌ Formální | ✅ Akční | ✅ **Playful, friendly** |
| **Breathing vibe** | ❌ | ✅ | ✅ **Breathing slang** |
| **Krátké** | ❌ (dlouhé) | ✅ | ✅ |
| **Drzost** | ❌ | ⚠️ Neutrální | ✅ **Playful** |
| **Memorable** | ❌ Generic | ✅ | ✅ **Unique** |

**Selected:** **"Dnešní dýchačka"** (playful, breathing vibe, memorable)

**Context on Dnes View:**
```
┌────────────────────────────────────────────┐
│  Dnes · 4. února 2026                      │
├────────────────────────────────────────────┤
│                                            │
│  ┌────────────────────────────────────────┐│
│  │  🤖 SMART CVIČENÍ                      ││ Hero card (AI)
│  │  5 min · Personalizované               ││
│  └────────────────────────────────────────┘│
│                                            │
│  ┌────────────────────────────────────────┐│
│  │  🔥 Dnešní dýchačka                    ││ Challenge card ← NEW
│  │  Den 5/21 · 7 min                      ││
│  └────────────────────────────────────────┘│
│                                            │
│  Doporučené protokoly:                     │
│  ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │RÁNO │ │KLID │ │VEČER│                  │ Protocol chips
│  │5min │ │7min │ │9min │                  │
│  └─────┘ └─────┘ └─────┘                  │
│                                            │
│  💡 Dnešní tip                             │
│  "Dýchej nosem, ne ústy..."               │
│                                            │
└────────────────────────────────────────────┘
```

---

## 💾 DATABASE SCHEMA (Supabase PostgreSQL)

### **Complete SQL Schema:**

```sql
-- ============================================================
-- TRACKS (Audio metadata)
-- ============================================================

CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL, -- seconds (e.g., 420 for 7min)
  audio_url TEXT NOT NULL, -- Bunny CDN: https://dechbar-cdn.b-cdn.net/path/file.mp3
  cover_url TEXT, -- Cover art URL
  category TEXT, -- "Ráno", "Klid", "Energie", "Večer"
  tags TEXT[], -- ["Funkční probuzení", "Wim Hof", "4:4:4:4"]
  description TEXT,
  track_order INTEGER DEFAULT 0, -- Order within album
  waveform_peaks JSONB, -- [0.5, 0.7, 0.3, ...] (80 values, Phase 2)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracks_album ON tracks(album_id);
CREATE INDEX idx_tracks_category ON tracks(category);

-- ============================================================
-- ALBUMS (Playlists, Challenges, Courses)
-- ============================================================

CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- "Březnová Dechová Výzva 2026"
  description TEXT,
  cover_url TEXT,
  type TEXT CHECK (type IN ('challenge', 'course', 'decharna')) NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  is_locked BOOLEAN DEFAULT false,
  required_tier TEXT CHECK (required_tier IN ('FREE', 'PREMIUM', 'STUDENT')) DEFAULT 'FREE',
  start_date DATE, -- For challenges (e.g., 1.3.2026)
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_albums_type ON albums(type);

-- ============================================================
-- TRACK_PROGRESS (Real-time listening state)
-- ============================================================

CREATE TABLE track_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  listened_seconds INTEGER DEFAULT 0, -- Total unique seconds listened (for 80% calc)
  last_position INTEGER DEFAULT 0, -- Last playhead position (for resume)
  progress_percent DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, track_id)
);

CREATE INDEX idx_track_progress_user ON track_progress(user_id);
CREATE INDEX idx_track_progress_track ON track_progress(track_id);

-- ============================================================
-- TRACK_COMPLETIONS (80% rule - historical)
-- ============================================================

CREATE TABLE track_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  completion_count INTEGER DEFAULT 1, -- 1st, 2nd, 3rd listen...
  listen_time INTEGER NOT NULL, -- Actual seconds listened (for stats)
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_completions_user ON track_completions(user_id);
CREATE INDEX idx_completions_track ON track_completions(track_id);
CREATE INDEX idx_completions_album ON track_completions(album_id);

-- ============================================================
-- TRACK_FAVOURITES (User likes)
-- ============================================================

CREATE TABLE track_favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, track_id)
);

CREATE INDEX idx_favourites_user ON track_favourites(user_id);

-- ============================================================
-- CHALLENGE_PROGRESS (21-day strict sequence)
-- ============================================================

CREATE TABLE challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES albums(id) ON DELETE CASCADE NOT NULL,
  current_day INTEGER DEFAULT 1, -- 1 to 21
  last_completed_day INTEGER DEFAULT 0, -- 0 to 21
  started_at TIMESTAMPTZ, -- When user first started challenge
  completed_at TIMESTAMPTZ, -- When all 21 days completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_challenge_progress_user ON challenge_progress(user_id);
CREATE INDEX idx_challenge_progress_challenge ON challenge_progress(challenge_id);

-- ============================================================
-- RLS POLICIES (Row Level Security)
-- ============================================================

-- Track Progress (user can only see/edit own)
ALTER TABLE track_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
ON track_progress
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Track Completions (user can only see/insert own)
ALTER TABLE track_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own completions"
ON track_completions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Favourites (user can only manage own)
ALTER TABLE track_favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favourites"
ON track_favourites
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Challenge Progress (user can only see/edit own)
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own challenge progress"
ON challenge_progress
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Tracks (public read, admin write)
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tracks"
ON tracks
FOR SELECT
USING (true);

CREATE POLICY "Admin can manage tracks"
ON tracks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Albums (public read, admin write)
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view albums"
ON albums
FOR SELECT
USING (true);

CREATE POLICY "Admin can manage albums"
ON albums
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
);
```

---

## 🛠️ TYPESCRIPT INTERFACES

```typescript
// src/platform/components/AudioPlayer/types.ts

/**
 * Track - Audio track metadata
 */
export interface Track {
  id: string;
  album_id: string | null;
  title: string;
  duration: number; // seconds
  audio_url: string; // Bunny CDN URL
  cover_url: string | null;
  category: string | null; // "Ráno", "Klid", "Energie", "Večer"
  tags: string[]; // ["Funkční probuzení", "Wim Hof"]
  description: string | null;
  track_order: number;
  waveform_peaks?: number[]; // Phase 2: [0.5, 0.7, ...] (80 values)
  created_at: string;
  updated_at: string;
}

/**
 * Album - Playlist/Challenge/Course
 */
export interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  type: 'challenge' | 'course' | 'decharna';
  difficulty: 'easy' | 'medium' | 'hard';
  is_locked: boolean;
  required_tier: 'FREE' | 'PREMIUM' | 'STUDENT';
  start_date: string | null; // ISO date (for challenges)
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * TrackProgress - Real-time listening state
 */
export interface TrackProgress {
  id: string;
  user_id: string;
  track_id: string;
  album_id: string | null;
  listened_seconds: number; // Total unique seconds (80% calc)
  last_position: number; // Resume position
  progress_percent: number; // 0.00 to 100.00
  last_played_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * TrackCompletion - Historical completion record
 */
export interface TrackCompletion {
  id: string;
  user_id: string;
  track_id: string;
  album_id: string | null;
  completion_count: number; // 1st, 2nd, 3rd listen
  listen_time: number; // Actual seconds listened
  completed_at: string;
}

/**
 * TrackFavourite - User like
 */
export interface TrackFavourite {
  id: string;
  user_id: string;
  track_id: string;
  created_at: string;
}

/**
 * ChallengeProgress - 21-day challenge state
 */
export interface ChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  current_day: number; // 1 to 21
  last_completed_day: number; // 0 to 21
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * AudioPlayerProps - Main component props
 */
export interface AudioPlayerProps {
  trackId: string;
  mode?: 'fullscreen' | 'sticky';
  autoplay?: boolean;
  onComplete?: (trackId: string) => void;
  onClose?: () => void;
}

/**
 * AudioPlayerState - Zustand store
 */
export interface AudioPlayerState {
  // Current track
  currentTrack: Track | null;
  
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  
  // UI state
  mode: 'fullscreen' | 'sticky' | null;
  isExpanded: boolean; // Sticky player expanded?
  
  // Tracking (80% rule)
  listenedSegments: Array<[number, number]>; // [[0, 30], [50, 100], ...]
  isCompleted: boolean;
  
  // Actions
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

## 📡 API DESIGN (Supabase Queries)

### **1. Fetch Track by ID:**
```typescript
const { data: track, error } = await supabase
  .from('tracks')
  .select('*')
  .eq('id', trackId)
  .single();
```

### **2. Fetch Album with Tracks (ordered):**
```typescript
const { data: album, error } = await supabase
  .from('albums')
  .select(`
    *,
    tracks (
      id,
      title,
      duration,
      audio_url,
      cover_url,
      track_order
    )
  `)
  .eq('id', albumId)
  .order('track_order', { foreignTable: 'tracks', ascending: true })
  .single();
```

### **3. Get Track Progress (resume position):**
```typescript
const { data: progress, error } = await supabase
  .from('track_progress')
  .select('*')
  .eq('user_id', userId)
  .eq('track_id', trackId)
  .maybeSingle(); // Returns null if not found (first play)
```

### **4. Save/Update Progress (UPSERT):**
```typescript
// Called every 10s during playback or on pause
const { data, error } = await supabase
  .from('track_progress')
  .upsert({
    user_id: userId,
    track_id: trackId,
    album_id: albumId,
    listened_seconds: totalListened,
    last_position: currentTime,
    progress_percent: (totalListened / duration) * 100,
    last_played_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id,track_id', // Update if exists
  });
```

### **5. Mark Track as Completed (80% reached):**
```typescript
// Check if already completed (get completion_count)
const { data: existing } = await supabase
  .from('track_completions')
  .select('*')
  .eq('user_id', userId)
  .eq('track_id', trackId)
  .order('completed_at', { ascending: false })
  .limit(1)
  .maybeSingle();

const completionCount = existing ? existing.completion_count + 1 : 1;

// Insert new completion record
const { data, error } = await supabase
  .from('track_completions')
  .insert({
    user_id: userId,
    track_id: trackId,
    album_id: albumId,
    completion_count: completionCount,
    listen_time: totalListened,
    completed_at: new Date().toISOString(),
  });

// Update challenge progress (if track is part of challenge)
if (albumId && albumType === 'challenge') {
  await updateChallengeProgress(userId, albumId);
}
```

### **6. Toggle Favourite (like/unlike):**
```typescript
// Check if already favourited
const { data: fav } = await supabase
  .from('track_favourites')
  .select('id')
  .eq('user_id', userId)
  .eq('track_id', trackId)
  .maybeSingle();

if (fav) {
  // Unlike
  await supabase
    .from('track_favourites')
    .delete()
    .eq('id', fav.id);
} else {
  // Like
  await supabase
    .from('track_favourites')
    .insert({
      user_id: userId,
      track_id: trackId,
    });
}
```

### **7. Get Challenge Progress:**
```typescript
const { data: challenge, error } = await supabase
  .from('challenge_progress')
  .select('*')
  .eq('user_id', userId)
  .eq('challenge_id', challengeId)
  .maybeSingle();

// Returns:
// {
//   current_day: 5,
//   last_completed_day: 4,
//   started_at: "2026-03-01T04:00:00Z",
//   completed_at: null
// }
```

### **8. Update Challenge Progress (after track completion):**
```typescript
async function updateChallengeProgress(userId: string, challengeId: string) {
  // Get current progress
  const { data: progress } = await supabase
    .from('challenge_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .single();
  
  // Increment last_completed_day
  const newCompletedDay = progress.last_completed_day + 1;
  
  // Check if all 21 days completed
  const isFullyCompleted = newCompletedDay >= 21;
  
  await supabase
    .from('challenge_progress')
    .update({
      last_completed_day: newCompletedDay,
      completed_at: isFullyCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', progress.id);
}
```

---

## 🎯 CORE IMPLEMENTATION - useAudioPlayer Hook

### **useAudioPlayer.ts (HTML5 Audio Management):**

```typescript
// src/platform/components/AudioPlayer/hooks/useAudioPlayer.ts

import { useRef, useState, useEffect, useCallback } from 'react';
import { Track } from '../types';

export const useAudioPlayer = (track: Track | null) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize audio element
  useEffect(() => {
    if (!track) return;
    
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = track.audio_url;
    
    audioRef.current = audio;
    setIsLoading(true);
    
    // Event listeners
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const handleError = () => {
      setError('Nepodařilo se načíst audio');
      setIsLoading(false);
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    // Cleanup
    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [track?.id]);
  
  // Play
  const play = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setError(null);
    } catch (err) {
      setError('Nepodařilo se spustit přehrávání');
      console.error('Audio play failed:', err);
    }
  }, []);
  
  // Pause
  const pause = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);
  
  // Seek
  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = Math.max(0, Math.min(time, duration));
  }, [duration]);
  
  // Set volume
  const setVolume = useCallback((vol: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.volume = Math.max(0, Math.min(vol, 1));
  }, []);
  
  return {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    error,
    play,
    pause,
    seek,
    setVolume,
    audioElement: audioRef.current,
  };
};
```

---

## 🎯 80% COMPLETION TRACKING - useAudioTracking Hook

### **useAudioTracking.ts (Critical Algorithm):**

```typescript
// src/platform/components/AudioPlayer/hooks/useAudioTracking.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/platform/lib/supabase';

interface UseAudioTrackingProps {
  trackId: string;
  albumId: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
}

export const useAudioTracking = ({
  trackId,
  albumId,
  duration,
  currentTime,
  isPlaying,
}: UseAudioTrackingProps) => {
  const [listenedSegments, setListenedSegments] = useState<Array<[number, number]>>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const lastTimeRef = useRef<number>(0);
  const segmentStartRef = useRef<number>(0);
  
  // Add listened segment (only during continuous playback)
  useEffect(() => {
    if (!isPlaying) return;
    
    const lastTime = lastTimeRef.current;
    const timeDiff = Math.abs(currentTime - lastTime);
    
    // Detect seek (time jump > 2 seconds)
    if (timeDiff > 2) {
      // Seek detected, save previous segment
      if (segmentStartRef.current !== lastTime) {
        setListenedSegments(prev => [...prev, [segmentStartRef.current, lastTime]]);
      }
      // Start new segment
      segmentStartRef.current = currentTime;
    }
    
    lastTimeRef.current = currentTime;
  }, [currentTime, isPlaying]);
  
  // Save segment on pause
  useEffect(() => {
    if (!isPlaying && lastTimeRef.current > segmentStartRef.current) {
      setListenedSegments(prev => [...prev, [segmentStartRef.current, lastTimeRef.current]]);
    }
  }, [isPlaying]);
  
  // Calculate total listened time
  const calculateTotalListened = useCallback(() => {
    // Merge overlapping intervals
    const merged = mergeIntervals(listenedSegments);
    
    // Sum total unique seconds
    return merged.reduce((sum, [start, end]) => sum + (end - start), 0);
  }, [listenedSegments]);
  
  // Merge overlapping intervals (helper)
  const mergeIntervals = (segments: Array<[number, number]>) => {
    if (segments.length === 0) return [];
    
    // Sort by start time
    const sorted = [...segments].sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const last = merged[merged.length - 1];
      const current = sorted[i];
      
      if (current[0] <= last[1]) {
        // Overlapping, merge
        last[1] = Math.max(last[1], current[1]);
      } else {
        // Non-overlapping, add new
        merged.push(current);
      }
    }
    
    return merged;
  };
  
  // Check completion (80% rule)
  const checkCompletion = useCallback(async () => {
    if (isCompleted || duration === 0) return;
    
    const totalListened = calculateTotalListened();
    const completionPercent = (totalListened / duration) * 100;
    
    if (completionPercent >= 80) {
      setIsCompleted(true);
      
      // Silent background save (no UI notification)
      await markAsCompleted(trackId, albumId, totalListened);
    }
  }, [trackId, albumId, duration, isCompleted, calculateTotalListened]);
  
  // Check completion on every time update
  useEffect(() => {
    checkCompletion();
  }, [currentTime, checkCompletion]);
  
  // Save to database
  const markAsCompleted = async (trackId: string, albumId: string | null, listenTime: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Check existing completions
    const { data: existing } = await supabase
      .from('track_completions')
      .select('completion_count')
      .eq('user_id', user.id)
      .eq('track_id', trackId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const completionCount = existing ? existing.completion_count + 1 : 1;
    
    // Insert completion record
    await supabase
      .from('track_completions')
      .insert({
        user_id: user.id,
        track_id: trackId,
        album_id: albumId,
        completion_count: completionCount,
        listen_time: Math.floor(listenTime),
        completed_at: new Date().toISOString(),
      });
    
    console.log(`✅ Track completed silently: ${trackId} (${completionCount}x)`);
  };
  
  // Save progress (every 10s or on pause)
  const saveProgress = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const totalListened = calculateTotalListened();
    const progressPercent = (totalListened / duration) * 100;
    
    await supabase
      .from('track_progress')
      .upsert({
        user_id: user.id,
        track_id: trackId,
        album_id: albumId,
        listened_seconds: Math.floor(totalListened),
        last_position: Math.floor(currentTime),
        progress_percent: Number(progressPercent.toFixed(2)),
        last_played_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
  }, [trackId, albumId, currentTime, duration, calculateTotalListened]);
  
  // Auto-save progress every 10s
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      saveProgress();
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, [isPlaying, saveProgress]);
  
  return {
    listenedSegments,
    isCompleted,
    calculateTotalListened,
    saveProgress,
  };
};
```

---

## 🎨 WAVEFORM IMPLEMENTATION

### **Approach: Static Waveform (80 bars)**

**Phase 1 (MVP): Simple randomized peaks**
```typescript
// Generate visually appealing bars (no real audio analysis)
const generateSimplePeaks = (count: number = 80): number[] => {
  return Array.from({ length: count }, (_, i) => {
    // Create wave pattern (higher in middle, lower at edges)
    const position = i / count; // 0 to 1
    const wave = Math.sin(position * Math.PI); // Bell curve
    const random = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
    return wave * random;
  });
};
```

**Phase 2 (Advanced): Real waveform analysis**
```typescript
// Edge Function or build-time: Analyze audio file
// Extract amplitude peaks using Web Audio API
// Save to tracks.waveform_peaks (JSONB)
```

---

### **WaveformProgress Component:**

```typescript
// components/WaveformProgress.tsx

interface WaveformProgressProps {
  peaks: number[]; // 80 values (0-1 range)
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const WaveformProgress: React.FC<WaveformProgressProps> = ({
  peaks,
  currentTime,
  duration,
  onSeek,
}) => {
  const progressPercent = (currentTime / duration) * 100;
  
  return (
    <div className="waveform">
      {peaks.map((peak, index) => {
        const barProgress = (index / peaks.length) * 100;
        const isPlayed = barProgress <= progressPercent;
        
        return (
          <button
            key={index}
            className={`waveform-bar ${isPlayed ? 'waveform-bar--played' : ''}`}
            style={{ 
              height: `${peak * 100}%`,
              minHeight: '4px' // Minimum visibility
            }}
            onClick={() => {
              const seekTime = (index / peaks.length) * duration;
              onSeek(seekTime);
            }}
            aria-label={`Přejít na ${Math.floor((index / peaks.length) * 100)}%`}
          />
        );
      })}
    </div>
  );
};
```

**CSS:**
```css
/* src/styles/components/audio-player.css */

.waveform {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
  height: 80px;
  width: 100%;
  padding: 0 8px;
}

.waveform-bar {
  flex: 1;
  background: var(--color-primary); /* Teal (unplayed) */
  opacity: 0.3;
  border-radius: 2px;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s var(--transition-spring);
}

.waveform-bar--played {
  background: var(--color-accent); /* Gold (played) */
  opacity: 1;
}

.waveform-bar:hover {
  opacity: 0.6;
  transform: scaleY(1.15);
}

.waveform-bar:active {
  transform: scaleY(0.95);
}

/* Mobile: Larger touch targets */
@media (max-width: 768px) {
  .waveform {
    gap: 1px;
    height: 60px;
  }
}
```

---

## 🔐 ACCESS CONTROL & USER TIERS

### **Tier Definitions:**

**FREE (default):**
- ✅ 3 sample tracks (DECHárna > Zdarma sekce)
- ✅ 1 longer meditation (20 min)
- ❌ No výzvy access
- ❌ Limited DECHárna (sample only)

**PREMIUM (měsíční předplatné):**
- ✅ Full library (all DECHárna tracks)
- ✅ Historie dechpress (minulý rok)
- ✅ All categories & tags
- ❌ Výzvy (separate purchase)

**VÝZVA (lifetime purchase - separate):**
- ✅ Specific challenge (21 tracks)
- ✅ Strict sequence unlock (Day 1 → 2 → ... → 21)
- ✅ Access after completion → Akademie > Výzvy (free navigation)

**STUDENT/TEACHER (future):**
- Custom tier
- Educational packages

---

### **Access Check (Client-side):**

```typescript
// Check user tier
const { data: { user } } = await supabase.auth.getUser();
const userTier = user?.user_metadata?.tier || 'FREE';

// Check track access
const canAccessTrack = (track: Track, userTier: string): boolean => {
  // FREE tier
  if (userTier === 'FREE') {
    return track.tags?.includes('FREE_SAMPLE') || false;
  }
  
  // PREMIUM tier
  if (userTier === 'PREMIUM') {
    return track.required_tier !== 'CHALLENGE';
  }
  
  // ADMIN
  if (userTier === 'ADMIN') {
    return true;
  }
  
  return false;
};

// Check challenge access
const canAccessChallenge = async (challengeId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Check if user purchased this challenge
  const { data: purchase } = await supabase
    .from('user_purchases')
    .select('*')
    .eq('user_id', user.id)
    .eq('product_id', challengeId)
    .eq('product_type', 'challenge')
    .maybeSingle();
  
  return !!purchase;
};
```

---

## 📱 MOBILE CONSIDERATIONS (iOS + Android)

### **iOS Safari Restrictions:**

**Problem 1: Autoplay blocked**
```typescript
// Solution: User gesture required
// Play button MUST directly trigger audio.play()

<button onClick={async () => {
  await audioRef.current?.play(); // ✅ Synchronous user gesture
}}>
  Přehrát
</button>

// ❌ DON'T: Async callback (blocked by Safari)
<button onClick={() => {
  setTimeout(() => {
    audioRef.current?.play(); // ❌ Blocked!
  }, 100);
}}>
```

**Problem 2: Background audio paused**
```typescript
// Solution: Capacitor native wrapper
// Use @capacitor/audio for native audio session

import { CapacitorAudio } from '@capacitor/audio';

// Initialize audio session (iOS AVAudioSession)
await CapacitorAudio.configure({
  category: 'playback',
  mode: 'spokenAudio', // Optimize for voice (not music)
  options: ['duckOthers'], // Lower other apps' volume
});

// HTML5 Audio will now continue in background
```

**Problem 3: Screen locks, audio stops**
```typescript
// Solution: Wake Lock API (reuse from Session Engine)
import { useWakeLock } from '@/modules/mvp0/hooks/useWakeLock';

const { request, release } = useWakeLock();

useEffect(() => {
  if (isPlaying) {
    request(); // Keep screen on
  } else {
    release(); // Allow sleep
  }
}, [isPlaying]);
```

---

### **Android Chrome Considerations:**

**Background Playback:**
```typescript
// Service Worker + Media Session API
// Register service worker

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Media Session (lock screen controls)
if ('mediaSession' in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: 'DechBar',
    album: album?.name,
    artwork: [
      { src: track.cover_url, sizes: '512x512', type: 'image/png' }
    ]
  });
  
  navigator.mediaSession.setActionHandler('play', () => play());
  navigator.mediaSession.setActionHandler('pause', () => pause());
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (details.seekTime) seek(details.seekTime);
  });
}
```

---

### **Touch Targets (WCAG AA Compliance):**

```css
/* Minimum touch target: 44x44px */

.play-pause-button {
  width: 48px; /* Desktop */
  height: 48px;
  /* Visual icon can be smaller, but hit area is 48px */
}

@media (max-width: 768px) {
  .play-pause-button {
    width: 44px; /* Mobile minimum */
    height: 44px;
  }
}

/* Ensure padding extends touch area */
.waveform-bar {
  min-width: 4px; /* Visual */
  padding: 8px 0; /* Touch area extends vertically */
}
```

---

### **Safe Areas (iOS Notch, Android Gesture Bar):**

```css
.sticky-player {
  position: fixed;
  bottom: 60px; /* Above BottomNav */
  left: 0;
  right: 0;
  
  /* Safe area insets (iOS notch, Android gesture) */
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  
  /* Note: bottom already accounts for BottomNav */
}

.fullscreen-player {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 🚀 IMPLEMENTATION ROADMAP

### **Phase 1: MVP (3 days) 🔥 PRIORITY**

**Day 1: Core Audio Player (8h)**
- [ ] Create folder structure (`AudioPlayer/`, `hooks/`, `components/`)
- [ ] Implement `useAudioPlayer` hook (HTML5 Audio)
- [ ] Implement `useAudioTracking` hook (80% algorithm)
- [ ] Create Zustand store (`audioPlayerStore.ts`)
- [ ] Test hooks (unit tests for 80% algorithm)
- [ ] Create TypeScript interfaces (`types.ts`)

**Day 2: Fullscreen Player UI (8h)**
- [ ] Create `FullscreenPlayer.tsx` (reuse FullscreenModal)
- [ ] TopBar: Title + Favourite ❤️ + Close ✕
- [ ] ContentZone: Cover art + Waveform + Time
- [ ] BottomBar: Play/Pause (gold) + Volume
- [ ] Implement `WaveformProgress` component (80 bars, seekable)
- [ ] Test on desktop browser
- [ ] Mobile testing (iOS Safari, ngrok URL)

**Day 3: Sticky Player + Polish (8h)**
- [ ] Create `StickyPlayer.tsx` (collapsed 60px, expanded 400px)
- [ ] Expand/collapse animations (slideUp, shared-element)
- [ ] Integrate Wake Lock (reuse from Session Engine)
- [ ] Favourite button (toggle like/unlike, API integration)
- [ ] Volume control (slider desktop, mute button mobile)
- [ ] Error handling (audio failed to load, network error)
- [ ] Loading states (spinner while buffering)
- [ ] Final mobile testing (iOS, Android)
- [ ] Bug fixes + polish

**Deliverable:** Working audio player ready for marketing video ✅

---

### **Phase 2: Výzva Flow (1 week)**

**Week 1: Challenge System**
- [ ] Create database migrations (challenge_progress table)
- [ ] Implement challenge unlock logic (cron job, 4:00 AM daily)
- [ ] "Dnešní dýchačka" button (Dnes view)
- [ ] Challenge progress API (get current day, check completion)
- [ ] Strict sequence validation (Day 1 → 2 → ... → 21)
- [ ] Late start handling (user joins Day 10 → starts at Day 1)
- [ ] Test challenge flow (complete Day 1 → unlock Day 2)

**Deliverable:** 21-day challenge functional ✅

---

### **Phase 3: Admin Panel (1 week)**

**Week 2: Content Management**
- [ ] Admin routes (`/admin/media/tracks`, `/albums`)
- [ ] Track CRUD (add, edit, delete forms)
- [ ] Album CRUD
- [ ] Category/Tag management
- [ ] Track assignment (assign tracks to challenge days)
- [ ] Bunny CDN upload integration (file upload + URL generation)
- [ ] Bulk operations (CSV import for metadata)
- [ ] Track preview player (admin can test audio)

**Deliverable:** Admin can manage audio library ✅

---

### **Phase 4: Advanced Features (2 weeks)**

**Week 3-4: Enhancements**
- [ ] Offline support (Service Worker, pre-download tracks)
- [ ] Share screen (post-challenge completion, 21/21 visual)
- [ ] Real-time sync (multi-device progress via Supabase Realtime)
- [ ] Analytics dashboard (completion rates, popular tracks)
- [ ] Waveform visualization (real audio analysis, animated bars)
- [ ] Playlist queue (auto-next track)
- [ ] Haptic feedback (Capacitor Haptics API, breath pacing cues)

**Deliverable:** Production-ready audio system ✅

---

## 📋 DATABASE MIGRATION PLAN

### **Migration 1: Core Tables (Day 1)**

```sql
-- 001_create_tracks_and_albums.sql

-- Albums
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  type TEXT CHECK (type IN ('challenge', 'course', 'decharna')) NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  is_locked BOOLEAN DEFAULT false,
  required_tier TEXT CHECK (required_tier IN ('FREE', 'PREMIUM', 'STUDENT')) DEFAULT 'FREE',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracks
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  category TEXT,
  tags TEXT[],
  description TEXT,
  track_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracks_album ON tracks(album_id);
CREATE INDEX idx_albums_type ON albums(type);

-- RLS
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tracks" ON tracks FOR SELECT USING (true);
CREATE POLICY "Public can view albums" ON albums FOR SELECT USING (true);
```

---

### **Migration 2: Progress & Completions (Day 2)**

```sql
-- 002_create_progress_tracking.sql

-- Track Progress (real-time)
CREATE TABLE track_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  listened_seconds INTEGER DEFAULT 0,
  last_position INTEGER DEFAULT 0,
  progress_percent DECIMAL(5,2) DEFAULT 0.00,
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, track_id)
);

-- Track Completions (80% rule)
CREATE TABLE track_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  completion_count INTEGER DEFAULT 1,
  listen_time INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_track_progress_user ON track_progress(user_id);
CREATE INDEX idx_completions_user ON track_completions(user_id);
CREATE INDEX idx_completions_track ON track_completions(track_id);

-- RLS
ALTER TABLE track_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress" ON track_progress
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own completions" ON track_completions
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

### **Migration 3: Favourites & Challenge (Day 3)**

```sql
-- 003_create_favourites_and_challenge.sql

-- Favourites
CREATE TABLE track_favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, track_id)
);

-- Challenge Progress
CREATE TABLE challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES albums(id) ON DELETE CASCADE NOT NULL,
  current_day INTEGER DEFAULT 1,
  last_completed_day INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_favourites_user ON track_favourites(user_id);
CREATE INDEX idx_challenge_progress_user ON challenge_progress(user_id);

-- RLS
ALTER TABLE track_favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favourites" ON track_favourites
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own challenge progress" ON challenge_progress
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 🧪 TESTING STRATEGY

### **1. Unit Tests (Vitest):**

```typescript
// hooks/useAudioTracking.test.ts

describe('useAudioTracking - 80% Completion', () => {
  it('should mark as completed when 80% listened', () => {
    const duration = 300; // 5 minutes
    const segments = [[0, 240]]; // 4 minutes continuous
    
    const totalListened = calculateTotalListened(segments);
    const percent = (totalListened / duration) * 100;
    
    expect(percent).toBeGreaterThanOrEqual(80);
  });
  
  it('should handle seeks without double-counting', () => {
    const segments = [
      [0, 50],    // Listen 0-50s
      [100, 150], // Seek to 100s, listen 100-150s
    ];
    
    const total = calculateTotalListened(segments);
    expect(total).toBe(100); // 50s + 50s = 100s (not 150s)
  });
  
  it('should merge overlapping segments', () => {
    const segments = [
      [0, 50],
      [30, 80], // Overlaps with [0, 50]
    ];
    
    const merged = mergeIntervals(segments);
    expect(merged).toEqual([[0, 80]]);
    
    const total = calculateTotalListened(segments);
    expect(total).toBe(80); // Not 100 (double-counted)
  });
});
```

---

### **2. Integration Tests (Playwright):**

```typescript
// e2e/audio-player.spec.ts

test('User can play track and track 80% completion', async ({ page }) => {
  // Login
  await page.goto('/');
  await login(page);
  
  // Navigate to DECHárna
  await page.click('[data-testid="nav-akademie"]');
  await page.click('[data-testid="track-1"]');
  
  // Player opens
  await expect(page.locator('[data-testid="fullscreen-player"]')).toBeVisible();
  
  // Play button
  await page.click('[data-testid="play-button"]');
  
  // Wait for 80% of duration (simulate fast playback)
  await page.evaluate(() => {
    const audio = document.querySelector('audio');
    if (audio) {
      audio.currentTime = audio.duration * 0.81; // 81%
      audio.dispatchEvent(new Event('timeupdate'));
    }
  });
  
  // Wait for completion API call
  await page.waitForTimeout(1000);
  
  // Check database
  const completion = await checkCompletion(userId, trackId);
  expect(completion).toBeTruthy();
});

test('Sticky player expands and collapses', async ({ page }) => {
  // Open player
  await page.click('[data-testid="track-1"]');
  
  // Play
  await page.click('[data-testid="play-button"]');
  
  // Close to sticky
  await page.click('[data-testid="close-button"]');
  
  // Sticky visible
  await expect(page.locator('[data-testid="sticky-player"]')).toBeVisible();
  
  // Expand
  await page.click('[data-testid="sticky-player"]');
  
  // Expanded height
  const height = await page.locator('[data-testid="sticky-player"]').evaluate(el => el.offsetHeight);
  expect(height).toBeGreaterThan(300); // Expanded ~400px
});
```

---

### **3. Mobile Testing Checklist:**

**iOS Safari (iPhone 13 Mini, iOS 17+):**
- [ ] Audio plays after tap (autoplay workaround works)
- [ ] Audio continues when screen locks (Capacitor audio session)
- [ ] Wake Lock keeps screen on (reused from Session Engine)
- [ ] Lock screen controls work (play/pause, seek)
- [ ] Safe areas respected (notch, home indicator)
- [ ] Touch targets ≥ 44px (all buttons)
- [ ] Swipe down to minimize (gesture works)
- [ ] Audio interruptions handled (phone call → pause → resume)

**Android Chrome (Pixel 7, Android 14+):**
- [ ] Background audio works (Service Worker)
- [ ] Media Session API (lock screen controls)
- [ ] Safe areas (gesture bar)
- [ ] Touch targets ≥ 44px
- [ ] Swipe gestures
- [ ] Wake Lock (Capacitor)

**Both Platforms:**
- [ ] Waveform bars seekable (tap to jump)
- [ ] Volume control works (slider desktop, mute mobile)
- [ ] Favourite button toggles (visual + DB)
- [ ] 80% completion tracked (tested with seeks)
- [ ] No memory leaks (audio cleanup on unmount)
- [ ] No console errors

---

## 🎯 SUCCESS CRITERIA (MVP Definition of Done)

### **Functional Requirements:**
- ✅ Audio plays on iOS Safari (autoplay restriction bypassed)
- ✅ Audio continues when screen locks (Capacitor + Wake Lock)
- ✅ 80% tracking works (tested with seek/pause scenarios)
- ✅ Sticky player shows while browsing app (fixed position)
- ✅ Favourite button toggles (saves to DB, visual feedback)
- ✅ Fullscreen ↔ Sticky transitions (smooth, no jank)
- ✅ Loading states (spinner while buffering)
- ✅ Error handling (graceful failure, retry option)

### **UX Requirements:**
- ✅ Zero completion modals (silent tracking)
- ✅ Smooth animations (expand/collapse, play button scale)
- ✅ Touch targets ≥ 44px (WCAG AA)
- ✅ Safe areas respected (iOS notch, Android gesture bar)
- ✅ Warm Black background (#121212)
- ✅ Gold accent (play button, progress bar)
- ✅ Glassmorphism (sticky player, modals)

### **Technical Requirements:**
- ✅ Database schema created (6 tables, RLS enabled)
- ✅ API queries optimized (indexes, efficient joins)
- ✅ Mobile tested (iPhone, Android, ngrok)
- ✅ No memory leaks (audio cleanup)
- ✅ Bundle size < 500KB (lazy loaded)
- ✅ TypeScript strict mode (no `any` types)

### **Marketing Video Requirements:**
- ✅ Demo shows ease of use ("Pusť a dýchej")
- ✅ "Dnešní dýchačka" button prominent
- ✅ Audio plays smoothly (no buffering delays)
- ✅ Sticky player stays visible (multitasking demo)
- ✅ Premium feel (glassmorphism, smooth animations)

---

## 🚨 CRITICAL IMPLEMENTATION NOTES

### **1. Audio Element Cleanup (Memory Leak Prevention):**

```typescript
// CRITICAL: Always cleanup audio element on unmount
useEffect(() => {
  const audio = new Audio();
  audioRef.current = audio;
  
  return () => {
    // Cleanup sequence
    audio.pause();           // Stop playback
    audio.src = '';          // Clear source
    audio.load();            // Reset element
    audioRef.current = null; // Clear ref
  };
}, [track?.id]);
```

---

### **2. 80% Tracking - Edge Case Matrix:**

| Scenario | Listened Segments | Total | Duration | Completed? |
|----------|-------------------|-------|----------|------------|
| **Continuous** | `[[0, 240]]` | 240s | 300s | ✅ Yes (80%) |
| **Seek forward** | `[[0, 50], [100, 150]]` | 100s | 300s | ❌ No (33%) |
| **Seek backward** | `[[0, 100], [50, 200]]` → Merge `[[0, 200]]` | 200s | 300s | ❌ No (67%) |
| **Multiple seeks** | `[[0, 50], [60, 110], [120, 200]]` | 180s | 300s | ❌ No (60%) |
| **Replay overlap** | `[[0, 150], [100, 250]]` → Merge `[[0, 250]]` | 250s | 300s | ✅ Yes (83%) |

**Key principle:** Merge overlapping intervals to avoid double-counting.

---

### **3. Wake Lock Integration (Reuse from Session Engine):**

```typescript
// REUSE: src/modules/mvp0/hooks/useWakeLock.ts (already exists!)

import { useWakeLock } from '@/modules/mvp0/hooks/useWakeLock';

// In AudioPlayer component
const { request, release, isActive } = useWakeLock();

useEffect(() => {
  if (isPlaying) {
    request(); // Keep screen on during playback
  } else {
    release(); // Allow screen to sleep when paused
  }
  
  // Cleanup on unmount
  return () => release();
}, [isPlaying]);
```

**Wake Lock Lifecycle:**
- ✅ **Request:** When audio starts playing
- ✅ **Release:** When audio pauses or ends
- ✅ **Re-request:** When tab becomes visible again (visibilitychange event)
- ✅ **Cleanup:** On component unmount

---

### **4. Bunny CDN Audio URLs:**

**URL Format:**
```
https://dechbar-cdn.b-cdn.net/challenges/brezna-2026/den-1-ranní-dech.mp3
```

**File Naming Convention:**
```
Original: "1. den výzvy - večerní výzva - ruka na břiše.mp3"
Sanitized: "den-1-vecerni-vyzva-ruka-na-brise.mp3"

Pattern:
- Remove diacritics (č → c, ř → r, š → s)
- Lowercase all
- Spaces → hyphens (-)
- Remove special chars
- Remove numbers at start (1. den → den-1)
```

**Sanitization Function:**
```typescript
export const sanitizeFileName = (name: string): string => {
  return name
    .normalize('NFD')                     // Decompose diacritics
    .replace(/[\u0300-\u036f]/g, '')      // Remove diacritics
    .toLowerCase()                         // Lowercase
    .replace(/^\d+\.\s*/, '')             // Remove leading numbers (1. → )
    .replace(/\s+/g, '-')                 // Spaces → hyphens
    .replace(/[^a-z0-9.-]/g, '')          // Remove special chars
    .replace(/--+/g, '-')                 // Multiple hyphens → one
    .replace(/^-|-$/g, '');               // Trim hyphens
};

// Example:
// sanitizeFileName("1. den výzvy - večerní výzva - ruka na břiše.mp3")
// → "den-vyzvy-vecerni-vyzva-ruka-na-brise.mp3"
```

---

## 🎨 VISUAL DESIGN DETAILS

### **Color Palette (Warm Black + Gold):**

```css
/* Background hierarchy */
--color-background: #121212;      /* Page background (Warm Black) */
--color-surface: #1E1E1E;         /* Elevated surface (cards) */
--color-surface-elevated: #252525; /* Modal background */

/* Text hierarchy */
--color-text-primary: #FFFFFF;    /* Headings, important text */
--color-text-secondary: #E0E0E0;  /* Body text */
--color-text-tertiary: #A0A0A0;   /* Subtle text (time, hints) */

/* Brand colors */
--color-primary: #2CBEC6;         /* Teal (unplayed waveform) */
--color-accent: #D6A23A;          /* Gold (CTA, played waveform) */

/* Semantic colors */
--color-success: #4CAF50;         /* Completion (silent, not shown) */
--color-error: #F44336;           /* Error states */
--color-warning: #FFC107;         /* Warnings */

/* Glassmorphism */
--glass-player: rgba(30, 30, 30, 0.95);
--glass-modal: rgba(18, 18, 18, 0.98);
backdrop-filter: blur(20px);
```

---

### **Typography Scale:**

```css
/* Headings */
--font-size-h1: 28px;  /* Player title (desktop) */
--font-size-h2: 24px;  /* Player title (mobile) */
--font-size-h3: 20px;  /* Section headers */

/* Body */
--font-size-base: 16px;    /* Default text */
--font-size-sm: 14px;      /* Time display, metadata */
--font-size-xs: 12px;      /* Hints, labels */

/* Mono (for time display) */
--font-family-mono: 'SF Mono', 'Courier New', monospace;

/* Letter spacing */
--letter-spacing-tight: -0.02em;  /* Headings */
--letter-spacing-normal: 0;       /* Body */
--letter-spacing-wide: 0.02em;    /* Uppercase labels */
```

---

### **Spacing System (4px base unit):**

```css
/* Consistent spacing throughout player */

/* Padding */
--player-padding-xs: 8px;   /* Waveform gap */
--player-padding-sm: 12px;  /* Button padding */
--player-padding-md: 16px;  /* Content padding */
--player-padding-lg: 24px;  /* Modal padding */
--player-padding-xl: 32px;  /* Fullscreen padding */

/* Gaps */
--player-gap-xs: 4px;   /* Icon + text */
--player-gap-sm: 8px;   /* Controls */
--player-gap-md: 16px;  /* Sections */
--player-gap-lg: 24px;  /* Large sections */

/* Heights */
--player-sticky-collapsed: 60px;
--player-sticky-expanded: 400px;
--player-topbar-height: 60px;
--player-bottombar-height: 80px;
--player-cover-desktop: 200px;
--player-cover-mobile: 150px;
```

---

### **Shadows & Effects:**

```css
/* Player shadows */
.fullscreen-player {
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6); /* Deep shadow */
}

.sticky-player {
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.4); /* Subtle top shadow */
}

.play-button {
  box-shadow: 0 4px 12px rgba(214, 162, 58, 0.3); /* Gold glow */
}

.play-button:active {
  box-shadow: 0 2px 8px rgba(214, 162, 58, 0.5); /* Pressed state */
}

/* Glassmorphism effect */
.sticky-player {
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
```

---

### **Animations:**

```css
/* Expand/Collapse sticky player */
@keyframes slideUp {
  from {
    height: 60px;
    opacity: 0.9;
  }
  to {
    height: 400px;
    opacity: 1;
  }
}

.sticky-player--expanded {
  animation: slideUp 300ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}

/* Play button scale (spring bounce) */
.play-button:active {
  transform: scale(0.95);
  transition: transform 200ms cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

/* Waveform bar hover */
.waveform-bar:hover {
  transform: scaleY(1.15);
  transition: transform 150ms ease-out;
}

/* Fullscreen modal slide up */
@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(32px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fullscreen-player {
  animation: modalSlideUp 300ms cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

---

## 🔄 INTEGRATION WITH EXISTING CODEBASE

### **1. Reuse FullscreenModal Pattern:**

```typescript
// Session Engine already uses this pattern
import { FullscreenModal } from '@/components/shared/FullscreenModal';

<FullscreenModal isOpen={mode === 'fullscreen'} onClose={collapseToSticky}>
  <FullscreenModal.TopBar>
    <h2 className="player-title">{track.title}</h2>
    <FavouriteButton trackId={track.id} />
    <button onClick={close} aria-label="Zavřít">✕</button>
  </FullscreenModal.TopBar>
  
  <FullscreenModal.ContentZone>
    <img src={track.cover_url} alt={track.title} className="player-cover" />
    <WaveformProgress peaks={peaks} currentTime={currentTime} duration={duration} onSeek={seek} />
    <TimeDisplay current={currentTime} total={duration} />
  </FullscreenModal.ContentZone>
  
  <FullscreenModal.BottomBar>
    <PlayPauseButton isPlaying={isPlaying} onClick={togglePlay} size="lg" />
    <VolumeControl volume={volume} onVolumeChange={setVolume} />
  </FullscreenModal.BottomBar>
</FullscreenModal>
```

**CSS already exists:**
- `src/styles/components/fullscreen-modal/_base.css` (desktop modal)
- `src/styles/components/fullscreen-modal/_mobile.css` (fullscreen mobile)

**Reuse strategy:**
- ✅ Same TopBar/ContentZone/BottomBar structure
- ✅ Same responsive breakpoints (768px)
- ✅ Same z-index layers
- ✅ Add audio-player-specific CSS separately

---

### **2. Reuse Wake Lock Hook:**

```typescript
// Already exists: src/modules/mvp0/hooks/useWakeLock.ts

import { useWakeLock } from '@/modules/mvp0/hooks/useWakeLock';

// Direct integration (no changes needed)
const { request, release } = useWakeLock();

useEffect(() => {
  if (isPlaying) request();
  else release();
}, [isPlaying]);
```

---

### **3. Integrate with AppLayout:**

```typescript
// src/platform/layouts/AppLayout.tsx

import { StickyAudioPlayer } from '@/platform/components/AudioPlayer';
import { useAudioPlayerStore } from '@/platform/stores/audioPlayerStore';

export const AppLayout: React.FC<Props> = ({ children }) => {
  const { currentTrack, mode } = useAudioPlayerStore();
  
  return (
    <div className="app-layout">
      <div className="app-layout__content">
        {children}
      </div>
      
      <BottomNav />
      
      {/* Sticky player (shows when track is playing) */}
      {currentTrack && mode === 'sticky' && (
        <StickyAudioPlayer />
      )}
    </div>
  );
};
```

**Z-index strategy:**
```css
.bottom-nav {
  z-index: 1000; /* Existing */
}

.sticky-player {
  z-index: 998; /* Below BottomNav, above content */
  bottom: 60px; /* Above BottomNav height */
}

.fullscreen-modal {
  z-index: 10000; /* Above everything */
}
```

---

## 📊 ADMIN PANEL STRUCTURE (Phase 3)

### **Admin Routes:**

```
/admin
├── /dashboard (overview stats)
│   ├── Total tracks: 156
│   ├── Total albums: 12
│   ├── Active challenges: 3
│   └── Completion rate: 67%
│
├── /media (track/album management)
│   ├── /tracks
│   │   ├── List (table: title, album, duration, category, actions)
│   │   ├── /add (form: upload to Bunny, metadata)
│   │   ├── /edit/:id (edit form)
│   │   └── /preview/:id (test player)
│   │
│   ├── /albums
│   │   ├── List (grid: cover, name, type, track count)
│   │   ├── /add (form: name, type, cover)
│   │   ├── /edit/:id (edit form + assign tracks)
│   │   └── /tracks/:id (drag-drop track ordering)
│   │
│   ├── /categories (CRUD categories)
│   └── /tags (CRUD tags)
│
├── /challenges (výzvy management)
│   ├── /create (wizard: 21 tracks selection)
│   ├── /edit/:id (edit challenge metadata)
│   ├── /assign/:id (assign tracks to days 1-21)
│   └── /analytics/:id (completion rates per day)
│
└── /settings
    ├── /cdn (Bunny.net URL, API key)
    └── /general (app settings)
```

---

### **Admin Components (Reusable):**

```
src/admin/
├── layouts/
│   └── AdminLayout.tsx (sidebar nav, topbar)
│
├── modules/
│   ├── media/
│   │   ├── TrackList.tsx (table with actions)
│   │   ├── TrackForm.tsx (add/edit form)
│   │   ├── AlbumList.tsx (grid with covers)
│   │   ├── AlbumForm.tsx
│   │   └── TrackPreviewPlayer.tsx (test audio in admin)
│   │
│   └── challenges/
│       ├── ChallengeWizard.tsx (21-day setup)
│       ├── TrackAssignment.tsx (drag-drop days)
│       └── ChallengeAnalytics.tsx (stats dashboard)
│
└── shared/
    ├── DataTable.tsx (sortable, filterable table)
    ├── DragDropList.tsx (reorderable list)
    └── FileUploader.tsx (Bunny CDN upload)
```

---

### **Bunny CDN Upload (Admin):**

```typescript
// Admin: Upload MP3 to Bunny CDN

async function uploadToBunny(file: File): Promise<string> {
  const BUNNY_STORAGE_ZONE = 'dechbar-cdn';
  const BUNNY_API_KEY = process.env.VITE_BUNNY_API_KEY;
  
  // Sanitize filename
  const sanitizedName = sanitizeFileName(file.name);
  const path = `challenges/brezna-2026/${sanitizedName}`;
  
  // Upload to Bunny Storage API
  const response = await fetch(
    `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${path}`,
    {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/octet-stream',
      },
      body: file,
    }
  );
  
  if (!response.ok) {
    throw new Error('Upload failed');
  }
  
  // Return public CDN URL
  return `https://dechbar-cdn.b-cdn.net/${path}`;
}

// Usage in admin form
const handleFileUpload = async (file: File) => {
  setUploading(true);
  
  try {
    const audioUrl = await uploadToBunny(file);
    
    // Save to Supabase
    const { data } = await supabase
      .from('tracks')
      .insert({
        title: trackTitle,
        duration: audioDuration, // Extract from file metadata
        audio_url: audioUrl,
        // ... other fields
      });
    
    toast.success('Track nahrán!');
  } catch (error) {
    toast.error('Upload selhal');
  } finally {
    setUploading(false);
  }
};
```

---

## 🎯 VÝZVA IMPLEMENTATION (Detailed)

### **Dnes View - "Dnešní dýchačka" Button:**

```typescript
// src/modules/mvp0/pages/DnesPage.tsx

export const DnesPage: React.FC = () => {
  const { data: challengeProgress } = useChallengeProgress(); // Get current day
  const { data: currentTrack } = useCurrentDayTrack(challengeProgress?.current_day);
  
  return (
    <div className="dnes-page">
      {/* SMART CVIČENÍ card */}
      <SmartExerciseCard />
      
      {/* Dnešní dýchačka card (if active challenge) */}
      {challengeProgress && (
        <ChallengeDayCard
          day={challengeProgress.current_day}
          track={currentTrack}
          isCompleted={challengeProgress.last_completed_day >= challengeProgress.current_day}
          onPlay={() => playTrack(currentTrack)}
        />
      )}
      
      {/* Protocols */}
      <ProtocolSection />
      
      {/* Daily tip */}
      <DailyTipWidget />
    </div>
  );
};
```

**ChallengeDayCard Component:**
```typescript
<div className="challenge-day-card">
  <div className="challenge-day-card__header">
    <h3>🔥 Dnešní dýchačka</h3>
    {isCompleted && <span className="badge badge--success">✅ Hotovo</span>}
  </div>
  
  <div className="challenge-day-card__content">
    <img src={track.cover_url} alt={track.title} className="cover-thumb" />
    <div className="track-info">
      <p className="day-number">Den {day}/21</p>
      <h4 className="track-title">{track.title}</h4>
      <p className="track-duration">{formatDuration(track.duration)}</p>
    </div>
  </div>
  
  <button 
    className="btn btn--primary btn--lg"
    onClick={onPlay}
    disabled={isCompleted}
  >
    {isCompleted ? 'Další den zítra v 4:00' : 'Přehrát'}
  </button>
</div>
```

---

### **Challenge Unlock Cron Job (Supabase Edge Function):**

```typescript
// supabase/functions/unlock-challenge-day/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Get all active challenges (started but not completed)
  const { data: challenges } = await supabase
    .from('challenge_progress')
    .select('*')
    .not('started_at', 'is', null)
    .is('completed_at', null);
  
  const updates = [];
  
  for (const challenge of challenges || []) {
    // Check if user completed previous day
    if (challenge.last_completed_day >= challenge.current_day) {
      // Unlock next day
      updates.push(
        supabase
          .from('challenge_progress')
          .update({
            current_day: challenge.current_day + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', challenge.id)
      );
    }
    // Else: User didn't complete, stays locked on current day
  }
  
  await Promise.all(updates);
  
  return new Response(
    JSON.stringify({ updated: updates.length }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

// Cron schedule: Every day at 4:00 AM (Europe/Prague timezone)
// Set in Supabase Dashboard → Database → Cron Jobs
// 0 4 * * * unlock-challenge-day
```

---

## 🧪 TESTING CHECKLIST (Complete)

### **Functional Tests:**

**Audio Playback:**
- [ ] Track plays on desktop (Chrome, Firefox, Safari)
- [ ] Track plays on iOS Safari (autoplay workaround)
- [ ] Track plays on Android Chrome
- [ ] Audio continues when screen locks (iOS, Android)
- [ ] Wake Lock keeps screen on (tested)
- [ ] Volume control works (slider desktop, mute mobile)
- [ ] Seek works (waveform bars clickable)
- [ ] Loading state shows (spinner while buffering)
- [ ] Error state shows (network error, invalid URL)

**80% Completion Tracking:**
- [ ] Continuous play: 80%+ → completed ✅
- [ ] Seek forward: Check total listened (not time position)
- [ ] Seek backward: Merge overlapping segments
- [ ] Multiple seeks: Accurate total calculation
- [ ] Pause/resume: Segments preserved
- [ ] Silent completion: No modal, no toast
- [ ] Database save: track_completions record created
- [ ] Repeat listen: completion_count increments

**Sticky Player:**
- [ ] Shows when track playing
- [ ] Fixed position (above BottomNav)
- [ ] Collapsed: 60px height
- [ ] Tap to expand: 400px height
- [ ] Swipe down to collapse (mobile)
- [ ] Persists across navigation (browse while playing)
- [ ] Close button works (stops playback)

**Fullscreen Player:**
- [ ] Opens from track list
- [ ] TopBar: Title + Favourite + Close
- [ ] ContentZone: Cover + Waveform + Time
- [ ] BottomBar: Play/Pause + Volume
- [ ] Close → collapse to sticky (not stop)
- [ ] Favourite button toggles (visual + DB)

**Challenge Flow:**
- [ ] "Dnešní dýchačka" button shows current day
- [ ] Day 1 unlocks at 4:00 AM (1.3.)
- [ ] Completion unlocks next day (Day 1 → Day 2)
- [ ] Incomplete keeps locked (Day 1 not done → Day 2 locked)
- [ ] Late start: User starts at Day 1 (not calendar day)
- [ ] All 21 days completed → unlock in Akademie

---

### **UX Tests:**

**Mobile (iPhone 13 Mini, ngrok URL):**
- [ ] Touch targets ≥ 44px (tested with finger)
- [ ] Safe areas respected (no UI under notch)
- [ ] Swipe gestures work (down to minimize)
- [ ] No layout shifts (smooth animations)
- [ ] Glassmorphism renders (backdrop-filter)
- [ ] Gold glow visible (play button shadow)

**Desktop (1280px):**
- [ ] Modal centered (max-width 480px)
- [ ] Hover states work (waveform bars)
- [ ] Volume slider smooth
- [ ] Animations smooth (60fps)

**Accessibility (WCAG 2.1 AA):**
- [ ] ARIA labels on icon buttons ("Přehrát", "Pauza")
- [ ] Focus indicators visible (keyboard navigation)
- [ ] Color contrast ≥ 4.5:1 (text on Warm Black)
- [ ] Screen reader announces track changes
- [ ] Reduced motion respected (prefers-reduced-motion)

---

## 🎯 KEY DECISIONS (Finalized)

### **1. Completion UI: SILENT (No Modal) ✅**
- **Decision:** Zero distraction during playback
- **Implementation:** Silent DB save at 80% threshold
- **Settings:** "Zobrazit notifikaci po dokončení" (default: OFF, Phase 2)
- **Psychology:** Respects meditative state (alpha/theta brainwaves)

### **2. Favourite Button: TopBar (Apple Music) ✅**
- **Decision:** TopBar right side (❤️ icon, 44px)
- **Implementation:** Toggle like/unlike, save to track_favourites
- **Visual:** Filled heart = liked, outline = not liked

### **3. Výzva Unlock: Strict Sequence ✅**
- **Decision:** Day 1 → Day 2 → ... → Day 21 (no skipping)
- **Late Start:** User starts at Day 1 (not current calendar day)
- **Consistency:** One track per day (habit formation > speed)
- **Unlock:** 4:00 AM daily (cron job checks last_completed_day)

### **4. Button Label: "Dnešní dýchačka" ✅**
- **Decision:** Playful, breathing vibe, Czech slang
- **Tone:** Neformální, memorable, action-oriented
- **Context:** Dnes view primary CTA for active challenge

### **5. CDN: Bunny.net ✅**
- **Decision:** Cheaper ($0.01/GB vs Supabase $0.021/GB)
- **Scalability:** 1150 users × 21 tracks × 15 MB = 362 GB/month
- **Cost:** Bunny ~$3.6/month, Supabase ~$7.6/month (savings: $4/month)
- **No URL expiration** (vs Supabase signed URLs 99 years max)

### **6. Admin Panel: Full React ✅**
- **Decision:** Standalone React admin (no WordPress dependency)
- **Structure:** Modular (/media, /challenges, /users Phase 2)
- **WordPress:** Reference only (inspiration, not code reuse)

### **7. XP/Gamification: Phase 2 ✅**
- **Decision:** Not in MVP (focus on player + tracking)
- **Separation:** Audio ≠ Gamification (separate components)
- **Timeline:** After MVP stable (v2.44.0+)

### **8. Share Screen: Post-Challenge Only ✅**
- **Decision:** Show after 21/21 days completed (not after each track)
- **Psychology:** Rare achievement = worth sharing
- **Design:** Beautiful visual (21 days, total minutes, streak badge)
- **CTA:** Subtle ("Chceš sdílet?"), easy dismiss

---

## 📈 ANALYTICS & METRICS (Phase 2)

### **Track-Level Metrics:**
```sql
-- Most played tracks
SELECT 
  t.title,
  COUNT(tc.id) as play_count,
  AVG(tc.listen_time) as avg_listen_time
FROM tracks t
JOIN track_completions tc ON t.id = tc.track_id
GROUP BY t.id
ORDER BY play_count DESC;

-- Completion rate per track
SELECT 
  t.title,
  COUNT(DISTINCT tp.user_id) as started_users,
  COUNT(DISTINCT tc.user_id) as completed_users,
  (COUNT(DISTINCT tc.user_id)::float / COUNT(DISTINCT tp.user_id) * 100) as completion_rate
FROM tracks t
LEFT JOIN track_progress tp ON t.id = tp.track_id
LEFT JOIN track_completions tc ON t.id = tc.track_id
GROUP BY t.id;
```

### **User-Level Metrics:**
```sql
-- User stats
SELECT 
  user_id,
  COUNT(DISTINCT track_id) as tracks_completed,
  SUM(listen_time) as total_minutes,
  COUNT(DISTINCT DATE(completed_at)) as active_days
FROM track_completions
GROUP BY user_id;
```

### **Challenge Metrics:**
```sql
-- Challenge completion rate
SELECT 
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_users,
  COUNT(*) as total_users,
  (COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::float / COUNT(*) * 100) as completion_rate
FROM challenge_progress
WHERE challenge_id = '<challenge_id>';
```

---

## 🚀 IMMEDIATE NEXT ACTIONS (Start Implementation)

### **Setup (Day 0 - Tonight):**

1. **Create database migrations:**
   ```bash
   cd dechbar-app
   npx supabase migration new create_audio_player_tables
   # Paste SQL from Migration 1-3 above
   npx supabase db push
   ```

2. **Upload test audio to Bunny CDN:**
   - Sanitize filename: "ranní-dech-7min.mp3"
   - Upload via Bunny dashboard or API
   - Get URL: `https://dechbar-cdn.b-cdn.net/test/ranní-dech-7min.mp3`
   - Test URL in browser (should play)

3. **Create folder structure:**
   ```bash
   mkdir -p src/platform/components/AudioPlayer/{components,hooks}
   mkdir -p src/admin/modules/{media,challenges}
   ```

---

### **Day 1: Core Implementation (Tomorrow):**

**Morning (4h):**
- [ ] Create `types.ts` (Track, Album, AudioPlayerProps)
- [ ] Create `audioPlayerStore.ts` (Zustand)
- [ ] Create `useAudioPlayer.ts` hook (HTML5 Audio)
- [ ] Unit tests for hook (play, pause, seek)

**Afternoon (4h):**
- [ ] Create `useAudioTracking.ts` hook (80% algorithm)
- [ ] Unit tests for 80% logic (edge cases: seeks, pauses)
- [ ] Test with mock audio element

---

### **Day 2: Fullscreen Player (Tomorrow+1):**

**Morning (4h):**
- [ ] Create `FullscreenPlayer.tsx` (reuse FullscreenModal)
- [ ] TopBar: Title + Favourite + Close
- [ ] ContentZone: Cover + Waveform + Time
- [ ] BottomBar: Play/Pause + Volume

**Afternoon (4h):**
- [ ] Create `WaveformProgress.tsx` (80 bars, seekable)
- [ ] Integrate `useAudioPlayer` + `useAudioTracking`
- [ ] Test on desktop browser
- [ ] Mobile test (ngrok URL: https://cerebellar-celestine-debatingly.ngrok-free.dev)

---

### **Day 3: Sticky Player + Polish (Tomorrow+2):**

**Morning (4h):**
- [ ] Create `StickyPlayer.tsx` (collapsed 60px, expanded 400px)
- [ ] Expand/collapse animations
- [ ] Integrate Wake Lock (reuse from Session Engine)
- [ ] Fixed positioning (above BottomNav)

**Afternoon (4h):**
- [ ] Favourite button (API integration)
- [ ] Error handling (graceful failures)
- [ ] Loading states (spinner)
- [ ] Final mobile testing (iOS, Android)
- [ ] Bug fixes + polish
- [ ] **READY FOR MARKETING VIDEO** 🎬

---

## 📝 HANDOFF TO NEW AGENT (Recommended)

### **WHY New Agent?**

**PROS:**
- ✅ **Clean context** (no brainstorming history, pure spec)
- ✅ **Maximum focus** (implementation only, not design debates)
- ✅ **Strict adherence** (follows spec exactly, no creative detours)
- ✅ **Faster execution** (no decision paralysis, clear roadmap)
- ✅ **Fresh perspective** (may spot edge cases we missed)

**CONS:**
- ⚠️ **No brainstorming context** (doesn't know "why" behind decisions)
- ⚠️ **Handoff cost** (5-10 min to read spec)

**RECOMMENDATION: YES, use new agent** 🎯

**Reason:**
- This spec is **comprehensive** (100+ pages unified from GPT + Gemini)
- New agent has **everything needed** (no ambiguity)
- Current agent (me) has **large context** (165K tokens used)
- Clean slate = **faster, cleaner execution**

---

### **Handoff Instructions (for new agent):**

```markdown
# 🎵 Audio Player Implementation - Agent Onboarding

**Your Mission:**
Implement the DechBar Audio Player according to the master specification.

**Read FIRST:**
1. `/src/platform/components/AudioPlayer/SPECIFICATION.md` (this document)
2. `/docs/design-system/00_OVERVIEW.md` (design tokens reference)
3. `/src/components/shared/FullscreenModal/FullscreenModal.tsx` (reuse pattern)
4. `/src/modules/mvp0/hooks/useWakeLock.ts` (reuse hook)

**Your Task:**
- Follow SPECIFICATION.md exactly (no creative changes)
- Reuse existing patterns (FullscreenModal, Wake Lock)
- Implement 80% tracking algorithm (robust, tested)
- Test on mobile (ngrok URL provided)
- Complete in 3 days (MVP for marketing video)

**Success Criteria:**
- Audio plays on iOS Safari (autoplay works)
- 80% completion tracked (silent, background)
- Sticky player functional (collapse/expand)
- Fullscreen player polished (glassmorphism, gold accent)
- Mobile tested (iPhone, Android)

**Ask Questions:**
- If spec is unclear (before implementing)
- If edge case not covered (propose solution)
- If existing pattern conflicts (resolve before proceeding)

**Timeline:**
- Day 1: Hooks + Store
- Day 2: Fullscreen Player
- Day 3: Sticky Player + Polish

**Let's build! 🚀**
```

---

## ✅ SPECIFICATION COMPLETE

**This document defines:**
- ✅ Component architecture (files, hierarchy, props)
- ✅ Database schema (6 tables, RLS policies, migrations)
- ✅ API design (Supabase queries, UPSERT patterns)
- ✅ 80% completion algorithm (robust, handles seeks/pauses)
- ✅ UX flows (fullscreen, sticky, výzva 21 days)
- ✅ Visual design (colors, typography, glassmorphism, animations)
- ✅ Mobile considerations (iOS Safari, Android, wake lock, safe areas)
- ✅ Implementation roadmap (3 days MVP, 6 weeks full system)
- ✅ Testing strategy (unit, integration, E2E, mobile checklist)
- ✅ Access control (FREE, PREMIUM, VÝZVA tiers)
- ✅ Admin panel structure (media, challenges, future modules)

**Ready for:**
- 🤖 **New AI agent** (clean context, pure implementation) ← RECOMMENDED
- 👨‍💻 Human developer (comprehensive technical spec)
- 📊 Product review (clear scope, decisions documented)

**Sources:**
- 📄 **Gemini UX Research** (17 pages): Bio-Pilot paradigm, Calm Technology, competitor analysis
- 📄 **GPT Technical Spec** (9 pages): Component architecture, 80% algorithm, database schema
- 🧠 **Brainstorming Session** (25+ messages): Requirements clarification, edge cases, design decisions

---

**Version:** v2.43.0 (Master Specification)  
**Status:** 📋 Design Complete → 🚀 Ready for Implementation  
**Next:** Hand to new agent with `/src/platform/components/AudioPlayer/SPECIFICATION.md`

---

*"The goal is to build an app that users are happy to close their eyes to."* - Gemini UX Research

*Unified insights from GPT (technical precision) + Gemini (UX psychology) = World-class audio player specification.*
