# Session Engine Protocol Fixes v2.42.5

## Version
v2.42.5 - 2026-01-27

## Overview
Critical fixes for KLID/VEČER protocols + UX improvements for instructions positioning and bzučení phase.

---

## 🔴 P0 CRITICAL FIXES

### **1. Fix Protocol Detection (KLID + VEČER)**

**Problem:** 
```ts
// OLD:
const PRESET_PROTOCOL_NAMES = ['RÁNO', 'RESET', 'NOC'] as const;
```

KLID a VEČER protocols nebyly rozpoznány → MiniTip místo description + chybějící phase names.

**Solution:**
```ts
// NEW:
const PRESET_PROTOCOL_NAMES = ['RÁNO', 'KLID', 'VEČER'] as const;
```

**Result:**
- ✅ Všechny 3 protokoly správně detekované
- ✅ Description v countdown (ne MiniTip)
- ✅ Phase names/instructions v active state

---

### **2. Instructions Above Circle (Priority)**

**Problem:**
- RÁNO: Phase name NAD circlem ✅
- KLID/VEČER: Instructions POD circlem ❌ (rozbíjelo layout)

**Solution:**
```tsx
{/* Conditional rendering */}
{isProtocol(exercise) && currentPhase && (
  currentPhase.instructions && !isFinalPhase && !isBuzzingPhase ? (
    <p className="session-active__instruction-text">
      {currentPhase.instructions}
    </p>
  ) : (
    <p className="session-active__phase-name">
      {currentPhase.name}
    </p>
  )
)}
```

**Logic:**
1. **If instructions exist:** Show instructions (actionable guidance)
2. **Else:** Show phase name (context)

**Result:**
- ✅ KLID/VEČER: "Dýchej hluboko do břicha" NAD circlem
- ✅ RÁNO: "Aktivace" NAD circlem
- ✅ Circle remains centered (no shift)

---

### **3. Bzučení - (bzzz) Only VÝDECH**

**Problem:**
```tsx
// OLD: (bzzz) vždy
{isBuzzingPhase ? (
  <>
    {currentInstruction}
    <span className="breathing-hint">(bzzz)</span>
  </>
) : ...}
```

**Solution:**
```tsx
// NEW: (bzzz) pouze při VÝDECH
{isBuzzingPhase ? (
  <>
    {currentInstruction}
    {currentInstruction === 'VÝDECH' && (
      <span className="breathing-hint">(bzzz)</span>
    )}
  </>
) : ...}
```

**Plus hint above circle:**
```tsx
{isBuzzingPhase && (
  <p className="session-active__buzzing-hint">
    Při výdechu jemně bzuč
  </p>
)}
```

**Result:**
- ✅ VÝDECH → "(bzzz)" visible
- ✅ NÁDECH → no (bzzz)
- ✅ ZADRŽ → no (bzzz)
- ✅ Hint text NAD circlem (gold color)

---

## 🟡 P1 ENHANCEMENTS

### **4. Completion Dynamic Height**

**Before:**
```css
.completion-content {
  max-height: 100%; /* Fixed */
}
```

**After:**
```css
.completion-content {
  max-height: calc(100vh - 180px); /* Dynamic */
  min-height: 300px;
}
```

**Result:**
- ✅ Modal grows with content
- ✅ Scrollbar only when needed
- ✅ Textarea expand works smoothly

---

### **5. MoodSlider Highlight Selected**

**New CSS:**
```css
/* Default state */
.mood-slider__label {
  opacity: 0.6;
  color: var(--color-text-secondary);
}

/* Selected state */
.mood-slider__emoji-btn--selected .mood-slider__label {
  color: var(--color-primary); /* Teal */
  opacity: 1;
  font-weight: 600; /* Bold */
  transform: scale(1.05); /* Subtle */
}
```

**Result:**
- ✅ Selected mood visually distinct
- ✅ Apple-style feedback
- ✅ Smooth transition (0.2s)

---

## 🎨 VISUAL OUTCOME

