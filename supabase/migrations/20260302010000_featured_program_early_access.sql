-- Migration: Featured program early access deadline
-- Adds early_access_until column to platform_featured_program.
--
-- Logic:
--   early_access_until = NULL   → no deadline, everyone has free access (default / backwards compat)
--   early_access_until = DATE   → users registered AFTER this date see the challenge as locked
--                                  (requires SMART subscription)
--
-- Existing users registered BEFORE the deadline keep free access until they complete the challenge.
-- After completion, the challenge locks for them too (SMART required for replay).

ALTER TABLE platform_featured_program
  ADD COLUMN IF NOT EXISTS early_access_until TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN platform_featured_program.early_access_until IS
  'Deadline pro bezplatny pristup (early access). Uzivatele zaregistrovani po tomto datumu vidi vyzvu jako uzamcenou (vyzaduje SMART). NULL = zadny limit.';

-- Set deadline for Ranní dechová výzva — free access until 7. March 2026
UPDATE platform_featured_program
  SET early_access_until = '2026-03-07 23:59:59+00'
  WHERE module_id = 'ranni-dechova-vyzva';
