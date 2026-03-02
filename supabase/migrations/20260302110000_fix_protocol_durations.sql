-- ============================================================
-- FIX PROTOCOL DURATIONS
-- Date: 2026-03-02
-- Reason: Commit 618a447 updated RÁNO and KLID durations via direct
--   MCP SQL but never created a migration file. This migration
--   permanently records those intended changes:
--   - RÁNO: 330s (6 min) → 420s (7 min)
--       Aktivace: 30s → 60s, Peak Aktivace: 30s → 60s, Uklidnění: 60s → 90s
--   - KLID: 420s (7 min) → 300s (5 min)
--       Simplified to 5 phases (progressive exhale + nosní bzučení)
--   - VEČER: unchanged (570s = ~10 min ✅)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. RÁNO — 7 fází, 420s (7 min)
-- ─────────────────────────────────────────────
UPDATE public.exercises
SET
  total_duration_seconds = 420,
  phase_count            = 7,
  breathing_pattern      = '{
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
                    "exhale_seconds": 1.5, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
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
                    "exhale_seconds": 1.5, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
      },
      {
        "order": 6, "type": "breathing", "name": "Uklidnění",
        "description": "Pomalý rytmus",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 6, "hold_after_exhale_seconds": 0},
        "duration_seconds": 90, "cycles_count": null
      },
      {
        "order": 7, "type": "silence", "name": "Doznění",
        "description": "Pozoruj své tělo",
        "instructions": "Dýchej ve svém volném rytmu, pozoruj své tělo",
        "pattern": null,
        "duration_seconds": 30, "cycles_count": null
      }
    ],
    "metadata": {
      "total_duration_seconds": 420,
      "phase_count": 7,
      "difficulty": "intermediate",
      "tags": ["morning", "energy", "multi-phase"]
    }
  }'::jsonb,
  updated_at = NOW()
WHERE name = 'RÁNO' AND category = 'preset';

-- ─────────────────────────────────────────────
-- 2. KLID — 5 fází, 300s (5 min)
-- ─────────────────────────────────────────────
UPDATE public.exercises
SET
  total_duration_seconds = 300,
  phase_count            = 5,
  breathing_pattern      = '{
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
        "order": 2, "type": "breathing", "name": "Prodloužení",
        "description": "Nádech 4s, výdech 7s",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 7, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
      },
      {
        "order": 3, "type": "breathing", "name": "Maximální výdech",
        "description": "Nádech 4s, výdech 8s",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 8, "hold_after_exhale_seconds": 0},
        "duration_seconds": 60, "cycles_count": null
      },
      {
        "order": 4, "type": "breathing", "name": "Nosní bzučení",
        "description": "Nádech 4s, výdech 8s s nosním bzučením",
        "instructions": "Při výdechu jemně bzučej nosem (hmmm)",
        "pattern": {"inhale_seconds": 4, "hold_after_inhale_seconds": 0,
                    "exhale_seconds": 8, "hold_after_exhale_seconds": 0},
        "duration_seconds": 90, "cycles_count": null
      },
      {
        "order": 5, "type": "silence", "name": "Doznění",
        "description": "Ticho, pozoruj své tělo",
        "instructions": "Dýchej ve svém volném rytmu, pozoruj své tělo",
        "pattern": null,
        "duration_seconds": 30, "cycles_count": null
      }
    ],
    "metadata": {
      "total_duration_seconds": 300,
      "phase_count": 5,
      "difficulty": "beginner",
      "tags": ["calm", "stress", "reset", "multi-phase"]
    }
  }'::jsonb,
  updated_at = NOW()
WHERE name = 'KLID' AND category = 'preset';

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
    RAISE NOTICE '✅ %: % sec (%s min), % phases',
      r.name, r.total_duration_seconds,
      round(r.total_duration_seconds / 60.0),
      r.actual_phases;
  END LOOP;
END;
$$;
