# EXERCISE CREATOR - IMPLEMENTATION CHECKLIST

**For:** New AI Agent implementing this component  
**Date:** 5. února 2026  
**Estimated Time:** 4 days (MVP) + 1 day (polish)

---

## 🎯 PRE-IMPLEMENTATION

### Step 0: Read Documentation (1 hour)

**Required reading (in order):**
- [ ] `/Users/DechBar/dechbar-app/src/modules/mvp0/components/ExerciseCreator/README.md`
- [ ] `/Users/DechBar/dechbar-app/src/modules/mvp0/components/ExerciseCreator/SPECIFICATION.md`
- [ ] `/Users/DechBar/dechbar-app/docs/design-system/01_PHILOSOPHY.md` (4 Temperamenty)
- [ ] `/Users/DechBar/dechbar-app/docs/brand/VISUAL_BRAND_BOOK.md` (Design System)
- [ ] `/Users/DechBar/dechbar-app/.cursorrules` (Coding standards)

**Explore existing code:**
- [ ] Browse `/Users/DechBar/dechbar-app/src/modules/mvp0/components/session-engine/` (reference for modal structure)
- [ ] Read `/Users/DechBar/dechbar-app/src/modules/mvp0/api/exercises.ts` (existing API hooks)
- [ ] Check `/Users/DechBar/dechbar-app/src/modules/mvp0/types/exercises.ts` (type definitions)

---

## 📅 DAY 1: FOUNDATION (8 hours)

### Morning: File Structure & Types (4 hours)

**Task 1.1: Create Base Files**
```bash
cd /Users/DechBar/dechbar-app/src/modules/mvp0/components/ExerciseCreator/

# Create component files
touch ExerciseCreatorModal.tsx
touch components/BasicInfoSection.tsx
touch components/BreathingPatternSection.tsx
touch components/BreathingControl.tsx
touch components/DurationSection.tsx
touch components/ColorPickerSection.tsx
touch components/ModeToggle.tsx

# Create hook files
touch hooks/useExerciseCreator.ts
touch hooks/useBreathingValidation.ts
touch hooks/useDurationCalculator.ts
touch hooks/useExerciseNameExists.ts

# Create config files
touch types.ts
touch constants.ts
touch index.ts
```

- [ ] Files created
- [ ] Imported basic React dependencies

**Task 1.2: Define TypeScript Types**

Create `types.ts`:
```typescript
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

export interface ExerciseCreatorContext {
  draftExercise: DraftExercise;
  originalExercise: DraftExercise | null;
  validationErrors: ValidationErrors;
  isDirty: boolean;
  mode: 'simple' | 'complex';
}
```

- [ ] Types defined
- [ ] Exported from index.ts

**Task 1.3: Define Constants**

Create `constants.ts`:
```typescript
import type { DraftExercise } from './types';

export const EXERCISE_CREATOR_LIMITS = {
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 350,
  DURATION_MIN: 0.0,
  DURATION_MAX: 20.0,
  DURATION_INCREMENT: 0.5,
  REPETITIONS_MIN: 1,
  REPETITIONS_MAX: 99,
  TOTAL_DURATION_MAX: 45 * 60,
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

export const PRESET_COLORS = [
  { id: 'teal', hex: '#2CBEC6', label: 'Teal' },
  { id: 'gold', hex: '#D6A23A', label: 'Zlatá' },
  { id: 'purple', hex: '#6c5ce7', label: 'Fialová' },
  { id: 'green', hex: '#10B981', label: 'Zelená' },
  { id: 'red', hex: '#EF4444', label: 'Červená' },
  { id: 'blue', hex: '#3B82F6', label: 'Modrá' },
  { id: 'orange', hex: '#F59E0B', label: 'Oranžová' },
  { id: 'pink', hex: '#EC4899', label: 'Růžová' },
];
```

- [ ] Constants defined
- [ ] PRESET_COLORS array complete

### Afternoon: XState Machine (4 hours)

**Task 1.4: Install XState (if needed)**
```bash
cd /Users/DechBar/dechbar-app
npm install xstate @xstate/react
```

- [ ] Dependencies installed

**Task 1.5: Create State Machine**

Create `hooks/useExerciseCreator.ts` with XState machine (see SPECIFICATION.md section 2.3)

- [ ] Machine defined
- [ ] Guards implemented
- [ ] Actions implemented
- [ ] Services (async operations) implemented

**Task 1.6: Create Utility Hooks**

`hooks/useDurationCalculator.ts`:
```typescript
export function useDurationCalculator() {
  function calculateCycleDuration(pattern) { /* ... */ }
  function calculateTotalDuration(pattern, reps) { /* ... */ }
  function formatDuration(seconds) { /* ... */ }
  
  return { calculateCycleDuration, calculateTotalDuration, formatDuration };
}
```

