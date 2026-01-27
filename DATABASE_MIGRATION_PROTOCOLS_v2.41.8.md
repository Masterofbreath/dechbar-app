# 🔄 Supabase Database Migration: Protocol Naming

**Created:** 2026-01-27  
**Purpose:** Update protocol names for better UX clarity  
**Changes:** `RESET` → `KLID`, `NOC` → `VEČER`

---

## 📋 **CONTEXT**

### **Why These Changes?**

| Old Name | New Name | Reason |
|----------|----------|--------|
| **RESET** | **KLID** | More wellbeing-friendly, less technical jargon |
| **NOC** | **VEČER** | Clearer time-based communication, self-explanatory |
| **RÁNO** | **RÁNO** | Already clear, no change needed |

### **Apple Premium Style Alignment:**
- ✅ Clear benefit communication (KLID = calm, peace)
- ✅ Time-based consistency (RÁNO, VEČER)
- ✅ Minimální kognitivní zátěž

---

## 🚀 **HOW TO RUN MIGRATION**

### **1. Access Supabase Dashboard**

1. Go to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Login with your credentials
3. Select project: **dechbar-app** (or your project name)

### **2. Open SQL Editor**

1. Click **"SQL Editor"** in left sidebar
2. Click **"New Query"** button (top right)

### **3. Copy-Paste SQL Script**

Copy the entire SQL script below and paste into the editor:

```sql
-- ============================================================
-- Migration: Rename Protocol Names (RESET → KLID, NOC → VEČER)
-- Created: 2026-01-27
-- ============================================================

-- STEP 1: Update exercises table (main protocol names)
-- ============================================================

-- Update RESET → KLID
UPDATE exercises 
SET 
  name = 'KLID',
  description = CASE 
    WHEN description LIKE '%reset%' THEN REPLACE(description, 'reset', 'klid')
    WHEN description LIKE '%Reset%' THEN REPLACE(description, 'Reset', 'Klid')
    ELSE description
  END,
  updated_at = NOW()
WHERE name = 'RESET';

-- Update NOC → VEČER  
UPDATE exercises 
SET 
  name = 'VEČER',
  description = CASE 
    WHEN description LIKE '%noc%' THEN REPLACE(description, 'noc', 'večer')
    WHEN description LIKE '%Noc%' THEN REPLACE(description, 'Noc', 'Večer')
    WHEN description LIKE '%noční%' THEN REPLACE(description, 'noční', 'večerní')
    ELSE description
  END,
  updated_at = NOW()
WHERE name = 'NOC';

-- ============================================================
-- STEP 2: Verify changes
-- ============================================================

-- Check updated protocols
SELECT 
  id,
  name,
  description,
  total_duration_seconds,
  difficulty_level,
  created_at,
  updated_at
FROM exercises 
WHERE name IN ('RÁNO', 'KLID', 'VEČER')
ORDER BY 
  CASE name
    WHEN 'RÁNO' THEN 1
    WHEN 'KLID' THEN 2
    WHEN 'VEČER' THEN 3
  END;

-- ============================================================
-- STEP 3: Update user sessions (if any existing data)
-- ============================================================

-- Check if sessions table exists and has exercise_name column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'sessions'
  ) THEN
    
    -- Update sessions with old protocol names
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'sessions' 
      AND column_name = 'exercise_name'
    ) THEN
      
      UPDATE sessions
      SET 
        exercise_name = 'KLID',
        updated_at = NOW()
      WHERE exercise_name = 'RESET';
      
      UPDATE sessions
      SET 
        exercise_name = 'VEČER',
        updated_at = NOW()
      WHERE exercise_name = 'NOC';
      
      RAISE NOTICE 'Updated sessions table successfully';
    ELSE
      RAISE NOTICE 'Sessions table does not have exercise_name column, skipping';
    END IF;
    
  ELSE
    RAISE NOTICE 'Sessions table does not exist, skipping';
  END IF;
END $$;

-- ============================================================
-- STEP 4: Update user favorites/bookmarks (if applicable)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'user_favorites'
  ) THEN
    
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'user_favorites' 
      AND column_name = 'exercise_id'
    ) THEN
      
      -- No action needed - favorites use exercise_id (FK), not name
      RAISE NOTICE 'User favorites reference by ID, no update needed';
      
    END IF;
    
  ELSE
    RAISE NOTICE 'User favorites table does not exist, skipping';
  END IF;
END $$;

-- ============================================================
-- STEP 5: Final verification & summary
-- ============================================================

-- Count protocols
SELECT 
  'Protocol Counts' as info,
  COUNT(*) FILTER (WHERE name = 'RÁNO') as rano_count,
  COUNT(*) FILTER (WHERE name = 'KLID') as klid_count,
  COUNT(*) FILTER (WHERE name = 'VEČER') as vecer_count,
  COUNT(*) FILTER (WHERE name IN ('RESET', 'NOC')) as old_protocols_remaining
FROM exercises;
```

