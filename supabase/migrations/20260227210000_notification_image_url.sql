-- ============================================================
-- Přidání image_url do notifications
-- Umožňuje přidat vlastní obrázek k notifikaci (Bunny.net CDN).
-- Cesta: images/notifications/{uuid}.{ext}
-- ============================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.notifications.image_url IS
  'Volitelný obrázek notifikace (CDN URL z Bunny.net, images/notifications/)';
