# 🤖 AUDIO PLAYER - Handoff to New Agent

**Date:** 2026-02-04  
**From:** Session Engine UX Specialist Agent  
**To:** Audio Player Implementation Agent  
**Goal:** Implement AudioPlayer v2.43.0 MVP in 3 days

---

## 🎯 WHAT YOU'RE BUILDING

**DechBar Audio Player** - Profesionální přehrávač pro guided breathing exercises.

**Core Feature:**
- "Pusť a nech běžet" (hands-free, eyes-closed)
- Zero distraction (no completion modals)
- 80% completion tracking (silent, background)
- Apple Premium Style (glassmorphism, Warm Black, gold accent)

**Use Case:**
- Březnová Dechová Výzva (21 days, 1150+ users)
- Audio-guided breathing (voice + ambient music)
- Strict sequence unlock (Day 1 → 2 → ... → 21)

---

## 📚 YOUR DOCUMENTATION (Everything You Need)

### **1. MASTER SPECIFICATION (100+ pages) ⭐ START HERE**

**Location:** `/src/platform/components/AudioPlayer/SPECIFICATION.md`

**Contains:**
- Complete component architecture
- Database schema (SQL migrations)
- 80% completion algorithm (with edge cases)
- API design (Supabase queries)
- UX flows (fullscreen, sticky, výzva)
- Visual design (colors, spacing, animations)
- Mobile considerations (iOS, Android)
- Implementation roadmap (3 days MVP)
- Testing strategy

**Read this FIRST.** Everything is documented.

---

### **2. IMPLEMENTATION CHECKLIST (3-day plan)**

**Location:** `/src/platform/components/AudioPlayer/IMPLEMENTATION_CHECKLIST.md`

**Contains:**
- Day-by-day tasks (8h per day)
- Morning/afternoon breakdown
- Unit test requirements
- Critical gotchas (memory leaks, iOS autoplay)
- Success criteria checklist

**Follow this for daily progress.**

---

### **3. QUICK START README**

**Location:** `/src/platform/components/AudioPlayer/README.md`

**Contains:**
- Quick start examples
- API reference (props, hooks)
- Component usage
- Testing commands

---

### **4. EXISTING CODE TO REUSE**

**Patterns already implemented:**

**FullscreenModal (reuse!):**
- Location: `/src/components/shared/FullscreenModal/FullscreenModal.tsx`
- Pattern: TopBar + ContentZone + BottomBar
- Already responsive (desktop modal, mobile fullscreen)
- **DON'T reinvent, REUSE this!**

**useWakeLock (reuse!):**
- Location: `/src/modules/mvp0/hooks/useWakeLock.ts`
- Already implemented in Session Engine
- Keeps screen on during playback
- **DON'T reimplement, IMPORT this!**

**Design Tokens (use!):**
- Location: `/src/styles/design-tokens/`
- All colors, spacing, shadows defined
- **DON'T hardcode, USE CSS variables!**

---

## 🏗️ FOLDER STRUCTURE (Already Created)

```
src/platform/components/AudioPlayer/
├── SPECIFICATION.md ✅         # Master spec (read first!)
├── README.md ✅                # Quick start
├── IMPLEMENTATION_CHECKLIST.md ✅ # 3-day plan
├── index.ts ✅                 # Exports (already done)
├── types.ts ✅                 # TypeScript interfaces (already done)
├── store.ts 🚧                 # TODO: Implement Zustand store
├── AudioPlayer.tsx 🚧          # TODO: Implement main component
├── FullscreenPlayer.tsx 🚧     # TODO: Implement fullscreen
├── StickyPlayer.tsx 🚧         # TODO: Implement sticky
├── components/ (create folder)
│   ├── PlayPauseButton.tsx 🚧
│   ├── WaveformProgress.tsx 🚧
│   ├── VolumeControl.tsx 🚧
│   ├── TimeDisplay.tsx 🚧
│   ├── FavouriteButton.tsx 🚧
│   └── TrackCover.tsx 🚧
└── hooks/ (folder exists)
    ├── useAudioPlayer.ts 🚧    # TODO: Implement
    └── useAudioTracking.ts 🚧  # TODO: Implement
```

**Legend:**
- ✅ = Done (ready to use)
- 🚧 = TODO (implement according to spec)

---

## 🚀 HOW TO START (Step-by-Step)

### **Step 1: Read Documentation (30 min)**

1. Open `/src/platform/components/AudioPlayer/SPECIFICATION.md`
2. Read Executive Summary (page 1)
3. Read Component Architecture (page 2-3)
4. Read 80% Completion Algorithm (page 4-5)
5. Skim Visual Design (page 6-7)
6. Skim Testing Strategy (page 8-9)

