# SMART CVIČENÍ — Feature Specification

**Verze:** 1.0  
**Datum:** 2026-03-05  
**Status:** ✅ Připraveno k implementaci  
**Tier:** SMART + AI_COACH (premium feature)  
**Primární soubory:** `src/modules/mvp0/components/SmartExerciseButton.tsx`, `src/modules/mvp0/components/session-engine/`, `src/modules/mvp0/pages/SettingsPage.tsx`, `src/components/pokrok/`, `src/modules/mvp0/types/exercises.ts`

> **Pro nové agenty:** Tento dokument definuje celou komponentu SMART CVIČENÍ.  
> Pokud provádíš změny v logice algoritmu, UI flow, datovém modelu nebo škále rytmů — **aktualizuj tento dokument** spolu se svými změnami.

---

## 1. Vize a cíl

SMART CVIČENÍ je první svého druhu **adaptivní trenér dechového vzorce** — funkce bez konkurence v globálním trhu dechových aplikací. Cílem je automaticky doporučit uživateli optimální dechové cvičení (rytmus + délku + fáze) podle jeho aktuálního stavu, historie a fyzické kondice (KP).

**Primární cíl:** Uživatel postupně zvyšuje svůj základní dechový vzorec a tím zlepšuje svůj KP (Kontrolní Pauza — délka bezproblémové zádrže dechu při měření).

**Filosofie:** 80% komfort, 20% výzva. Méně a dlouhodobě je více než krátkodobé přepálení. Bezpečnost vždy nad výkonem.

**UX princip:** "Klikneš a dýcháš." Maximum 2 kliky od otevření aplikace k probíhajícímu cvičení.

---

## 2. Tier a přístup

| Tier | Přístup |
|------|---------|
| ZDARMA | Tlačítko viditelné, po kliknutí zobrazí `LockedFeatureModal` |
| SMART | Plný přístup — doporučení + cvičení |
| AI_COACH | Plný přístup + budoucí LLM coaching vrstva |

---

## 3. Datový model

### 3.1 Existující tabulky (Supabase)

**`smart_exercise_recommendations`** (existuje, 0 řádků):
- `user_id` UUID PK
- `recommended_inhale_s` NUMERIC
- `recommended_hold_after_inhale_s` NUMERIC (vždy 0 — zádrže po nádechu nikdy)
- `recommended_exhale_s` NUMERIC
- `recommended_hold_after_exhale_s` NUMERIC
- `confidence_score` NUMERIC (0.0–1.0)
- `data_points_count` INTEGER
- `is_ready` BOOLEAN
- `context_snapshot` JSONB
- `recalculate_after` TIMESTAMPTZ
- `last_calculated_at` TIMESTAMPTZ

**`session_intensity_events`** (existuje, ~33 řádků):
- `session_id`, `user_id`, `occurred_at_ms`, `action` ('up'|'down'), `multiplier_from`, `multiplier_to`

**`exercise_sessions`** (existuje, 93 řádků):
- Klíčová pole: `final_intensity_multiplier`, `quality_rating`, `difficulty_rating`, `was_completed`, `session_type`, `started_at`

**`kp_measurements`** (existuje, 48 řádků):
- `value_seconds`, `time_of_day`, `is_morning_measurement`, `measured_at`

**`profiles`** (existuje):
- `safety_flags` JSONB: `{epilepsy, pregnancy, cardiovascular, asthma, questionnaire_completed}`

### 3.2 Požadované DB změny (nové migrace)

