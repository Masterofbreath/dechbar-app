-- Migration: napoveda_settings — globální on/off přepínač Nápověda systému
-- Singleton tabulka (id=1) — admin může Nápovědu kompletně vypnout bez deploymentu.
-- Použití: při PROD incidentu, A/B testování, plánované údržbě.

CREATE TABLE IF NOT EXISTS public.napoveda_settings (
  id              integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton
  is_enabled      boolean NOT NULL DEFAULT true,
  disabled_by     uuid REFERENCES auth.users(id),
  disabled_at     timestamptz,
  disabled_reason text,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.napoveda_settings IS
  'Singleton tabulka pro globální nastavení Nápověda systému. Řádek id=1 je jediný záznam.';

INSERT INTO public.napoveda_settings (id, is_enabled)
VALUES (1, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.napoveda_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read napoveda settings"
  ON public.napoveda_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage napoveda settings"
  ON public.napoveda_settings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