- [ ] Calculator hook created
- [ ] All 3 functions implemented

`hooks/useBreathingValidation.ts`:
- [ ] Pattern validation (min 1 value > 0)
- [ ] Total duration validation (max 45 min)

---

## 📅 DAY 2: UI COMPONENTS (8 hours)

### Morning: Input Components (4 hours)

**Task 2.1: BreathingControl (Hybrid Stepper)**

Create `components/BreathingControl.tsx`:
- [ ] Visual structure (arrows + value + label)
- [ ] Tap +/-: Increment/decrement 0.5s
- [ ] Long press: Rapid increment
- [ ] Tap value: Open numeric keyboard
- [ ] Range validation: 0.0-20.0s
- [ ] Accessibility: role="spinbutton", ARIA labels
- [ ] CSS: Dark mode styling
- [ ] Test: Keyboard navigation (arrow keys)

**Task 2.2: BasicInfoSection**

Create `components/BasicInfoSection.tsx`:
- [ ] Name input (text field)
  - [ ] Placeholder: "Např. Box Breathing 🫁"
  - [ ] Validation: 3-50 chars
  - [ ] Emoji support enabled
  - [ ] Error display: Inline red text
- [ ] Description field (expandable textarea)
  - [ ] Default: Collapsed (ⓘ icon + chevron)
  - [ ] Max 350 chars
  - [ ] Character counter
  - [ ] Optional field

### Afternoon: Advanced Components (4 hours)

**Task 2.3: BreathingPatternSection**

Create `components/BreathingPatternSection.tsx`:
- [ ] Section title: "Rytmus dechu"
- [ ] 4-column layout (flex or grid)
- [ ] 4× BreathingControl instances:
  - [ ] Nádech
  - [ ] Zadrž po nádechu
  - [ ] Výdech
  - [ ] Zadrž po výdechu
- [ ] Labels below controls
- [ ] Responsive: Stack vertically on mobile if needed

**Task 2.4: DurationSection**

Create `components/DurationSection.tsx`:
- [ ] Section title: "Doba a opakování"
- [ ] Circular controller:
  - [ ] SVG circle with draggable handle
  - [ ] Drag interaction (touch + mouse)
  - [ ] Angle → repetition mapping (1-99)
  - [ ] Center display: "9× Opakování • 00:01:12"
  - [ ] Live calculation on rhythm change
- [ ] Quick preset buttons:
  - [ ] [9×] [18×] [27×]
  - [ ] Tap to set count instantly
- [ ] Accessibility: role="slider", keyboard control

**Task 2.5: ColorPickerSection**