**Migrace 1 — `smart_exercise_recommendations` rozšíření:**
```sql
ALTER TABLE public.smart_exercise_recommendations
  ADD COLUMN current_level INTEGER DEFAULT 3,
  ADD COLUMN session_count_smart INTEGER DEFAULT 0,
  ADD COLUMN preferred_duration_seconds INTEGER DEFAULT 420,
  ADD COLUMN time_context TEXT DEFAULT 'day'
    CHECK (time_context IN ('morning','day','evening','night')),
  ADD COLUMN phase_profile TEXT DEFAULT 'standard'
    CHECK (phase_profile IN ('standard','dynamic_day','evening_humming'));

COMMENT ON COLUMN public.smart_exercise_recommendations.current_level
  IS 'Index do BREATH_LEVELS škály (1–21). Aktuální optimální level uživatele.';
COMMENT ON COLUMN public.smart_exercise_recommendations.session_count_smart
  IS 'Počet dokončených SMART sessions. Pod 10 = kalibrační fáze.';
```

**Migrace 2 — `exercise_sessions` rozšíření:**
```sql
-- session_type: přidat 'smart' hodnotu (existující CHECK constraint rozšíření)
ALTER TABLE public.exercise_sessions
  DROP CONSTRAINT IF EXISTS exercise_sessions_session_type_check;
ALTER TABLE public.exercise_sessions
  ADD CONSTRAINT exercise_sessions_session_type_check
    CHECK (session_type IN ('preset', 'custom', 'smart'));

ALTER TABLE public.exercise_sessions
  ADD COLUMN smart_context JSONB;

COMMENT ON COLUMN public.exercise_sessions.smart_context
  IS 'Kompletní kontext SMART session: použitý level, fáze, KP snapshot, time_context, phase_profile, base_rhythm. NULL pro non-smart sessions. Klíčové pro AI COACH analýzu.';
```

**Migrace 3 — `profiles.safety_flags` — podpora kojení:**
```sql
-- Kojení přidáváme jako safety flag (chování shodné s těhotenstvím)
-- Aplikováno při příštím vyplnění questionnaire — není zpětně nutné
-- Poznámka: safety_flags je JSONB, nová pole se přidávají přirozeně
```

**Migrace 4 — `smart_settings` v user profile (Zustand persist stačí pro MVP):**
> Délka cvičení se ukládá lokálně v Zustand persist store jako `smartDurationMode`. DB sync v2.

---

## 4. Algoritmus — Breath Intelligence Engine (BIE)

### 4.1 Přehled

BIE je **deterministický algoritmus** (bez LLM), běží na frontendu při každém kliknutí na tlačítko SMART CVIČENÍ. Výsledek je cachován v `smart_exercise_recommendations` s TTL 24h. Výpočet trvá < 100ms.

LLM (AI COACH) se přidá v budoucí verzi pro textovou personalizovanou zpětnou vazbu — **nezdržuje** aktuální flow.

### 4.2 BREATH_LEVELS škála (21 levelů)

Konstantní konfigurace v kódu (`src/modules/mvp0/config/breathLevels.ts`).

Zádrže po nádechu = **vždy 0** (bez výjimky).  
Pořadí navyšování: výdech → nádech → zádrž po výdechu.  
Ratio výdech:nádech vždy ≥ 1.5×.

