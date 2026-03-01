-- Fix: Enable RLS on webhook_debug_logs (reported by Supabase security advisors)
ALTER TABLE public.webhook_debug_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_debug_logs_admin_only"
  ON public.webhook_debug_logs
  FOR ALL
  USING (is_admin());

-- Fix: Add missing image_url column to notifications table
-- (used in NotificationCenter.tsx + NotificationsAdmin.tsx but was missing in DB)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS image_url text;
