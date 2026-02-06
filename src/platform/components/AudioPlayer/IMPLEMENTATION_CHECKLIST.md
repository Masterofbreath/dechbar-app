# 🎯 AUDIO PLAYER - Implementation Checklist

**For:** New AI Agent  
**Goal:** Implement AudioPlayer v2.43.0 in 3 days  
**Spec:** [SPECIFICATION.md](./SPECIFICATION.md)

---

## 📚 BEFORE YOU START (15 min)

### **Required Reading:**
- [ ] `/src/platform/components/AudioPlayer/SPECIFICATION.md` (master spec)
- [ ] `/docs/design-system/00_OVERVIEW.md` (design tokens)
- [ ] `/src/components/shared/FullscreenModal/FullscreenModal.tsx` (reuse pattern)
- [ ] `/src/modules/mvp0/hooks/useWakeLock.ts` (reuse hook)
- [ ] `/src/modules/mvp0/components/session-engine/SessionEngineModal.tsx` (reference)

### **Existing Patterns to Reuse:**
- ✅ FullscreenModal (TopBar, ContentZone, BottomBar)
- ✅ useWakeLock (screen stays on)
- ✅ Design tokens (colors, spacing, shadows)
- ✅ State machine pattern (idle → active → completed)

---

## 🚀 DAY 1: CORE FOUNDATION (8h)

### **Morning (4h) - Hooks & Store:**

- [ ] **1.1 Implement `types.ts`** (ALREADY DONE ✅)
  - Track, Album, AudioPlayerState interfaces
  - All TypeScript types defined

- [ ] **1.2 Implement `store.ts` (Zustand)**
  - Global audio player state
  - Actions: play, pause, seek, setVolume, toggleMute
  - Test: Store updates correctly

- [ ] **1.3 Implement `hooks/useAudioPlayer.ts`**
  - HTML5 Audio element management
  - Play/pause/seek controls
  - Event listeners (timeupdate, ended, error)
  - Cleanup on unmount (prevent memory leaks)
  - Test: Audio plays, pauses, seeks

- [ ] **1.4 Unit Tests (useAudioPlayer)**
  - Test play() triggers audio.play()
  - Test pause() triggers audio.pause()
  - Test seek() updates audio.currentTime
  - Test cleanup on unmount

---

### **Afternoon (4h) - 80% Tracking:**

- [ ] **1.5 Implement `hooks/useAudioTracking.ts`**
  - Track listened segments: Array<[start, end]>
  - Handle seeks (ignore time jumps > 2s)
  - Merge overlapping intervals (mergeIntervals function)
  - Calculate total listened time
  - Check 80% threshold
  - Silent completion (background DB save)

- [ ] **1.6 Unit Tests (80% Algorithm)** ⚠️ CRITICAL
  - Test continuous play: [0, 240] → 80% of 300s → completed ✅
  - Test seek forward: [0, 50], [100, 150] → 100s/300s → 33% → not completed ❌
  - Test seek backward: [0, 100], [50, 200] → merge [0, 200] → 67% → not completed ❌
  - Test overlapping segments: [0, 50], [30, 80] → merge [0, 80] → 80s (no double-count)
  - Test multiple seeks: Various scenarios
  - Test pause/resume: Segments preserved

- [ ] **1.7 Database Setup**
  - Create migration: `001_create_audio_player_tables.sql`
  - Paste SQL from SPECIFICATION.md (tracks, albums, progress, completions)
  - Run: `npx supabase db push`
  - Verify: Tables created, RLS enabled

**End of Day 1:**
- ✅ Hooks working (audio plays, 80% tracks)
- ✅ Unit tests passing (80% algorithm robust)
- ✅ Database ready (tables, RLS)

---

## 🎨 DAY 2: FULLSCREEN PLAYER (8h)

### **Morning (4h) - UI Structure:**

- [ ] **2.1 Create `components/PlayPauseButton.tsx`**
  - Large gold button (48px desktop, 44px mobile)
  - States: playing (⏸), paused (▶️), loading (spinner)
  - Animation: scale(0.95) on active
  - Gold glow shadow (--shadow-gold)

- [ ] **2.2 Create `components/WaveformProgress.tsx`**
  - 80 bars (div elements, flex layout)
  - Height based on peak value (0-1 range)
  - Colors: Gold played, Teal unplayed
  - Clickable (onClick → seek to time)
  - Hover: scaleY(1.15) animation

- [ ] **2.3 Create `components/TimeDisplay.tsx`**
  - Format: "2:34 / 5:00" (MM:SS)
  - Mono font (SF Mono or Courier)
  - Small size (14px)

- [ ] **2.4 Create `components/FavouriteButton.tsx`**
  - Heart icon ❤️ (44px touch target)
  - States: liked (filled), not liked (outline)
  - Toggle on click
  - API: Save to track_favourites (like/unlike)

---

### **Afternoon (4h) - Fullscreen Assembly:**

