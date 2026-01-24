# Exercise System - Complete Specification

## Table of Contents
1. [Current State (MVP v0.2)](#current-state)
2. [Protocol vs Exercise Distinction](#protocol-vs-exercise)
3. [Future Roadmap (v2.0+)](#future-roadmap)
4. [Decision Log](#decision-log)
5. [Migration Path](#migration-path)

---

## Current State (MVP v0.2)

### Database Schema (Supabase)

**Table:** `exercises`

```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'preset' | 'custom'
  subcategory VARCHAR(50), -- 'morning' | 'evening' | 'stress' | ...
  created_by UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT false,
  required_tier VARCHAR(20), -- 'ZDARMA' | 'SMART' | 'AI_COACH'
  breathing_pattern JSONB NOT NULL,
  total_duration_seconds INTEGER,
  phase_count INTEGER,
  difficulty VARCHAR(20), -- 'beginner' | 'intermediate' | 'advanced'
  tags TEXT[],
  contraindications TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### Current Content

**Preset Protocols (Admin):**
1. RÁNO (7 min) - Ranní aktivace
2. RESET (5 min) - Rychlé zklidnění
3. NOC (10 min) - Noční uvolnění

**Preset Exercises (Admin):**
1. Box Breathing (5 min) - 4-4-4-4 klasika
2. Calm (7 min) - Prodloužený výdech
3. Coherence (5 min) - Srdeční koherence

---

## Protocol vs Exercise Distinction

### What is a Protocol?

**Protocols** are special admin-created exercises with these characteristics:
- Shown on Dnes page as primary quick-access buttons
- Direct countdown start (skip intro flow)
- Display exercise description in countdown (contextual info)
- Curated by DechBar team for specific daily use cases

**Examples:** RÁNO, RESET, NOC

### What is an Exercise?

**Exercises** are breathing practices with these characteristics:
- Shown in "Cvičit" page list
- Normal flow (SessionStartScreen → MoodPick → Countdown)
- Display rotating breathing tips in countdown (educational)
- Can be admin presets or user-created custom

**Examples:** Box Breathing, Calm, Coherence

### Current Implementation

**Protocol Detection (Temporary):**
```typescript
// src/utils/exerciseHelpers.ts
const PRESET_PROTOCOL_NAMES = ['RÁNO', 'RESET', 'NOC'];

export function isProtocol(exercise: Exercise): boolean {
  return PRESET_PROTOCOL_NAMES.includes(exercise.name);
}
```

**Why temporary?**
- Avoids premature DB schema changes
- Keeps flexibility while Exercise Studio design is in progress
- Easy to migrate to DB column later

**Countdown Content Logic:**
```typescript
// SessionCountdown.tsx
{isProtocol(exercise) ? (
  <p className="session-countdown__description">
    {exercise.description} {/* "Ranní aktivace s postupnou progresí..." */}
  </p>
) : (
  <MiniTip variant="static">
    <strong>Tip:</strong> {currentTip} {/* "Dýchej břichem, ne hrudí..." */}
  </MiniTip>
)}
```

**Final Phase Detection:**
```typescript
// SessionActive.tsx
const isFinalPhase = 
  currentPhase.name === 'Doznění' || 
  currentPhase.name.toLowerCase().includes('doznění');

// This prevents single-phase exercises from incorrectly showing "VOLNĚ"
// Only phases explicitly named "Doznění" will trigger free breathing
```

---

## Future Roadmap (v2.0+)

### Exercise Types (Future DB Column)

```typescript
export type ExerciseType = 
  | 'protocol'      // Admin curated daily protocols (RÁNO/RESET/NOC)
  | 'preset'        // Admin curated exercises (Box Breathing, etc.)
  | 'custom'        // User created in Exercise Studio
  | 'template'      // Editable templates (future)
  | 'ai-generated'; // AI Coach created (future)
```

### User Roles & Permissions

```typescript
export type UserRole = 
  | 'free'      // Základní člen DechBaru (limited access)
  | 'vip'       // VIP člen (premium features)
  | 'student'   // Student (learning mode, assignments)
  | 'teacher'   // Učitel (create, assign, track students)
  | 'admin'     // Admin (manage content, users)
  | 'ceo';      // CEO (full system access)

export interface ExercisePermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
  canShare: boolean;
  canAssign: boolean; // For teachers
}
```

### User Preferences (Future Feature)

```typescript
export interface UserPreferences {
  // Flow preferences
  always_skip_intro: boolean;
  skip_mood_tracking: boolean;
  
  // Content preferences
  countdown_content_type: 'auto' | 'description' | 'tips' | 'motivational' | 'silent';
  
  // Dashboard customization
  pinned_exercises: string[]; // Max 4 exercise IDs for Dnes page
  dnes_layout: 'protocols-only' | 'protocols-favorites' | 'favorites-only';
  
  // Notifications
  daily_reminder: boolean;
  reminder_time: string; // HH:MM format
}
```

### Exercise Studio (Future Feature)

**Functionality:**
- Multi-phase breathing pattern builder
- Visual phase editor (drag & drop timeline)
- Duration calculator
- Real-time preview player
- Save as template
- Share with community

**UI Sections:**
1. Pattern Builder (phases, timing)
2. Metadata Editor (name, description, tags)
3. Preview Player
4. Save & Share Options

---

## Decision Log

### 2026-01-24: Why NOT add DB columns now?

**Question:** Should we add `type` column to `exercises` table now?

**Decision:** NO - Keep helper function approach until Exercise Studio is designed.

**Reasoning:**

1. **Uncertainty about Studio requirements:**
   - Don't know all metadata fields needed for custom exercises
   - Don't know permission model complexity
   - Don't know template system architecture

2. **Risk of premature optimization:**
   - Adding DB columns now = commitment to schema
   - Changing DB schema later = complex migration
   - Current helper function is sufficient for 3 protocols + 3 exercises

3. **Validation-first approach:**
   - Get user feedback on current 6 exercises first
   - Understand real usage patterns
   - Design Studio based on actual needs, not assumptions

4. **Clean migration path:**
   - Helper function has clear TODO comment
   - Easy to replace with DB column later
   - No tech debt or complexity

**Timeline:**
- MVP v0.2 (NOW): Helper function
- MVP v1.0 (1-2 months): User feedback, Studio design
- MVP v2.0 (2-3 months): DB migration, Studio build

### What MUST be in DB now:
- ✅ `exercises` table (basic schema)
- ✅ `exercise_sessions` table (history tracking)
- ✅ `profiles.safety_flags` (JSONB for questionnaire)

### What CAN wait:
- ⏸️ `exercises.type` column → helper function sufficient
- ⏸️ `profiles.preferences` → use app defaults
- ⏸️ `exercise_templates` table → after Studio design
- ⏸️ Complex permissions → after sharing features designed

### 2026-01-24: Fixed "Doznění" Phase Bug

**Problem:** Single-phase exercises (Box Breathing, Calm, Coherence) incorrectly showed "Doznění – dýchej podle sebe" and "VOLNĚ" in the breathing circle.

**Root Cause:** Detection logic used `currentPhaseIndex === totalPhases - 1`, which is TRUE for single-phase exercises (0 === 1-1).

**Solution:** Changed detection to explicit phase name matching:
```typescript
const isFinalPhase = 
  currentPhase.name === 'Doznění' || 
  currentPhase.name.toLowerCase().includes('doznění');
```

**Result:**
- Single-phase exercises show correct instructions (NÁDECH/VÝDECH/ZADRŽ)
- Only phases explicitly named "Doznění" trigger free breathing mode
- Multi-phase protocols work correctly when they have a "Doznění" phase

---

## Migration Path

### Phase 1: NOW (Helper Function)

**Status:** ✅ Implemented (2026-01-24)

```typescript
// Temporary helper
export function isProtocol(exercise: Exercise): boolean {
  return ['RÁNO', 'RESET', 'NOC'].includes(exercise.name);
}
```

**Usage:** SessionCountdown conditional rendering

### Phase 2: v1.0 (User Research)

**Goals:**
- Test 3 protocols + 3 exercises with real users
- Gather feedback on desired custom exercise features
- Design Exercise Studio UI/UX
- Define required metadata fields

**Deliverables:**
- User research report
- Studio wireframes
- DB schema specification v2.0

### Phase 3: v2.0 (DB Migration)

**SQL Migration:**
```sql
-- Add exercise type
ALTER TABLE exercises 
ADD COLUMN type VARCHAR(20) DEFAULT 'preset'
CHECK (type IN ('protocol', 'preset', 'custom', 'template', 'ai-generated'));

-- Set existing protocols
UPDATE exercises 
SET type = 'protocol' 
WHERE name IN ('RÁNO', 'RESET', 'NOC');

-- Add countdown content preference
ALTER TABLE exercises 
ADD COLUMN countdown_content VARCHAR(20) DEFAULT 'tips'
CHECK (countdown_content IN ('description', 'tips'));

-- Set protocol countdown content
UPDATE exercises 
SET countdown_content = 'description' 
WHERE type = 'protocol';
```

**Code Migration:**
```typescript
// BEFORE (helper)
if (isProtocol(exercise)) { ... }

// AFTER (DB column)
if (exercise.type === 'protocol') { ... }
```

### Phase 4: v3.0 (User Preferences)

**SQL Migration:**
```sql
-- Add user preferences
ALTER TABLE profiles 
ADD COLUMN preferences JSONB DEFAULT '{
  "always_skip_intro": false,
  "countdown_content_type": "auto",
  "skip_mood_tracking": false,
  "pinned_exercises": []
}'::jsonb;
```

**Features:**
- User settings page
- Dashboard customization
- Pinned favorites on Dnes page

### Phase 5: v4.0 (Exercise Studio)

**Features:**
- Custom exercise builder
- Template system
- Community sharing
- Teacher assignments (for teacher role)

---

## Technical Notes

### Breathing Pattern Structure

```typescript
export interface BreathingPattern {
  version: string; // "1.0"
  type: 'simple' | 'multi-phase';
  phases: ExercisePhase[];
  metadata: {
    total_duration_seconds: number;
    phase_count: number;
    difficulty: ExerciseDifficulty;
    tags: string[];
  };
}

export interface ExercisePhase {
  order: number;
  type: 'breathing' | 'silence';
  name: string;
  description: string;
  pattern: {
    inhale_seconds: number;
    hold_after_inhale_seconds: number;
    exhale_seconds: number;
    hold_after_exhale_seconds: number;
  } | null;
  duration_seconds: number;
  cycles_count: number | null;
  instructions?: string;
}
```

### Current Limitations

1. **No custom exercises yet** - Only admin presets
2. **No templates** - Each exercise is unique
3. **No sharing** - Exercises are not shareable between users
4. **No permissions** - All users see same exercises (filtered by tier)
5. **No user preferences** - All users have same flow/content

### Future Considerations

1. **AI Coach Integration:**
   - Generate personalized exercises
   - Adapt difficulty based on performance
   - Suggest optimal timing

2. **Teacher Features:**
   - Assign exercises to students
   - Track student progress
   - Create custom protocols for classes

3. **Community Features:**
   - Share exercises publicly
   - Rate and review
   - Follow favorite creators

---

## References

- TypeScript Types: `src/modules/mvp0/types/exercises.ts`
- Helper Functions: `src/utils/exerciseHelpers.ts`
- SessionCountdown: `src/modules/mvp0/components/session-engine/components/SessionCountdown.tsx`
- SessionActive: `src/modules/mvp0/components/session-engine/components/SessionActive.tsx`
- Database Schema: Supabase dashboard → `exercises` table

---

**Last Updated:** 2026-01-24  
**Version:** 0.2.0 (MVP)  
**Next Review:** When starting Exercise Studio design (v1.0)