| Level | Nádech | Zádrž↑ | Výdech | Zádrž↓ | Min KP | Label | Dechy/min |
|-------|--------|--------|--------|--------|--------|-------|-----------|
| 1 | 4 | 0 | 4 | 0 | 0 | Vstup | ~7.5 |
| 2 | 4 | 0 | 5 | 0 | 0 | Základní | ~6.7 |
| 3 | 4 | 0 | 6 | 0 | 0 | Základní+ | ~6.0 |
| 4 | 4 | 0 | 7 | 0 | 0 | Mírný | ~5.5 |
| 5 | 4 | 0 | 8 | 0 | 0 | Mírný+ | ~5.0 |
| 6 | 5 | 0 | 8 | 0 | 0 | Střední | ~4.6 |
| 7 | 5 | 0 | 9 | 1 | 0 | Střední+ | ~4.0 |
| 8 | 5 | 0 | 10 | 1 | 11 | Střední++ | ~3.75 |
| 9 | 5 | 0 | 10 | 2 | 20 | Pokročilý | ~3.5 |
| 10 | 5 | 0 | 11 | 2 | 20 | Pokročilý+ | ~3.3 |
| 11 | 5 | 0 | 12 | 2 | 25 | Pokročilý++ | ~3.1 |
| 12 | 6 | 0 | 12 | 3 | 30 | Expert | ~3.0 |
| 13 | 6 | 0 | 12 | 4 | 30 | Expert+ | ~2.9 |
| 14 | 6 | 0 | 13 | 4 | 35 | Expert++ | ~2.7 |
| 15 | 6 | 0 | 14 | 4 | 40 | Master | ~2.6 |
| 16 | 7 | 0 | 14 | 5 | 40 | Master+ | ~2.4 |
| 17 | 7 | 0 | 15 | 5 | 45 | Master++ | ~2.3 |
| 18 | 7 | 0 | 16 | 5 | 50 | Elite | ~2.2 |
| 19 | 7 | 0 | 17 | 5 | 55 | Elite+ | ~2.1 |
| 20 | 8 | 0 | 16 | 5 | 55 | Elite++ | ~2.1 |
| 21 | 8 | 0 | 17 | 5 | 60 | Mistr | ~2.0 |

> **Notace UI:** `4 · 0 · 7 · 0` — nuly zádrže se zobrazují jako `0`.  
> Pokud zádrž > 0: `5 · 0 · 10 · 2` (číslo zádrže vždy viditelné).  
> Uživatele učíme naší terminologii, která je konzistentní napříč celou aplikací.

### 4.3 TIER 1 — Safety Gate (přepisuje absolutně vše)

Zdroj: `profiles.safety_flags`  
Editovatelné kdykoliv v Profil page (sekce "Zdravotní dotazník").  
Při odškrtnutí: jednorázový confirm dialog ("Potvrzuješ, že toto zdravotní omezení již nemáš?").

| Safety Flag | Max rytmus | Zádrže | Max délka |
|-------------|-----------|--------|-----------|
| pregnancy = true | 4\|0\|6\|0 (level 3) | žádné | 10 min |
| cardiovascular = true | 4\|0\|6\|0 (level 3) | žádné | 10 min |
| epilepsy = true | 4\|0\|6\|0 (level 3) | žádné | 10 min |
| asthma = true | 4\|0\|6\|0 (level 3) | žádné | bez omezení délky |

### 4.4 TIER 2 — KP Cap (tvrdý strop pro rytmus a zádrže)

Zdroj: nejnovější validní `kp_measurements.value_seconds`

| KP rozsah | Max level | Max rytmus | Zádrže |
|-----------|-----------|------------|--------|
| < 10s | 3 | 4\|0\|6\|0 | žádné |
| 11–20s | 5 | 4\|0\|8\|0 | žádné |
| 20–30s | 9 | 5\|0\|10\|2 | max 2s |
| 30–40s | 13 | 6\|0\|12\|4 | max 4s |
| 40–50s | 16 | 7\|0\|14\|5 | max 5s |
| 50s+ | 21 | uncapped | uncapped |

### 4.5 TIER 3 — Time Context (denní modulátor)

Zdroj: `new Date().getHours()` na zařízení uživatele

**4:00–10:00 (morning):** Zádrže povoleny (pokud splněn KP cap). Mírně náročnější doporučení — upper_bound aktuálního levelu.

**10:00–17:00 (day):** Plná volnost. Dynamický 5-fázový profil dostupný (viz sekce 5).

**17:00–20:00 (evening_lite):** -1 level od aktuálního optima. Mírně klidnější.

**20:00–4:00 (night)** — speciální prahy bez zádrží:

| KP | Max noční rytmus |
|----|-----------------|
| < 10s | 4\|0\|6\|0 |
| 10–20s | 5\|0\|7\|0 |
| 20–30s | 6\|0\|9\|0 |
| 30s+ | 7\|0\|10\|0 |

V nočním okně: **bzučení při výdechu** přidáno do Fáze 3 (viz sekce 5).

