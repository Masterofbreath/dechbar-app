-- =====================================================
-- DechBar Exercises System - MVP1
-- Date: 2026-01-19
-- Author: AI Agent
-- Purpose: Multi-phase breathing exercise system with tier-based access control
-- =====================================================

-- =====================================================
-- TABLE: exercises
-- Purpose: Store both admin preset exercises and user custom exercises
-- =====================================================
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('preset', 'custom')),
  subcategory TEXT CHECK (subcategory IN ('morning', 'evening', 'stress', 'sleep', 'focus', 'energy')),
  
  -- Ownership & Visibility
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  
  -- Tier Requirements
  required_tier TEXT CHECK (required_tier IN ('ZDARMA', 'SMART', 'AI_COACH')),
  
  -- Multi-Phase Protocol Data (JSONB for flexibility)
  breathing_pattern JSONB NOT NULL,
  
  -- Denormalized Metadata (for quick queries without parsing JSONB)
  total_duration_seconds INTEGER NOT NULL,
  phase_count INTEGER NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  
  -- Tags for filtering/search
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Safety Contraindications
  contraindications TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Soft Delete Support
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: exercise_sessions
-- Purpose: Track user exercise completion history
-- =====================================================
CREATE TABLE IF NOT EXISTS public.exercise_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  
  -- Session Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  was_completed BOOLEAN DEFAULT false,
  
  -- Quality Metrics (MVP1: basic, MVP2: BOLT score, HRV)
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  
  -- Mood Tracking
  mood_before TEXT CHECK (mood_before IN ('stressed', 'calm', 'tired', 'energized', 'neutral')),
  mood_after TEXT CHECK (mood_after IN ('stressed', 'calm', 'tired', 'energized', 'neutral')),
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Exercises table indexes
CREATE INDEX IF NOT EXISTS exercises_created_by_idx ON public.exercises(created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS exercises_category_idx ON public.exercises(category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS exercises_public_idx ON public.exercises(is_public) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS exercises_tier_idx ON public.exercises(required_tier) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS exercises_duration_idx ON public.exercises(total_duration_seconds) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS exercises_tags_idx ON public.exercises USING GIN (tags);
CREATE INDEX IF NOT EXISTS exercises_deleted_idx ON public.exercises(deleted_at);

-- Exercise sessions indexes
CREATE INDEX IF NOT EXISTS sessions_user_idx ON public.exercise_sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_exercise_idx ON public.exercise_sessions(exercise_id);
CREATE INDEX IF NOT EXISTS sessions_completed_idx ON public.exercise_sessions(completed_at DESC) WHERE was_completed = true;
CREATE INDEX IF NOT EXISTS sessions_started_idx ON public.exercise_sessions(started_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;

-- Exercises Policies
CREATE POLICY "exercises_select_public"
  ON public.exercises FOR SELECT
  USING (
    (is_public = true AND deleted_at IS NULL) OR
    (auth.uid() = created_by)
  );

CREATE POLICY "exercises_insert_own"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "exercises_update_own"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "exercises_delete_own"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = created_by);

-- Admin bypass (for CEO/admin roles to manage all exercises)
CREATE POLICY "exercises_admin_all"
  ON public.exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('admin', 'ceo')
    )
  );

-- Exercise Sessions Policies
CREATE POLICY "sessions_select_own"
  ON public.exercise_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sessions_insert_own"
  ON public.exercise_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_update_own"
  ON public.exercise_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- SAFETY FLAGS (add to profiles table)
-- =====================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS safety_flags JSONB DEFAULT '{
  "questionnaire_completed": false,
  "epilepsy": false,
  "pregnancy": false,
  "cardiovascular": false,
  "asthma": false
}'::jsonb;

-- =====================================================
-- SEED DATA: 6 Preset Protocols
-- =====================================================

