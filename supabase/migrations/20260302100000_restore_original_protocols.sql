-- ============================================================
-- RESTORE ORIGINAL PROTOCOLS (January 2026 design)
-- Date: 2026-03-02
-- Reason: On 2026-02-27 an AI agent replaced the original 7-phase
--   protocols with simplified 4-phase versions directly in Supabase
--   dashboard (not through migrations). This migration restores the
--   original designs: RÁNO (7 phases, 330s), KLID (7 phases, 420s,
--   formerly RESET), VEČER (5 phases, 570s, formerly NOC).
--   Names RÁNO/KLID/VEČER are PRESERVED (DnesPage depends on them).
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. RÁNO — 7-phase Morning Protocol (330s = ~6 min)
-- Original: Zahřátí → Prodloužení → Aktivace → Stabilizace
--           → Peak Aktivace → Uklidnění → Doznění
-- ─────────────────────────────────────────────
UPDATE public.exercises
SET
  description        = 'Ranní aktivace s postupnou progresí dechové frekvence',
  total_duration_seconds = 330,
  phase_count        = 7,
  difficulty         = 'intermediate',
  tags               = ARRAY['morning', 'energy', 'multi-phase', 'intermediate'],
  breathing_pattern  = '{
    "version": "1.0",
    "type": "multi-phase",
    "phases": [
      {
        "order": 1, "type": "breathing", "name": "Zahřátí",
        "description": "Pomalý rytmus pro aktivaci",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 6, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
      },
      {
        "order": 2, "type": "breathing", "name": "Prodloužení",
        "description": "Delší výdech pro uklidnění",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 7, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
      },
      {
        "order": 3, "type": "breathing", "name": "Aktivace",
        "description": "Rychlé dýchání pro energii",
        "pattern": {"inhale_seconds": 3, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 2, "hold_after_exhale_seconds": 0},
        "duration_seconds": 30, "cycles_count": null
      },
      {
        "order": 4, "type": "breathing", "name": "Stabilizace",
        "description": "Hluboký dech",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 7, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
      },
      {
        "order": 5, "type": "breathing", "name": "Peak Aktivace",
        "description": "Intenzivní dech",
        "pattern": {"inhale_seconds": 3, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 2, "hold_after_exhale_seconds": 0},
        "duration_seconds": 30, "cycles_count": null
      },
      {
        "order": 6, "type": "breathing", "name": "Uklidnění",
        "description": "Pomalý rytmus",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 6, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
      },
      {
        "order": 7, "type": "silence", "name": "Doznění",
        "description": "Pozoruj své tělo",
        "pattern": null,
        "duration_seconds": 30, "cycles_count": null
      }
    ],
    "metadata": {
      "total_duration_seconds": 330,
      "phase_count": 7,
      "difficulty": "intermediate",
      "tags": ["morning", "energy", "multi-phase"]
    }
  }'::jsonb,
  updated_at = NOW()
WHERE name = 'RÁNO' AND category = 'preset';

-- ─────────────────────────────────────────────
-- 2. KLID — 7-phase Stress Reset Protocol (420s = 7 min)
-- Originally named RESET. Renamed to KLID by prev. agent, content preserved here.
-- Zahájení → Prodloužení 1 → Prodloužení 2 → Maximální výdech
--   → Nosní bzučení → Stabilizace → Doznění
-- ─────────────────────────────────────────────
UPDATE public.exercises
SET
  description        = 'Dechový protokol pro okamžité zklidnění a reset nervového systému',
  subcategory        = 'stress',
  total_duration_seconds = 420,
  phase_count        = 7,
  difficulty         = 'intermediate',
  tags               = ARRAY['calm', 'stress', 'reset', 'multi-phase'],
  breathing_pattern  = '{
    "version": "1.0",
    "type": "multi-phase",
    "phases": [
      {
        "order": 1, "type": "breathing", "name": "Zahájení",
        "description": "Nádech 4s, výdech 5s",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 5, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
      },
      {
        "order": 2, "type": "breathing", "name": "Prodloužení 1",
        "description": "Nádech 4s, výdech 6s",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 6, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
      },
      {
        "order": 3, "type": "breathing", "name": "Prodloužení 2",
        "description": "Nádech 4s, výdech 7s",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 7, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
      },
      {
        "order": 4, "type": "breathing", "name": "Maximální výdech",
        "description": "Nádech 4s, výdech 8s",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 8, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
      },
      {
        "order": 5, "type": "breathing", "name": "Nosní bzučení",
        "description": "Nádech 4s, výdech 8s s nosním bzučením",
        "instructions": "Při výdechu jemně bzučej nosem (hmmm)",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 8, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
      },
      {
        "order": 6, "type": "breathing", "name": "Stabilizace",
        "description": "Nádech 4s, výdech 7s",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 7, "hold_after_exhale_seconds": 0},
        "duration_seconds": 90, "cycles_count": null
      },
      {
        "order": 7, "type": "silence", "name": "Doznění",
        "description": "Ticho, pozoruj své tělo",
        "pattern": null,
        "duration_seconds": 30, "cycles_count": null
      }
    ],
    "metadata": {
      "total_duration_seconds": 420,
      "phase_count": 7,
      "difficulty": "intermediate",
      "tags": ["calm", "stress", "reset", "multi-phase"]
    }
  }'::jsonb,
  updated_at = NOW()