### 4.6 TIER 4 — Session Intelligence (jádro učení)

Zdroj: `exercise_sessions` kde `session_type = 'smart'` a `was_completed = true`  
Rolling window: posledních 5–7 dokončených SMART sessions

**Primární signály (objektivní):**
- `final_intensity_multiplier` — byl uživatel na 1.5× (lehké) nebo 0.5× (těžké)?
- `session_intensity_events` — pattern tapů: kolikrát +/-, kdy v průběhu session?

**Sekundární signály:**
- `difficulty_rating` (1=easy, 2=just right, 3=hard) — pokud vyplněno
- `was_completed` — nedokončená session se do kalibrace NEpočítá

**Logika progression:**

```
Signál NAVÝŠENÍ (level + 1):
  - final_intensity_multiplier ≥ 1.25 v posledních 2 sezeních
  - difficulty_rating = 1 (snadné) v posledních 2 sezeních
  - was_completed = true obě sezení
  - Podmínka: min 2 dny uplynuly od posledního navýšení (denní uživatel)
  - Podmínka: min 7 dní uplynulo (uživatel 3×/týden)

Signál SNÍŽENÍ (level - 1):
  - final_intensity_multiplier ≤ 0.75 v posledním sezení
  - difficulty_rating = 3 (náročné) v posledním sezení
  - was_completed = false (nedokončení = okamžitý signal přepálení)
  - Okamžité snížení, bez čekání

Zádrž přidání (hold_exhale + 1s):
  - Min 7 dní konzistentní výkon na aktuálním levelu
  - KP musí splňovat podmínku pro zádrž (Tier 2)
  - Zádrž se přidává jako nový level, nikoliv modifikace stávajícího
```

### 4.7 TIER 5 — Progression Gate

- Denní uživatel (streak ≥ 5): max +1 level každé **2 dny**
- Sporadický (streak < 5): max +1 level každý **7 dní**
- Nikdy více než +1 level v jednom výpočtu
- Snížení: okamžité, bez gate

### 4.8 TIER 6 — Behavioral Preference

- KLID/VEČER oblíbená cvičení → zvyšuje pravděpodobnost `phase_profile = 'evening_humming'`
- Activity streak ≥ 7: lze nabídnout horní konec délkového rozsahu
- (v2) Akademie lesson favorites × technique tags → preference bzučení/přidušení

### 4.9 Cold Start (0 SMART sessions)

Default: `level = 3` (4|0|6|0), `délka = 7 min`, `phase_profile = 'standard'`.  
Bezpečný vstup pro všechny KP a safety flags.

### 4.10 Kalibrační fáze

| SMART sessions | Stav | `confidence_score` | UI hint |
|---|---|---|---|
| 0–3 | Exploration | 0.0–0.3 | "Absolvuj ještě X cvičení pro přesné doporučení" |
| 4–9 | Calibration | 0.3–0.7 | "Ještě X cvičení a budu tě znát jako své boty." + dots progress |
| 10+ | Ready | 0.7–1.0 | Plné doporučení bez disclaimeru |

---

## 5. Dynamický intenzitní profil (multi-phase)

SMART cvičení generuje **ephemeral `Exercise` objekt** (není uložen v tabulce `exercises`).  
Typ: `BreathingPattern.type = 'multi-phase'`.

### 5.1 Morning profile (4:00–10:00)

```
Fáze 1: NÁSTUP    T × 20%   base_rhythm          (zahřátí)
Fáze 2: PEAK      T × 55%   base_rhythm × 1.15   (hlavní trénink)
Fáze 3: DOZNĚNÍ   T × 20%   base_rhythm          (návrat)
Fáze 4: TICHO     T × 5%    silence (min 30s, max 60s)
```

*× 1.15 se zaokrouhlí na celé sekundy výdechu, nikdy nepřekročí TIER 2 cap.*

### 5.2 Dynamic Day profile (10:00–17:00) — prémiový 5-fázový