- [ ] **2.5 Create `FullscreenPlayer.tsx`**
  - Reuse FullscreenModal component
  - TopBar: Title (centered) + Favourite (right) + Close (right)
  - ContentZone: Cover art (200x200) + Waveform + Time
  - BottomBar: PlayPauseButton + VolumeControl
  - Integrate useAudioPlayer + useAudioTracking hooks
  - Integrate useWakeLock (reuse from Session Engine)

- [ ] **2.6 Create `components/VolumeControl.tsx`**
  - Desktop: Slider (range input, 0-1)
  - Mobile: Mute button (🔇/🔊 toggle)
  - Media query: @media (max-width: 768px)

- [ ] **2.7 Test Fullscreen Player**
  - Open player (track from test data)
  - Play audio (Bunny CDN URL)
  - Seek on waveform (click bar)
  - Favourite toggle (check DB)
  - Close button (stop playback)
  - Mobile test (ngrok URL)

**End of Day 2:**
- ✅ Fullscreen player working
- ✅ Audio plays, seeks, pauses
- ✅ Waveform interactive
- ✅ Mobile tested (iOS Safari)

---

## 📱 DAY 3: STICKY PLAYER + POLISH (8h)

### **Morning (4h) - Sticky Implementation:**

- [ ] **3.1 Create `StickyPlayer.tsx`**
  - Fixed position: bottom 60px (above BottomNav)
  - Z-index: 998 (below modals, above BottomNav 1000)
  - Collapsed state (60px):
    - PlayPauseButton (44px)
    - CoverThumbnail (40x40px)
    - TrackTitle (truncated, 1 line)
    - TimeDisplay (compact, "2:34/5:00")
    - ThinProgress (2px gold bar, 100% width)
  - Expanded state (400px):
    - Same as FullscreenPlayer (reuse components)
  - Tap anywhere → expand
  - Swipe down → collapse (mobile gesture)

- [ ] **3.2 Expand/Collapse Animations**
  - slideUp: 60px → 400px (300ms cubic-bezier)
  - Smooth transition (no jank)
  - Shared-element animation (cover art morph)

- [ ] **3.3 Integrate into AppLayout**
  - Add StickyPlayer to AppLayout.tsx
  - Conditional render: {currentTrack && mode === 'sticky'}
  - Z-index hierarchy: Sticky (998) < BottomNav (1000) < Modals (10000)

---

### **Afternoon (4h) - Polish + Testing:**

- [ ] **3.4 Error Handling**
  - Audio failed to load → show error message
  - Network error → retry button
  - Invalid URL → fallback message
  - Graceful degradation (no crash)

- [ ] **3.5 Loading States**
  - Buffering spinner (while audio loads)
  - Skeleton UI (before metadata loaded)
  - Progress bar disabled until loaded

- [ ] **3.6 Mobile Testing (CRITICAL)**
  - iOS Safari (ngrok URL):
    - [ ] Audio plays (autoplay workaround works)
    - [ ] Continues when screen locks
    - [ ] Wake Lock keeps screen on
    - [ ] Lock screen controls (play/pause)
    - [ ] Safe areas respected (notch)
    - [ ] Touch targets ≥ 44px
    - [ ] Swipe down to minimize
  - Android Chrome:
    - [ ] Background audio works
    - [ ] Media Session API
    - [ ] Touch gestures

- [ ] **3.7 Final Polish**
  - Animations smooth (60fps)
  - No console errors
  - No memory leaks (audio cleanup)
  - Glassmorphism renders correctly
  - Gold glow on play button
  - Waveform hover effects

- [ ] **3.8 Bug Fixes**
  - Fix any issues from testing
  - Edge cases (rapid seeks, pause/play spam)
  - Cross-browser testing

**End of Day 3:**
- ✅ **MVP COMPLETE**
- ✅ Sticky player functional
- ✅ Mobile tested (iOS, Android)
- ✅ Ready for marketing video 🎬

---

## ✅ DEFINITION OF DONE (MVP)

### **Functional Requirements:**
- [ ] Audio plays on desktop (Chrome, Firefox, Safari)
- [ ] Audio plays on iOS Safari (autoplay restriction bypassed)
- [ ] Audio plays on Android Chrome
- [ ] Audio continues when screen locks (Capacitor + Wake Lock)
- [ ] 80% tracking works (tested with seeks/pauses)
- [ ] Sticky player shows while browsing (fixed position)
- [ ] Favourite button toggles (saves to DB, visual feedback)
- [ ] Fullscreen ↔ Sticky transitions smooth
- [ ] Loading states (spinner while buffering)
- [ ] Error handling (graceful failure)

