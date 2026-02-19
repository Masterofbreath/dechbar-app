-- =====================================================
-- Migration: Add Digitální ticho products to modules table
-- Date: 2026-02-19
-- Author: AI Agent
-- Purpose: Enable one-time purchase of Digitální ticho (990 Kč)
--          and 3 weekly series (390 Kč each) via Stripe
-- =====================================================

-- ============================================================
-- INSERT: Digitální ticho — full 21-day program
-- ============================================================

INSERT INTO public.modules (
  id,
  name,
  description,
  price_czk,
  price_type,
  is_active,
  is_beta,
  requires_module_id,
  icon,
  color,
  sort_order
)
VALUES (
  'digitalni-ticho',
  'Digitální ticho',
  '21denní audio program pro regulaci nervového systému. Jedna platba, doživotní přístup.',
  990,
  'lifetime',
  true,
  false,
  NULL,
  '🔇',
  '#2CBEC6',
  10
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_czk = EXCLUDED.price_czk,
  price_type = EXCLUDED.price_type,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- INSERT: Týdenní série — Příběh (dny 1–7)
-- ============================================================

INSERT INTO public.modules (
  id,
  name,
  description,
  price_czk,
  price_type,
  is_active,
  is_beta,
  requires_module_id,
  icon,
  color,
  sort_order
)
VALUES (
  'serie-pribeh',
  'Série: Příběh',
  'Týdenní série dní 1–7 z programu Digitální ticho. Nervový systém se začíná uklidňovat.',
  390,
  'lifetime',
  false,
  true,
  NULL,
  '📖',
  '#D6A23A',
  11
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_czk = EXCLUDED.price_czk,
  updated_at = NOW();

-- ============================================================
-- INSERT: Týdenní série — Vedení (dny 8–14)
-- ============================================================

INSERT INTO public.modules (
  id,
  name,
  description,
  price_czk,
  price_type,
  is_active,
  is_beta,
  requires_module_id,
  icon,
  color,
  sort_order
)
VALUES (
  'serie-vedeni',
  'Série: Vedení',
  'Týdenní série dní 8–14 z programu Digitální ticho. Jdeme hlouběji.',
  390,
  'lifetime',
  false,
  true,
  NULL,
  '🧭',
  '#D6A23A',
  12
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_czk = EXCLUDED.price_czk,
  updated_at = NOW();

-- ============================================================
-- INSERT: Týdenní série — Ticho (dny 15–21)
-- ============================================================

INSERT INTO public.modules (
  id,
  name,
  description,
  price_czk,
  price_type,
  is_active,
  is_beta,
  requires_module_id,
  icon,
  color,
  sort_order
)
VALUES (
  'serie-ticho',
  'Série: Ticho',
  'Týdenní série dní 15–21 z programu Digitální ticho. Plná integrace.',
  390,
  'lifetime',
  false,
  true,
  NULL,
  '🤫',
  '#D6A23A',
  13
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_czk = EXCLUDED.price_czk,
  updated_at = NOW();

-- ============================================================
-- Add stripe_price_id column to modules (pro mapování Stripe → DB)
-- ============================================================

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Nastav Stripe Price ID pro Digitální ticho
UPDATE public.modules
SET stripe_price_id = 'price_1T2SBJK0OYr7u1q9HkiaSKYY'
WHERE id = 'digitalni-ticho';

CREATE INDEX IF NOT EXISTS modules_stripe_price_id_idx
  ON public.modules(stripe_price_id)
  WHERE stripe_price_id IS NOT NULL;

-- ============================================================
-- Add stripe_session_id + email to user_modules (pro guest checkout)
-- ============================================================

ALTER TABLE public.user_modules
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS guest_email TEXT;

CREATE INDEX IF NOT EXISTS user_modules_stripe_session_idx
  ON public.user_modules(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

COMMENT ON COLUMN public.user_modules.stripe_session_id IS 'Stripe Checkout Session ID — pro dohledání platby';
COMMENT ON COLUMN public.user_modules.guest_email IS 'Email pro guest checkout (před vytvořením účtu)';

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON COLUMN public.modules.stripe_price_id IS 'Stripe Price ID (price_xxx) pro automatické mapování webhooků';

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Digitální ticho module added to modules table';
  RAISE NOTICE '✅ 3 weekly series added (inactive/beta for now)';
  RAISE NOTICE '✅ stripe_price_id column added to modules';
  RAISE NOTICE '✅ stripe_session_id + guest_email added to user_modules';
  RAISE NOTICE '🎯 Price ID: price_1T2SBJK0OYr7u1q9HkiaSKYY';
END $$;
