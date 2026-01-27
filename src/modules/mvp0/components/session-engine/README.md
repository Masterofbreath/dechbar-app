# SessionEngineModal Component

## Overview
Orchestrator component for multi-phase breathing exercises. Manages state machine, audio cues, and sub-component rendering.

## Usage

```tsx
import { SessionEngineModal } from '@/modules/mvp0/components';

<SessionEngineModal
  exercise={exerciseFromSupabase}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
/>
```

## Props

```typescript
interface SessionEngineModalProps {
  exercise: Exercise;      // Exercise data from Supabase
  isOpen?: boolean;         // Default: true
  onClose: () => void;      // Callback when modal closes
}
```

## State Machine

```
idle ────> countdown ────> active ────> completed ────> onClose()
             (5s)          (N phases)     (survey)
                              │
                              └──> abandoned ────> onClose()
                                  (confirm modal)
```

## Sub-Components

### SessionStartScreen
- Shows exercise metadata (duration, phases, difficulty)
- Primary CTA: "Začít cvičení"
- Location: `components/SessionStartScreen.tsx`

### SessionCountdown
- 5-4-3-2-1 countdown with breathing tip
- Audio bell on each second
- Location: `components/SessionCountdown.tsx`

### SessionActive
- Real-time breathing circle (RAF animation)
- Phase timer + progress bar
- Phase indicator (FÁZE 3/7)
- Next phase preview
- Location: `components/SessionActive.tsx`

### SessionCompleted
- **DifficultyCheck** - 3 text buttons (no emoji)
- **MoodSlider** - Horizontal gradient slider
- **NotesField** - Collapsible textarea
- Actions: Save, Share, Repeat
- Location: `components/SessionCompleted/`

## Custom Hooks

### useBreathingAnimation()
Returns: `{ circleRef, animateBreathingCircle, cleanup }`

Manages RAF-based breathing circle scaling (1.0 ↔ 1.5).

**Location:** `hooks/useBreathingAnimation.ts`

### useAudioCues()
Returns: `{ playBell }`

Preloads and plays bell audio on phase transitions.

**Location:** `hooks/useAudioCues.ts`

## Files

```
session-engine/
├── SessionEngineModal.tsx          # Main orchestrator
├── components/
│   ├── SessionStartScreen.tsx
│   ├── SessionCountdown.tsx
│   ├── SessionActive.tsx
│   └── SessionCompleted/
│       ├── SessionCompleted.tsx
│       ├── DifficultyCheck.tsx
│       ├── MoodSlider.tsx
│       └── NotesField.tsx
├── hooks/
│   ├── useBreathingAnimation.ts
│   └── useAudioCues.ts
├── types.ts                        # Local types
├── index.ts                        # Public exports
└── README.md (this file)
```

## Key Features

### 1. Breathing Circle Animation
- RequestAnimationFrame (60fps)
- Cubic-bezier easing
- Teal color variants (light/standard/dark)
- Subtle gold pulse on phase change

### 2. Mobile Immersive Mode
- Hides top/bottom nav on mobile (<768px)
- Fullscreen modal (z-index 10001)
- Body class: `session-active`

### 3. UX Improvements (2026-01-20)
- Reduced glow intensity (calmer effect)
- Tips only in countdown (not active)
- Text-only difficulty (no emoji)
- Horizontal mood slider (space-saving)
- Collapsible notes field

## Styling

**CSS File:** `src/styles/components/session-engine-modal.css`

**Key Classes:**
- `.session-engine-modal` - Main modal container
- `.breathing-circle` - Animated breathing circle
- `.breathing-circle--inhale/exhale/hold` - Color variants
- `.pulse-gold` - Gold pulse animation
- `.mood-slider` - Horizontal gradient slider
- `.session-notes__toggle` - Collapsible notes button

## State Management

**Local State (useState):**
- `sessionState` - State machine state
- `currentPhaseIndex` - Current phase index
- `phaseTimeRemaining` - Countdown timer
- `difficultyRating` - User rating (1-3)
- `moodAfter` - User mood (MoodType)
- `notes` - User notes (max 150 chars)

**Effects (useEffect):**
- Phase runner - Manages breathing cycles and timer
- Progress calculator - Updates progress bar
- Tip rotator - Rotates tips (removed from active state)
- Mobile nav hider - Adds `session-active` class

## Integration

