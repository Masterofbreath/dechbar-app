# 🎯 EXERCISE CREATOR - MASTER SPECIFICATION

**Component:** Custom Breathing Exercise Builder  
**Version:** 1.0.0  
**Created:** 5. února 2026  
**Status:** 📋 Ready for Implementation  
**Estimated Time:** 4 days MVP + 1 day polish

---

## 🚀 QUICK START FOR NEW AGENT

**👋 Jsi nový agent implementující tuto komponentu?**

### READ FIRST (v tomto pořadí):

1. **Tento dokument** (MASTER.md) - Celkový přehled
2. **README.md** - Quick start & architecture
3. **SPECIFICATION.md** - Detailní technická specifikace
4. **IMPLEMENTATION_CHECKLIST.md** - Krok-po-kroku implementační plán

### THEN EXPLORE:

5. Existing SessionEngine: `../session-engine/SessionEngineModal.tsx`
6. Exercise types: `../../types/exercises.ts`
7. Exercise API: `../../api/exercises.ts`
8. Design System: `/Users/DechBar/dechbar-app/docs/design-system/`

---

## 📋 WHAT ARE WE BUILDING?

### Component Name
**Exercise Creator** (internally "Studio MVP")

### Location
```
View: "Cvičit"
  → Tab: "Vlastní"
    → Button: "+ Vytvořit nové cvičení"
      → Opens: ExerciseCreatorModal (fullscreen)
```

### Purpose
Umožnit uživatelům vytvářet vlastní dechová cvičení s přesným nastavením:
- 🫁 Rytmus dechu (nádech, zádrže, výdech)
- ⏱️ Počet opakování (1-99 cyklů)
- 🎨 Barva karty (8 preset colors)
- 📝 Název + popis (emoji support)

---

## 🎨 VISUAL REFERENCE (Mobile Layout)

```
┌─────────────────────────────────────────────────┐
│  ← Zrušit          Nové cvičení                 │ ← Header
│      Jednoduchý  ●━━━○  Komplexní              │ ← Mode Toggle
├─────────────────────────────────────────────────┤
│  Název cvičení*                                 │
│  [Např. Box Breathing 🫁_________________]      │
│                                                  │
│  ⓘ Informace o cvičení ▼                       │ ← Expandable
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Rytmus dechu                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │  ▲   │ │  ▲   │ │  ▲   │ │  ▲   │         │
│  │ 4.0s │ │ 0.0s │ │ 4.0s │ │ 0.0s │         │
│  │  ▼   │ │  ▼   │ │  ▼   │ │  ▼   │         │
│  └──────┘ └──────┘ └──────┘ └──────┘         │
│  Nádech   Zadrž    Výdech   Zadrž             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Doba a opakování                               │
│     ┌─────────────────┐                        │
│     │    ◉ (dot)     │                        │
│     │      9×         │                        │
│     │   00:01:12      │                        │
│     └─────────────────┘                        │
│   [9×]  [18×]  [27×]                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  Barva karty cvičení                            │
│  [●✓] [●] [●] [●] [●] [●] [●] [●]             │
├─────────────────────────────────────────────────┤
│              [✓ Uložit]                        │ ← Footer
└─────────────────────────────────────────────────┘
```

**Reference:** Screenshots from "Breathe" app (see images in project)

---

## 🏗️ ARCHITECTURE OVERVIEW

### File Structure
```
ExerciseCreator/
├── README.md                          ← Overview
├── SPECIFICATION.md                   ← Complete spec
├── IMPLEMENTATION_CHECKLIST.md        ← Step-by-step
├── MASTER.md                          ← This file
├── ExerciseCreatorModal.tsx           ← Main container
├── components/
│   ├── BasicInfoSection.tsx
│   ├── BreathingPatternSection.tsx
│   ├── BreathingControl.tsx          ← Reusable stepper
│   ├── DurationSection.tsx
│   ├── ColorPickerSection.tsx
│   └── ModeToggle.tsx
├── hooks/
│   ├── useExerciseCreator.ts         ← XState machine
│   ├── useBreathingValidation.ts
│   ├── useDurationCalculator.ts
│   └── useExerciseNameExists.ts
├── types.ts
├── constants.ts
└── index.ts
```

