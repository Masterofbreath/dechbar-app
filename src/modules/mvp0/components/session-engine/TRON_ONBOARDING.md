# CESTA NA TRŮN — Specifikace pro AI agenty

> Poslední aktualizace: 2026-03-11  
> Verze: Fáze 2 (engine plně zapojen)

---

## Co je "Cesta na Trůn"?

Cesta na Trůn je hypercapnický tréninkový nástroj pro **chůzi**. Uživatel dýchá v pevném rytmu `3 | 0 | 3 | X` (nádech | zádrž | výdech | zádrž po výdechu), kde zádrž po výdechu se postupně prodlužuje (3–23s). Hromadění CO₂ v krvi vede k lepšímu uvolňování kyslíku do buněk (Bohrův efekt).

Klíčový rozdíl od SMART CVIČENÍ (statika):
- **Trůn = dynamická aktivita** (chůze, pohyb)
- Žádná hudba na pozadí — 100% pozornost na rytmus dechu
- Multiplikátor intenzity ovlivňuje **pouze zádrž po výdechu** (inhale/exhale zůstávají fixní 3s)
- Přístup jen pro KP ≥ 20s z bezpečnostních důvodů

---

## Přístupové podmínky (všechny musí platit)

| Podmínka | Kde se kontroluje | Co se stane při nesplnění |
|---|---|---|
| Tier `SMART` nebo `AI_COACH` (nebo admin) | `TronButton.tsx` | `LockedFeatureModal` (upsell) |
| KP ≥ 20s (`TRON_MIN_KP`) | `TronButton.tsx` | Toast: "Tvoje KP je Xs. Pro Trůn potřebuješ min. 20s" |
| KP změřeno (není null) | `TronButton.tsx` | Toast: "Nejprve si změř svou KP v sekci Pokrok" |
| `safety_flags.pregnancy === false` | `TronButton.tsx` | Toast: bezpečnostní varování |
| `safety_flags.cardiovascular === false` | `TronButton.tsx` | Toast: bezpečnostní varování |

---

## Architektura toku

```
TronButton (DnesPage)
  └─ handleClick() → buildTronExercise(config) → onTronStart(config, exercise)
       ↓
DnesPage
  └─ setTronExercise(exercise) + setTronConfig(config)
       ↓
SessionEngineModal (tronConfig prop)
  └─ useEffect: idle → tron-prep
       ↓
TronPrepState (prep screen: rytmus, délka, kalibrace)
  └─ onStart → startTronSession()
       ↓
SessionActive (breathingIntervalId, isTronMode=true)
  └─ effHoldOut = holdExhale * localMultiplier (ostatní fáze = 1.0×)
       ↓
completeExercise → SessionCompleted
  └─ saveSession() → completeSession.mutateAsync() + completeTronSession.mutateAsync()
       ↓
Supabase: exercise_sessions (session_type='tron', tron_context JSONB)
         + tron_recommendations (current_level, session_count)
```

---

## Soubory a jejich role

### Konfigurace
| Soubor | Role |
|---|---|
| `src/modules/mvp0/config/tronLevels.ts` | 21 úrovní, `getTronLevel()`, `formatTronRhythm()`, `TRON_MIN_KP` |

### Typy
| Soubor | Co obsahuje |
|---|---|
| `src/modules/mvp0/types/exercises.ts` | `TronSessionConfig`, `TronContextSnapshot`, `'tron'` v session_type union |

### API / Datová vrstva
| Soubor | Role |
|---|---|
| `src/modules/mvp0/api/tron.ts` | `useTronRecommendation`, `useCompleteTronSession`, `useResetTronProgress`, `tronKeys` |
| `supabase/migrations/*_create_tron_recommendations.sql` | Tabulka `tron_recommendations` |
| `supabase/migrations/*_add_tron_context_to_exercise_sessions.sql` | Sloupec `tron_context JSONB` v `exercise_sessions` |

### Hooks
| Soubor | Role |
|---|---|
| `src/modules/mvp0/hooks/useTronSession.ts` | Čte `tron_recommendations`, sestavuje `TronSessionConfig`, exportuje `buildTronExercise()` |

### Komponenty
| Soubor | Role |
|---|---|
| `src/modules/mvp0/components/TronButton.tsx` | CTA tlačítko na DnesPage (teal, tier+safety gate) |
| `src/modules/mvp0/components/session-engine/TronPrepState.tsx` | Prep screen (rytmus, délka, kalibrace, auto-start) |
| `src/modules/mvp0/components/session-engine/SessionEngineModal.tsx` | Engine — přijímá `tronConfig`, řídí celý flow |

### Styly
| Soubor | Role |
|---|---|
| `src/styles/pages/dnes.css` | `.tron-button` + `.dnes-page__main-cta-row` (2-column grid) |
| `src/styles/components/session-engine/_tron-prep.css` | `.tron-prep__*` — prep screen (gold rytmus, teal title) |

---

## Databázové tabulky

### `public.tron_recommendations` (1 řádek na uživatele)

