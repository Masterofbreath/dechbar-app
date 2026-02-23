-- =====================================================
-- Akademie: Kratší popisky kategorií + nové coming-soon kategorie
-- Date: 2026-02-23
-- =====================================================

-- 1. Kratší popis pro Program REŽIM
UPDATE public.akademie_categories
SET description = '21 dní, 15 minut ráno. Strukturovaná audio praxe.'
WHERE slug = 'rezim';

-- 2. Kratší popis pro Výzvy
UPDATE public.akademie_categories
SET description = '21denní dechové výzvy. Zdarma pro každého.'
WHERE slug = 'vyzvy';

-- 3. Nové coming-soon kategorie (is_active = false → zobrazují se jako "Brzy")
INSERT INTO public.akademie_categories (id, name, slug, icon, description, sort_order, is_active, required_module_id)
VALUES
  (
    'a1000000-0000-0000-0000-000000000010',
    'VIP sekce',
    'vip',
    'vip',
    'Exkluzivní obsah pro VIP členy.',
    40,
    false,
    null
  ),
  (
    'a1000000-0000-0000-0000-000000000011',
    'Bonusy',
    'bonusy',
    'bonusy',
    'Prémiové bonusové materiály.',
    50,
    false,
    null
  ),
  (
    'a1000000-0000-0000-0000-000000000012',
    'Osobní mentoring',
    'mentoring',
    'mentoring',
    '1:1 práce s lektorem.',
    60,
    false,
    null
  )
ON CONFLICT (slug) DO UPDATE
  SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description,
    sort_order  = EXCLUDED.sort_order,
    is_active   = EXCLUDED.is_active;