### **KLID Protokol - Active State:**
```
┌──────────────────────────┐
│ KLID        FÁZE 2/5 [X] │ TopBar
├──────────────────────────┤
│  ↕ 60px                  │
│  Dýchej hluboko do břicha│ ← Instructions NAD circlem!
│                          │
│      ◯✨ VÝDECH          │ Glowing circle
│                          │
│       45 s               │ Timer
│  ↕ 60px                  │
├──────────────────────────┤
│ Další: Prodloužení       │ BottomBar
│ [progress bar]           │
└──────────────────────────┘
```

### **VEČER Protokol - Bzučení Fáze:**
```
┌──────────────────────────┐
│ VEČER       FÁZE 3/5 [X] │ TopBar
├──────────────────────────┤
│  ↕ 60px                  │
│  Při výdechu jemně bzuč  │ ← Buzzing hint (gold)
│                          │
│      ◯✨ VÝDECH          │
│         (bzzz)           │ ← Only on VÝDECH!
│                          │
│       30 s               │ Timer
│  ↕ 60px                  │
├──────────────────────────┤
│ Další: Uklidnění         │ BottomBar
└──────────────────────────┘
```

**NÁDECH state (same fáze):**
```
│      ◯✨ NÁDECH          │
│                          │ ← NO (bzzz)!
```

### **RÁNO Protokol - Active State:**
```
┌──────────────────────────┐
│ RÁNO        FÁZE 1/7 [X] │ TopBar
├──────────────────────────┤
│  ↕ 60px                  │
│  Aktivace                │ ← Phase name (no instructions)
│                          │
│      ◯✨ NÁDECH          │ Glowing circle
│                          │
│       12 s               │ Timer
│  ↕ 60px                  │
├──────────────────────────┤
│ Další: Stabilizace       │ BottomBar
└──────────────────────────┘
```

### **Completion - Mood Highlight:**
```
Jak se teď cítíš?

😰      😴      😐      😌      ⚡
Ve      Una-    Neu-    Klidně  Ener-
stresu  veně    trálně          gicky
                        ^^^^
                  Teal + Bold + scale(1.05)
```

---

## 📁 FILES MODIFIED (4 files)

1. **`src/utils/exerciseHelpers.ts`**
   - Line 18: `['RÁNO', 'RESET', 'NOC']` → `['RÁNO', 'KLID', 'VEČER']`

2. **`src/modules/mvp0/components/session-engine/components/SessionActive.tsx`**
   - Removed unused `NavIcon` import
   - Instructions conditional rendering (priority over phase name)
   - Bzučení hint above circle
   - (bzzz) conditional: `currentInstruction === 'VÝDECH'`
   - Removed duplicate instructions below circle

3. **`src/styles/components/session-engine/_active.css`**
   - Added `.session-active__instruction-text` (same as phase name)
   - Added `.session-active__buzzing-hint` (gold accent color)
   - Mobile responsive (13px font, 12px top, 16px padding)

4. **`src/styles/components/session-engine/_completed.css`**
   - Completion: `max-height: calc(100vh - 180px)`
   - Completion: `min-height: 300px`
   - MoodSlider selected state highlight (teal, bold, scale)

---

## 📊 BEFORE/AFTER COMPARISON

| Feature | Before | After | Result |
|---------|--------|-------|--------|
| KLID detection | ❌ Not recognized | ✅ Recognized | Description shows |
| VEČER detection | ❌ Not recognized | ✅ Recognized | Phase names work |
| KLID instructions | ❌ Below circle (breaks layout) | ✅ Above circle | Centered circle |
| Bzučení (bzzz) | ❌ Always visible | ✅ Only VÝDECH | Clear guidance |
| Completion height | ❌ Fixed scrollbar | ✅ Dynamic growth | Better UX |
| Mood selected | ⚪ No highlight | ✅ Teal + bold | Apple feedback |

---

## 🧪 TESTING CHECKLIST

### **Desktop (1280px+):**

**RÁNO Protokol:**
- [ ] Countdown: Description below circle (not MiniTip)
- [ ] Active: "Aktivace" phase name above circle
- [ ] No instructions (fallback to phase name works)