-- 1. BOX BREATHING (4-4-4-4)
INSERT INTO public.exercises (
  id,
  name,
  description,
  category,
  subcategory,
  created_by,
  is_public,
  required_tier,
  breathing_pattern,
  total_duration_seconds,
  phase_count,
  difficulty,
  tags,
  contraindications
) VALUES (
  'box-breathing-preset',
  'Box Breathing',
  'Klasická technika 4-4-4-4 pro okamžité uklidnění a focus',
  'preset',
  'focus',
  NULL,
  true,
  'ZDARMA',
  '{"version":"1.0","type":"simple","phases":[{"order":1,"type":"breathing","name":"Box Breathing","description":"Rovnoměrný rytmus pro klid","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":4,"exhale_seconds":4,"hold_after_exhale_seconds":4},"duration_seconds":300,"cycles_count":null}],"metadata":{"total_duration_seconds":300,"phase_count":1,"difficulty":"beginner","tags":["focus","calm","beginner"]}}'::jsonb,
  300,
  1,
  'beginner',
  ARRAY['focus', 'calm', 'beginner', 'stress-relief'],
  ARRAY[]::TEXT[]
);

-- 2. CALM (4-6 Pattern)
INSERT INTO public.exercises (
  id,
  name,
  description,
  category,
  subcategory,
  created_by,
  is_public,
  required_tier,
  breathing_pattern,
  total_duration_seconds,
  phase_count,
  difficulty,
  tags,
  contraindications
) VALUES (
  'calm-breathing-preset',
  'Calm',
  'Prodloužený výdech pro rychlé uklidnění',
  'preset',
  'stress',
  NULL,
  true,
  'ZDARMA',
  '{"version":"1.0","type":"simple","phases":[{"order":1,"type":"breathing","name":"Calm Breathing","description":"Delší výdech aktivuje parasympatikus","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":6,"hold_after_exhale_seconds":0},"duration_seconds":300,"cycles_count":null}],"metadata":{"total_duration_seconds":300,"phase_count":1,"difficulty":"beginner","tags":["calm","stress","beginner"]}}'::jsonb,
  300,
  1,
  'beginner',
  ARRAY['calm', 'stress', 'beginner', 'anxiety-relief'],
  ARRAY[]::TEXT[]
);

-- 3. COHERENCE (5-5 Pattern)
INSERT INTO public.exercises (
  id,
  name,
  description,
  category,
  subcategory,
  created_by,
  is_public,
  required_tier,
  breathing_pattern,
  total_duration_seconds,
  phase_count,
  difficulty,
  tags,
  contraindications
) VALUES (
  'coherence-breathing-preset',
  'Coherence',
  'Optimální rytmus pro srdeční variabilitu (HRV)',
  'preset',
  'focus',
  NULL,
  true,
  'ZDARMA',
  '{"version":"1.0","type":"simple","phases":[{"order":1,"type":"breathing","name":"Coherent Breathing","description":"5 sekund nádech, 5 sekund výdech pro optimální HRV","pattern":{"inhale_seconds":5,"hold_after_inhale_seconds":0,"exhale_seconds":5,"hold_after_exhale_seconds":0},"duration_seconds":300,"cycles_count":null}],"metadata":{"total_duration_seconds":300,"phase_count":1,"difficulty":"beginner","tags":["coherence","hrv","focus"]}}'::jsonb,
  300,
  1,
  'beginner',
  ARRAY['coherence', 'hrv', 'focus', 'performance'],
  ARRAY[]::TEXT[]
);

