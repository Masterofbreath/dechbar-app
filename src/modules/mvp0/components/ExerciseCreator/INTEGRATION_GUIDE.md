# EXERCISE CREATOR - INTEGRATION GUIDE

**For:** Agent integrating ExerciseCreator with CvicitPage  
**Time:** 30 minutes  
**Prerequisites:** ExerciseCreator component fully implemented

---

## 🎯 INTEGRATION POINTS

ExerciseCreator integrates with:
1. **CvicitPage.tsx** - Entry point (create button)
2. **ExerciseList.tsx** - List component (settings icon)
3. **ExerciseCard.tsx** - Card component (display color)
4. **exercises.ts API** - New hooks

---

## 📍 INTEGRATION 1: CvicitPage.tsx

### Current State

```typescript
// CvicitPage.tsx (lines 24, 32, 38)
const [isCreatorOpen, setIsCreatorOpen] = useState(false);

function handleCreateCustom() {
  setIsCreatorOpen(true);
}

function handleEditExercise(exercise: Exercise) {
  // TODO: Open exercise editor (MVP2)
  console.log('Edit exercise:', exercise.id);
  alert('Editace cvičení bude dostupná brzy.');
}
```

### Updated Implementation

```typescript
// CvicitPage.tsx
import { useState } from 'react';
import { 
  ExerciseList, 
  SessionEngineModal,
  ExerciseCreatorModal // ⭐ NEW
} from '../components';
import { TierLockModal } from '../components/TierLockModal'; // ⭐ NEW
import { useMembership } from '../hooks/useMembership';
import { useCustomExerciseCount } from '../api/exercises';
import type { Exercise } from '../types/exercises';

export function CvicitPage() {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null); // ⭐ NEW
  const [showTierLock, setShowTierLock] = useState(false); // ⭐ NEW
  
  const { plan } = useMembership();
  const { data: customCount = 0 } = useCustomExerciseCount(); // ⭐ NEW
  
  function handleStartExercise(exercise: Exercise) {
    setSelectedExercise(exercise);
    setIsSessionOpen(true);
  }
  
  function handleCreateCustom() {
    // ⭐ NEW: Check tier limit
    if (plan === 'ZDARMA' && customCount >= 3) {
      setShowTierLock(true);
      return;
    }
    
    setExerciseToEdit(null); // Create mode
    setIsCreatorOpen(true);
  }
  
  function handleEditExercise(exercise: Exercise) {
    // ⭐ NEW: Open creator in edit mode
    setExerciseToEdit(exercise);
    setIsCreatorOpen(true);
  }
  
  function handleCreatorClose() {
    setIsCreatorOpen(false);
    setExerciseToEdit(null);
  }
  
  function handleCreatorSaved(exercise: Exercise) {
    // Optional: Auto-start exercise after creation
    // setSelectedExercise(exercise);
    // setIsSessionOpen(true);
  }
  
  return (
    <div className="cvicit-page">
      {/* ... header ... */}
      
      <ExerciseList
        onStartExercise={handleStartExercise}
        onCreateCustom={handleCreateCustom}
        onEditExercise={handleEditExercise}
      />
      
      {/* Session Engine */}
      {isSessionOpen && selectedExercise && (
        <SessionEngineModal
          isOpen={isSessionOpen}
          exercise={selectedExercise}
          onClose={() => setIsSessionOpen(false)}
        />
      )}
      
      {/* ⭐ NEW: Exercise Creator */}
      {isCreatorOpen && (
        <ExerciseCreatorModal
          isOpen={isCreatorOpen}
          exerciseToEdit={exerciseToEdit || undefined}
          onClose={handleCreatorClose}
          onSaved={handleCreatorSaved}
        />
      )}
      
      {/* ⭐ NEW: Tier Lock Modal */}
      <TierLockModal
        isOpen={showTierLock}
        requiredTier="SMART"
        featureName="Více než 3 vlastní cvičení"
        description="Dosáhl jsi limit 3 cvičení na FREE tarifu."
        onClose={() => setShowTierLock(false)}
      />
    </div>
  );
}
```

---

## 📍 INTEGRATION 2: ExerciseCard.tsx

### Update Card Component

```typescript
// ExerciseCard.tsx

import type { Exercise } from '../../types/exercises';

interface ExerciseCardProps {
  exercise: Exercise;
  onStart: (exercise: Exercise) => void;
  onEdit?: (exercise: Exercise) => void; // ⭐ NEW
}

export function ExerciseCard({ exercise, onStart, onEdit }: ExerciseCardProps) {
  return (
    <div 
      className="exercise-card"
      style={{
        // ⭐ NEW: Apply card_color for custom exercises
        background: exercise.category === 'custom' && exercise.card_color
          ? exercise.card_color
          : 'var(--color-surface-elevated)'
      }}
    >
      {/* Card content */}
      <div className="exercise-card__content">
        <h3>{exercise.name}</h3>
        <p>{exercise.description}</p>
      </div>
      
      {/* Actions */}
      <div className="exercise-card__actions">
        <button onClick={() => onStart(exercise)}>
          ▶ Start
        </button>
        
        {/* ⭐ NEW: Settings for custom exercises */}
        {exercise.category === 'custom' && onEdit && (
          <button 
            className="exercise-card__settings"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(exercise);
            }}
            aria-label="Upravit cvičení"
          >
            ⚙️
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## 📍 INTEGRATION 3: API Hooks (exercises.ts)

### Add New Hook

```typescript
// src/modules/mvp0/api/exercises.ts

