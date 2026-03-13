-- Migration: tour RLS policies
-- Bezpečnost přístupu k Tour datům.
--
-- tour_levels, tour_chapters, tour_steps  → read-only pro auth uživatele, admin spravuje
-- user_tour_progress, user_tour_state, user_tour_onboarding_state → per-user (vlastní data)

-- =============================================
-- RLS: tour_levels (read-only config data)
-- =============================================
ALTER TABLE public.tour_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tour levels"
  ON public.tour_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tour levels"
  ON public.tour_levels FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- RLS: tour_chapters (read-only config data)
-- =============================================
ALTER TABLE public.tour_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tour chapters"
  ON public.tour_chapters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tour chapters"
  ON public.tour_chapters FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- RLS: tour_steps (read-only config data)
-- =============================================
ALTER TABLE public.tour_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tour steps"
  ON public.tour_steps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tour steps"
  ON public.tour_steps FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- RLS: user_tour_progress (per-user data)
-- =============================================
ALTER TABLE public.user_tour_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tour progress"
  ON public.user_tour_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tour progress"
  ON public.user_tour_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tour progress"
  ON public.user_tour_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tour progress"
  ON public.user_tour_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage tour progress"
  ON public.user_tour_progress FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- RLS: user_tour_state (per-user data)
-- =============================================
ALTER TABLE public.user_tour_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tour state"
  ON public.user_tour_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tour state"
  ON public.user_tour_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tour state"
  ON public.user_tour_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tour state"
  ON public.user_tour_state FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage tour state"
  ON public.user_tour_state FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- RLS: user_tour_onboarding_state (OnboardJS plugin)
-- =============================================
ALTER TABLE public.user_tour_onboarding_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own onboarding state"
  ON public.user_tour_onboarding_state FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage onboarding state"
  ON public.user_tour_onboarding_state FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
