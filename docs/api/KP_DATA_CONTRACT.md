# KP Measurements - Data Contract

**Status:** 🚧 DRAFT - DB migration bude vytvořena později  
**Version:** 1.0  
**Last Updated:** 2026-01-23  
**Purpose:** Definovat, jaká data ukládáme a proč (připraveno pro budoucí DB implementaci)

---

## 📋 STRATEGIE

**Aktuální fáze:** UX Flow Polish (Frontend First)  
**DB Migration:** Vytvoříme POZDĚJI, až bude flow stabilní  
**Pro testování:** Mock data, simulace `saveKP()` success

**Proč tento přístup:**
- ✅ Flow se může měnit → schema se může měnit
- ✅ Rychlé iterace bez DB závislostí  
- ✅ Optimální schema design až na konci  
- ✅ Žádné předčasné commitnutí struktury

---

## 🎯 CO UKLÁDÁME A PROČ

### 1. ZÁKLADNÍ MĚŘENÍ (Core Data)

#### `value_seconds` (number)
**Co:** Průměrná hodnota KP v sekundách (nebo single value při 1 pokusu)  
**Rozsah:** 10-180 sekund (reálné hodnoty)  
**Použití:**
- Zobrazení v TOP NAV (`KPDisplay` component)
- Trend calculation (current vs previous)
- Pokrok statistiky (average, best)

**Příklad:** `35` (= průměr z [33, 36, 36])

---

#### `attempt_1_seconds` (number)
**Co:** První pokus (vždy vyplněno)  
**Použití:**
- Detail view v Pokrok module
- Analýza variability měření
- Validace kvality měření

**Příklad:** `33`

---

#### `attempt_2_seconds` (number | null)
**Co:** Druhý pokus (null pokud user ukončil předčasně)  
**Použití:** Stejné jako attempt_1  
**Příklad:** `36` nebo `null`

---

#### `attempt_3_seconds` (number | null)
**Co:** Třetí pokus (null pokud user ukončil předčasně)  
**Použití:** Stejné jako attempt_1  
**Příklad:** `36` nebo `null`

---

#### `attempts_count` (1 | 2 | 3)
**Co:** Kolik pokusů user provedl  
**Použití:**
- Validace kompletnosti měření
- Analytics (kolik % users měří 3x vs 1x)

**Příklad:** `3` (všechny 3 pokusy) nebo `1` (early finish)

---

### 2. ČASOVÉ METADATA (Time Context)

#### `measured_at` (timestamp)
**Co:** Přesný čas měření (ISO 8601)  
**Použití:**
- Historie timeline (Pokrok module)
- Sorting measurements
- Relative time display ("před 2 hodinami")

**Příklad:** `"2026-01-23T07:30:15.000Z"`

---

#### `time_of_day` ('morning' | 'afternoon' | 'evening' | 'night')
**Co:** Denní doba měření  
**Mapping:**
- `morning`: 4:00 - 11:59
- `afternoon`: 12:00 - 17:59
- `evening`: 18:00 - 21:59
- `night`: 22:00 - 3:59

**Použití:**
- Analytics (kdy users měří)
- Filtrování v Pokrok module

**Příklad:** `"morning"`

---

#### `is_morning_measurement` (boolean)
**Co:** TRUE pokud měření proběhlo 4-9h (ranní okno)  
**Proč důležité:** Ranní měření je **validní měření** (stabilní podmínky)  
**Použití:**
- Filtrování validních dat
- TOP NAV zobrazuje jen validní KP
- Pokrok statistiky počítají jen validní

**Příklad:** `true` (měřeno v 7:30) nebo `false` (měřeno v 15:00)

---

#### `hour_of_measurement` (0-23)
**Co:** Hodina měření (0 = půlnoc, 23 = 11 PM)  
**Použití:**
- Detailnější analytics
- Validace `is_morning_measurement`

**Příklad:** `7` (= 7:00-7:59)

---

### 3. VALIDAČNÍ METADATA (Validity)

#### `is_valid` (boolean)
**Co:** TRUE = validní měření (splňuje kvalitní podmínky)  
**Kritéria validity:**
- ✅ `is_morning_measurement === true` (4-9h)
- ✅ Kvalita měření (budoucí: RSA analýza)

**Použití:**
- **TOP NAV**: Zobrazuje jen validní KP
- **Pokrok statistiky**: Počítají jen validní
- **Trend**: Porovnává validní vs validní

**Příklad:** `true` (ranní měření) nebo `false` (odpolední)

---

#### `is_first_measurement` (boolean)
**Co:** TRUE jen pro úplně první KP měření usera  
**Použití:**
- Onboarding analytics
- Celebrace prvního měření
- "První KP" badge v Pokrok module

