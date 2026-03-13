-- Migration: tour seed data — základní úrovně, kapitoly a kroky (cs texty)
-- Idempotentní: ON CONFLICT DO NOTHING → bezpečné opakování.
--
-- Seed obsahuje:
-- - 2 úrovně: basic (FREE), smart (SMART)
-- - 3 kapitoly v Úrovni 1: welcome, dnes-overview, kp-measurement
-- - Ukázkové kroky v češtině (~3 kroky na kapitolu)

-- =============================================
-- Úrovně
-- =============================================
INSERT INTO public.tour_levels (id, order_index, slug, title, description, is_active, requires_plan, reward_days)
VALUES
  (
    '11111111-0001-0001-0001-000000000001',
    1,
    'basic',
    '{"cs": "Základní Nápověda", "en": "Basic Tour"}',
    '{"cs": "Nauč se základy DechBaru a získej 1 den SMART zdarma.", "en": "Learn the basics of DechBar and get 1 free SMART day."}',
    true,
    NULL,
    1
  ),
  (
    '11111111-0002-0002-0002-000000000002',
    2,
    'smart',
    '{"cs": "SMART Nápověda", "en": "SMART Tour"}',
    '{"cs": "Prozkoumej SMART funkce a získej +2 dny SMART zdarma.", "en": "Explore SMART features and get +2 free SMART days."}',
    true,
    'SMART',
    2
  )
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- Kapitoly — Úroveň 1 (první 3)
-- =============================================
INSERT INTO public.tour_chapters (id, level_id, order_index, slug, title, route_path, tab_context, is_active)
VALUES
  (
    '22222222-0001-0001-0001-000000000001',
    '11111111-0001-0001-0001-000000000001',
    1,
    'welcome',
    '{"cs": "Vítej v DechBaru", "en": "Welcome to DechBar"}',
    NULL,
    NULL,
    true
  ),
  (
    '22222222-0002-0002-0002-000000000002',
    '11111111-0001-0001-0001-000000000001',
    2,
    'dnes-overview',
    '{"cs": "View Dnes", "en": "Today View"}',
    '/app',
    'dnes',
    true
  ),
  (
    '22222222-0003-0003-0003-000000000003',
    '11111111-0001-0001-0001-000000000001',
    3,
    'kp-measurement',
    '{"cs": "Kontrolní pauza", "en": "Control Pause"}',
    '/app',
    'dnes',
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- Kroky — Kapitola 1: welcome (info slide)
-- =============================================
INSERT INTO public.tour_steps (
  id, chapter_id, order_index, title, description,
  dom_selector, element_hint, step_type,
  interactive_action, is_required_for_reward, is_active
)
VALUES
  (
    '33333333-0001-0001-0001-000000000001',
    '22222222-0001-0001-0001-000000000001',
    1,
    '{"cs": "Vítej v DechBaru", "en": "Welcome to DechBar"}',
    '{"cs": "DechBar tě provede prací s dechem krok za krokem. Každý den pár minut — a uvidíš výsledky.", "en": "DechBar guides you through breathwork step by step. A few minutes each day — and you will see results."}',
    NULL,
    'Uvítací fullscreen slide — žádný DOM element',
    'info',
    NULL,
    false,
    true
  ),
  (
    '33333333-0002-0002-0002-000000000002',
    '22222222-0001-0001-0001-000000000001',
    2,
    '{"cs": "Žárovička tě provede", "en": "The bulb guides you"}',
    '{"cs": "Žárovička vpravo nahoře tě provede celou aplikací. Kdykoli svítí — je tu pro tebe nápověda.", "en": "The bulb in the top right guides you through the whole app. When it glows — there is help available."}',
    '.bulb-indicator',
    'Žárovička v pravém horním rohu TopNav',
    'highlight',
    NULL,
    false,
    true
  ),
  (
    '33333333-0003-0003-0003-000000000003',
    '22222222-0001-0001-0001-000000000001',
    3,
    '{"cs": "3 dny SMART zdarma", "en": "3 free SMART days"}',
    '{"cs": "Dokonči Nápovědu a získej 3 dny členství SMART zdarma. Uvidíš, co všechno DechBar umí.", "en": "Complete the Tour and get 3 free SMART days. You will see everything DechBar can do."}',
    NULL,
    'Uvítací info slide — odměna',
    'info',
    NULL,
    false,
    true
  )
ON CONFLICT DO NOTHING;

-- =============================================
-- Kroky — Kapitola 2: dnes-overview
-- =============================================
INSERT INTO public.tour_steps (
  id, chapter_id, order_index, title, description,
  dom_selector, element_hint, step_type,
  interactive_action, is_required_for_reward, is_active
)
VALUES
  (
    '33333333-0004-0004-0004-000000000004',
    '22222222-0002-0002-0002-000000000002',
    1,
    '{"cs": "Tvůj hlavní přehled", "en": "Your main overview"}',
    '{"cs": "View Dnes je tvůj denní přehled. Odtud spustíš každé cvičení, uvidíš dnešní program a sledovat svůj pokrok.", "en": "Today view is your daily overview. From here you can start any exercise, see today''s program and track your progress."}',
    '.dnes-page',
    'Celá stránka Dnes',
    'highlight',
    NULL,
    false,
    true
  ),
  (
    '33333333-0005-0005-0005-000000000005',
    '22222222-0002-0002-0002-000000000002',
    2,
    '{"cs": "Ranní, klidové a večerní protokoly", "en": "Morning, calm and evening protocols"}',
    '{"cs": "Tři protokoly — RÁNO, KLID a VEČER — jsou navrženy pro různé části dne. Každý trvá jen pár minut.", "en": "Three protocols — MORNING, CALM and EVENING — are designed for different parts of the day. Each takes just a few minutes."}',
    '.protocol-cards',
    'Sekce s protokoly RÁNO/KLID/VEČER na stránce Dnes',
    'highlight',
    NULL,
    false,
    true
  ),
  (
    '33333333-0006-0006-0006-000000000006',
    '22222222-0002-0002-0002-000000000002',
    3,
    '{"cs": "Denní program", "en": "Daily program"}',
    '{"cs": "Tlačítko Dnešní výzva spustí tvůj denní program. Plní se automaticky každý den — stačí kliknout.", "en": "The Today''s Challenge button starts your daily program. It refills automatically each day — just tap."}',
    '[data-testid="todays-challenge-button"]',
    'Tlačítko Dnešní výzva / TodaysChallengeButton',
    'highlight',
    NULL,
    false,
    true
  )
ON CONFLICT DO NOTHING;

-- =============================================
-- Kroky — Kapitola 3: kp-measurement (Kontrolní pauza)
-- =============================================
INSERT INTO public.tour_steps (
  id, chapter_id, order_index, title, description,
  dom_selector, element_hint, step_type,
  interactive_action, is_required_for_reward, is_active
)
VALUES
  (
    '33333333-0007-0007-0007-000000000007',
    '22222222-0003-0003-0003-000000000003',
    1,
    '{"cs": "Co je Kontrolní pauza?", "en": "What is Control Pause?"}',
    '{"cs": "Kontrolní pauza (KP) je tvůj osobní ukazatel zdraví dechu. Čím vyšší KP, tím lépe dýcháš. Měř ji každé ráno.", "en": "Control Pause (CP) is your personal breath health indicator. The higher your CP, the better you breathe. Measure it every morning."}',
    '.kp-display',
    'KP display v horní části TopNav nebo na stránce Dnes',
    'highlight',
    NULL,
    false,
    true
  ),
  (
    '33333333-0008-0008-0008-000000000008',
    '22222222-0003-0003-0003-000000000003',
    2,
    '{"cs": "Změř si první KP", "en": "Measure your first CP"}',
    '{"cs": "Klikni na KP tlačítko a změř svou první Kontrolní pauzu. Bude to tvá baseline — referenční hodnota pro sledování pokroku.", "en": "Tap the CP button and measure your first Control Pause. This will be your baseline — reference value for tracking progress."}',
    '.kp-display',
    'KP tlačítko pro spuštění měření',
    'interactive',
    'measure_kp',
    true,
    true
  ),
  (
    '33333333-0009-0009-0009-000000000009',
    '22222222-0003-0003-0003-000000000003',
    3,
    '{"cs": "KP se zvyšuje s praxí", "en": "CP improves with practice"}',
    '{"cs": "Pravidelným dýcháním tvoje KP roste. Doporučená ranní KP je 40 sekund. Uvidíš svůj pokrok v záložce Pokrok.", "en": "With regular breathwork your CP grows. Recommended morning CP is 40 seconds. You''ll see your progress in the Progress tab."}',
    NULL,
    'Info slide po změření KP',
    'info',
    NULL,
    false,
    true
  )
ON CONFLICT DO NOTHING;