| Sloupec | Typ | Popis |
|---|---|---|
| `user_id` | UUID | FK → auth.users |
| `current_level` | INTEGER 1–21 | Aktuální úroveň |
| `session_count` | INTEGER | Počet dokončených Trůn sessions |
| `last_level_change_at` | TIMESTAMPTZ | Kdy naposledy změněna úroveň |
| `reset_at` | TIMESTAMPTZ | Kdy byl progress resetován |

### `public.exercise_sessions` — rozšíření pro Trůn

| Sloupec | Hodnota pro Trůn |
|---|---|
| `session_type` | `'tron'` |
| `exercise_id` | `null` (ephemeral, žádný DB řádek v `exercises`) |
| `tron_context` | `{ level, hold_exhale_base, final_multiplier, duration_seconds, session_count_at_start }` |
| `smart_context` | `null` |

---

## Úrovně (21-level scale)

Formula: `holdExhale = level + 2`

| Level | holdExhale | Label | Cyklus |
|---|---|---|---|
| 1 | 3s | Start | 9s |
| 5 | 7s | Mírný+ | 13s |
| 10 | 12s | Pokročilý+ | 18s |
| 15 | 17s | Master | 23s |
| 21 | 23s | Trůn | 29s |

---

## Intensity multiplier — Trůn mód

**Klíčový rozdíl od SMART:** multiplier ovlivňuje POUZE `holdExhale`.

```
// V SessionEngineModal.tsx — updateBreathingState():
const isTronMode = sessionTypeRef.current === 'tron';
const effInhale  = isTronMode ? 3 : inhale_seconds * localMultiplier;
const effHoldIn  = isTronMode ? 0 : 0;
const effExhale  = isTronMode ? 3 : exhale_seconds * localMultiplier;
const effHoldOut = isTronMode
  ? Math.max(1, Math.round(hold_after_exhale_seconds * localMultiplier * 10) / 10)
  : hold_after_exhale_seconds * localMultiplier;
```

Multiplier kroky: `0.5×, 0.75×, 1.0×, 1.25×, 1.5×` (stejné jako SMART)

---

## Audio pravidla pro Trůn sessions

- ❌ **Žádná background music** — `triggerMusicForSession()` vrátí early pro `tron` session type
- ✅ **Start bell** — plánovaný v `TronPrepState` (stejný mechanismus jako SmartPrepState)
- ✅ **End bell** — hraje při `completeExercise()`
- ✅ **Cues** (inhale, exhale, hold) — sdílejí SMART nastavení ze `sessionSettingsStore`
- `useBreathingCues({ isTronSession: true })` → použije `smartCuesEnabled`, `smartCueVolume`, `smartBellsEnabled`

---

## Kalibrační fáze

- Prvních **10 sessions** = kalibrace (`isCalibrating = true`)
- Zobrazen progress v `TronPrepState` (10 teček + text)
- Skloňování slova "cesta": **10 cest, 5 cest / 4 cesty, 3 cesty, 2 cesty, poslední cestu**
- Po 10 sezeních algoritmus v `useCompleteTronSession` začne upravovat `current_level`

---

## Logika postupu v úrovních

Implementováno v `src/modules/mvp0/api/tron.ts` → `useCompleteTronSession`:

- `final_multiplier >= 1.25` → level UP (při dalším doporučení)
- `final_multiplier <= 0.75` → level DOWN
- `final_multiplier === 1.0` → level beze změny
- Level se mění maximálně o ±1 po každé session
- Změna se projeví až v **dalším** `useTronRecommendation` fetch (po invalidaci cache)

---

## Bezpečnostní pravidla

1. `TRON_MIN_KP = 20s` — absolutní minimum, nelze obejít
2. Těhotenství (`pregnancy: true`) → blokováno
3. Kardiovaskulární potíže (`cardiovascular: true`) → blokováno
4. `holdInhale` je VŽDY 0 — zadržení po nádechu je pro Trůn nepřijatelné

---

## Barevné schéma

| Element | Barva | Proč |
|---|---|---|
| Tlačítko na DnesPage (`.tron-button`) | Teal `#2CBEC6` | Vizuální odlišení od zlatého SMART tlačítka |
| Prep screen title, icon, "cesta" label | Teal `#2CBEC6` | Identifikace komponenty |
| Hero rytmus, duration, hint-count | Gold `#F8CA00` (`--color-accent`) | Jednotný vizuální jazyk s SMART prep screen |
| Card border, box-shadow | `rgb(248 202 0 / 18%)` | Konzistentní s `.smart-prep__card` |

---

## Co NESMÍŠ měnit bez pochopení

1. `buildTronExercise()` — single-phase, žádné multi-phase. Trůn nemá "nástup/peak/doznění" jako SMART.
2. `isTronMode` logika v `updateBreathingState` — zásah do ní změní chování multiplier pro VŠECHNY session typy.
3. `TRON_MIN_KP = 20` — bezpečnostní konstanta, nesnižuj.
4. Bell scheduling v `TronPrepState` — stejný Safari AudioContext fix jako v `SmartPrepState`. Nemeň bez pochopení `scheduleBellsCalledRef` patternu.