### Component Hierarchy
```
ExerciseCreatorModal
├── Header (Close + Title + ModeToggle)
├── ScrollableContent
│   ├── BasicInfoSection (Name + Description)
│   ├── BreathingPatternSection (4× BreathingControl)
│   ├── DurationSection (Circle + Presets)
│   └── ColorPickerSection (8 pills)
└── Footer (Save button)
```

---

## 🎯 KEY FEATURES

### 1. Smart Defaults
```typescript
// Pre-filled with balanced 4-0-4-0 pattern
breathingPattern: {
  inhale_seconds: 4.0,
  hold_after_inhale_seconds: 0.0,
  exhale_seconds: 4.0,
  hold_after_exhale_seconds: 0.0,
}
repetitions: 9
cardColor: '#2CBEC6' (Teal)
```

### 2. Hybrid Controls
- **Tap arrows:** Quick ±0.5s adjustments
- **Long press:** Rapid increment (2-10×/sec)
- **Tap value:** Numeric keyboard for precise entry
- **Drag circle:** Gesture-based repetition setting

### 3. Real-Time Validation
- Name: Min 3 chars, unique check (debounced 300ms)
- Pattern: Min 1 value > 0 (can't be all zeros)
- Duration: Max 45 minutes total
- Inline errors: Red text below invalid inputs
- Save button: Disabled when invalid

### 4. Tier System
- **FREE:** Max 3 custom exercises
- **SMART:** Unlimited + Complex mode
- **Paywall:** iOS-compliant (no payment links)

### 5. Color Personalization
8 preset colors:
- Teal, Gold, Purple, Green, Red, Blue, Orange, Pink
- Applied to ExerciseCard background
- Tap to select, checkmark on selected

---

## 📐 DESIGN SYSTEM

### Colors
```css
--modal-background: #121212;
--modal-surface: #1E1E1E;
--text-primary: #E0E0E0;
--color-primary: #2CBEC6; /* Teal */
--color-accent: #D6A23A;  /* Gold */
--color-error: #EF4444;
```

### Typography
```css
font-family: 'Inter', sans-serif;
/* Header */ 20px, weight 600, -0.02em
/* Body */ 16px, weight 400
/* Values */ 24px, weight 700, tabular-nums
```

### Spacing
```css
--spacing-section-gap: 32px;
--spacing-item-gap: 16px;
```

---

## 🔐 VALIDATION RULES

### Required
- ✅ **Název:** 3-50 znaků, unique
- ✅ **Rytmus:** Min 1 hodnota > 0

### Valid Patterns
- ✅ `4-0-0-0` (jen nádech)
- ✅ `0-0-4-0` (jen výdech)
- ✅ `4-4-4-4` (box breathing)
- ❌ `0-0-0-0` (error!)

### Limits
- Duration per phase: 0.0 - 20.0s
- Repetitions: 1 - 99
- Total duration: Max 45 minutes

---

## 💾 DATABASE

### New Column
```sql
ALTER TABLE exercises 
ADD COLUMN card_color VARCHAR(7) DEFAULT '#2CBEC6';
```

### CREATE Payload
```typescript
{
  name: "Moje cvičení 🫁",
  category: 'custom',
  card_color: '#2CBEC6',
  breathing_pattern: {
    version: "1.0",
    type: "simple",
    phases: [{ /* single phase */ }]
  }
}
```

---

## 🔌 INTEGRATION POINTS

### 1. SessionEngine
✅ No changes needed - already supports custom exercises

### 2. ExerciseList
- Add state for creator modal
- Check tier limit before opening
- Show TierLockModal if limit reached

### 3. ExerciseCard
- Apply `card_color` as background
- Add settings icon (⚙️) for custom exercises
- Click settings → open creator in edit mode

### 4. API
- Add `useExerciseNameExists()` hook
- Update `useCreateExercise()` payload (card_color)

---

## 🧪 TESTING

### Functional (20 scenarios)
1. Create new exercise
2. Edit existing
3. Validation errors (all types)
4. Tier limit (FREE: 3 exercises)
5. Close with changes (confirm modal)
6. Network failure
7. Emoji in name
8. Extreme values (0.5s, 20s, 99 reps)

### Accessibility
- Keyboard navigation (Tab, Enter, Esc)
- Screen reader (ARIA labels)
- Touch targets ≥ 44px
- Color contrast (WCAG AA)

### 4 Temperaments
- **Sangvinik:** Colors, emoji ✅
- **Cholerik:** Quick presets, shortcuts ✅
- **Melancholik:** 0.5s precision, validation ✅
- **Flegmatik:** Clean UI, optional fields ✅

---

## 📊 ANALYTICS

Track these events:
```typescript
exercise_creator_opened
exercise_creator_field_changed
exercise_creator_saved
exercise_creator_error
tier_limit_reached
tier_lock_modal_shown
```

---

## ⏱️ IMPLEMENTATION TIMELINE

### Phase 1: MVP (3 days)
**Day 1:** Foundation (types, XState, structure)
**Day 2:** UI Components (all sections)
**Day 3:** Integration (DB, API, testing)

### Phase 2: Polish (1 day)
**Day 4:** TierLockModal, animations, analytics

### Phase 3: Future (V2.0)
- Complex mode (multi-phase editor)
- AI suggestions
- Community sharing

**Total:** 4 days for production-ready MVP

---

## ✅ DEFINITION OF DONE

Component is complete when:
- ✅ All files created (see FILE_STRUCTURE below)
- ✅ All tests pass (20 scenarios)
- ✅ Accessibility audit complete
- ✅ 4 temperaments validated
- ✅ Database migration applied
- ✅ Analytics integrated
- ✅ Documentation updated
- ✅ Deployed to PROD

---

## 📁 COMPLETE FILE STRUCTURE

```
src/modules/mvp0/components/
├── ExerciseCreator/
│   ├── README.md                          ✅ Created
│   ├── SPECIFICATION.md                   ✅ Created
│   ├── IMPLEMENTATION_CHECKLIST.md        ✅ Created
│   ├── MASTER.md                          ✅ Created (this file)
│   ├── ExerciseCreatorModal.tsx           ⏳ To implement
│   ├── components/
│   │   ├── BasicInfoSection.tsx           ⏳ To implement
│   │   ├── BreathingPatternSection.tsx    ⏳ To implement
│   │   ├── BreathingControl.tsx           ⏳ To implement
│   │   ├── DurationSection.tsx            ⏳ To implement
│   │   ├── ColorPickerSection.tsx         ⏳ To implement
│   │   └── ModeToggle.tsx                 ⏳ To implement
│   ├── hooks/
│   │   ├── useExerciseCreator.ts          ⏳ To implement
│   │   ├── useBreathingValidation.ts      ⏳ To implement
│   │   ├── useDurationCalculator.ts       ⏳ To implement
│   │   └── useExerciseNameExists.ts       ⏳ To implement
│   ├── types.ts                           ✅ Created
│   ├── constants.ts                       ✅ Created
│   └── index.ts                           ✅ Created
│
├── TierLockModal/                         ← Global component
│   ├── README.md                          ✅ Created
│   ├── TierLockModal.tsx                  ⏳ To implement
│   ├── types.ts                           ✅ Created
│   └── index.ts                           ✅ Created
│
src/styles/components/
├── exercise-creator.css                   ⏳ To implement
└── tier-lock-modal.css                    ⏳ To implement

supabase/migrations/
└── YYYYMMDDHHMMSS_add_card_color.sql      ⏳ To create & apply
```

**Legend:**
- ✅ Created (documentation/types)
- ⏳ To implement (code)

---

## 🎯 CORE SPECIFICATIONS

### Input Controls

#### BreathingControl (Hybrid Stepper)
```
Range: 0.0 - 20.0s
Increment: 0.5s
Interactions: Tap +/-, long press, tap value
Visual: ▲ VALUE ▼ + label
```

#### CircularController
```
Range: 1 - 99 repetitions
Interaction: Drag gold dot around circle
Display: "9× Opakování • 00:01:12"
Quick presets: [9×] [18×] [27×]
```

#### ColorPicker
```
8 preset pills: Teal, Gold, Purple, Green, Red, Blue, Orange, Pink
Default: Teal (#2CBEC6)
Interaction: Tap to select
Selected: White checkmark overlay
```

### Validation

**Required:**
- Name: 3-50 chars
- Pattern: Min 1 value > 0

**Valid Patterns:**
- ✅ 4-0-0-0, 0-0-4-0, 4-4-4-4
- ❌ 0-0-0-0 (error)

**Limits:**
- Total duration: Max 45 min
- Repetitions: 1-99

### Tier System

**FREE:**
- Max 3 custom exercises
- Paywall shown at 4th creation
- Complex mode locked

**SMART:**
- Unlimited exercises
- Complex mode enabled (future)

---

## 🔄 USER FLOWS

### Flow 1: Create New Exercise (Happy Path)

```
User in "Cvičit" view, tab "Vlastní"
  ↓
Taps "+ Vytvořit nové cvičení"
  ↓
[Check: customCount < 3 for FREE]
  ↓ OK
ExerciseCreatorModal opens
  ↓
User fills:
  - Název: "Ranní energie 🌅"
  - Rytmus: 3-0-6-0 (relaxing 1:2 ratio)
  - Opakování: 18× (drag circle)
  - Barva: Orange (tap pill)
  ↓
User taps "✓ Uložit"
  ↓
[Validation: All OK]
  ↓
Save to Supabase (optimistic UI)
  ↓
Modal closes with success animation
  ↓
Exercise appears in "Vlastní" tab with orange background
  ↓
User taps card → SessionEngine plays with 3-0-6-0 pattern
```

### Flow 2: Edit Existing Exercise

```
User in "Cvičit" view, tab "Vlastní"
  ↓
Taps ⚙️ settings icon on exercise card
  ↓
ExerciseCreatorModal opens in edit mode
  - Title: "Upravit cvičení"
  - All fields pre-filled with current values
  ↓
User changes:
  - Repetitions: 18× → 27×
  - Color: Orange → Purple
  ↓
User taps "✓ Uložit"
  ↓
[Validation + Update to DB]
  ↓
Modal closes
  ↓
Card refreshes with new color + duration
```

### Flow 3: Tier Limit Hit (FREE User)

```
FREE user with 3 existing exercises
  ↓
Taps "+ Vytvořit nové cvičení"
  ↓
[Check: customCount >= 3]
  ↓ LIMIT REACHED
TierLockModal shown:
  - "Více než 3 vlastní cvičení"
  - "Dostupné od tarifu SMART"
  - "Pro odemčení navštiv dechbar.cz"
  - [📋 Zkopírovat odkaz] button
  ↓
User taps "Zkopírovat odkaz"
  ↓
Clipboard: "https://dechbar.cz"
Feedback: "✓ Zkopírováno"
  ↓
User manually opens Safari → dechbar.cz
```

### Flow 4: Close with Unsaved Changes

```
User editing exercise
  ↓
Changes name from "Test" to "Ranní"
  ↓
Taps "← Zrušit"
  ↓
[Check: isDirty = true]
  ↓
ConfirmDiscardModal shown:
  - "Zahodit změny?"
  - "Máte neuložené změny. Opravdu chcete odejít?"
  - [Zahodit] [Zrušit]
  ↓
User chooses:
  - "Zahodit" → Modal closes, changes lost
  - "Zrušit" → Returns to editing
```

---

## 📊 4 TEMPERAMENTS DESIGN

### 🎉 Sangvinik (Playful, Social)
**Needs:** Fun, personalization, visual feedback
**Features:**
- ✅ 8 colorful card options
- ✅ Emoji support in name ("Ranní energie 🌅")
- ✅ Instant visual preview (live calculation)
- ⏸️ Future: Success animation on save

### ⚡ Cholerik (Fast, Efficient)
**Needs:** Speed, shortcuts, minimal clicks
**Features:**
- ✅ Smart defaults (pre-filled 4-0-4-0)
- ✅ Quick presets ([9×] [18×] [27×] = 1 tap)
- ✅ Keyboard shortcuts (Cmd+Enter = save)
- ✅ Single screen (no multi-step wizard)

### 📚 Melancholik (Detailed, Quality)
**Needs:** Precision, control, information
**Features:**
- ✅ 0.5s increment (fine-tune control)
- ✅ Live duration calculation ("00:01:12")
- ✅ Description field (optional context)
- ✅ Inline validation (clear error messages)
- ✅ Unique name check (quality enforcement)

### 🕊️ Flegmatik (Simple, Calm)
**Needs:** Simplicity, no pressure, ease
**Features:**
- ✅ Clean, minimal UI (dark, calm)
- ✅ Optional fields (only name + rhythm required)
- ✅ Clear sections with dividers
- ✅ Confirm before discarding (no accidents)
- ✅ No aggressive notifications

**Validation:** All 4 temperaments are satisfied ✅

---

## 🗄️ DATABASE SCHEMA

### Migration
```sql
-- Add card_color column
ALTER TABLE exercises 
ADD COLUMN card_color VARCHAR(7) DEFAULT '#2CBEC6' 
CHECK (card_color ~ '^#[0-9A-Fa-f]{6}$');

-- Index for performance
CREATE INDEX idx_exercises_user_custom 
ON exercises(created_by, category, deleted_at) 
WHERE category = 'custom';
```

### Example Record
```json
{
  "id": "uuid",
  "name": "Ranní energie 🌅",
  "description": "Aktivační dech do nového dne",
  "category": "custom",
  "created_by": "user_uuid",
  "card_color": "#F59E0B",
  "breathing_pattern": {
    "version": "1.0",
    "type": "simple",
    "phases": [{
      "order": 1,
      "pattern": {
        "inhale_seconds": 3.0,
        "hold_after_inhale_seconds": 0.0,
        "exhale_seconds": 6.0,
        "hold_after_exhale_seconds": 0.0
      },
      "cycles_count": 18
    }]
  },
  "total_duration_seconds": 162
}
```

---

## 📱 INTEGRATION FLOW

```
User Action: Create Exercise
  ↓
ExerciseCreatorModal (UI)
  ↓
useExerciseCreator (State)
  ↓
useCreateExercise (API Hook)
  ↓
Supabase (Database)
  ↓
React Query Cache (Invalidate)
  ↓
ExerciseList (Re-fetch)
  ↓
ExerciseCard (Display with color)
  ↓
User taps card
  ↓
SessionEngineModal (Play)
  ↓
exercise_sessions table (History)
```

---

## ⚠️ CRITICAL IMPLEMENTATION NOTES

### iOS Compliance
**NO payment links in app!**
- ❌ "Upgrade na SMART" button
- ❌ Direct link to pricing page
- ✅ "Navštiv dechbar.cz" text
- ✅ Copy link button only

### Performance
- Modal opens <150ms
- Input response <50ms
- Debounce validation (300ms)
- Optimistic UI updates

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation full support
- Screen reader tested
- Touch targets ≥ 44px

### XState Machine
- Prevents impossible states
- Clear transition logic
- Guards for validation
- Services for async operations

---

## 🚀 GETTING STARTED

**New Agent?** Follow this path:

```
1. Read: MASTER.md (this file) - Overview
2. Read: SPECIFICATION.md - Deep dive
3. Read: IMPLEMENTATION_CHECKLIST.md - Step-by-step
4. Explore: Existing session-engine/ code
5. Implement: Follow checklist Day 1 → Day 4
6. Test: All scenarios
7. Deploy: test branch → PROD
```

**Time:** 4 days = 32 hours

**Ready?** → Open `IMPLEMENTATION_CHECKLIST.md` and start Day 1! 🚀

---

## 📚 REFERENCE DOCUMENTS

**In this folder:**
- `README.md` - Component overview
- `SPECIFICATION.md` - Complete technical spec (23 pages)
- `IMPLEMENTATION_CHECKLIST.md` - Day-by-day plan
- `types.ts` - TypeScript definitions
- `constants.ts` - Defaults and limits

**Project-wide:**
- `/Users/DechBar/dechbar-app/PROJECT_GUIDE.md` - Project navigation
- `/Users/DechBar/dechbar-app/docs/design-system/01_PHILOSOPHY.md` - 4 Temperamenty
- `/Users/DechBar/dechbar-app/docs/brand/VISUAL_BRAND_BOOK.md` - Design system
- `/Users/DechBar/dechbar-app/.cursorrules` - Coding standards

**Existing code:**
- `../session-engine/SessionEngineModal.tsx` - Reference implementation
- `../../api/exercises.ts` - API hooks
- `../../types/exercises.ts` - Exercise types

---

## 🎉 SUCCESS CRITERIA

Component succeeds when:
- ✅ Users create exercises easily (< 2 min)
- ✅ 0 confusion reports (clear UI)
- ✅ 65%+ adoption rate (Month 1)
- ✅ 18%+ conversion at tier limit
- ✅ 4.5+ rating on ease of use

---

**Status:** 📋 Ready for Implementation  
**Priority:** High  
**Complexity:** Medium  
**Impact:** High (retention + monetization)

---

*Created: 5. února 2026*  
*Version: 1.0*  
*Next: Start IMPLEMENTATION_CHECKLIST.md Day 1*
