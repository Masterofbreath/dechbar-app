# Session Engine - Maintenance Guide

## Common Tasks

### Modify Breathing Circle Colors
**Location:** `src/styles/components/session-engine-modal.css` lines 419-442

Change glow intensity or color variants:
```css
.breathing-circle--inhale {
  box-shadow: 
    0 0 20px rgba(106, 219, 224, 0.15), /* Adjust opacity here */
}
```

### Add New Phase Type
1. Update `PhaseType` in `src/modules/mvp0/types/exercises.ts`
2. Handle in `SessionEngineModal.tsx` breathing state logic
3. Add corresponding CSS class in `session-engine-modal.css`

### Change Animation Easing
**Location:** `src/modules/mvp0/components/session-engine/hooks/useBreathingAnimation.ts`

Modify cubic-bezier function:
```typescript
const easeInOutCubic = (t: number): number => {
  // Change formula for different easing
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
```

### Add New Mood Option
**Location:** `src/modules/mvp0/components/session-engine/components/SessionCompleted/MoodSlider.tsx`

Update `MOOD_OPTIONS` array:
```typescript
const MOOD_OPTIONS = [
  { value: 'new_mood', emoji: '🎯', label: 'Nový stav' },
  // ... existing options
];
```

Also update:
1. `MoodType` in `types/exercises.ts`
2. Database enum `mood_type` in Supabase
3. CSS gradient in `session-engine-modal.css`

### Change Countdown Duration
**Location:** `src/modules/mvp0/components/session-engine/SessionEngineModal.tsx`

Modify countdown logic:
```typescript
const startCountdown = useCallback(() => {
  setCountdownNumber(3); // Change from 5 to 3 for shorter countdown
  let count = 3;
  // ...
}, []);
```

### Adjust Mobile Z-index
**Location:** `src/styles/components/session-engine-modal.css` (end of file)

```css
body.session-active .session-engine-modal {
  z-index: 10001; /* Increase if needed */
}
```

### Modify Mood Slider Gradient
**Location:** `src/styles/components/session-engine-modal.css`

```css
.mood-slider__input {
  background: linear-gradient(90deg, 
    #EF4444 0%,    /* Red - adjust colors here */
    #F59E0B 25%,
    #A0A0A0 50%,
    #6ADBE0 75%,
    #10B981 100%
  );
}
```

## Testing Checklist

### Functional Tests
- [ ] Start → Countdown → Active → Completed flow
- [ ] Exit during active session (confirm modal)
- [ ] Audio cues play on phase transitions
- [ ] Progress bar animates correctly
- [ ] Mood slider saves correct value
- [ ] Notes field expands/collapses
- [ ] Session saves to Supabase
- [ ] Difficulty and notes badges appear in history
- [ ] Notes tooltip shows/hides on click

### Visual Tests
- [ ] Breathing circle animates smoothly (60fps)
- [ ] Colors match brand (teal variants, reduced glow)
- [ ] Gold pulse is subtle (not jarring)
- [ ] Mobile: Nav hidden during session
- [ ] Modal is fullscreen on mobile
- [ ] Text is readable (WCAG AA)
- [ ] Tips only show during countdown, not active

### UX Tests
- [ ] Difficulty shows text only (no emoji)
- [ ] Mood slider is horizontal with gradient
- [ ] Notes field starts collapsed
- [ ] Slider thumb is gold and responsive
- [ ] Badges display correctly in history

### Performance Tests
- [ ] RAF animation doesn't drop frames
- [ ] No memory leaks (cleanup on unmount)
- [ ] Audio preloads without delay
- [ ] Modal opens instantly (<100ms)
- [ ] Component lazy loading works

### Browser Compatibility
- [ ] Safari (iOS 15+)
- [ ] Chrome (desktop + Android)
- [ ] Firefox (desktop)
- [ ] Range slider works on all browsers

## Troubleshooting

### Issue: Breathing circle doesn't animate
**Cause:** RAF not running or circleRef is null
**Fix:** Check console for errors, verify useRef is attached to DOM element

### Issue: Audio doesn't play
**Cause:** Autoplay policy (requires user gesture)
**Fix:** Audio will play after user clicks "Začít cvičení" (initial gesture)

### Issue: Modal z-index conflict
**Cause:** Another component has higher z-index
**Fix:** Session modal uses z-index 10001 (highest in app)

### Issue: State doesn't reset after completion
**Cause:** Cleanup not called in useEffect
**Fix:** Check cleanup in `SessionEngineModal.tsx` useEffect dependencies

### Issue: Nav still visible on mobile
**Cause:** `session-active` class not added to body
**Fix:** Check useEffect in SessionEngineModal that adds/removes class

### Issue: Mood slider doesn't work
**Cause:** Browser doesn't support range input styling
**Fix:** Check -webkit-slider-thumb and -moz-range-thumb styles

### Issue: Notes tooltip doesn't show
**Cause:** Note badge click handler not firing
**Fix:** Check onClick handler and selectedNoteId state

### Issue: Component not found error
**Cause:** Import path incorrect after refactor
**Fix:** Import from `@/modules/mvp0/components/session-engine` (not old path)

## Performance Optimization

### RAF Animation
- Uses `requestAnimationFrame` for 60fps smooth animation
- Cleanup prevents memory leaks
- Cancel previous animation before starting new one

### State Management
- Local state (no global store overhead)
- useCallback for stable function references
- useRef for values that don't need re-renders

### CSS Transitions
- Hardware-accelerated transforms
- Will-change hint for breathing circle
- Reduced animations on `prefers-reduced-motion`

## Code Quality

### Component Size Guidelines
- Main orchestrator: <400 lines
- Sub-components: <150 lines each
- Hooks: <100 lines each
- CSS: Modular, scoped to component

### TypeScript
- All props typed with interfaces
- Strict null checks
- No `any` types

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators visible
- Reduced motion support
