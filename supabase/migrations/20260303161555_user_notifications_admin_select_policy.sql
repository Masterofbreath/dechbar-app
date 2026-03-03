-- ============================================================
-- Migration: user_notifications — admin SELECT policy
-- Date: 2026-03-03
-- Scope: DEV + PROD
-- Riziko: NULOVÉ — přidání permissive policy, nic se neodstraňuje
--
-- Problém:
--   SELECT policy "user_sees_own_notifications" povoluje číst
--   pouze vlastní řádky (auth.uid() = user_id).
--   Admin volající getNotifications() viděl stats pouze za sebe
--   → total_count = 1 místo 454.
--
-- Řešení:
--   Přidat separátní admin policy přes user_roles tabulku.
--   Admin (role = 'admin' nebo 'ceo') vidí všechny řádky.
--   Běžní uživatelé nejsou dotčeni — jejich policy zůstává.
-- ============================================================

CREATE POLICY "admin_reads_all_user_notifications"
  ON public.user_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('admin', 'ceo')
    )
  );