```
Fáze 1: NÁSTUP    T × 20%   base_rhythm          (zahřátí)
Fáze 2: NÁRŮST    T × 35%   base_rhythm × 1.15   (progrese)
Fáze 3: PEAK      T × 20%   base_rhythm × 1.25   (vrchol — testovací interval)
Fáze 4: DOZNĚNÍ   T × 20%   base_rhythm          (návrat)
Fáze 5: TICHO     T × 5%    silence
```

*Fáze 3 PEAK slouží jako "preview" příštího levelu — data z intensity taps v této fázi jsou extra cenná.*

### 5.3 Evening/Night profile (17:00–4:00)

```
Fáze 1: NÁSTUP    T × 20%   base_rhythm          (zahřátí)
Fáze 2: HLAVNÍ    T × 45%   base_rhythm          (bez navýšení)
Fáze 3: BZUČENÍ   T × 30%   base_rhythm + instrukce "Při výdechu jemně bzuč"
Fáze 4: TICHO     T × 5%    silence
```

*V nočním okně žádné zádrže, žádné navýšení, pouze bzučení jako parasympatická aktivace.*

### 5.4 Délka cvičení

Uloženo v `sessionSettingsStore` jako `smartDurationMode`:

```typescript
type SmartDurationMode =
  | { type: 'fixed'; seconds: number }        // 300–900s (5–15 min)
  | { type: 'range'; preset: 'short' | 'medium' | 'long' }
  //   short  = 5–8 min  → algoritmus zvolí podle time_context
  //   medium = 7–10 min → default
  //   long   = 10–15 min
```

Výběr konkrétní délky v rozsahu:
1. **Primárně:** time_context (ráno → kratší konec, večer → delší konec)
2. **Sekundárně:** streak (≥ 7 dní → delší konec rozsahu)
3. **Terciálně:** mood_before (tired → kratší, pokud uživatel mood vybere)

Délka fází = `total_seconds × phase_ratio`. Min. délka tiché fáze = 30s.

---

## 6. UX Flow — "Klikneš a dýcháš"

### 6.1 Kompletní tok od kliknutí

```
[Tlačítko SMART CVIČENÍ na DnesPage]
        ↓ kliknutí
[BIE výpočet] (< 100ms, nebo cache z smart_exercise_recommendations)
        ↓
[SessionEngineModal otevře se s prop: smartConfig={...}]
        ↓
[SMART Prep State] — zobrazí se místo SessionStartScreen:
   • Nadpis: "SMART CVIČENÍ"
   • Dnešní doporučení: [4 · 0 · 7 · 0] [7 min]
   • (pokud calibrating): "Ještě 3 cvičení a budu tě znát jako své boty."
                          [● ● ● ○ ○ ○ ○ ○ ○ ○] (dots progress)
   • Dole: [–1 min] [+1 min] ghost buttons (mění délku o 60s)
   • Countdown začne automaticky po 5 sekundách NEBO okamžitě při tiku
        ↓ (5s countdown nebo tap kdekoliv na screen)
[SessionCountdown 5→0]
   • BreathingCircle + countdown číslo
   • Zobrazí se doporučení jako text pod kružnicí (stejný pattern jako protokoly)
        ↓
[SessionActive] — probíhá cvičení s dynamickým profilem
   • Intensity controls (+/-) viditelné
   • Fáze se střídají dle multi-phase struktury
        ↓
[SessionCompleted] — po dokončení
   • DifficultyCheck (1-3)
   • MoodSlider (mood after)
   • NotesField (volitelné)
   • BIE přepočet se naplánuje (recalculate_after = now + 24h)
```

### 6.2 Přerušení SMART session

Při tiku "Zavřít" během active stavu: stávající `ConfirmModal` se **rozšíří** o SMART-specific zprávu:

> "Probíhá kalibrace SMART CVIČENÍ. Nedokončené cvičení se do kalibrace nepočítá."  
> [Pokračovat] [Přesto odejít]

