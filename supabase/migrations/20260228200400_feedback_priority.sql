-- ============================================================
-- Feedback Priority — přidání sloupce priority
--
-- Admin/CEO může označit podnět prioritou 1-3 (plameny).
-- NULL = bez priority, 1 = nízká, 2 = střední, 3 = vysoká
-- Podněty s prioritou se zobrazují v admin UI první.
--
-- @since 2026-02-28
-- ============================================================

ALTER TABLE public.user_feedback
  ADD COLUMN IF NOT EXISTS priority INTEGER
    CHECK (priority BETWEEN 1 AND 3);

-- Index pro rychlé řazení dle priority
CREATE INDEX IF NOT EXISTS idx_user_feedback_priority
  ON public.user_feedback(priority DESC NULLS LAST);