Create `components/ColorPickerSection.tsx`:
- [ ] Section title: "Barva karty cvičení"
- [ ] 8 color pills (40x40px circles)
- [ ] Tap to select
- [ ] Selected state: White checkmark overlay
- [ ] Default: Teal (#2CBEC6)
- [ ] CSS: Grid layout (4 columns mobile, 8 columns desktop)

**Task 2.6: ModeToggle**

Create `components/ModeToggle.tsx`:
- [ ] Toggle switch UI (Jednoduchý ●━━━○ Komplexní)
- [ ] iOS-style animation (250ms ease-out)
- [ ] Disabled state (FREE tier):
  - [ ] Grey appearance
  - [ ] Lock icon (🔒) next to "Komplexní"
  - [ ] Tap: Show TierLockModal
- [ ] Enabled state (SMART tier):
  - [ ] Teal fill when active
  - [ ] Smooth transition

---

## 📅 DAY 3: INTEGRATION & TESTING (8 hours)

### Morning: Modal Assembly & Validation (4 hours)

**Task 3.1: ExerciseCreatorModal Container**

Create `components/ExerciseCreatorModal.tsx`:
- [ ] Import all section components
- [ ] Connect to useExerciseCreator hook
- [ ] Render header:
  - [ ] Close button (← Zrušit)
  - [ ] Title (dynamic: "Nové" or "Upravit")
  - [ ] ModeToggle
- [ ] Scrollable content:
  - [ ] BasicInfoSection
  - [ ] Divider
  - [ ] BreathingPatternSection
  - [ ] Divider
  - [ ] DurationSection
  - [ ] Divider
  - [ ] ColorPickerSection
- [ ] Fixed footer:
  - [ ] Save button (Gold CTA)
  - [ ] Disabled when invalid
  - [ ] Loading state during save
- [ ] Keyboard shortcuts:
  - [ ] Esc: Close (with confirm if dirty)
  - [ ] Cmd+Enter: Save

**Task 3.2: Validation Logic**

In `hooks/useBreathingValidation.ts`:
- [ ] Name validation:
  - [ ] Min 3 chars
  - [ ] Max 50 chars
  - [ ] Unique check (async, debounced)
- [ ] Pattern validation:
  - [ ] At least 1 value > 0
  - [ ] Error: "Nastavte alespoň jeden dech"
- [ ] Duration validation:
  - [ ] Total max 45 minutes
- [ ] Inline error display
- [ ] Save button disable logic

### Afternoon: Database & API (4 hours)

**Task 3.3: Database Migration**

Create migration file:
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_card_color.sql
ALTER TABLE exercises 
ADD COLUMN card_color VARCHAR(7) DEFAULT '#2CBEC6' 
CHECK (card_color ~ '^#[0-9A-Fa-f]{6}$');

CREATE INDEX IF NOT EXISTS idx_exercises_user_custom 
ON exercises(created_by, category, deleted_at) 
WHERE category = 'custom';
```

Run migration:
```bash
cd /Users/DechBar/dechbar-app
supabase db push
```

- [ ] Migration created
- [ ] Applied to local DB
- [ ] Verified column exists

**Task 3.4: API Hook (Name Exists Check)**

In `/Users/DechBar/dechbar-app/src/modules/mvp0/api/exercises.ts`, add:
```typescript
export function useExerciseNameExists(name: string, excludeId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['exercise-name-exists', user?.id, name, excludeId],
    queryFn: async () => {
      if (!user || !name || name.length < 3) return false;
      
      let query = supabase
        .from('exercises')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('category', 'custom')
        .ilike('name', name)
        .is('deleted_at', null);
      
      if (excludeId) query = query.neq('id', excludeId);
      
      const { count, error } = await query;
      if (error) throw error;
      return (count || 0) > 0;
    },
    enabled: !!user && name.length >= 3,
    staleTime: 5000,
  });
}
```

- [ ] Hook added to exercises.ts
- [ ] Exported
- [ ] Tested with mock data

**Task 3.5: Integration with ExerciseList**

Update `/Users/DechBar/dechbar-app/src/modules/mvp0/components/ExerciseList.tsx`:
- [ ] Add state for creator modal
- [ ] Handle "Vytvořit" button click:
  - [ ] Check tier limit (FREE: 3 max)
  - [ ] If limit reached: Show TierLockModal
  - [ ] Else: Open ExerciseCreatorModal

Update `/Users/DechBar/dechbar-app/src/modules/mvp0/components/ExerciseCard.tsx`:
- [ ] Apply card_color as background style
- [ ] Add settings icon (⚙️) for custom exercises
- [ ] On settings click: Open ExerciseCreatorModal in edit mode

**Task 3.6: Testing (Manual)**

Test scenarios:
- [ ] Create new exercise (happy path)
- [ ] Edit existing exercise
- [ ] Validation errors:
  - [ ] Name too short
  - [ ] Name duplicate
  - [ ] All zeros pattern
  - [ ] Total duration > 45 min
- [ ] Tier limit (FREE: 3 exercises)
- [ ] Close with unsaved changes
- [ ] Emoji in name
- [ ] Color selection
- [ ] Quick presets work

---

## 📅 DAY 4: POLISH & PAYWALL (8 hours)

### Morning: TierLockModal (4 hours)

**Task 4.1: Create TierLockModal Component**

Create `/Users/DechBar/dechbar-app/src/modules/mvp0/components/TierLockModal/`:
```bash
mkdir -p /Users/DechBar/dechbar-app/src/modules/mvp0/components/TierLockModal
cd /Users/DechBar/dechbar-app/src/modules/mvp0/components/TierLockModal
touch TierLockModal.tsx types.ts index.ts
```

`TierLockModal.tsx`:
- [ ] Modal UI:
  - [ ] Lock icon (🔒)
  - [ ] Feature name (dynamic)
  - [ ] Description: "Tato funkce je dostupná od tarifu {SMART/AI_COACH}."
  - [ ] Instructions: "Pro odemčení navštiv dechbar.cz"
  - [ ] Copy link button (📋 Zkopírovat odkaz)
  - [ ] Close button
- [ ] Copy to clipboard functionality
- [ ] Success feedback: "✓ Zkopírováno"
- [ ] Props interface:
  ```typescript
  interface TierLockModalProps {
    isOpen: boolean;
    requiredTier: 'SMART' | 'AI_COACH';
    featureName: string;
    description?: string;
    onClose: () => void;
  }
  ```

**Task 4.2: Integrate TierLockModal**

In ExerciseCreatorModal:
- [ ] Import TierLockModal
- [ ] Show when Complex mode clicked (FREE user)
- [ ] Show when creating 4th exercise (FREE user)

In CvicitPage:
- [ ] Show when "Vytvořit" clicked and limit reached

### Afternoon: Animations & Analytics (4 hours)

**Task 4.3: CSS Styling**

Create `/Users/DechBar/dechbar-app/src/styles/components/exercise-creator.css`:
- [ ] Modal styles (fullscreen, dark mode)
- [ ] Section spacing (32px gaps)
- [ ] Input styles (BreathingControl)
- [ ] Circular controller SVG
- [ ] Color pills grid
- [ ] Responsive breakpoints (390px, 768px, 1024px)
- [ ] Animations:
  - [ ] Modal open/close (fade + scale)
  - [ ] Save button press (scale 0.98)
  - [ ] Toggle switch (250ms ease-out)
  - [ ] Color pill hover (scale 1.1)

Create `/Users/DechBar/dechbar-app/src/styles/components/tier-lock-modal.css`:
- [ ] Modal overlay styles
- [ ] Content centering
- [ ] Button styles
- [ ] Copy feedback animation

**Task 4.4: Analytics Integration**

In ExerciseCreatorModal, add analytics events:
```typescript
// On modal open
analytics.track('exercise_creator_opened', {
  mode: isEditMode ? 'edit' : 'create',
  user_tier: plan,
});

