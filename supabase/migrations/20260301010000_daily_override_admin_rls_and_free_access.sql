-- ============================================================
-- 1. Admin write RLS pro platform_daily_override
--
-- Aktuálně tabulka nemá write policy → admin nemůže
-- INSERT/UPDATE/DELETE přes supabase klienta (admin UI).
-- ============================================================

CREATE POLICY "Admin manage daily override"
  ON public.platform_daily_override
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 2. Přístup k ranní-dechova-výzva pro VŠECHNY uživatele
--
-- Vloží user_modules záznam pro každého autentizovaného uživatele
-- který ho ještě nemá. Tím pádem v fetchProgramsForCategory
-- isOwned = true → lekce jsou přehratelné v Akademii i z Dnes tlačítka.
-- ============================================================

-- Zjistíme jaké sloupce user_modules má (purchase_type, purchased_at atd.)
-- a vložíme jen povinné: user_id, module_id
-- purchase_type = 'free_challenge' pro snazší filtrování

-- Najdeme skutečné module_id podle name (bez diakritiky v ID)
INSERT INTO public.user_modules (user_id, module_id, purchase_type, purchased_at)
SELECT
  p.user_id,
  m.id,
  'lifetime',
  NOW()
FROM public.profiles p
CROSS JOIN public.modules m
WHERE m.name = 'Ranní dechová výzva'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_modules um
    WHERE um.user_id = p.user_id
      AND um.module_id = m.id
  )
ON CONFLICT (user_id, module_id) DO NOTHING;

-- ============================================================
-- 3. Trigger: nový uživatel automaticky dostane přístup
-- ============================================================

CREATE OR REPLACE FUNCTION public.grant_free_challenge_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_modules (user_id, module_id, purchase_type, purchased_at)
  SELECT NEW.user_id, m.id, 'lifetime', NOW()
  FROM public.modules m
  WHERE m.name = 'Ranní dechová výzva'
  ON CONFLICT (user_id, module_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Odstraní starý trigger pokud existuje (idempotentní)
DROP TRIGGER IF EXISTS on_new_user_grant_challenge_access ON public.profiles;

CREATE TRIGGER on_new_user_grant_challenge_access
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_free_challenge_access();

DO $$ BEGIN
  RAISE NOTICE '✅ platform_daily_override: admin write RLS added';
  RAISE NOTICE '✅ ranní-dechova-výzva: přístup udělen všem stávajícím i novým uživatelům';
END $$;