WHERE name = 'KLID' AND category = 'preset';

-- ─────────────────────────────────────────────
-- 3. VEČER — 5-phase Evening / Sleep Protocol (570s = ~10 min)
-- Originally named NOC. Renamed to VEČER by prev. agent, content preserved here.
-- Zahájení → Hluboké dýchání → Prodloužený výdech → Nosní bzučení → Doznění
-- ─────────────────────────────────────────────
UPDATE public.exercises
SET
  description        = 'Večerní relaxace s hlubokým dýcháním pro lepší spánek',
  subcategory        = 'evening',
  total_duration_seconds = 570,
  phase_count        = 5,
  difficulty         = 'beginner',
  tags               = ARRAY['evening', 'sleep', 'relaxation', 'multi-phase'],
  breathing_pattern  = '{
    "version": "1.0",
    "type": "multi-phase",
    "phases": [
      {
        "order": 1, "type": "breathing", "name": "Zahájení",
        "description": "Nádech 4s, výdech 4s",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 4, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
      },
      {
        "order": 2, "type": "breathing", "name": "Hluboké dýchání",
        "description": "Nádech 4s, výdech 5s — dýchej hluboko do břicha",
        "instructions": "Dýchej hluboko do břicha",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 5, "hold_after_exhale_seconds": 0},
        "duration_seconds": 120, "cycles_count": null
      },
      {
        "order": 3, "type": "breathing", "name": "Prodloužený výdech",
        "description": "Nádech 4s, výdech 6s — dýchej hluboko do břicha",
        "instructions": "Dýchej hluboko do břicha",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 6, "hold_after_exhale_seconds": 0},
        "duration_seconds": 180, "cycles_count": null
      },
      {
        "order": 4, "type": "breathing", "name": "Nosní bzučení",
        "description": "Nádech 4s, výdech 6s s nosním bzučením",
        "instructions": "Při výdechu jemně bzučej nosem (hmmm)",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 6, "hold_after_exhale_seconds": 0},
        "duration_seconds": 180, "cycles_count": null
      },
      {
        "order": 5, "type": "silence", "name": "Doznění",
        "description": "Ticho, připrav se na spánek",
        "pattern": null,
        "duration_seconds": 30, "cycles_count": null
      }
    ],
    "metadata": {
      "total_duration_seconds": 570,
      "phase_count": 5,
      "difficulty": "beginner",
      "tags": ["evening", "sleep", "relaxation", "multi-phase"]
    }
  }'::jsonb,
  updated_at = NOW()
WHERE name = 'VEČER' AND category = 'preset';

-- Verify
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT name, total_duration_seconds, phase_count,
           jsonb_array_length(breathing_pattern->'phases') AS actual_phases
    FROM public.exercises
    WHERE name IN ('RÁNO','KLID','VEČER') AND category = 'preset'
    ORDER BY name
  LOOP
    RAISE NOTICE '✅ %: % sec, % phases defined, % phases in JSON',
      r.name, r.total_duration_seconds, r.phase_count, r.actual_phases;
  END LOOP;
END;
$$;