**Příklad:** `true` (první ever) nebo `false` (další měření)

---

### 4. DEVICE & CONTEXT (Analytics)

#### `device_type` ('mobile' | 'desktop' | 'tablet' | null)
**Co:** Typ zařízení, na kterém user měřil  
**Detekce:** Auto z user agent  
**Použití:**
- Analytics (kolik % mobile vs desktop)
- UX optimalizace per device

**Příklad:** `"mobile"`

---

#### `measurement_duration_ms` (number | null)
**Co:** Celková délka měření v milisekundách  
**Od:** Klik "Začít měření"  
**Do:** Klik "Zavřít" (po všech pokusech)  
**Použití:**
- Analytics (jak dlouho trvá celé měření)
- UX optimalizace (zkrátit flow?)

**Příklad:** `180000` (= 3 minuty)

---

#### `measured_in_context` ('top_nav' | 'homepage_demo' | 'pokrok_module')
**Co:** Odkud user spustil měření  
**Použití:**
- Analytics (který entry point je nejpoužívanější)
- A/B testing různých entry points

**Příklad:** `"top_nav"`

---

### 5. FUTURE ENHANCEMENTS (Připraveno)

#### `measurement_type` ('manual' | 'hrv' | 'smart')
**Co:** Typ měření  
**Hodnoty:**
- `manual`: Běžné měření (user sám zastavuje)
- `hrv`: HRV sensor (hrudní pás detekuje first signal)
- `smart`: AI-estimated KP (z activity data)

**Status:** 🔮 Budoucnost (plánováno Q2 2026)  
**Použití:** Rozlišit typy měření v historii

---

#### `notes` (string | null)
**Co:** Volitelná poznámka usera  
**Použití:** User může napsat kontext ("po běhu", "před spánkem")  
**Status:** 🔮 Budoucnost (možná)

---

#### `heart_rate_before` (number | null)
#### `heart_rate_after` (number | null)
**Co:** Heart rate před/po měření (z HRV sensoru)  
**Status:** 🔮 Budoucnost (HRV integration)

---

## 🔐 SECURITY & RELATIONS

### User Ownership

```sql
-- RLS Policy (připraveno pro migration)
user_id UUID NOT NULL REFERENCES auth.users(id)
```

**Pravidla:**
- User vidí jen svoje měření
- Teacher může vidět studenta (School module)
- Admin vidí vše (analytics)

---

## 📊 USE CASES

### UC1: User měří KP ráno (TOP NAV)
```typescript
{
  value_seconds: 35,
  attempt_1_seconds: 33,
  attempt_2_seconds: 36,
  attempt_3_seconds: 36,
  attempts_count: 3,
  measured_at: "2026-01-23T07:30:00Z",
  time_of_day: "morning",
  is_morning_measurement: true,
  is_valid: true,
  hour_of_measurement: 7,
  device_type: "mobile",
  measured_in_context: "top_nav",
  is_first_measurement: false,
}
```

**Result:**
- ✅ Uloží se do DB
- ✅ TOP NAV zobrazí "KP 35s"
- ✅ Pokrok statistiky se aktualizují
- ✅ Trend se vypočítá (vs previous valid)

---

### UC2: User měří KP odpoledne (testing)
```typescript
{
  value_seconds: 28,
  attempt_1_seconds: 28,
  attempt_2_seconds: null,
  attempt_3_seconds: null,
  attempts_count: 1,
  measured_at: "2026-01-23T15:00:00Z",
  time_of_day: "afternoon",
  is_morning_measurement: false,
  is_valid: false, // ❌ Není ranní okno
  hour_of_measurement: 15,
  device_type: "desktop",
  measured_in_context: "top_nav",
  is_first_measurement: false,
}
```

**Result:**
- ✅ Uloží se do DB (pro historii)
- ❌ TOP NAV NEZOBRAZÍ (není validní)
- ❌ Statistiky NEPOČÍTAJÍ (není validní)
- ℹ️ Historie zobrazí s "⚠️ Mimo ranní okno"

---

### UC3: První měření usera (Homepage demo)
```typescript
{
  value_seconds: 20,
  attempt_1_seconds: 20,
  attempt_2_seconds: null,
  attempt_3_seconds: null,
  attempts_count: 1,
  measured_at: "2026-01-23T08:00:00Z",
  time_of_day: "morning",
  is_morning_measurement: true,
  is_valid: true,
  hour_of_measurement: 8,
  device_type: "mobile",
  measured_in_context: "homepage_demo",
  is_first_measurement: true, // 🎉 První!
}
```

**Result:**
- ✅ Uloží se jako první KP
- 🎉 Celebrace "První KP!" (badge)
- ✅ TOP NAV zobrazí "KP 20s"
- ✅ Onboarding completed

---