Tato zpráva se zobrazí **pouze** pokud `session_type === 'smart'` a `session_count_smart < 10`.

---

## 7. SMART Audio identita

SMART CVIČENÍ má **vlastní audio profil** odlišný od standardního cvičení. Nastavitelné v Settings → karta "SMART CVIČENÍ".

| Zvuk | Standard | SMART (default) |
|------|----------|-----------------|
| Start bell | Solfeggio 396 Hz | Dedikovaný SMART start bell |
| End bell | Solfeggio 963 Hz | Dedikovaný SMART end bell |
| Inhale cue | dle pack | SMART sada (jemnější, prémiový sound) |
| Exhale cue | dle pack | SMART sada |
| Background music | user choice | SMART dedikovaná playlist kategorie |

**Kategorie v `background_tracks`:** přidat novou kategorii `smart` (slug: `smart-session`).  
Admin nahraje tracky označené pro SMART. Default track pro SMART: vybrán z kategorie `smart` náhodně.

---

## 8. Settings — reorganizace karet

### 8.1 Nová struktura SettingsPage

```
Karta 1: "Cvičení & protokoly"     [vždy viditelná]
  - Zvuk při změně rytmu (toggle + pack + volume)
  - Vibrace (toggle + intensity + adaptive) [native only]
  - Hudba na pozadí (toggle + track + volume)
  - Doplňky (walking mode + bells + keep screen on + vocal guidance)

Karta 2: "SMART CVIČENÍ"           [viditelná vždy, locked pro ZDARMA]
  - Pro ZDARMA tier: karta zobrazena jako zamčená,
    klik = tooltip "Prémiová funkce dostupná s tarifem SMART"
  - Pro SMART/AI_COACH:
    • Preferovaná délka:
      ○ Pevný čas: [slider 5–15 min]
      ● Smart Time:
          ○ Krátké   5–8 min
          ● Střední  7–10 min  (default)
          ○ Delší    10–15 min
    • Zvuk pro SMART CVIČENÍ:
      - Start bell (selector ze SMART pack)
      - End bell (selector ze SMART pack)
      - Signály rytmu dechu (selector ze SMART pack)
    • Hudba na pozadí SMART:
      - toggle + SMART playlist selector + volume

Karta 3: [budoucí — případná další nastavení]
```

---

## 9. Pokrok page — SMART widget

### 9.1 Umístění

V `PokrokPage`, sekce **Výkon** (zatím jediná aktivní sekce — Komunita a TOP10 mají placeholder "Obsah se rozdýchává a brzy bude dostupný").

SMART widget se zobrazí **pod** `KPSection`, sdílí stejný vizuální jazyk (glass card, Apple premium style).

### 9.2 Obsah SMART widgetu

```
[Ikona — odlišná od plic, např. sinusoida/vlna dechu]

SMART DECH
Aktuální rytmus: 4 · 0 · 7 · 0
Level: 4 / 21  [●●●●○○○○○○○○○○○○○○○○○]

[Mini sparkline — vývoj levelu v čase]

Zahájil: <datum první SMART session>  |  Celkem: <N> cvičení
[→ Spustit SMART CVIČENÍ]
```

Pokud uživatel nemá žádné SMART sessions: empty state s CTA "Začni první SMART cvičení".

### 9.3 Pokrok page tab struktura (pro budoucnost)

```
Výkon     | Komunita       | TOP10
──────────────────────────────────
KPSection | (coming soon)  | (coming soon)
SMART     | "Obsah se      | "Obsah se
widget    |  rozdýchává"   |  rozdýchává"
Activity  |                |
Heatmap   |                |
Community |                |
Milestone |                |
Weekly    |                |
Stats     |                |
```

Tabs implementace: sticky tabs (stejný vzor jako `exercise-list__tabs` v CvičitPage).

---

## 10. Výpočet — SmartExerciseButton a SessionEngineModal integrace

### 10.1 Nový prop `smartConfig`

