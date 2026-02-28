-- ============================================================
-- Feedback: Admin UPDATE policy
--
-- Admini/CEO mohou updatovat status, priority a timestamps.
-- Uživatelé nemohou měnit svůj vlastní feedback po odeslání.
--
-- @since 2026-02-28
-- ============================================================

CREATE POLICY "Admins can update feedback"
  ON public.user_feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('admin', 'ceo')
    )
  );
