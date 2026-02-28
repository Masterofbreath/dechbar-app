-- ============================================================
-- Fix: Oprava názvů lekcí Digitálního ticha na PROD
-- DEV má správné tituly, PROD má generické placeholdery "Den N — Série"
-- Matchujeme přes day_number + series_id (IDs jsou stejné na obou prostředích)
-- ============================================================

-- SÉRIE 1: Příběh (dny 1–7) — series_id c1000000-0000-0000-0000-000000000001
UPDATE public.akademie_lessons SET title = 'Notifikace v těle'    WHERE series_id = 'c1000000-0000-0000-0000-000000000001' AND day_number = 2;
UPDATE public.akademie_lessons SET title = 'Jeden kanál'          WHERE series_id = 'c1000000-0000-0000-0000-000000000001' AND day_number = 3;
UPDATE public.akademie_lessons SET title = 'Digitální půst'       WHERE series_id = 'c1000000-0000-0000-0000-000000000001' AND day_number = 4;
UPDATE public.akademie_lessons SET title = 'Prázdná obrazovka'    WHERE series_id = 'c1000000-0000-0000-0000-000000000001' AND day_number = 5;
UPDATE public.akademie_lessons SET title = 'Reset po dni'         WHERE series_id = 'c1000000-0000-0000-0000-000000000001' AND day_number = 6;
UPDATE public.akademie_lessons SET title = 'Jeden směr'           WHERE series_id = 'c1000000-0000-0000-0000-000000000001' AND day_number = 7;

-- SÉRIE 2: Vedení (dny 8–14) — series_id c1000000-0000-0000-0000-000000000002
UPDATE public.akademie_lessons SET title = 'Tělo jako filtr'         WHERE series_id = 'c1000000-0000-0000-0000-000000000002' AND day_number = 8;
UPDATE public.akademie_lessons SET title = 'Prodloužený výdech'      WHERE series_id = 'c1000000-0000-0000-0000-000000000002' AND day_number = 9;
UPDATE public.akademie_lessons SET title = 'Měkká čelist'            WHERE series_id = 'c1000000-0000-0000-0000-000000000002' AND day_number = 10;
UPDATE public.akademie_lessons SET title = 'Pomalejší rytmus'        WHERE series_id = 'c1000000-0000-0000-0000-000000000002' AND day_number = 11;
UPDATE public.akademie_lessons SET title = 'Jedna věc'               WHERE series_id = 'c1000000-0000-0000-0000-000000000002' AND day_number = 12;
UPDATE public.akademie_lessons SET title = 'Širší pole pozornosti'   WHERE series_id = 'c1000000-0000-0000-0000-000000000002' AND day_number = 13;
UPDATE public.akademie_lessons SET title = 'Stabilní tempo'          WHERE series_id = 'c1000000-0000-0000-0000-000000000002' AND day_number = 14;

-- SÉRIE 3: Ticho (dny 15–21) — series_id c1000000-0000-0000-0000-000000000003
UPDATE public.akademie_lessons SET title = '5 minut bez řeči'           WHERE series_id = 'c1000000-0000-0000-0000-000000000003' AND day_number = 15;
UPDATE public.akademie_lessons SET title = 'Dech jako rytmus'           WHERE series_id = 'c1000000-0000-0000-0000-000000000003' AND day_number = 16;
UPDATE public.akademie_lessons SET title = 'Prostor mezi myšlenkami'    WHERE series_id = 'c1000000-0000-0000-0000-000000000003' AND day_number = 17;
UPDATE public.akademie_lessons SET title = 'Bez hodnocení'              WHERE series_id = 'c1000000-0000-0000-0000-000000000003' AND day_number = 18;
UPDATE public.akademie_lessons SET title = 'Ticho pod šumem'            WHERE series_id = 'c1000000-0000-0000-0000-000000000003' AND day_number = 19;
UPDATE public.akademie_lessons SET title = 'Jednoduchost'               WHERE series_id = 'c1000000-0000-0000-0000-000000000003' AND day_number = 20;
UPDATE public.akademie_lessons SET title = 'Ticho'                      WHERE series_id = 'c1000000-0000-0000-0000-000000000003' AND day_number = 21;
