# MASTER PROMPT — PLAN MODE: SMART CVIČENÍ Implementace

**Soubor k použití:** Zkopíruj celý obsah níže do nového Cursor agenta v PLAN MODE.  
**Doporučení:** Spusť v **novém agentovi** (PLAN MODE) — tato konverzace má velký kontext,  
nový agent s čistým oknem a tímto promptem provede přesnější plán bez přetížení.

---

## PROMPT PRO NOVÉHO AGENTA (PLAN MODE):

```
Jsi zkušený senior React/TypeScript architekt pracující na projektu dechbar-app/
(React 18 + TypeScript + Supabase + Capacitor, mobile-first).

TVŮJ ÚKOL:
Vytvoř detailní implementační plán (krok za krokem) pro novou feature
SMART CVIČENÍ podle existující Feature Spec.

POVINNÉ ČTENÍ PŘED PLÁNOVÁNÍM (přečti v tomto pořadí):
1. dechbar-app/README.md
2. dechbar-app/docs/development/AI_AGENT_ONBOARDING.md
3. dechbar-app/docs/features/SMART_EXERCISE_SPEC.md  ← PRIMÁRNÍ ZDROJ PRAVDY
4. dechbar-app/src/modules/mvp0/types/exercises.ts
5. dechbar-app/src/modules/mvp0/components/SmartExerciseButton.tsx
6. dechbar-app/src/modules/mvp0/components/session-engine/SessionEngineModal.tsx
7. dechbar-app/src/modules/mvp0/components/session-engine/hooks/useIntensityControl.ts
8. dechbar-app/src/modules/mvp0/api/exercises.ts
9. dechbar-app/src/modules/mvp0/pages/DnesPage.tsx
10. dechbar-app/src/modules/mvp0/pages/SettingsPage.tsx
11. dechbar-app/src/modules/mvp0/stores/sessionSettingsStore.ts
12. dechbar-app/src/modules/mvp0/types/audio.ts
13. dechbar-app/src/modules/mvp0/pages/PokrokPage.tsx
14. dechbar-app/src/components/pokrok/KPSection.tsx
15. dechbar-app/src/modules/mvp0/pages/ProfilPage.tsx
16. dechbar-app/src/styles/pages/dnes.css
17. dechbar-app/src/routes/index.tsx

KONTEXT PROJEKTU:
- Workspace: /Users/DechBar/dechbar-app/
- React 18 + TypeScript + Vite, Supabase (PostgreSQL + Auth), Zustand, React Router v6
- Design: Dark-first premium (#121212 bg, #2CBEC6 teal, #D6A23A gold), Inter font
- Filosofie: "Calm by Default", "One Strong CTA", "Less is More", 4 Temperamenty
- Mobile-first, budoucí Capacitor iOS/Android native app
- Supabase projekt ID: iqyahebbteiwzwyrtmns

KRITICKÁ PRAVIDLA PRO PLÁN:
1. NIKDY neprovádět přímé změny v Supabase dashboardu — vždy migrace
2. Každá DB změna = nový soubor v supabase/migrations/YYYYMMDDHHMMSS_nazev.sql
3. Implementace VŽDY v pořadí: DB migrace → typy → engine → hooks → UI
4. Po každém kroku: ZACHOVAT funkčnost existujícího kódu (no breaking changes)
5. Dodržet coding standards z .cursorrules (2 spaces indent, const/let, no var)
6. Všechny nové komponenty: CSS Modules nebo dedikovaný .css soubor v src/styles/
7. Žádné emoji v UI komponentách, pouze inline SVG ikony (24×24, 2px stroke)
8. Tykání v česky psaném UI textu, dechový vibe v success/loading zprávách

VÝSTUP PLÁNU:
Vytvoř implementační plán rozdělený do FÁZÍ (ne nutně splnit v jednom agentovi).
Každá fáze musí být:
- Samostatně funkční (app nesmí být broken po jakékoli fázi)
- Jasně definovaná (co přesně se vytvoří/modifikuje)
- Testovatelná (co má uživatel vidět po dokončení fáze)

POŽADOVANÉ FÁZE (přizpůsob podle svého architektonického úsudku):

FÁZE 0 — DB migrace a typy (základ bez UI)
- Supabase migrace: rozšíření smart_exercise_recommendations, exercise_sessions
- TypeScript typy: SmartSessionConfig, SmartContextSnapshot, SmartDurationMode, BreathLevel
- breathLevels.ts config: BREATH_LEVELS konstanta (21 levelů)
- Výstup: kompilace prochází, DB schéma připraveno

FÁZE 1 — BIE Algoritmus (logika bez UI)
- BreathIntelligenceEngine.ts: computeSmartSession() funkce
  - TIER 1: Safety Gate (čtení safety_flags)
  - TIER 2: KP Cap (čtení kp_measurements)
  - TIER 3: Time Context (device time)
  - TIER 4: Session Intelligence (rolling 5 sessions)
  - TIER 5: Progression Gate
  - TIER 6: Behavioral Preference (basic)
- buildSmartExercise(): generátor ephemeral Exercise objektu (multi-phase)
  - Morning profile (4 fáze)
  - Dynamic Day profile (5 fází, 10:00–17:00)
  - Evening/Night profile s bzučením (4 fáze)
- useSmartExercise hook: React wrapper s cache logikou
- Výstup: unit-testovatelný algoritmus, žádné UI změny

FÁZE 2 — SessionEngineModal integrace (core UX flow)
- SmartPrepState.tsx: nová komponenta (místo SessionStartScreen pro smart)
  - Rhythm zobrazení: "4 · 0 · 7 · 0"
  - Délka cvičení
  - Kalibrační progress (dots + text)
  - ±1 min buttons (ghost style)
  - Auto-countdown po 5s nebo okamžitý tap
- SessionEngineModal: nový prop smartConfig, nový state 'smart-prep'
- ConfirmModal SMART varianta (zpráva o kalibraci při přerušení)
- SmartExerciseButton: onClick spustí useSmartExercise → otevře modal
- DnesPage: propojení SmartExerciseButton → SessionEngineModal
- Výstup: kliknutí na SMART CVIČENÍ spustí kompletní flow

FÁZE 3 — Session uložení a zpětná vazba
- completeSession API: rozšíření o session_type + smart_context
- BIE recalculate trigger: po každé SMART session nastav recalculate_after
- Kalibrační counter: update session_count_smart
- Výstup: SMART sessions se ukládají se správným kontextem, kalibrace funguje

FÁZE 4 — Settings reorganizace
- SettingsPage: reorganizace na "Cvičení & protokoly" + "SMART CVIČENÍ"
- sessionSettingsStore: smartDurationMode + smartAudioPack
- SmartDurationMode selector UI (fixed slider + range presets)
- Locked state pro ZDARMA tier (tooltip on click)
- Výstup: uživatel SMART tier si může nastavit délku a audio

FÁZE 5 — Pokrok page SMART widget
- SmartSection.tsx: widget pro PokrokPage
- Vizuální jazyk KPSection (glass card, sparkline, level progress)
- PokrokPage: přidat SmartSection pod KPSection
- Tab struktura (Výkon / Komunita placeholder / TOP10 placeholder)
- Výstup: uživatel vidí svůj SMART progress v Pokroku

FÁZE 6 — Safety flags v Profil page
- ProfilPage: aktivovat "Zdravotní dotazník" sekci
- Safety flags formulář (checkbox list)
- Confirm dialog při odškrtnutí
- Výstup: uživatel může editovat safety flags

FÁZE 7 — Leštění a edge cases
- Empty states (žádné KP měření, žádná SMART history)
- Error states (Supabase offline, výpočet selže → fallback na level 3)
- Loading states (skeleton pro SmartSection)
- Accessibility (aria labels, focus management)
- Reduced motion respekt
- Výstup: produkčně robustní feature

PRO KAŽDÝ KROK V PLÁNU UVEĎ:
1. Název kroku
2. Soubory k vytvoření / modifikaci (přesné cesty)
3. Co přesně se implementuje (ne jak — to je na agenta implementátora)
4. Závislosti (co musí být hotovo před tímto krokem)
5. Testovací kritérium (co uživatel uvidí/vyzkouší)
6. Rizika nebo upozornění

NEBEZPEČNÉ ZÓNY — na toto zvlášť upozorni v plánu:
- SessionEngineModal je komplexní state machine — jakákoliv změna state flow musí být zpětně kompatibilní
- useIntensityControl reset musí být volán při každém close/abandon
- BIE výpočet nesmí nikdy překročit Safety Gate ani KP Cap limity
- Ephemeral Exercise objekt musí splňovat kompletní Exercise TypeScript interface
- Přidání session_type CHECK constraint musí být backward compatible

Po přečtení všech dokumentů a vytvoření plánu:
1. Shrň architekturu v 5 větách
2. Identifikuj 3 největší technická rizika
3. Navrhni pořadí fází s odhadem komplexity (S/M/L/XL)
4. Zeptej se na jakékoliv nejasnosti PŘED zahájením implementace
```