-- 4. RÁNO (7-phase Morning Protocol)
INSERT INTO public.exercises (
  id, name, description, category, subcategory, created_by, is_public, required_tier,
  breathing_pattern, total_duration_seconds, phase_count, difficulty, tags, contraindications
) VALUES (
  'rano-protocol-preset',
  'RÁNO',
  'Ranní aktivace s postupnou progresí dechové frekvence',
  'preset',
  'morning',
  NULL,
  true,
  'ZDARMA',
  '{"version":"1.0","type":"multi-phase","phases":[{"order":1,"type":"breathing","name":"Zahřátí","description":"Pomalý rytmus pro aktivaci","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":6,"hold_after_exhale_seconds":0},"duration_seconds":60,"cycles_count":null},{"order":2,"type":"breathing","name":"Prodloužení","description":"Delší výdech pro uklidnění","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":7,"hold_after_exhale_seconds":0},"duration_seconds":60,"cycles_count":null},{"order":3,"type":"breathing","name":"Aktivace","description":"Rychlé dýchání pro energii","pattern":{"inhale_seconds":3,"hold_after_inhale_seconds":0,"exhale_seconds":1.5,"hold_after_exhale_seconds":0},"duration_seconds":30,"cycles_count":null},{"order":4,"type":"breathing","name":"Stabilizace","description":"Hluboký dech","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":7,"hold_after_exhale_seconds":0},"duration_seconds":60,"cycles_count":null},{"order":5,"type":"breathing","name":"Peak Aktivace","description":"Intenzivní dech","pattern":{"inhale_seconds":3,"hold_after_inhale_seconds":0,"exhale_seconds":1.5,"hold_after_exhale_seconds":0},"duration_seconds":30,"cycles_count":null},{"order":6,"type":"breathing","name":"Uklidnění","description":"Pomalý rytmus","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":6,"hold_after_exhale_seconds":0},"duration_seconds":60,"cycles_count":null},{"order":7,"type":"silence","name":"Doznění","description":"Pozoruj své tělo","pattern":null,"duration_seconds":30,"cycles_count":null}],"metadata":{"total_duration_seconds":330,"phase_count":7,"difficulty":"intermediate","tags":["morning","energy","multi-phase"]}}'::jsonb,
  330,
  7,
  'intermediate',
  ARRAY['morning', 'energy', 'multi-phase', 'intermediate'],
  ARRAY[]::TEXT[]
);

-- 5. RESET (7-phase Midday Protocol)
INSERT INTO public.exercises (
  id, name, description, category, subcategory, created_by, is_public, required_tier,
  breathing_pattern, total_duration_seconds, phase_count, difficulty, tags, contraindications
) VALUES (
  'reset-protocol-preset',
  'RESET',
  'Poledavní reset s progresivním výdechem a nosním bzučením',
  'preset',
  'stress',
  NULL,
  true,
  'ZDARMA',
  '{"version":"1.0","type":"multi-phase","phases":[{"order":1,"type":"breathing","name":"Zahájení","description":"Nádech 4s, výdech 5s","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":5,"hold_after_exhale_seconds":0},"duration_seconds":60,"cycles_count":null},{"order":2,"type":"breathing","name":"Prodloužení 1","description":"Nádech 4s, výdech 6s","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":6,"hold_after_exhale_seconds":0},"duration_seconds":60,"cycles_count":null},{"order":3,"type":"breathing","name":"Prodloužení 2","description":"Nádech 4s, výdech 7s","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":7,"hold_after_exhale_seconds":0},"duration_seconds":60,"cycles_count":null},{"order":4,"type":"breathing","name":"Maximální výdech","description":"Nádech 4s, výdech 8s","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":8,"hold_after_exhale_seconds":0},"duration_seconds":60,"cycles_count":null},{"order":5,"type":"breathing","name":"Nosní bzučení","description":"Nádech 4s, výdech 8s s nosním bzučením (humming)","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":8,"hold_after_exhale_seconds":0},"duration_seconds":60,"cycles_count":null,"instructions":"Při výdechu jemně bzučej nosem (hmmm)"},{"order":6,"type":"breathing","name":"Stabilizace","description":"Nádech 4s, výdech 7s","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":7,"hold_after_exhale_seconds":0},"duration_seconds":90,"cycles_count":null},{"order":7,"type":"silence","name":"Doznění","description":"Ticho, pozoruj své tělo","pattern":null,"duration_seconds":30,"cycles_count":null}],"metadata":{"total_duration_seconds":420,"phase_count":7,"difficulty":"intermediate","tags":["reset","stress","multi-phase"]}}'::jsonb,
  420,
  7,
  'intermediate',
  ARRAY['reset', 'stress', 'multi-phase', 'intermediate', 'humming'],
  ARRAY[]::TEXT[]
);

