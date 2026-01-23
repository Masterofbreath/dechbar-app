-- ═══════════════════════════════════════════════════════════════
-- KP Measurements Table
-- Single Source of Truth pro KP data napříč celou aplikací
-- Používají: TOP NAV, Pokrok Module, School Module, AI Coach
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════
-- CREATE TABLE
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS kp_measurements (
  -- PRIMARY KEY
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- CORE MEASUREMENT DATA
  value_seconds INTEGER NOT NULL CHECK (value_seconds >= 10 AND value_seconds <= 180),
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Individual attempts (NULL pokud uživatel měřil jen 1x)
  attempt_1_seconds INTEGER NOT NULL CHECK (attempt_1_seconds >= 10 AND attempt_1_seconds <= 180),
  attempt_2_seconds INTEGER CHECK (attempt_2_seconds IS NULL OR (attempt_2_seconds >= 10 AND attempt_2_seconds <= 180)),
  attempt_3_seconds INTEGER CHECK (attempt_3_seconds IS NULL OR (attempt_3_seconds >= 10 AND attempt_3_seconds <= 180)),
  attempts_count INTEGER NOT NULL DEFAULT 1 CHECK (attempts_count IN (1, 2, 3)),
  
  -- TIME CONTEXT (auto-detected ze zařízení)
  time_of_day VARCHAR(20) NOT NULL CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
  is_morning_measurement BOOLEAN DEFAULT FALSE NOT NULL,
  hour_of_measurement INTEGER CHECK (hour_of_measurement >= 0 AND hour_of_measurement <= 23),
  
  -- MEASUREMENT METADATA
  measurement_type VARCHAR(20) DEFAULT 'manual' CHECK (measurement_type IN ('manual', 'hrv', 'smart')),
  device_type VARCHAR(20) CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
  measurement_duration_ms INTEGER CHECK (measurement_duration_ms > 0),
  
  -- PHYSIOLOGICAL DATA (OPTIONAL - budoucnost)
  heart_rate_before INTEGER CHECK (heart_rate_before > 0 AND heart_rate_before <= 220),
  heart_rate_after INTEGER CHECK (heart_rate_after > 0 AND heart_rate_after <= 220),
  hrv_data JSONB,
  
  -- USER INPUT (optional)
  notes TEXT,
  
  -- STATUS & VALIDATION
  is_valid BOOLEAN DEFAULT TRUE NOT NULL,
  is_first_measurement BOOLEAN DEFAULT FALSE NOT NULL,
  validation_notes TEXT,
  
  -- SOURCE CONTEXT (pro School Module)
  measured_in_context VARCHAR(50) CHECK (measured_in_context IN ('homepage_demo', 'top_nav', 'pokrok_module')),
  
  -- TIMESTAMPS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ═══════════════════════════════════════════════
-- INDEXES (pro rychlé dotazy)
-- ═══════════════════════════════════════════════

-- Hlavní dotazy: "Dej mi všechna validní měření uživatele (nejnovější první)"
CREATE INDEX idx_kp_user_valid_measured 
  ON kp_measurements(user_id, is_valid, measured_at DESC);

-- Pokrok modul: "Jen ranní měření za poslední měsíc"
CREATE INDEX idx_kp_morning_recent 
  ON kp_measurements(user_id, is_morning_measurement, measured_at DESC)
  WHERE is_morning_measurement = TRUE;

-- První měření: "Dej mi první KP uživatele"
CREATE INDEX idx_kp_first 
  ON kp_measurements(user_id, is_first_measurement)
  WHERE is_first_measurement = TRUE;

-- ═══════════════════════════════════════════════
-- RLS POLICIES (Row Level Security)
-- ═══════════════════════════════════════════════

ALTER TABLE kp_measurements ENABLE ROW LEVEL SECURITY;

-- User může vidět jen svoje měření
CREATE POLICY "Users can view own KP measurements"
  ON kp_measurements FOR SELECT
  USING (auth.uid() = user_id);

-- User může vkládat jen svoje měření
CREATE POLICY "Users can insert own KP measurements"
  ON kp_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User může upravovat jen svoje měření (např. přidat notes)
CREATE POLICY "Users can update own KP measurements"
  ON kp_measurements FOR UPDATE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════

-- Funkce: Získat poslední validní KP uživatele
CREATE OR REPLACE FUNCTION get_current_kp(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kp INTEGER;
BEGIN
  SELECT value_seconds INTO v_kp
  FROM kp_measurements
  WHERE user_id = p_user_id
    AND is_valid = TRUE
  ORDER BY measured_at DESC
  LIMIT 1;
  
  RETURN v_kp;
END;
$$;

-- Funkce: Získat první KP uživatele
CREATE OR REPLACE FUNCTION get_first_kp(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kp INTEGER;
BEGIN
  SELECT value_seconds INTO v_kp
  FROM kp_measurements
  WHERE user_id = p_user_id
    AND is_first_measurement = TRUE
  LIMIT 1;
  
  RETURN v_kp;
END;
$$;

-- Funkce: Výpočet týdenního streaku (kolik týdnů v řadě měřil)
CREATE OR REPLACE FUNCTION calculate_weekly_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_week DATE;
  v_previous_week DATE;
BEGIN
  -- Začneme od aktuálního týdne
  v_current_week := date_trunc('week', CURRENT_DATE);
  
  -- Kontrolujeme, zda měřil tento týden
  IF NOT EXISTS (
    SELECT 1 FROM kp_measurements
    WHERE user_id = p_user_id
      AND is_valid = TRUE
      AND measured_at >= v_current_week
  ) THEN
    -- Tento týden neměřil -> streak = 0
    RETURN 0;
  END IF;
  
  -- Počítáme zpět po týdnech
  v_streak := 1;  -- Tento týden měřil
  v_previous_week := v_current_week - INTERVAL '7 days';
  
  -- Iterujeme zpět, dokud najdeme týden bez měření
  WHILE EXISTS (
    SELECT 1 FROM kp_measurements
    WHERE user_id = p_user_id
      AND is_valid = TRUE
      AND measured_at >= v_previous_week
      AND measured_at < v_current_week
  ) LOOP
    v_streak := v_streak + 1;
    v_current_week := v_previous_week;
    v_previous_week := v_previous_week - INTERVAL '7 days';
    
    -- Safety limit (prevent infinite loop)
    IF v_streak > 520 THEN  -- 10 years
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_streak;
END;
$$;

-- ═══════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════

-- Automaticky aktualizovat updated_at timestamp
CREATE OR REPLACE FUNCTION update_kp_measurements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kp_measurements_updated_at
  BEFORE UPDATE ON kp_measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_kp_measurements_updated_at();

-- ═══════════════════════════════════════════════
-- COMMENTS (dokumentace schématu)
-- ═══════════════════════════════════════════════

COMMENT ON TABLE kp_measurements IS 'Ukládá všechna KP (kontrolní pauza) měření uživatelů. Používáno TOP NAV, Pokrok Module, School Module, AI Coach.';
COMMENT ON COLUMN kp_measurements.value_seconds IS 'Průměr ze všech pokusů nebo single value (10-180s expected range)';
COMMENT ON COLUMN kp_measurements.is_morning_measurement IS 'TRUE = měřeno mezi 4-9h ráno';
COMMENT ON COLUMN kp_measurements.is_valid IS 'FALSE = mimo ranní okno nebo jiný problém';
COMMENT ON COLUMN kp_measurements.is_first_measurement IS 'TRUE pouze pro úplně první měření uživatele';
COMMENT ON COLUMN kp_measurements.attempts_count IS 'Kolik pokusů bylo provedeno (1, 2, nebo 3)';
