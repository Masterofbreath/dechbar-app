-- Payment System v2: DB jako Single Source of Truth pro Stripe Price IDs
-- Bezpečná pro PROD — pouze ADD COLUMN a UPDATE, žádné DROP ani destructive operace

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Nové sloupce v tabulce modules
-- ─────────────────────────────────────────────────────────────────────────────

-- Stripe Product ID (pro admin odkaz do Stripe Dashboardu)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- Pro subscription produkty: oddělené price IDs per billing interval
ALTER TABLE modules ADD COLUMN IF NOT EXISTS stripe_price_id_monthly TEXT;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS stripe_price_id_annual TEXT;

-- Příznaky pro zobrazení na landing page / v katalogu
-- show_on_homepage default false — bezpečné, musí se explicitně zapnout
ALTER TABLE modules ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN NOT NULL DEFAULT false;
-- show_in_catalog default true — produkty se zobrazí v katalogu pokud je is_active = true
ALTER TABLE modules ADD COLUMN IF NOT EXISTS show_in_catalog BOOLEAN NOT NULL DEFAULT true;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Datová migrace — naplnění pro existující LIVE produkty
-- ─────────────────────────────────────────────────────────────────────────────

-- membership-smart: subscription, LIVE Stripe Price IDs
-- Stripe acct: acct_1S3eJ5K0OYr7u1q9, Product: prod_U0SzbyNG0vrzZ0
UPDATE modules SET
  stripe_product_id      = 'prod_U0SzbyNG0vrzZ0',
  stripe_price_id_monthly = 'price_1T2S3eK0OYr7u1q9W5ZW042C',
  stripe_price_id_annual  = 'price_1T2S3dK0OYr7u1q9bwA0cNS8',
  show_on_homepage       = true
WHERE id = 'membership-smart';

-- lifetime produkty s existujícím stripe_price_id
UPDATE modules SET show_on_homepage = true
WHERE id IN ('digitalni-ticho', 'ranni-dechova-vyzva');

-- membership-ai-coach: subscription, placeholder IDs (nelivé) — show_on_homepage false
-- Stripe Product ID bude doplněno po aktivaci v admin panelu
UPDATE modules SET
  stripe_price_id_monthly = 'price_1SraCSK7en1dcW6HFkmAbdIL',
  stripe_price_id_annual  = 'price_1SraIaK7en1dcW6HsYyN0Aj9'
WHERE id = 'membership-ai-coach';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Indexy pro výkon webhook lookupů
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_modules_stripe_price_id_monthly
  ON modules (stripe_price_id_monthly)
  WHERE stripe_price_id_monthly IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_modules_stripe_price_id_annual
  ON modules (stripe_price_id_annual)
  WHERE stripe_price_id_annual IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_modules_show_on_homepage
  ON modules (show_on_homepage)
  WHERE show_on_homepage = true;
