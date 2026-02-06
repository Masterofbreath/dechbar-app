# Challenge Progress - SQL Migration

**File:** `20260205134945_create_challenge_progress.sql`  
**Status:** Ready for manual application  
**Reason:** Supabase migrations folder is filtered by `.cursorignore`

---

## 📝 SQL Migration Content

Copy this SQL and run it in **Supabase SQL Editor**:

```sql
-- =====================================================
-- Challenge Progress Tracking Migration
-- Created: 2026-02-05
-- Purpose: Track user progress through 21-day challenge
-- =====================================================

-- Create challenge_progress table
-- Stores completion status for each day of the challenge

CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL, -- e.g., 'challenge-2026-03'
  day_number INT NOT NULL CHECK (day_number >= 1 AND day_number <= 21),
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can only have one record per challenge day
  UNIQUE(user_id, challenge_id, day_number)
);

-- Add helpful comment
COMMENT ON TABLE challenge_progress IS 'Tracks user progress through 21-day breathing challenges';
COMMENT ON COLUMN challenge_progress.day_number IS 'Day number in challenge (1-21)';
COMMENT ON COLUMN challenge_progress.completed_at IS 'When user completed this day (NULL = not completed yet)';

-- Create index for fast lookups
CREATE INDEX idx_challenge_progress_user_challenge 
ON challenge_progress(user_id, challenge_id);

CREATE INDEX idx_challenge_progress_day 
ON challenge_progress(challenge_id, day_number);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own progress
CREATE POLICY "Users can view own progress"
ON challenge_progress FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own progress
CREATE POLICY "Users can insert own progress"
ON challenge_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own progress
CREATE POLICY "Users can update own progress"
ON challenge_progress FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all progress
CREATE POLICY "Admins can view all progress"
ON challenge_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'ceo')
  )
);

-- =====================================================
-- HELPER FUNCTION: Mark Challenge Day Complete
-- =====================================================

CREATE OR REPLACE FUNCTION mark_challenge_day_complete(
  p_user_id UUID,
  p_challenge_id TEXT,
  p_day_number INT,
  p_exercise_id UUID,
  p_duration_seconds INT
)
RETURNS challenge_progress
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress challenge_progress;
BEGIN
  -- Insert or update progress record
  INSERT INTO challenge_progress (
    user_id,
    challenge_id,
    day_number,
    exercise_id,
    completed_at,
    duration_seconds
  )
  VALUES (
    p_user_id,
    p_challenge_id,
    p_day_number,
    p_exercise_id,
    NOW(),
    p_duration_seconds
  )
  ON CONFLICT (user_id, challenge_id, day_number)
  DO UPDATE SET
    completed_at = NOW(),
    duration_seconds = p_duration_seconds,
    exercise_id = p_exercise_id
  RETURNING * INTO v_progress;
  
  RETURN v_progress;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_challenge_day_complete TO authenticated;

COMMENT ON FUNCTION mark_challenge_day_complete IS 'Mark a challenge day as completed (upsert)';

-- =====================================================
-- HELPER FUNCTION: Get Challenge Progress Summary
-- =====================================================

CREATE OR REPLACE FUNCTION get_challenge_progress_summary(
  p_user_id UUID,
  p_challenge_id TEXT
)
RETURNS TABLE (
  total_days INT,
  completed_days INT,
  current_streak INT,
  last_completed_day INT,
  completion_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH progress_data AS (
    SELECT 
      day_number,
      completed_at IS NOT NULL as is_completed
    FROM challenge_progress
    WHERE user_id = p_user_id
      AND challenge_id = p_challenge_id
    ORDER BY day_number
  )
  SELECT 
    21::INT as total_days,
    COUNT(*) FILTER (WHERE is_completed)::INT as completed_days,
    -- TODO: Calculate current streak (consecutive completed days)
    0::INT as current_streak,
    MAX(day_number) FILTER (WHERE is_completed)::INT as last_completed_day,
    ROUND((COUNT(*) FILTER (WHERE is_completed)::NUMERIC / 21) * 100, 1) as completion_percentage
  FROM progress_data;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_challenge_progress_summary TO authenticated;

COMMENT ON FUNCTION get_challenge_progress_summary IS 'Get summary statistics for user challenge progress';
```

---

## 🚀 How to Apply

1. Open **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Create **New Query**
4. Copy-paste SQL above
5. Click **Run**
6. Verify table created: Check **Table Editor** → `challenge_progress`

---

## ✅ Verification Queries

After running migration, verify with these queries:

### Check table exists
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'challenge_progress';
```

### Check RLS policies
```sql
SELECT * 
FROM pg_policies 
WHERE tablename = 'challenge_progress';
```

### Check functions
```sql
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname IN ('mark_challenge_day_complete', 'get_challenge_progress_summary');
```

---

## 📊 Table Schema

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `user_id` | UUID | NO | User reference (FK) |
| `challenge_id` | TEXT | NO | Challenge identifier |
| `day_number` | INT | NO | Day 1-21 |
| `exercise_id` | UUID | YES | Exercise reference (FK) |
| `completed_at` | TIMESTAMP | YES | Completion timestamp |
| `duration_seconds` | INT | YES | Exercise duration |
| `created_at` | TIMESTAMP | NO | Record creation |

**Constraints:**
- UNIQUE: `(user_id, challenge_id, day_number)`
- CHECK: `day_number >= 1 AND day_number <= 21`

---

## 🔒 RLS Policies

1. **"Users can view own progress"** - SELECT
   - Users see only their own progress
   
2. **"Users can insert own progress"** - INSERT
   - Users can create their own progress records
   
3. **"Users can update own progress"** - UPDATE
   - Users can update their own progress records
   
4. **"Admins can view all progress"** - SELECT
   - Admin/CEO can see all user progress

---

## 🛠️ Helper Functions

### mark_challenge_day_complete()

**Purpose:** Upsert challenge day completion

**Usage:**
```sql
SELECT mark_challenge_day_complete(
  'user-uuid'::UUID,
  'challenge-2026-03'::TEXT,
  5::INT, -- day 5
  'exercise-uuid'::UUID,
  420::INT -- 7 minutes
);
```

### get_challenge_progress_summary()

**Purpose:** Get user's challenge statistics

**Usage:**
```sql
SELECT * FROM get_challenge_progress_summary(
  'user-uuid'::UUID,
  'challenge-2026-03'::TEXT
);
```

**Returns:**
```
total_days | completed_days | current_streak | last_completed_day | completion_percentage
-----------+----------------+----------------+--------------------+----------------------
21         | 5              | 0              | 5                  | 23.8
```

---

## ⚠️ Important Notes

1. **Run BEFORE using component** - Component expects this table to exist
2. **Backup first** - Always backup before running migrations
3. **Test in staging** - Test migration in test environment first
4. **Check profiles.role** - Make sure `profiles` table has `role` column for admin detection

---

## 🔗 Related Files

- Component: `src/modules/mvp0/components/TodaysChallengeButton/`
- Hook: `src/modules/mvp0/hooks/useActiveChallenge.ts`
- Types: `src/modules/mvp0/types/challenge.types.ts`
- README: `src/modules/mvp0/components/TodaysChallengeButton/README.md`