### **4. Execute Migration**

1. Click **"Run"** button (or press `Cmd/Ctrl + Enter`)
2. Wait for execution (should take ~1-2 seconds)
3. Check output panel for results

### **5. Verify Results**

Expected output:
```
✓ exercises updated (2 rows)
✓ Protocol Counts:
  - rano_count: 1
  - klid_count: 1
  - vecer_count: 1
  - old_protocols_remaining: 0
```

---

## 🔄 **ROLLBACK (If Needed)**

If you need to revert changes:

```sql
-- Rollback: KLID → RESET, VEČER → NOC

UPDATE exercises 
SET 
  name = 'RESET',
  description = REPLACE(description, 'klid', 'reset')
WHERE name = 'KLID';

UPDATE exercises 
SET 
  name = 'NOC',
  description = REPLACE(description, 'večer', 'noc')
WHERE name = 'VEČER';

-- Verify rollback
SELECT name FROM exercises WHERE name IN ('RÁNO', 'RESET', 'NOC');
```

---

## ✅ **POST-MIGRATION CHECKLIST**

### **1. Database Verification**

Run in Supabase SQL Editor:
```sql
SELECT id, name, description 
FROM exercises 
WHERE name IN ('RÁNO', 'KLID', 'VEČER');
```

Expected: 3 rows (RÁNO, KLID, VEČER)

### **2. Frontend Testing**

- [ ] Navigate to `/app/dnes`
- [ ] See 3 protocol buttons: **RÁNO**, **KLID**, **VEČER**
- [ ] Click **RÁNO** → opens morning protocol ✅
- [ ] Click **KLID** → opens calm/reset protocol ✅
- [ ] Click **VEČER** → opens evening protocol ✅
- [ ] Check icons: sun (RÁNO), wind (KLID), moon (VEČER)

### **3. Mobile Testing**

- [ ] Open on mobile device (iPhone/Android)
- [ ] Protocol buttons display correctly
- [ ] Icons + labels readable
- [ ] Clicking works smoothly

---

## 📊 **AFFECTED TABLES**

| Table | Column | Change | Impact |
|-------|--------|--------|--------|
| `exercises` | `name` | RESET→KLID, NOC→VEČER | ⚠️ **HIGH** (main data) |
| `sessions` | `exercise_name` | Updated if exists | ⚠️ **MEDIUM** (historical data) |
| `user_favorites` | `exercise_id` | No change (uses FK) | ✅ **NONE** |

---

## 🎯 **FRONTEND CHANGES (Already Applied)**

- ✅ `DnesPage.tsx` - Updated button labels + icons
- ✅ `PresetProtocolButton.tsx` - Updated TypeScript types
- ✅ `SessionCountdown.tsx` - Refactored exercise name display
- ✅ `SessionActive.tsx` - Refactored exercise name display

---

## ⚠️ **IMPORTANT NOTES**

1. **Backup:** This is a **destructive operation**. Supabase auto-backs up daily, but consider manual backup if critical.
2. **Timing:** Run during low-traffic period (ideally 2-4 AM CET).
3. **Testing:** Test on **TEST environment** first if available.
4. **Rollback:** Keep rollback script handy for 24h post-migration.

---

## 📞 **SUPPORT**

- **Issues:** Check `FOUNDATION/13_DATABASE_MIGRATIONS.md`
- **Questions:** Contact team via Slack/Discord
- **Emergency Rollback:** Use rollback script above

---

**Last Updated:** 2026-01-27  
**Version:** 1.0  
**Status:** ✅ Ready to Execute