**KLID Protokol:**
- [ ] Countdown: Description below circle
- [ ] Active: "Dýchej hluboko do břicha" above circle
- [ ] Timer below circle (circle centered)
- [ ] Phase transition smooth

**VEČER Protokol:**
- [ ] Same as KLID
- [ ] Bzučení fáze:
  - [ ] Hint "Při výdechu jemně bzuč" above circle (gold)
  - [ ] VÝDECH → (bzzz) visible
  - [ ] NÁDECH → no (bzzz)
  - [ ] ZADRŽ → no (bzzz)

**Completion:**
- [ ] Modal grows with content (no scrollbar if fits)
- [ ] Textarea expand → smooth growth
- [ ] Selected mood: Teal label + bold
- [ ] Smooth transition (0.2s)

### **Mobile (390px):**
- [ ] Instructions readable (13px font)
- [ ] Buzzing hint visible (gold, 12px top)
- [ ] Completion responsive
- [ ] Mood highlight works

---

## 🎯 KEY IMPROVEMENTS

**1. Protocol Parity:**
- All 3 protocols (RÁNO, KLID, VEČER) now work identically
- Consistent behavior across all protocol types

**2. Contextual Information:**
- Instructions when actionable (KLID/VEČER)
- Phase name when contextual (RÁNO)
- Bzučení guidance when relevant (gold hint)

**3. Visual Hierarchy:**
- Instructions above circle (actionable)
- Timer below circle (secondary)
- Circle always centered (focus)

**4. User Feedback:**
- Mood selection highlighted (Apple style)
- Completion dynamic (grows with need)
- Bzučení clear (only when buzzing)

---

## 🐛 KNOWN ISSUES & NEXT STEPS

### **P0 (Investigate):**
1. **Circle blink during phase transitions**
   - User reports "bliknutí" při přechodu fází
   - Možné příčiny:
     - Shadow reset (inhale → exhale transition)
     - RAF animation restart
     - React re-render
   - **Next:** Add debug console logs

### **P1 (Future):**
2. **Pre-exercise mood tracking**
   - Move to Settings as opt-in
   - Separate mood modal (small, focused)
   - Auto-advance on emoji tap

3. **Progress bar timing**
   - Use `performance.now()` for accuracy
   - Prevent "jump" when tab inactive

---

## 💡 DESIGN PHILOSOPHY ALIGNMENT

**Apple Premium Style:**
- ✅ Clear visual hierarchy (instructions > phase name > timer)
- ✅ Contextual information (show when relevant)
- ✅ Smooth transitions (teal highlight, 0.2s ease)

**Méně Je Více:**
- ✅ Instructions only when actionable
- ✅ (bzzz) only when buzzing
- ✅ Phase name as fallback (not redundant)

**Visual Brand Book:**
- ✅ Gold accent for special guidance (bzučení)
- ✅ Teal for feedback (selected mood)
- ✅ Consistent positioning (top 16px, bottom 8px)

**Tone of Voice:**
- ✅ "Při výdechu jemně bzuč" (clear, gentle)
- ✅ "Dýchej hluboko do břicha" (actionable, specific)
- ✅ "Klidně" (calm, welcoming)

---

## 📝 COMMIT DETAILS

**Commit:** `f88f871`  
**Branch:** `feature/fullscreen-modal-system`  
**Build:** ✅ TypeScript clean (pre-existing errors only)  
**Files:** 4 modified  
**Lines:** +879, -30

---

**Status:** 🎯 **READY FOR TESTING**

**Test Priority:**
1. **P0:** KLID/VEČER protocols (all 3 working)
2. **P0:** Instructions positioning (above circle)
3. **P0:** Bzučení (bzzz) logic (only VÝDECH)
4. **P1:** Completion dynamic height
5. **P1:** Mood highlight feedback

**Next Steps:**
1. User testing (desktop + mobile)
2. Debug circle transitions (if blink persists)
3. Implement pre-exercise mood Settings toggle

Testuj prosím a dej mi feedback! 🚀
