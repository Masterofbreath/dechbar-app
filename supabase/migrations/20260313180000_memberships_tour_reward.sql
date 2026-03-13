-- Migration: memberships — rozšíření o Tour odměnu
-- Additive-only: ADD COLUMN IF NOT EXISTS + úprava status CHECK constraintu.
--
-- Přidáme:
--   tour_reward_phase         — 1 = za Fázi 1 (Úroveň 1), 2 = za Fázi 2 (Úroveň 2)
--   tour_reward_granted_at    — kdy byla odměna přidělena
-- Rozšíříme status CHECK:
--   'superseded' — starý Tour reward řádek po koupi předplatného

-- Nové sloupce pro Tour odměnu
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS tour_reward_phase INTEGER DEFAULT NULL
    CHECK (tour_reward_phase IN (1, 2)),
  ADD COLUMN IF NOT EXISTS tour_reward_granted_at TIMESTAMPTZ DEFAULT NULL;

-- Rozšíření status CHECK constraintu o 'superseded'
-- (Bezpečná operace: DROP + přidání nového constraintu se stejným názvem)
DO $$
BEGIN
  -- Odstraníme existující CHECK constraint na status (pokud existuje)
  ALTER TABLE public.memberships
    DROP CONSTRAINT IF EXISTS memberships_status_check;

  -- Přidáme rozšířený CHECK constraint včetně 'superseded'
  ALTER TABLE public.memberships
    ADD CONSTRAINT memberships_status_check
      CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'superseded'));

  RAISE NOTICE 'memberships status CHECK constraint rozšířen o superseded';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'memberships status CHECK: % (ignoruji, constraint pravděpodobně již v pořádku)', SQLERRM;
END;
$$;

COMMENT ON COLUMN public.memberships.tour_reward_phase IS
  'Fáze Tour odměny: 1 = základní (1 den SMART), 2 = rozšířená (+2 dny SMART). NULL = žádná tour odměna.';

COMMENT ON COLUMN public.memberships.tour_reward_granted_at IS
  'Kdy byla Tour odměna přidělena uživateli.';
