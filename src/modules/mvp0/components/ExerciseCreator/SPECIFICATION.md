# EXERCISE CREATOR COMPONENT - COMPLETE SPECIFICATION

**Version:** 1.0  
**Date:** 5. února 2026  
**Status:** Production-Ready Specification  
**Project:** DechBar App - Custom Breathing Exercise Builder

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Component Architecture](#2-component-architecture)
3. [UI/UX Specification](#3-uiux-specification)
4. [Technical Implementation](#4-technical-implementation)
5. [Database Schema](#5-database-schema)
6. [Validation & Safety Rules](#6-validation--safety-rules)
7. [Tier System & Paywall](#7-tier-system--paywall)
8. [Integration Points](#8-integration-points)
9. [Accessibility & Testing](#9-accessibility--testing)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Purpose & Vision

The **Exercise Creator Component** (internally "Studio MVP") transforms DechBar from a passive content library into an active bio-regulation tool. It empowers users to design custom breathing exercises tailored to their specific CO2 tolerance, stress levels, and training goals.

**Key Value Propositions:**
- 🎨 **Personalization:** Users create exercises matching their BOLT/KP score
- 💪 **Retention:** IKEA Effect - users value self-created content 3x more
- 💰 **Monetization:** Natural conversion path (FREE: 3 exercises → SMART: unlimited)
- 🔬 **Precision:** 0.5s granularity for fine-tuning respiratory mechanics

### 1.2 Strategic Positioning

**Market Gap Analysis:**
- ❌ **Breathwrk/iBreathe:** Too simple (single-loop only, no multi-phase)
- ❌ **Prana Breath:** Too complex (spreadsheet UI, cognitive overload)
- ✅ **DechBar Opportunity:** Professional depth + Apple premium UX

**Competitive Advantage:**
- Dark-first ergonomics (no eye strain during evening sessions)
- Hybrid controls (dial + stepper + keyboard for all temperaments)
- BOLT-aware safety guardrails (physiological intelligence - future)
- iOS-compliant paywall (no App Store policy violations)

### 1.3 Success Metrics

**Product KPIs:**
- 📈 **Engagement:** 65% of users create ≥1 custom exercise (Month 1)
- 🔄 **Retention:** Users with custom exercises: 2.5x Week 4 retention
- 💳 **Conversion:** 18% of FREE users hitting 3-exercise limit upgrade to SMART
- ⭐ **Quality:** 4.5+ star rating on "ease of creation" survey

**Technical Performance:**
- ⚡ Modal opens in <150ms (60fps animation)
- 🎯 Input response time <50ms (no perceived lag)
- 💾 Save operation completes in <500ms (optimistic UI update)

---

## 2. COMPONENT ARCHITECTURE

### 2.1 File Structure

```
src/modules/mvp0/components/
├── ExerciseCreator/
│   ├── README.md                          ← Overview & quick start
│   ├── SPECIFICATION.md                   ← This file (complete spec)
│   ├── IMPLEMENTATION_CHECKLIST.md        ← Step-by-step guide
│   ├── ExerciseCreatorModal.tsx           ← Main fullscreen modal
│   ├── components/
│   │   ├── BasicInfoSection.tsx           ← Název + Popis
│   │   ├── BreathingPatternSection.tsx    ← 4-column rhythm editor
│   │   ├── BreathingControl.tsx           ← Single stepper (reusable)
│   │   ├── DurationSection.tsx            ← Circular controller
│   │   ├── ColorPickerSection.tsx         ← 8 preset pills
│   │   └── ModeToggle.tsx                 ← Simple ↔ Complex switch
│   ├── hooks/
│   │   ├── useExerciseCreator.ts          ← State management (XState)
│   │   ├── useBreathingValidation.ts      ← Validation logic
│   │   ├── useDurationCalculator.ts       ← Auto-calculate time
│   │   └── useExerciseNameExists.ts       ← Unique name check
│   ├── types.ts                           ← Creator-specific TypeScript types
│   ├── constants.ts                       ← Default values, limits
│   └── index.ts                           ← Public API exports
│
├── TierLockModal/                         ← ⭐ NEW (global component)
│   ├── TierLockModal.tsx                  ← iOS-compliant paywall
│   ├── types.ts
│   └── index.ts
│
src/styles/components/
├── exercise-creator.css                   ← Component styles
└── tier-lock-modal.css                    ← Paywall modal styles

src/modules/mvp0/api/
└── exercises.ts                           ← Add useExerciseNameExists hook
```

### 2.2 Component Hierarchy

```
ExerciseCreatorModal (Container)
├── Header
│   ├── CloseButton (← Zrušit)
│   ├── Title ("Nové cvičení" | "Upravit cvičení")
│   └── ModeToggle (Jednoduchý ●━━━○ Komplexní)
│
├── ScrollableContent
│   ├── BasicInfoSection
│   │   ├── NameInput (text, 3-50 chars, emoji support)
│   │   └── DescriptionField (expandable textarea, 350 chars)
│   │
│   ├── Divider
│   │
│   ├── BreathingPatternSection
│   │   ├── SectionTitle ("Rytmus dechu")
│   │   ├── BreathingControl (Nádech) [0.0-20.0s]
│   │   ├── BreathingControl (Zadrž po nádechu) [0.0-20.0s]
│   │   ├── BreathingControl (Výdech) [0.0-20.0s]
│   │   └── BreathingControl (Zadrž po výdechu) [0.0-20.0s]
│   │
│   ├── Divider
│   │
│   ├── DurationSection
│   │   ├── SectionTitle ("Doba a opakování")
│   │   ├── CircularController (drag handle, 1-99 reps)
│   │   ├── LiveCalculation ("4× Opakování • 00:01:04")
│   │   └── QuickPresets ([9×] [18×] [27×])
│   │
│   ├── Divider
│   │
│   └── ColorPickerSection
│       ├── SectionTitle ("Barva karty cvičení")
│       └── ColorPills (8 presets, tap to select)
│
└── Footer
    └── SaveButton (Gold CTA, disabled when invalid)

ConfirmDiscardModal (on close with changes)
TierLockModal (when FREE user hits limit or taps Complex mode)
```

### 2.3 State Management (XState Machine)

```typescript
// useExerciseCreator.ts - State Machine Definition
const exerciseCreatorMachine = createMachine({
  id: 'exerciseCreator',
  initial: 'idle',
  context: {
    draftExercise: defaultExercise,
    originalExercise: null, // for edit mode
    validationErrors: {},
    isDirty: false,
  },
  states: {
    idle: {
      on: {
        OPEN_CREATE: 'checkingTierLimit',
        OPEN_EDIT: {
          target: 'editing',
          actions: 'loadExerciseForEdit',
        },
      },
    },
    checkingTierLimit: {
      invoke: {
        src: 'checkCustomExerciseCount',
        onDone: [
          {
            target: 'showingPaywall',
            cond: 'hasReachedFreeLimit',
          },
          { target: 'editing' },
        ],
        onError: 'error',
      },
    },
    editing: {
      on: {
        UPDATE_FIELD: {
          actions: ['updateDraftExercise', 'setDirty', 'validateField'],
        },
        CLOSE: [
          {
            target: 'confirmingDiscard',
            cond: 'isDirty',
          },
          { target: 'idle' },
        ],
        SAVE: 'validating',
      },
    },
    validating: {
      invoke: {
        src: 'validateExercise',
        onDone: [
          {
            target: 'editing',
            cond: 'hasValidationErrors',
            actions: 'showValidationErrors',
          },
          { target: 'saving' },
        ],
      },
    },
    saving: {
      invoke: {
        src: 'saveExercise',
        onDone: {
          target: 'saved',
          actions: 'notifySuccess',
        },
        onError: {
          target: 'errorSaving',
          actions: 'notifyError',
        },
      },
    },
    saved: {
      after: {
        500: 'idle', // Auto-close after animation
      },
    },
    confirmingDiscard: {
      on: {
        CONFIRM_DISCARD: 'idle',
        CANCEL_DISCARD: 'editing',
      },
    },
    showingPaywall: {
      on: {
        CLOSE_PAYWALL: 'idle',
      },
    },
    errorSaving: {
      on: {
        RETRY: 'saving',
        CANCEL: 'editing',
      },
    },
    error: {
      on: {
        RETRY: 'checkingTierLimit',
        CANCEL: 'idle',
      },
    },
  },
});
```

---

## 3. UI/UX SPECIFICATION

### 3.1 Visual Design System Compliance

**Colors (from VISUAL_BRAND_BOOK.md):**
```css
/* Background Layers */
--modal-background: #121212;        /* Warm Black */
--modal-surface: #1E1E1E;           /* Elevated surface */
--divider: #2A2A2A;                 /* Subtle separator */

/* Typography */
--text-primary: #E0E0E0;            /* 87% white, soft on eyes */
--text-secondary: #A0A0A0;          /* 60% white, labels */
--text-tertiary: #707070;           /* 38% white, hints */

/* Interactive States */
--color-primary: #2CBEC6;           /* Teal - focus, active */
--color-accent: #D6A23A;            /* Gold - CTA, save */
--color-error: #EF4444;             /* Red - validation */
--color-success: #10B981;           /* Green - saved */

/* Preset Colors (8 pills) */
--preset-teal: #2CBEC6;
--preset-gold: #D6A23A;
--preset-purple: #6c5ce7;
--preset-green: #10B981;
--preset-red: #EF4444;
--preset-blue: #3B82F6;
--preset-orange: #F59E0B;
--preset-pink: #EC4899;
```

**Typography:**
```css
/* Header Title */
font-family: 'Inter', sans-serif;
font-size: 20px;
font-weight: 600;
letter-spacing: -0.02em; /* Tight spacing = premium feel */
color: var(--text-primary);

/* Section Titles */
font-size: 16px;
font-weight: 500;
color: var(--text-secondary);
margin-bottom: 16px;

/* Input Values (Breathing Controls) */
font-size: 24px;
font-weight: 700;
font-variant-numeric: tabular-nums; /* Aligned numbers */
color: var(--text-primary);

/* Helper Text / Placeholders */
font-size: 14px;
font-weight: 400;
color: var(--text-tertiary);
```

**Spacing (4px base unit):**
```css
--spacing-section-gap: 32px;        /* Between sections */
--spacing-item-gap: 16px;           /* Inside sections */
--spacing-input-padding: 16px;      /* Input internal */
--spacing-modal-padding: 24px;      /* Modal edges */
```

### 3.2 Mobile Layout (390px viewport - iPhone 14 Pro)

```
┌─────────────────────────────────────────────────┐
│  ← Zrušit          Nové cvičení                 │ Header (fixed)
│                                                  │
│      Jednoduchý  ●━━━○  Komplexní              │ Mode Toggle
├─────────────────────────────────────────────────┤
│                                                  │
│  Název cvičení*                                 │ ← Scroll starts
│  ┌───────────────────────────────────────────┐ │
│  │ Např. Box Breathing 🫁                    │ │
│  └───────────────────────────────────────────┘ │
│                                                  │
│  ⓘ Informace o cvičení              ▼          │ ← Expandable
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │ Divider
│                                                  │
│  Rytmus dechu                                   │
│                                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │   ▲    │ │   ▲    │ │   ▲    │ │   ▲    │ │
│  │ 4.0 s  │ │ 0.0 s  │ │ 4.0 s  │ │ 0.0 s  │ │
│  │   ▼    │ │   ▼    │ │   ▼    │ │   ▼    │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ │
│   Nádech    Zadrž      Výdech     Zadrž       │
│             po nád.               po výd.      │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                  │
│  Doba a opakování                               │
│                                                  │
│       ┌─────────────────────────────┐          │
│       │         ◉ (teal dot)        │          │
│       │      /             \         │          │
│       │     |     9×       |        │          │
│       │      \  00:01:12  /         │          │
│       │         '─────'             │          │
│       └─────────────────────────────┘          │
│                                                  │
│    [9×]      [18×]      [27×]                  │ Quick presets
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                  │
│  Barva karty cvičení                            │
│                                                  │
│  [●✓] [●] [●] [●] [●] [●] [●] [●]             │ Color pills
│  teal gold pur grn red blu org pnk             │
│                                                  │
│  (scroll space)                                 │
├─────────────────────────────────────────────────┤
│              [✓ Uložit]                        │ Footer (fixed)
└─────────────────────────────────────────────────┘
```

### 3.3 Component Specifications

#### 3.3.1 BreathingControl (Hybrid Stepper)

**Purpose:** Input for breathing phase duration

**Visual:**
```
┌──────────────────┐
│       ▲          │  ← +0.5s
│     4.0 s        │  ← Tap to edit
│       ▼          │  ← -0.5s
└──────────────────┘
     Nádech
```

**Interactions:**
- Tap +/-: Increment/decrement 0.5s
- Long press: Rapid increment (2-10×/sec)
- Tap value: Open numeric keypad
- Range: 0.0 - 20.0s

#### 3.3.2 CircularController

**Purpose:** Set repetitions (1-99)

**Visual:**
```
┌───────────────┐
│   ╭─────╮    │
│  │   ◉  │   │  ← Drag handle
│  │  9×   │   │
│  │00:01:12│  │  ← Auto-calculated
│   ╰─────╯    │
└───────────────┘
```

**Interactions:**
- Drag gold dot around circle
- Live calculation updates
- Quick presets: [9×] [18×] [27×]

#### 3.3.3 ColorPickerSection

**8 preset pills:**
```
[●✓] [●] [●] [●] [●] [●] [●] [●]
teal gold pur grn red blu org pnk
```

**Default:** Teal (#2CBEC6)
**Selected:** White checkmark overlay

---

## 4. TECHNICAL IMPLEMENTATION

### 4.1 TypeScript Interfaces

```typescript
// types.ts

export interface DraftExercise {
  id?: string;
  name: string;
  description: string | null;
  breathingPattern: {
    inhale_seconds: number;
    hold_after_inhale_seconds: number;
    exhale_seconds: number;
    hold_after_exhale_seconds: number;
  };
  repetitions: number;
  cardColor: string;
  isValid: boolean;
  totalDurationSeconds: number;
}

export interface ValidationErrors {
  name?: string;
  breathingPattern?: string;
  repetitions?: string;
  totalDuration?: string;
}

export const EXERCISE_CREATOR_LIMITS = {
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 350,
  DURATION_MIN: 0.0,
  DURATION_MAX: 20.0,
  DURATION_INCREMENT: 0.5,
  REPETITIONS_MIN: 1,
  REPETITIONS_MAX: 99,
  TOTAL_DURATION_MAX: 45 * 60, // 45 minutes
};

export const DEFAULT_EXERCISE: DraftExercise = {
  name: '',
  description: null,
  breathingPattern: {
    inhale_seconds: 4.0,
    hold_after_inhale_seconds: 0.0,
    exhale_seconds: 4.0,
    hold_after_exhale_seconds: 0.0,
  },
  repetitions: 9,
  cardColor: '#2CBEC6',
  isValid: false,
  totalDurationSeconds: 72,
};
```

### 4.2 Key Implementation Notes

**State Management:**
- Use XState for complex validation flow
- Context holds draft + validation errors
- Guards prevent invalid transitions

**Validation:**
- Real-time (on every field change)
- Async name uniqueness check (debounced 300ms)
- Inline error display (red text below input)

**Performance:**
- Optimistic UI (show saved state immediately)
- Debounce validation to reduce queries
- Memoize calculated duration

---

## 5. DATABASE SCHEMA

### 5.1 Migration SQL

```sql
-- Add card_color column to exercises table
ALTER TABLE exercises 
ADD COLUMN card_color VARCHAR(7) DEFAULT '#2CBEC6' 
CHECK (card_color ~ '^#[0-9A-Fa-f]{6}$');

COMMENT ON COLUMN exercises.card_color IS 
  'Hex color code for exercise card background';

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_exercises_user_custom 
ON exercises(created_by, category, deleted_at) 
WHERE category = 'custom';
```

### 5.2 CREATE Payload

```typescript
const createPayload = {
  name: draftExercise.name,
  description: draftExercise.description || null,
  category: 'custom',
  card_color: draftExercise.cardColor, // ⭐ NEW
  breathing_pattern: {
    version: "1.0",
    type: "simple",
    phases: [{
      order: 1,
      type: "breathing",
      name: "Hlavní fáze",
      pattern: draftExercise.breathingPattern,
      duration_seconds: totalDuration,
      cycles_count: draftExercise.repetitions,
    }],
    metadata: {
      total_duration_seconds: totalDuration,
      phase_count: 1,
      difficulty: "beginner",
    },
  },
};
```

---

## 6. VALIDATION & SAFETY RULES

### 6.1 Client-Side Validation

```typescript
// Required fields
- Name: 3-50 chars, unique, emoji allowed
- Breathing pattern: Min 1 value > 0.0

// Valid patterns
✅ 4-0-0-0 (just inhale)
✅ 0-0-4-0 (just exhale)
✅ 4-4-4-4 (box breathing)
❌ 0-0-0-0 (error: "Nastavte alespoň jeden dech")

// Limits
- Total duration: Max 45 minutes
- Repetitions: 1-99
- Phase duration: 0.0-20.0s
```

### 6.2 Error Display

```typescript
// Inline errors (below input)
<div className="error-message">
  ⚠ Název musí mít minimálně 3 znaky
</div>

// Disable Save button when invalid
<Button disabled={!isValid} />
```

---

## 7. TIER SYSTEM & PAYWALL

### 7.1 TierLockModal (iOS-Compliant)

**CRITICAL:** No in-app payment links (Apple rules)

```typescript
<TierLockModal
  isOpen={true}
  requiredTier="SMART"
  featureName="Více než 3 vlastní cvičení"
  onClose={() => {}}
/>
```

**UI:**
```
┌─────────────────────────┐
│          🔒             │
│                         │
│  Více než 3 vlastní    │
│  cvičení                │
│                         │
│  Tato funkce je         │
│  dostupná od tarifu     │
│  SMART.                 │
│                         │
│  Pro odemčení navštiv   │
│  dechbar.cz            │
│                         │
│  [📋 Zkopírovat odkaz] │
│                         │
│       [Zavřít]         │
└─────────────────────────┘
```

### 7.2 Tier Limits

**FREE:**
- Max 3 custom exercises
- Check BEFORE opening modal
- Show paywall if limit reached

**SMART:**
- Unlimited exercises
- Complex mode access (future)

---

## 8. INTEGRATION POINTS

### 8.1 SessionEngine

**No changes needed** - already supports custom exercises

### 8.2 ExerciseList

**Update ExerciseCard:**
```typescript
<div 
  style={{ background: exercise.card_color }}
  onClick={() => onStart(exercise)}
>
  {/* Card content */}
</div>

{/* Add settings icon for custom exercises */}
{exercise.category === 'custom' && (
  <button onClick={() => onEdit(exercise)}>
    ⚙️
  </button>
)}
```

### 8.3 API Hooks

**New hook needed:**
```typescript
export function useExerciseNameExists(name: string, excludeId?: string) {
  // Check if name exists for current user
  // Debounced query to reduce load
}
```

---

## 9. ACCESSIBILITY & TESTING

### 9.1 WCAG 2.1 AA Compliance

**Color Contrast:**
- ✅ Text (#E0E0E0) on bg (#121212): 13:1
- ✅ Teal (#2CBEC6) on bg: 9:1
- ✅ All interactive states pass AA

**Touch Targets:**
- ✅ All buttons ≥ 44x44px
- ✅ Arrows: 48x48px tap area

**Keyboard:**
- ✅ Tab order logical
- ✅ Esc = close, Enter = save
- ✅ Arrow keys work on steppers

### 9.2 Testing Scenarios

1. ✅ Create new exercise
2. ✅ Edit existing
3. ✅ Validation errors
4. ✅ Tier limit enforcement
5. ✅ Close with changes
6. ✅ Network failure
7. ✅ Emoji in name
8. ✅ Extreme values

### 9.3 4 Temperaments

- **Sangvinik:** Colors, emoji ✅
- **Cholerik:** Quick presets ✅
- **Melancholik:** 0.5s precision ✅
- **Flegmatik:** Clean UI ✅

---

## 10. IMPLEMENTATION ROADMAP

### Phase 1: MVP (3 days)
**Day 1:** Structure + types + XState
**Day 2:** UI components (all sections)
**Day 3:** Integration + testing

### Phase 2: Polish (1 day)
**Day 4:** TierLockModal + animations + analytics

### Phase 3: Future (V2.0)
- Complex mode (multi-phase)
- AI suggestions
- Community sharing

---

## 11. CONCLUSION

Exercise Creator je klíčová komponenta pro transformaci DechBaru na plnohodnotnou bio-regulační platformu. Kombinuje:

- **Apple premium UX** (dark-first, clean)
- **Fyziologickou inteligenci** (0.5s precision)
- **4 temperamenty design** (všichni spokojeni)
- **iOS compliance** (no payment links)

**Estimated Impact:**
- 📈 +40% retention
- 💳 +18% conversion
- ⭐ 4.5+ rating

**Ready for implementation:** ✅

---

*Version: 1.0*  
*Created: 5. února 2026*  
*Status: Production-Ready*