-- 6. NOC (5-phase Evening Protocol)
INSERT INTO public.exercises (
  id, name, description, category, subcategory, created_by, is_public, required_tier,
  breathing_pattern, total_duration_seconds, phase_count, difficulty, tags, contraindications
) VALUES (
  'noc-protocol-preset',
  'NOC',
  'Večerní relaxace s hlubokým dýcháním a nosním bzučením pro lepší spánek',
  'preset',
  'evening',
  NULL,
  true,
  'ZDARMA',
  '{"version":"1.0","type":"multi-phase","phases":[{"order":1,"type":"breathing","name":"Zahájení","description":"Nádech 4s, výdech 4s","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":4,"hold_after_exhale_seconds":0},"duration_seconds":60,"cycles_count":null},{"order":2,"type":"breathing","name":"Hluboké dýchání","description":"Nádech 4s, výdech 5s (připomenutí nádechu do břicha)","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":5,"hold_after_exhale_seconds":0},"duration_seconds":120,"cycles_count":null,"instructions":"Dýchej hluboko do břicha"},{"order":3,"type":"breathing","name":"Prodloužený výdech","description":"Nádech 4s, výdech 6s (připomenutí nádechu do břicha)","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":6,"hold_after_exhale_seconds":0},"duration_seconds":180,"cycles_count":null,"instructions":"Dýchej hluboko do břicha"},{"order":4,"type":"breathing","name":"Nosní bzučení","description":"Nádech 4s, výdech 6s s nosním bzučením","pattern":{"inhale_seconds":4,"hold_after_inhale_seconds":0,"exhale_seconds":6,"hold_after_exhale_seconds":0},"duration_seconds":180,"cycles_count":null,"instructions":"Při výdechu jemně bzučej nosem (hmmm)"},{"order":5,"type":"silence","name":"Doznění","description":"Ticho, připrav se na spánek","pattern":null,"duration_seconds":30,"cycles_count":null}],"metadata":{"total_duration_seconds":570,"phase_count":5,"difficulty":"beginner","tags":["evening","sleep","relaxation","multi-phase"]}}'::jsonb,
  570,
  5,
  'beginner',
  ARRAY['evening', 'sleep', 'relaxation', 'multi-phase', 'humming'],
  ARRAY[]::TEXT[]
);

-- =====================================================
-- COMMENTS (for documentation)
-- =====================================================

COMMENT ON TABLE public.exercises IS 'Multi-phase breathing exercises (admin presets + user custom)';
COMMENT ON COLUMN public.exercises.breathing_pattern IS 'JSONB: Multi-phase protocol definition with phases array';
COMMENT ON COLUMN public.exercises.contraindications IS 'Array of safety flags (epilepsy, pregnancy, water_activities)';
COMMENT ON COLUMN public.exercises.deleted_at IS 'Soft delete timestamp (NULL = active, NOT NULL = deleted)';

COMMENT ON TABLE public.exercise_sessions IS 'User exercise completion history with mood tracking';
COMMENT ON COLUMN public.exercise_sessions.was_completed IS 'True if user completed all phases, false if abandoned';

COMMENT ON COLUMN public.profiles.safety_flags IS 'JSONB: Safety questionnaire responses (epilepsy, pregnancy, etc)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ DechBar Exercises System created successfully!';
  RAISE NOTICE '📊 Tables: exercises, exercise_sessions';
  RAISE NOTICE '🔐 RLS policies: enabled';
  RAISE NOTICE '🌱 Seed data: 6 preset protocols (BOX, Calm, Coherence, RÁNO, RESET, NOC)';
END $$;