## 🧮 COMPUTED FIELDS (Helper Functions)

Tyto hodnoty se **NEPOČÍTAJÍ při ukládání**, ale **VYPOČÍTÁVAJÍ při dotazu**:

### `get_current_kp(user_id)` → number | null
**Co:** Poslední validní KP usera  
**SQL:**
```sql
SELECT value_seconds 
FROM kp_measurements 
WHERE user_id = $1 AND is_valid = true
ORDER BY measured_at DESC 
LIMIT 1
```

---

### `get_first_kp(user_id)` → number | null
**Co:** První KP ever (validní i nevalidní)  
**SQL:**
```sql
SELECT value_seconds 
FROM kp_measurements 
WHERE user_id = $1
ORDER BY measured_at ASC 
LIMIT 1
```

---

### `calculate_weekly_streak(user_id)` → number
**Co:** Kolik týdnů v řadě měřil (1x týdně)  
**Logika:** Složitější (helper function v DB)

---

### `get_kp_stats(user_id)` → KPStats
**Co:** Kompletní statistiky  
**Returns:**
```typescript
{
  currentKP: number | null,
  firstKP: number | null,
  averageKP: number,
  bestKP: number,
  totalMeasurements: number,
  validMeasurements: number,
  weeklyStreak: number,
  trend: number,
}
```

---

## 🗄️ DB SCHEMA (Draft - pro budoucí migration)

```sql
-- Toto je DRAFT - vytvoříme až bude flow stabilní!

CREATE TABLE kp_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Core measurement data
  value_seconds INTEGER NOT NULL CHECK (value_seconds >= 10 AND value_seconds <= 180),
  attempt_1_seconds INTEGER NOT NULL,
  attempt_2_seconds INTEGER,
  attempt_3_seconds INTEGER,
  attempts_count INTEGER NOT NULL CHECK (attempts_count IN (1, 2, 3)),
  
  -- Time context
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_of_day TEXT NOT NULL CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
  is_morning_measurement BOOLEAN NOT NULL DEFAULT FALSE,
  hour_of_measurement INTEGER NOT NULL CHECK (hour_of_measurement >= 0 AND hour_of_measurement <= 23),
  
  -- Validity
  is_valid BOOLEAN NOT NULL DEFAULT TRUE,
  is_first_measurement BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Device & context
  device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
  measurement_duration_ms INTEGER,
  measured_in_context TEXT DEFAULT 'top_nav' CHECK (measured_in_context IN ('top_nav', 'homepage_demo', 'pokrok_module')),
  
  -- Future enhancements
  measurement_type TEXT DEFAULT 'manual' CHECK (measurement_type IN ('manual', 'hrv', 'smart')),
  notes TEXT,
  heart_rate_before INTEGER,
  heart_rate_after INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kp_measurements_user_id ON kp_measurements(user_id);
CREATE INDEX idx_kp_measurements_measured_at ON kp_measurements(measured_at DESC);
CREATE INDEX idx_kp_measurements_is_valid ON kp_measurements(is_valid) WHERE is_valid = TRUE;

-- RLS
ALTER TABLE kp_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own measurements"
  ON kp_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements"
  ON kp_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Helper Functions (TODO)
-- CREATE FUNCTION get_current_kp(user_id UUID) ...
-- CREATE FUNCTION get_first_kp(user_id UUID) ...
-- CREATE FUNCTION calculate_weekly_streak(user_id UUID) ...
```

---

## 📚 ODKAZY

- **API Hook:** `docs/api/KP_MEASUREMENTS_API.md`
- **Component:** `src/platform/components/KPCenter.tsx`
- **Hooks:** `src/hooks/kp/useKPMeasurementEngine.ts`
- **Utils:** `src/utils/kp/`

---

## ✅ CHECKLIST PRO AGENTA

Když budeš implementovat save KP:

- [ ] Zkontroluj, že všechna povinná pole jsou vyplněna
- [ ] Validuj `value_seconds` (10-180)
- [ ] Detekuj `time_of_day` z `measured_at`
- [ ] Nastav `is_morning_measurement` (4-9h)
- [ ] Nastav `is_valid` = `is_morning_measurement`
- [ ] Detekuj `device_type` z user agent
- [ ] Nastav `measured_in_context` (odkud měří)
- [ ] První měření? → `is_first_measurement = true`
- [ ] Zavolej `saveKP(data)` z `useKPMeasurements()`
- [ ] Pro testování: mock success response

---

**Version History:**
- 1.0 (2026-01-23): Initial draft - Complete data contract

---

**Status:** 🚧 DRAFT  
**Next Step:** Implementovat DB migration až bude flow stabilní  
**Questions:** Kontaktuj product team

---

✅ **Tento dokument je Single Source of Truth pro KP data!**