**You don't need to memorize everything.** Just understand the big picture.

---

### **Step 2: Setup Environment (10 min)**

1. **Dev server already running:**
   - Local: http://localhost:5173/
   - Ngrok: https://cerebellar-celestine-debatingly.ngrok-free.dev

2. **Database setup:**
   ```bash
   cd /Users/DechBar/dechbar-app
   
   # Create migration
   npx supabase migration new create_audio_player_tables
   
   # Paste SQL from SPECIFICATION.md (Migration 1-3)
   # Then push
   npx supabase db push
   ```

3. **Test audio URL (Bunny CDN):**
   ```
   https://dechbar-cdn.b-cdn.net/test/test-audio.mp3
   ```
   (If doesn't exist, use any public MP3 for testing)

---

### **Step 3: Implement Day 1 Tasks (8h)**

**Morning:**
1. Implement `store.ts` (Zustand)
2. Implement `hooks/useAudioPlayer.ts`
3. Unit test: Audio play/pause/seek

**Afternoon:**
4. Implement `hooks/useAudioTracking.ts`
5. Unit test: 80% algorithm (CRITICAL!)
6. Database setup (migrations)

**Check:** IMPLEMENTATION_CHECKLIST.md for details

---

### **Step 4: Continue Day 2 & 3**

Follow IMPLEMENTATION_CHECKLIST.md day-by-day.

---

## 📋 QUICK REFERENCE

### **Key Decisions (Don't Change!):**
- ✅ **No completion modal** (silent tracking)
- ✅ **Favourite in TopBar** (Apple Music pattern)
- ✅ **80% completion** (psychological sweet spot)
- ✅ **Sticky 60px** (collapsed), 400px (expanded)
- ✅ **Bunny.net CDN** (audio files)
- ✅ **Warm Black** (#121212 background)
- ✅ **Gold accent** (#D6A23A play button, progress)

### **Must Reuse (Don't Reimplement!):**
- ✅ `FullscreenModal` (from Session Engine)
- ✅ `useWakeLock` (from Session Engine)
- ✅ Design tokens (CSS variables)

### **80% Algorithm (Critical!):**
```typescript
// Track segments: [[0, 50], [30, 80]]
// Merge overlaps: [[0, 80]]
// Total listened: 80s
// Completion: 80s / 300s = 27% (not completed)

// MUST merge overlapping intervals!
```

---

## 🧪 Testing URLs

**Desktop:**
```
http://localhost:5173/
```

**Mobile (ngrok):**
```
https://cerebellar-celestine-debatingly.ngrok-free.dev
```

**Test on:**
- iPhone 13 Mini (iOS Safari)
- Android phone (Chrome)

---

## ❓ FAQ

**Q: Can I change the design?**
A: No. Design is finalized (Apple Premium Style, glassmorphism, gold accent). Follow SPECIFICATION.md exactly.

**Q: Can I add features not in spec?**
A: No. Stick to MVP scope. Additional features go to Phase 2.

**Q: What if spec is unclear?**
A: Ask questions before implementing. Propose solution based on spec principles.

**Q: Can I use a different state library?**
A: No. Use Zustand (already in spec, better performance for audio).

**Q: Can I use external audio library (howler.js, wavesurfer)?**
A: No. Use HTML5 Audio (specified). Keep dependencies minimal.

**Q: How do I test on mobile?**
A: Use ngrok URL (already running). Open on iPhone/Android.

**Q: What if 80% algorithm fails?**
A: Debug with unit tests. Check mergeIntervals logic. See SPECIFICATION.md examples.

**Q: Where do I commit code?**
A: Git commit to `dev` branch. Follow DechBar git workflow.

---

## ✅ YOUR MISSION

**Implement AudioPlayer v2.43.0 MVP in 3 days.**

**Success = Marketing video ready** (smooth playback, sticky player, premium feel).

**Follow:**
1. SPECIFICATION.md (design decisions, architecture)
2. IMPLEMENTATION_CHECKLIST.md (daily tasks)
3. Existing patterns (FullscreenModal, Wake Lock)

**Test on mobile** (iOS Safari critical for autoplay).

**Ask questions** if spec unclear.

---

## 🚀 LET'S BUILD!

**Day 1:** Hooks + Store (80% algorithm working)  
**Day 2:** Fullscreen Player (audio plays, waveform seeks)  
**Day 3:** Sticky Player + Polish (mobile tested, marketing ready)

**You have 3 days. Everything is documented. Let's ship! 🎬**

---

**Handoff Date:** 2026-02-04  
**Spec Version:** v2.43.0  
**Status:** 📋 Ready for Implementation

---

*Read SPECIFICATION.md → Implement → Test → Ship*