/**
 * Check if exercise name already exists for current user
 */
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
      
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      
      const { count, error } = await query;
      if (error) throw error;
      
      return (count || 0) > 0;
    },
    enabled: !!user && name.length >= 3,
    staleTime: 5000, // Cache for 5 seconds
  });
}

/**
 * Get count of custom exercises for current user
 */
export function useCustomExerciseCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['custom-exercise-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from('exercises')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('category', 'custom')
        .is('deleted_at', null);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}
```

---

## 📍 INTEGRATION 4: Database Migration

### Run Migration

```bash
cd /Users/DechBar/dechbar-app

# Create migration file
supabase migration new add_card_color_to_exercises

# Add SQL to file:
# supabase/migrations/YYYYMMDDHHMMSS_add_card_color_to_exercises.sql
```

```sql
-- Add card_color column to exercises table
ALTER TABLE exercises 
ADD COLUMN card_color VARCHAR(7) DEFAULT '#2CBEC6' 
CHECK (card_color ~ '^#[0-9A-Fa-f]{6}$');

COMMENT ON COLUMN exercises.card_color IS 
  'Hex color code for custom exercise card background';

-- Index for faster custom exercise queries
CREATE INDEX IF NOT EXISTS idx_exercises_user_custom 
ON exercises(created_by, category, deleted_at) 
WHERE category = 'custom';
```

```bash
# Apply migration
supabase db push
```

---

## 📍 INTEGRATION 5: Component Exports

### Update components/index.ts

```typescript
// src/modules/mvp0/components/index.ts

export { ExerciseList } from './ExerciseList';
export { ExerciseCard } from './ExerciseCard';
export { SessionEngineModal } from './session-engine';
export { ExerciseCreatorModal } from './ExerciseCreator'; // ⭐ NEW
export { TierLockModal } from './TierLockModal'; // ⭐ NEW

// ... other exports
```

---

## 📍 INTEGRATION 6: CSS Styling

### Add Global Styles

```css
/* src/styles/components/exercise-creator.css */

.exercise-creator-modal {
  /* Modal styles */
}

.breathing-control {
  /* Stepper styles */
}

.circular-controller {
  /* Circle drag control */
}

/* ... see SPECIFICATION.md for complete CSS */
```

```css
/* src/styles/components/tier-lock-modal.css */

.tier-lock-modal {
  /* Paywall modal styles */
}

/* ... see TierLockModal/README.md for complete CSS */
```

### Import in main CSS

```css
/* src/styles/index.css */

@import './components/exercise-creator.css';
@import './components/tier-lock-modal.css';
```

---

## ✅ INTEGRATION CHECKLIST

### Step 1: Components
- [ ] ExerciseCreatorModal fully implemented
- [ ] TierLockModal implemented
- [ ] All sub-components working

### Step 2: Database
- [ ] Migration created
- [ ] Migration applied to local DB
- [ ] `card_color` column exists

### Step 3: API
- [ ] `useExerciseNameExists()` hook added
- [ ] `useCustomExerciseCount()` hook added
- [ ] `useCreateExercise()` supports `card_color`

### Step 4: CvicitPage
- [ ] Import ExerciseCreatorModal
- [ ] Import TierLockModal
- [ ] Add state management
- [ ] Handle create button
- [ ] Handle edit button
- [ ] Tier limit check

### Step 5: ExerciseCard
- [ ] Apply `card_color` style
- [ ] Add settings icon
- [ ] Call `onEdit` callback

### Step 6: Testing
- [ ] Create exercise (end-to-end)
- [ ] Edit exercise
- [ ] Tier limit (show paywall)
- [ ] Color applied correctly
- [ ] Validation works

### Step 7: Analytics
- [ ] All events tracked
- [ ] Verified in console

---

## 🧪 TESTING FLOW

### Test 1: Create New Exercise

1. Go to "Cvičit" page
2. Click "+ Vytvořit nové cvičení"
3. Fill form:
   - Name: "Test 🫁"
   - Rhythm: 4-0-4-0
   - Reps: 9
   - Color: Purple
4. Click "Uložit"
5. ✅ Exercise appears in list with purple background

### Test 2: Edit Exercise

1. Find custom exercise
2. Click ⚙️ icon
3. Change color to Orange
4. Click "Uložit"
5. ✅ Card background updates to orange

### Test 3: Tier Limit (FREE)

1. Create 3 exercises
2. Try to create 4th
3. ✅ Paywall shown
4. Click "Zkopírovat odkaz"
5. ✅ "dechbar.cz" copied

---

## 🚨 COMMON ISSUES

### Issue: Modal doesn't open
**Fix:** Check imports in CvicitPage.tsx

### Issue: Color not applied
**Fix:** Verify `card_color` in database

### Issue: Validation errors
**Fix:** Check XState machine transitions

### Issue: Tier limit not working
**Fix:** Verify `useCustomExerciseCount()` query

---

## 📊 ANALYTICS VERIFICATION

Open browser console and verify events:
```javascript
// Expected events
exercise_creator_opened
exercise_creator_saved
tier_limit_reached
tier_lock_modal_shown
```

---

## ✅ DONE WHEN...

- ✅ Can create exercise from "Cvičit"
- ✅ Can edit exercise via ⚙️ icon
- ✅ Color applies to card
- ✅ Tier limit enforced
- ✅ Paywall shown correctly
- ✅ All 20 test scenarios pass

---

**Ready?** → Follow this guide step-by-step! 🚀

---

*Version: 1.0*  
*Created: 5. února 2026*