---

## Poznámky k použití

### Proč nový agent?

Tato konverzace obsahuje 4 kola brainstormingu + kompletní analýzu databáze + prostudování ~20 souborů kódu. Kontext je velký a přetížení by vedlo k méně přesným architektonickým rozhodnutím v PLAN MODE.

**Nový agent v PLAN MODE:**
- Začíná s čistým kontextovým oknem
- Feature Spec (`SMART_EXERCISE_SPEC.md`) je jeho primárním zdrojem pravdy
- Přečte relevantní soubory přesně dle instrukce
- Vytvoří čistý plán bez interference z brainstormingové konverzace

### Jak pokračovat

1. **Otevři nový Cursor chat** → přepni do PLAN MODE
2. Zkopíruj celý prompt ze sekce výše
3. Agent přečte spec + kódy a vytvoří implementační plán
4. Po schválení plánu → přepni zpět do AGENT MODE
5. Postupuj fázi po fázi, ideálně každá fáze = nová implementační session

### Po implementaci každé fáze

- Otestuj na TEST serveru (Vercel preview branch)
- Aktualizuj `SMART_EXERCISE_SPEC.md` sekci changelog
- Aktualizuj `dechbar-app/CHANGELOG.md`

---

*Master Prompt vytvořen: 2026-03-05*  
*Feature Spec: dechbar-app/docs/features/SMART_EXERCISE_SPEC.md*