// On field change
analytics.track('exercise_creator_field_changed', {
  field: fieldName,
});

// On save success
analytics.track('exercise_creator_saved', {
  exercise_id: savedExercise.id,
  total_duration_seconds: savedExercise.total_duration_seconds,
});

// On error
analytics.track('exercise_creator_error', {
  error_type: 'validation',
  error_field: errorField,
});

// On tier limit hit
analytics.track('tier_limit_reached', {
  feature: 'custom_exercises',
  current_count: 3,
});
```

- [ ] All events tracked
- [ ] Test in console (dev mode)

**Task 4.5: Accessibility Audit**

Run through checklist:
- [ ] Color contrast (WCAG AA)
- [ ] Touch targets ≥ 44px
- [ ] Keyboard navigation
- [ ] Screen reader support (ARIA)
- [ ] Focus indicators visible
- [ ] Motion sensitivity (prefers-reduced-motion)

**Task 4.6: Final Testing**

Test all scenarios again:
- [ ] Create exercise (all fields)
- [ ] Edit exercise (modify values)
- [ ] Validation (all error states)
- [ ] Tier limit (paywall shown)
- [ ] Confirm discard modal
- [ ] Network errors (disconnect and try save)
- [ ] Mobile gestures (drag circular controller)
- [ ] Desktop keyboard shortcuts

---

## ✅ POST-IMPLEMENTATION

### Step 5: Documentation Update

- [ ] Update `/Users/DechBar/dechbar-app/src/modules/mvp0/components/ExerciseCreator/README.md`:
  - [ ] Update Implementation Status section
  - [ ] Mark completed tasks
- [ ] Update `/Users/DechBar/dechbar-app/CHANGELOG.md`:
  - [ ] Add entry for Exercise Creator component
- [ ] Create PR description:
  - [ ] Features added
  - [ ] Screenshots (mobile + desktop)
  - [ ] Testing notes

### Step 6: Code Review Checklist

- [ ] TypeScript: No `any` types
- [ ] CSS: All design tokens used (no hardcoded colors)
- [ ] Accessibility: WCAG AA compliant
- [ ] Performance: No unnecessary re-renders
- [ ] 4 Temperaments: All satisfied
- [ ] Mobile-first: Works on 390px viewport
- [ ] Error handling: All edge cases covered
- [ ] Analytics: All events tracked

### Step 7: Deployment

- [ ] Merge to `test` branch
- [ ] Test on PREVIEW environment
- [ ] Smoke test (create 1 exercise end-to-end)
- [ ] Ask team for feedback
- [ ] Merge to `main` (PROD) after approval

---

## 🎉 COMPLETION CRITERIA

Component is DONE when:
- ✅ All tasks checked off
- ✅ Manual testing passed (20 scenarios)
- ✅ Accessibility audit passed
- ✅ 4 temperaments validated
- ✅ Code review approved
- ✅ Documentation updated
- ✅ Deployed to PROD

**Estimated Time:** 32 hours (4 days × 8h)

**Actual Time:** ___ hours (fill after completion)

---

## 📞 NEED HELP?

**Stuck on something?**
1. Re-read SPECIFICATION.md (section related to your task)
2. Check existing similar component (session-engine/)
3. Review .cursorrules for coding standards
4. Ask in team chat with specific question

**Found a bug in the spec?**
- Document it in README.md
- Suggest improvement
- Discuss with team before implementing workaround

---

*Last updated: 5. února 2026*  
*Version: 1.0*
