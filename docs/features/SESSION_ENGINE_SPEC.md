# Session Engine - Feature Specification

## Purpose
Multi-phase breathing exercise engine with real-time visual feedback, audio cues, and completion tracking.

## Architecture

### Component Structure
- **SessionEngineModal** - Main orchestrator (state machine)
- **SessionStartScreen** - Exercise overview, "Začít" CTA
- **SessionCountdown** - 5-4-3-2-1 preparation phase
- **SessionActive** - Real-time breathing guidance
- **SessionCompleted** - Post-exercise survey (difficulty, mood, notes)

### Custom Hooks
- **useBreathingAnimation** - RAF-based circle scaling (1.0 → 1.5)
- **useAudioCues** - Bell audio on phase transitions

### State Machine
```
idle → countdown (5s) → active (N phases) → completed
                            ↓
                        abandoned (exit confirmation)
```

## Key Features

### 1. Breathing Circle Animation
- **Method:** requestAnimationFrame (RAF) + cubic-bezier easing
- **Scale:** 1.0 (exhale) ↔ 1.5 (inhale)
- **Colors:** Teal gradient (light/standard/dark)
- **Gold Pulse:** Subtle flash on phase change (dramatically reduced intensity)

### 2. Phase Management
- Multi-phase support (1-7+ phases)
- Phase indicator: "FÁZE 3/7"
- Next phase preview: "Další: Stabilizace"
- Gold progress bar at bottom

### 3. Audio Feedback
- Bell cue on phase transitions
- Countdown beeps (5-4-3-2-1)
- Preloaded audio (Web Audio API ready for MVP2)

### 4. Completion Survey
- **Difficulty:** Snadné / Tak akorát / Náročné (text only, no emoji)
- **Mood:** Horizontal slider (😰 → ⚡) with gradient
- **Notes:** Collapsible textarea (max 150 chars)

## Integration Points

### Supabase
- **Table:** `exercise_sessions`
- **Mutation:** `useCompleteSession()`
- **Fields:** `difficulty_rating`, `mood_after`, `notes`

### Audio Assets
- **Path:** `/public/sounds/bell.mp3`
- **Format:** MP3, 0.5 volume
- **Fallback:** Silent (no error thrown)

### History Display
- **Component:** `ExerciseList.tsx`
- **Badges:** Duration, Status, Mood, Difficulty, Notes
- **Notes Tooltip:** Click badge to expand

## Design Principles

### Visual Brand Book Compliance
- **Calm by Default:** Subtle animations, dark colors (#121212)
- **Less is More:** No tips during active breathing
- **One Strong CTA:** Primary action always clear
- **Accessible Contrast:** WCAG AA compliant

### Mobile-First
- Fullscreen immersive (hide nav on <768px)
- Safe area insets respected
- Touch-friendly targets (min 44x44px)

## UX Improvements (2026-01-20)

### Breathing Circle Colors
- **Reduced glow intensity:** Opacity reduced from 0.4 → 0.15 for calmer effect
- **Gold pulse:** Dramatically reduced (0.4 → 0.08) for subtle hint

### Tips Timing
- **Countdown only:** Tips shown only during countdown, not during active breathing
- **Reason:** Reduce cognitive load during exercise

### Mobile Immersive Mode
- **Hidden nav:** Top and bottom navigation hidden on mobile (<768px)
- **Z-index:** Modal z-index increased to 10001 for fullscreen
- **Body class:** `session-active` added to body when modal open

### Difficulty Check
- **Text only:** Removed star emoji for cleaner UX
- **Labels:** "Snadné", "Tak akorát", "Náročné"

### Mood Slider
- **Horizontal gradient:** Red (stressed) → Green (energized)
- **Space-saving:** 2 rows → 1 row
- **Gold thumb:** Matches brand accent color

### Notes Field
- **Collapsible:** Hidden by default, click to expand
- **Progressive disclosure:** Saves vertical space
- **Space saved:** 136px → 48px (collapsed)

## Modular Architecture

### File Structure
```
session-engine/
├── SessionEngineModal.tsx          # Main orchestrator (~350 lines)
├── components/
│   ├── SessionStartScreen.tsx      # Idle state (~70 lines)
│   ├── SessionCountdown.tsx        # Countdown (~30 lines)
│   ├── SessionActive.tsx           # Active session (~90 lines)
│   └── SessionCompleted/
│       ├── SessionCompleted.tsx    # Completion wrapper (~80 lines)
│       ├── DifficultyCheck.tsx     # Difficulty rating (~45 lines)
│       ├── MoodSlider.tsx          # Mood slider (~80 lines)
│       └── NotesField.tsx          # Collapsible notes (~50 lines)
├── hooks/
│   ├── useAudioCues.ts             # Bell audio (~35 lines)
│   └── useBreathingAnimation.ts    # RAF animation (~60 lines)
├── types.ts                        # Local types
└── index.ts                        # Public exports
```

**Benefits:**
- Each component < 150 lines
- Clear separation of concerns
- Easy to test and maintain
- API/tokens communication pattern

## Future Enhancements (MVP2+)
- Haptic feedback on phase changes
- Real-time breath detection (microphone)
- Social sharing with visual preset (Canvas API)
- Achievement unlocks
- Personalized breathing rhythm (AI adaptation)