```typescript
interface SmartSessionConfig {
  level: number;                    // 1–21, index do BREATH_LEVELS
  basePattern: {
    inhale_seconds: number;
    hold_after_inhale_seconds: 0;   // vždy 0
    exhale_seconds: number;
    hold_after_exhale_seconds: number;
  };
  totalDurationSeconds: number;     // vypočtená délka
  phaseProfile: 'standard' | 'dynamic_day' | 'evening_humming';
  timeContext: 'morning' | 'day' | 'evening' | 'night';
  sessionCountSmart: number;        // pro kalibrační UI
  confidenceScore: number;          // 0.0–1.0
  isCalibrating: boolean;           // sessionCountSmart < 10
  cacheValid: boolean;              // z smart_exercise_recommendations
}
```

`SessionEngineModal` přijme nový volitelný prop `smartConfig?: SmartSessionConfig`.  
Pokud přítomen → `sessionType = 'smart'`, zobrazí SMART prep state místo `SessionStartScreen`.

### 10.2 Ukládání SMART session

`completeSession` API se rozšíří:
```typescript
interface CompleteSessionPayload {
  // ... existující pole ...
  session_type?: 'preset' | 'custom' | 'smart';  // nové
  smart_context?: SmartContextSnapshot;            // nové, pouze pro smart
}
```

`smart_context` JSONB struktura:
```json
{
  "level": 4,
  "base_rhythm": { "inhale": 4, "hold_inhale": 0, "exhale": 7, "hold_exhale": 0 },
  "phase_profile": "standard",
  "time_context": "morning",
  "kp_at_session": 22,
  "total_duration_seconds": 420,
  "confidence_score_at_start": 0.65,
  "session_count_at_start": 7,
  "phase_breakdown": [
    { "order": 1, "duration_seconds": 84, "multiplier": 1.0 },
    { "order": 2, "duration_seconds": 231, "multiplier": 1.15 },
    { "order": 3, "duration_seconds": 84, "multiplier": 1.0 },
    { "order": 4, "duration_seconds": 21, "type": "silence" }
  ]
}
```

---

## 11. Soubory k vytvoření/modifikaci

### Nové soubory

```
src/modules/mvp0/config/breathLevels.ts
  └── BREATH_LEVELS konstanta (21 levelů), typová definice BreathLevel

src/modules/mvp0/engine/BreathIntelligenceEngine.ts
  └── BIE algoritmus — computeSmartSession(userId, kp, safetyFlags, history, settings)
  └── buildSmartExercise(config) → ephemeral Exercise object

src/modules/mvp0/hooks/useSmartExercise.ts
  └── React hook: načte data, zavolá BIE, vrátí SmartSessionConfig
  └── Cache logika (smart_exercise_recommendations TTL 24h)
  └── Výpočet na frontendu (<100ms), invalidace po každé SMART session

src/modules/mvp0/components/session-engine/SmartPrepState.tsx
  └── SMART prep screen (místo SessionStartScreen pro smart sessions)
  └── Countdown se spustí automaticky po 5s nebo tappem
  └── Zobrazí rhythm, délku, kalibrační progress, ±1 min buttons

src/components/pokrok/SmartSection.tsx
  └── SMART widget pro PokrokPage (vizuální jazyk KPSection)

src/styles/components/smart-exercise.css
  └── Styly pro SmartPrepState, SmartSection widget

supabase/migrations/YYYYMMDDHHMMSS_smart_exercise_enhancements.sql
  └── Viz sekce 3.2 — rozšíření smart_exercise_recommendations + exercise_sessions
```

### Modifikované soubory