### Supabase
```typescript
await completeSession.mutateAsync({
  exercise_id: exercise.id,
  started_at: sessionStartTime,
  completed_at: new Date(),
  difficulty_rating: difficultyRating,
  mood_after: moodAfter,
  notes: notes.trim(),
});
```

### Audio
```typescript
const audio = new Audio('/sounds/bell.mp3');
audio.volume = 0.5;
await audio.play();
```

### History Display
- Difficulty badge: "Snadné" / "Tak akorát" / "Náročné"
- Notes badge: Click to show tooltip
- Location: `ExerciseList.tsx`

## Development

### Adding New Phase Type
1. Update `PhaseType` in `types/exercises.ts`
2. Handle in breathing state logic
3. Add CSS class for color variant

### Modifying Animation
1. Edit `useBreathingAnimation.ts`
2. Adjust easing function or scale values
3. Test at 60fps

### Changing Mood Options
1. Update `MOOD_OPTIONS` in `MoodSlider.tsx`
2. Update `MoodType` in `types/exercises.ts`
3. Update Supabase enum
4. Adjust CSS gradient colors

## Testing

```bash
# Run component tests
npm run test session-engine

# Visual regression tests
npm run test:visual session-engine

# E2E tests
npm run test:e2e session-engine
```

## Related Documentation
- [Feature Spec](../../../../docs/features/SESSION_ENGINE_SPEC.md)
- [Maintenance Guide](../../../../docs/development/SESSION_ENGINE_MAINTENANCE.md)
- [Visual Brand Book](../../../../docs/brand/VISUAL_BRAND_BOOK.md)
- [Tone of Voice](../../../../docs/design-system/TONE_OF_VOICE.md)

---

## Mobile & PWA Behavior (v2.41.6+)

### Fullscreen Immersive Mode

Na mobile (≤768px) se Session Engine zobrazuje jako **fullscreen modal** (bez top/bottom nav):

```css
@media (max-width: 768px) {
  .session-engine-modal__content {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 10002 !important;
  }
}
```

**Výhody:**
- ✅ Immersive focus (žádné rozptýlení)
- ✅ Maximální prostor pro breathing circle
- ✅ Plynulá PWA experience

### iOS Safe Area Padding

**Symetrický padding** pro TRUE vertical centering:

```css
.session-states-wrapper {
  padding: 
    max(34px, env(safe-area-inset-top))      /* ✅ Top */
    max(20px, env(safe-area-inset-right))
    max(34px, env(safe-area-inset-bottom))   /* ✅ Bottom - SHODNÝ! */
    max(20px, env(safe-area-inset-left));
}
```

**Proč symetrický?**
- iOS: top ~47px (notch), bottom ~34px (home indicator)
- Asymetrie → Circle posunutý níže
- **Fix:** Použít max() hodnotu (34px+) pro obě strany
- **Výsledek:** Breathing circle TRUE centered ✅

### Breathing Circle Centering

```css
@media (max-width: 768px) {
  .breathing-circle-container {
    position: fixed !important;
    top: 50vh !important;
    left: 50vw !important;
    transform: translate(-50%, -50%) !important;
    z-index: 2 !important;
  }
}
```

**Fixed position** zajišťuje:
- ✅ Centrování relativně k viewportu (ne parent)
- ✅ Konzistence s KP measurement
- ✅ Respektuje safe area padding

### CloseButton Positioning

Centralizováno v `fullscreen-modal-mobile.css`:

```css
.session-engine-modal__content .close-button {
  position: fixed !important;
  top: max(16px, env(safe-area-inset-top)) !important;
  right: max(16px, env(safe-area-inset-right)) !important;
  z-index: 20 !important;
}
```

### Testing on Mobile

**Ngrok Workflow:**
```bash
npm run dev        # Port 5173
ngrok http 5173    # Získej public URL
# Otevři na iPhone → Test protokol
```

**Test Checklist:**
1. ✅ Fullscreen (no top/bottom nav)?
2. ✅ Breathing circle centered?
3. ✅ CloseButton accessible (top-right)?
4. ✅ Safe areas respektovány?
5. ✅ Phase transitions smooth?
6. ✅ Audio cues working?

---

## Migration Notes

### From Old Structure (2026-01-20)
- **Before:** Single 811-line `SessionEngineModal.tsx`
- **After:** Modular structure with sub-components
- **Import path changed:** From `./SessionEngineModal` to `./session-engine`
- **All functionality preserved**
- **New features:** Mood slider, collapsible notes, difficulty badges

### Breaking Changes
None - all exports remain the same.

## License
DechBar Platform - Internal Use Only