### **UX Requirements:**
- [ ] Zero completion modals (silent tracking)
- [ ] Smooth animations (expand/collapse, play scale)
- [ ] Touch targets ≥ 44px (WCAG AA)
- [ ] Safe areas respected (iOS notch, Android gesture bar)
- [ ] Warm Black background (#121212)
- [ ] Gold accent (play button, progress bar)
- [ ] Glassmorphism (sticky player blur)

### **Technical Requirements:**
- [ ] Database schema created (6 tables, RLS enabled)
- [ ] API queries working (progress save, completion, favourite)
- [ ] Mobile tested (iPhone, Android, ngrok)
- [ ] No memory leaks (audio cleanup)
- [ ] TypeScript strict (no `any` types)
- [ ] Unit tests passing (80% algorithm)

### **Marketing Video Requirements:**
- [ ] Demo-ready (smooth playback, no bugs)
- [ ] "Pusť a dýchej" workflow clear
- [ ] Sticky player visible (multitasking demo)
- [ ] Premium feel (glassmorphism, animations)

---

## 🚨 CRITICAL GOTCHAS (Read Before Implementing!)

### **1. Audio Element Cleanup (Memory Leak!)**
```typescript
// ALWAYS cleanup on unmount
useEffect(() => {
  const audio = new Audio();
  
  return () => {
    audio.pause();       // ✅ Stop
    audio.src = '';      // ✅ Clear source
    audio.load();        // ✅ Reset
    audioRef.current = null; // ✅ Clear ref
  };
}, [track?.id]);
```

### **2. iOS Safari Autoplay Restriction**
```typescript
// ✅ DO: Direct user gesture
<button onClick={async () => {
  await audio.play(); // Synchronous user action
}}>

// ❌ DON'T: Async callback (blocked!)
<button onClick={() => {
  setTimeout(() => audio.play(), 100); // Blocked by Safari
}}>
```

### **3. 80% Algorithm - Merge Overlapping!**
```typescript
// User listens [0-50s], then [30-80s]
// Total is NOT 50s + 50s = 100s (double-counted!)
// Total IS merge([0-50], [30-80]) = [0-80] = 80s ✅

// MUST merge overlapping intervals!
```

### **4. Wake Lock - Reuse Existing Hook**
```typescript
// DON'T reimplement Wake Lock!
// REUSE: src/modules/mvp0/hooks/useWakeLock.ts

import { useWakeLock } from '@/modules/mvp0/hooks/useWakeLock';
```

### **5. Z-index Hierarchy**
```css
/* CRITICAL: Don't break z-index layers */
.bottom-nav { z-index: 1000; }        /* Existing */
.sticky-player { z-index: 998; }      /* NEW (below BottomNav) */
.fullscreen-modal { z-index: 10000; } /* Existing (above all) */
```

---

## 🎯 SUCCESS CRITERIA CHECKLIST

Before marking as "DONE", verify:

### **Desktop (1280px Chrome):**
- [ ] Player opens (fullscreen modal)
- [ ] Audio plays (no errors)
- [ ] Waveform bars clickable (seek works)
- [ ] Volume slider smooth
- [ ] Favourite button toggles
- [ ] Close → collapse to sticky
- [ ] Sticky player visible
- [ ] Tap sticky → expand to fullscreen
- [ ] Animations smooth (60fps)

### **Mobile (iPhone 13, ngrok):**
- [ ] Audio plays (autoplay workaround)
- [ ] Continues when screen locks
- [ ] Wake Lock active (screen stays on)
- [ ] Touch targets ≥ 44px (tested with finger)
- [ ] Swipe down to minimize
- [ ] Safe areas (no UI under notch)
- [ ] Glassmorphism renders

### **Database:**
- [ ] track_progress saves (every 10s)
- [ ] track_completions saves (at 80%)
- [ ] track_favourites toggles
- [ ] RLS policies work (user sees only own data)

### **Testing:**
- [ ] Unit tests passing (80% algorithm)
- [ ] No console errors
- [ ] No memory leaks (audio cleanup)
- [ ] Works offline (Phase 2)

---

## 📞 WHEN TO ASK FOR HELP

**Ask questions if:**
- ✅ Spec is unclear (before implementing)
- ✅ Edge case not covered (propose solution)
- ✅ Existing pattern conflicts (resolve first)
- ✅ Mobile testing fails (iOS Safari issues)
- ✅ 80% algorithm doesn't work (debug logic)

**Don't ask if:**
- ❌ Spec already answers (read SPECIFICATION.md fully)
- ❌ Design decision (spec is final)
- ❌ "Should I add feature X?" (stick to MVP scope)

---

## 🎯 FINAL CHECKLIST (Before Handoff)

- [ ] All code committed (git commit -m "feat: Audio Player MVP v2.43.0")
- [ ] README.md updated (usage examples)
- [ ] Tests passing (npm run test)
- [ ] Mobile tested (screenshot from iPhone)
- [ ] No TypeScript errors (npm run typecheck)
- [ ] No linter errors (npm run lint)
- [ ] Marketing video ready (demo-able)

---

**Good luck! You have everything you need in SPECIFICATION.md** 🚀

**Questions? Check SPECIFICATION.md first, then ask.** 💪

---

**Timeline:** 3 days  
**Status:** 📋 Ready to start  
**Next:** Read SPECIFICATION.md → Implement Day 1 tasks