```
src/modules/mvp0/components/SmartExerciseButton.tsx
  └── onClick → spustí useSmartExercise, otevře SessionEngineModal se smartConfig

src/modules/mvp0/components/session-engine/SessionEngineModal.tsx
  └── Nový prop: smartConfig?: SmartSessionConfig
  └── Nový state: 'smart-prep' (před countdown)
  └── Rozšíření ConfirmModal o SMART-specific zprávu
  └── completeSession: přidání session_type + smart_context

src/modules/mvp0/api/exercises.ts
  └── completeSession hook: rozšíření CompleteSessionPayload (session_type, smart_context)
  └── Nový hook: useSmartRecommendation (CRUD pro smart_exercise_recommendations)

src/modules/mvp0/pages/DnesPage.tsx
  └── SmartExerciseButton onClick: předá exercise + smartConfig do SessionEngineModal

src/modules/mvp0/pages/SettingsPage.tsx
  └── Reorganizace karet: "Cvičení & protokoly" + "SMART CVIČENÍ"
  └── Nová SMART karta s duration mode + SMART audio selection

src/modules/mvp0/stores/sessionSettingsStore.ts
  └── Přidat smartDurationMode: SmartDurationMode
  └── Přidat smartAudioPack: string | null (SMART audio identita)

src/modules/mvp0/types/exercises.ts
  └── Přidat: SmartSessionConfig, SmartContextSnapshot, SmartDurationMode

src/modules/mvp0/pages/PokrokPage.tsx
  └── Přidat SmartSection pod KPSection
  └── Přidat tab navigaci (Výkon / Komunita / TOP10) s placeholdery

src/modules/mvp0/pages/ProfilPage.tsx
  └── Aktivovat "Zdravotní dotazník" sekci (odstraňit PŘIPRAVUJEME stav)
  └── Safety flags formulář s confirm dialogem při odškrtnutí
```

---

## 12. DB migrace — pořadí

1. `YYYYMMDDHHMMSS_smart_exercise_enhancements.sql` — sloupce v smart_exercise_recommendations + session_type constraint + smart_context column
2. `YYYYMMDDHHMMSS_smart_audio_category.sql` — přidat kategorii `smart` do background_categories

---

## 13. Push notifikace (budoucnost)

Aktuálně: in-app notifikace (tabulka `notifications`).  
Plán: Při přidání Capacitor push notifikací → připojit trigger na `recalculate_after` timestamp.  
2× denně (4:00 + 16:00) aktivní SMART uživatele notifikovat: "Pro tebe máme aktuální SMART cvičení."

Připravit: `notification_auto_triggers` tabulka existuje, připravena pro tuto funkci.

---

## 14. KPI a úspěch komponenty

| Metrika | Cíl (po 60 dnech od launche) |
|---------|------------------------------|
| Aktivace SMART (% SMART tier uživatelů, kteří spustili ≥1 SMART session) | ≥ 70% |
| Dokončenost SMART sessions | ≥ 80% |
| Retention po 30 dnech (SMART uživatelé vs. free) | +20% |
| Průměrný level po 30 sezeních | ≥ 6 (z 1) |
| KP zlepšení za 90 dní u pravidelných SMART uživatelů | ≥ +5s |

---

## 15. Bezpečnostní pravidla (KRITICKÉ)

1. **Safety Gate přepisuje vše** — žádný algoritmus nesmí překročit Tier 1 limity
2. **KP Cap je tvrdý strop** — žádná zádrž bez splněného KP prahu
3. **Zádrže po nádechu NIKDY** — v celém systému, žádná výjimka
4. **Maximální progression** — max +1 level za 2 dny (nebo 7 dní)
5. **Nedokončená session = nezapočítá se** do kalibrace
6. **Přímé DB změny zakázány** — vše přes migrační soubory

---

## 16. Verze a changelog

| Verze | Datum | Popis |
|-------|-------|-------|
| 1.0 | 2026-03-05 | Iniciální feature spec po brainstormingu (3 kola, ~20 otázek) |

> **Při každé implementační změně:** Aktualizuj tuto tabulku a příslušné sekce.

---

*Tento dokument byl vytvořen na základě tříroundového brainstormingu mezi produktovým vlastníkem a AI agentem.*  
*Uložení: `dechbar-app/docs/features/SMART_EXERCISE_SPEC.md`*
