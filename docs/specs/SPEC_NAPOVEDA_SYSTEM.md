# SPEC: Nápověda & Onboarding Tour System
# Verze: 1.1
# Datum: 2026-03-13
# Autor: Brainstorming agent (5 kol otázek + DB průzkum + tech prověrka)
# Status: PŘIPRAVENO K IMPLEMENTACI

---

## 🎯 PŘEHLED SYSTÉMU

Nápověda je **klíčová adoptivní komponenta** DechBar aplikace. Provede uživatele celou
aplikací, naučí ho s ní pracovat a zároveň funguje jako **konverzní funnel** směrem
k placenému členství SMART.

### Co systém obsahuje:
1. **Uvítací slide** — první obrazovka po prvním přihlášení
2. **Tour** — krokovaný průvodce s Spotlight efektem (driver.js)
3. **Žárovička** — persistentní indikátor stavu Nápovědy v TopNav
4. **Centrum pomoci** — `/app/admin/napoveda` + sekce v Settings pro uživatele
5. **Odměnový funnel** — 3 dny SMART zdarma za dokončení Tour (dvou-fázově)
6. **Admin panel** — správa kroků, kapitol, úrovní bez deploymentu

---

## 🏗️ ARCHITEKTURA KOMPONENT

```
src/platform/components/napoveda/
  ├── NapovedaProvider.tsx        — Context + state management
  ├── WelcomeSlide.tsx            — Uvítací fullscreen slide
  ├── TourOverlay.tsx             — Driver.js wrapper + Spotlight
  ├── TourTooltip.tsx             — Custom tooltip UI (design systém)
  ├── BulbIndicator.tsx           — Žárovička v TopNav
  ├── NapovedaCentrum.tsx         — Centrum pomoci (Settings sekce)
  └── hooks/
        ├── useNapoveda.ts        — Hlavní hook (stav, progress, akce)
        ├── useTourProgress.ts    — Výpočet % dokončení, aktuální krok
        └── useRewardGrant.ts     — Logika udělení SMART odměny

src/modules/admin/NapovedaAdmin/
  ├── NapovedaAdmin.tsx           — Admin stránka (/app/admin/napoveda)
  ├── LevelEditor.tsx             — Správa úrovní
  ├── ChapterEditor.tsx           — Správa kapitol
  └── StepEditor.tsx              — Správa kroků (text, selektor, i18n)
```

---

## 📐 DATOVÁ HIERARCHIE

```
Úroveň (Level)        — určuje prioritu a pořadí
  └── Kapitola (Chapter) — určuje segment/skupinu aplikace
        └── Krok (Step)    — konkrétní highlight + text + akce
```

### Úroveň = Priorita
- **Úroveň 1 — Základní Tour (FREE):** Vše dostupné bez SMART členství
- **Úroveň 2 — Rozšířená Tour (SMART):** Funkce dostupné v SMART členství

### Kapitoly v Úrovni 1 (FREE):
| Pořadí | Slug | Název | View/Route |
|--------|------|-------|------------|
| 1 | `welcome` | Uvítání v DechBaru | — (fullscreen slide) |
| 2 | `dnes-overview` | View Dnes | `/app` tab=dnes |
| 3 | `kp-measurement` | Kontrolní pauza | `/app` → KPCenter modal |
| 4 | `bottom-nav` | Spodní navigace | `/app` (any tab) |
| 5 | `cvicit-page` | Cvičit — Knihovna | `/app` tab=cvicit |
| 6 | `akademie-overview` | Akademie — přehled | `/app` tab=akademie |
| 7 | `pokrok-page` | Pokrok — přehled | `/app` tab=pokrok |
| 8 | `profil-setup` | Profil — nastavení | `/app/profil` |
| 9 | `settings-overview` | Nastavení | `/app/settings` |
| 10 | `feedback-submit` | Podnět ke zlepšení | `/app/profil` → feedback |

### Kapitoly v Úrovni 2 (SMART — odemčeno po odměně Fáze 1):
| Pořadí | Slug | Název | View/Route |
|--------|------|-------|------------|
| 1 | `smart-cviceni` | SMART cvičení | `/app` tab=dnes |
| 2 | `cesta-na-trun` | Cesta na Trůn | `/app` tab=dnes |
| 3 | `vyzvy-overview` | Dechové výzvy | `/app` tab=akademie → vyzvy |
| 4 | `rezim-program` | Program REŽIM | `/app` tab=akademie → rezim |
| 5 | `smart-history` | Historie 90 dní | `/app` tab=cvicit |
| 6 | `custom-exercises` | Vlastní cvičení | `/app` tab=cvicit |

---

## 🗄️ DATABÁZOVÉ SCHEMA

### Nové tabulky (migrace potřeba):

#### `tour_levels`
```sql
CREATE TABLE IF NOT EXISTS public.tour_levels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_index integer NOT NULL,           -- pořadí (1, 2, 3...)
  slug        text NOT NULL UNIQUE,       -- 'basic', 'smart'
  title       jsonb NOT NULL DEFAULT '{}',-- i18n: {"cs": "Základní Tour"}
  description jsonb NOT NULL DEFAULT '{}',
  is_active   boolean NOT NULL DEFAULT true,
  requires_plan text DEFAULT NULL,        -- NULL = FREE, 'SMART' = vyžaduje SMART
  reward_days integer DEFAULT 0,          -- počet dní SMART odměny za dokončení
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

#### `tour_chapters`
```sql
CREATE TABLE IF NOT EXISTS public.tour_chapters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id    uuid NOT NULL REFERENCES tour_levels(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  slug        text NOT NULL UNIQUE,       -- 'dnes-overview', 'kp-measurement'...
  title       jsonb NOT NULL DEFAULT '{}',-- i18n: {"cs": "View Dnes"}
  route_path  text,                       -- '/app' — kde se kapitola spouští
  tab_context text,                       -- 'dnes', 'cvicit'... pro TabCarousel
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

#### `tour_steps`
```sql
CREATE TABLE IF NOT EXISTS public.tour_steps (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id      uuid NOT NULL REFERENCES tour_chapters(id) ON DELETE CASCADE,
  order_index     integer NOT NULL,         -- 1–9 (max 9 kroků na kapitolu)
  title           jsonb NOT NULL DEFAULT '{}', -- i18n: {"cs": "Titulek kroku"}
  description     jsonb NOT NULL DEFAULT '{}', -- i18n: max 2-3 věty
  dom_selector    text,                     -- CSS selektor pro Spotlight
  element_hint    text,                     -- lidský popis kde element je (pro debug)
  step_type       text NOT NULL DEFAULT 'highlight',
  -- highlight = jen zvýrazni + text
  -- interactive  = uživatel musí udělat akci (vyplnit pole, kliknout)
  -- info         = fullscreen info slide bez highlightu
  interactive_action text,                  -- 'fill_nickname', 'measure_kp', 'submit_feedback'
  is_required_for_reward boolean DEFAULT false, -- musí být splněn pro získání odměny
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

#### `user_tour_progress`
```sql
CREATE TABLE IF NOT EXISTS public.user_tour_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id         uuid NOT NULL REFERENCES tour_steps(id) ON DELETE CASCADE,
  chapter_id      uuid NOT NULL REFERENCES tour_chapters(id) ON DELETE CASCADE,
  level_id        uuid NOT NULL REFERENCES tour_levels(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'pending',
  -- pending / completed / skipped / deferred
  completed_at    timestamptz,
  deferred_at     timestamptz,             -- odloženo na později
  view_context    text,                    -- route kde byl uživatel
  interaction_data jsonb DEFAULT '{}',     -- co uživatel udělal (vyplněná přezdívka atd.)
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_id)
);
```

#### `user_tour_state`
```sql
CREATE TABLE IF NOT EXISTS public.user_tour_state (
  user_id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_shown_at timestamptz,          -- kdy viděl uvítací slide
  current_level_id    uuid REFERENCES tour_levels(id),
  current_chapter_id  uuid REFERENCES tour_chapters(id),
  current_step_id     uuid REFERENCES tour_steps(id),
  level1_completed_at timestamptz,          -- kdy dokončil Úroveň 1
  level2_completed_at timestamptz,          -- kdy dokončil Úroveň 2
  tour_completed_at   timestamptz,          -- kdy dokončil celou Tour
  reward_phase1_granted_at timestamptz,     -- kdy dostal 1 den SMART
  reward_phase2_granted_at timestamptz,     -- kdy dostal +2 dny SMART
  bulb_state          text NOT NULL DEFAULT 'lit',
  -- lit = svítí (neprojito), dim = zhasnuto (projito), hidden = skryto (vše splněno)
  show_bulb_preference boolean DEFAULT true,-- uživatelovo nastavení (Settings toggle)
  deferred_until      timestamptz,          -- odloženo do tohoto času
  sessions_count      integer DEFAULT 0,    -- kolikrát uživatel otevřel Tour
  last_session_at     timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
```

### Rozšíření existujících tabulek:

#### `memberships` — přidat sloupce pro Tour odměnu:
```sql
-- Již existuje: challenge_smart_access, challenge_smart_expires_at
-- Přidáme:
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS tour_reward_phase integer DEFAULT NULL,
  -- 1 = za Fázi 1, 2 = za Fázi 2
  ADD COLUMN IF NOT EXISTS tour_reward_granted_at timestamptz DEFAULT NULL;
-- metadata.reason bude: "napoveda-tour-reward"
-- metadata.phase bude: 1 nebo 2
```

---

## 🎬 FLOWS

### Flow 1 — Nový uživatel (první přihlášení)

```
1. Auth úspěšný → AppLayout detekuje: user_tour_state NEEXISTUJE
2. Zobrazí WelcomeSlide (fullscreen, 3 informace):
   - "Vítej v DechBaru — práce s dechem dostupná na 2 kliky"
   - "Žárovička vpravo nahoře tě provede celou aplikací"
   - "Dokonči Nápovědu a získej 3 dny členství SMART zdarma"
   - CTA: "Jdeme na to" + malé "Přeskočit vše" (Apple požadavek)
3. Klikne "Jdeme na to" → vytvoří se user_tour_state, spustí se Tour od Kapitoly 1
4. Klikne "Přeskočit vše" → vytvoří se user_tour_state, bulb_state='lit', info toast
   "Kdykoli se vrátíš — klikni na žárovičku vpravo nahoře"
```

### Flow 2 — Tour krok (standardní highlight)

```
1. Driver.js zvýrazní DOM element (dim overlay + spotlight výřez)
2. Tooltip zobrazí: [Číslo kroku / Celkem kroků] + Titulek + 2-3 věty popis
3. Uživatel čte → klikne "Další" (nebo šipka) → další krok
4. Uživatel může kliknout "Zpět" → předchozí krok
5. Uživatel může kliknout "Odložit na později" → deferred_at = now(), Tour se zavře
   → bulb_state zůstává 'lit'
```

### Flow 3 — Interaktivní krok (příklad: přezdívka)

```
1. Driver.js zvýrazní pole "Přezdívka" v ProfilPage
2. Tooltip: "Vyplň si přezdívku — tak tě uvidí ostatní členové DechBaru"
   + info: "Tento krok je potřeba pro získání odměny"
3. Uživatel klikne do pole a píše (overlay zůstává, jen zvýrazněné pole je aktivní)
4. Uživatel klikne "Uložit" → ProfilPage uloží → Zustand/React Query update
5. NapovedaProvider detekuje event 'nickname_saved' → krok označen 'completed'
   → automaticky posun na další krok
6. Pokud uživatel klikne "Zpět" z dalšího kroku → přezdívka pole zvýrazněno znovu
   → uloží znovu → detekce stejná
7. Pokud uživatel chce přeskočit → krok označen 'deferred', NENÍ počítán pro odměnu
   → tooltip upozorní: "Tento krok budeš potřeba pro odměnu"
```

### Flow 4 — Žárovička (kontextová navigace)

```
Žárovička přečte aktuální route a tab_context

Logika (priorita):
1. Jsem na route X → najdi kapitoly pro tuto route
2. Jsou neprojité kapitoly pro tuto route? → spusť nejbližší neprojitou
3. Jsou projité, ale nedokončené kroky? → pokračuj tam kde jsem skončil
4. Vše na této route projito → nabídni:
   a) "Jít do hloubky" (subcapitola — detailní prvky na stejné route)
   b) "Přejít na nejbližší neprojitou kapitolu"
   c) "Projít tuto část znovu"

Stav žárovičky:
- LIT (svítí zlatě)  → kapitola pro aktuální view NEBYLA projita
- DIM (tlumená)      → kapitola projita, ale Tour stále nedokončena
                     → klik nabídne nejbližší neprojitou nebo zopakování
- HIDDEN (skryto)    → celá Tour dokončena (obě úrovně)
                     → v Settings lze zapnout zpět (show_bulb_preference)
```

### Flow 5 — Odměna (dvou-fázová)

```
FÁZE 1 — po dokončení Úrovně 1 (FREE kapitoly):
  Podmínky: všechny is_required_for_reward = true kroky splněny (ne deferred)
  Akce:
    1. Vytvořit memberships řádek:
       { plan: 'SMART', type: 'subscription', status: 'active',
         stripe_subscription_id: null,
         expires_at: zítřejší_4rano + 1 den (= pozítří 3:59:59),
         metadata: { reason: 'napoveda-tour-reward', phase: 1 },
         tour_reward_phase: 1, tour_reward_granted_at: now() }
    2. Aktualizovat user_tour_state: reward_phase1_granted_at = now()
    3. Zobrazit celebration modal:
       "Skvělé! Dokončil/a jsi základní Nápovědu 🎉
        Získal/a jsi 1 den členství SMART zdarma.
        Teď ti ukážeme, co všechno SMART přináší."
    4. Automaticky spustit Úroveň 2 Tour (SMART kapitoly)

FÁZE 2 — po dokončení Úrovně 2 (SMART kapitoly):
  Podmínky: všechny is_required_for_reward = true kroky Úrovně 2 splněny
  Akce:
    1. UPDATE existující memberships řádek z Fáze 1:
       expires_at = expires_at + 2 dny
       metadata.phase = 2
       tour_reward_phase = 2
    2. Aktualizovat user_tour_state:
       reward_phase2_granted_at = now(), tour_completed_at = now()
       bulb_state = 'hidden'
    3. Zobrazit completion modal:
       "Nápověda dokončena! Máš 3 dny SMART k dispozici.
        Doporučujeme začít s Ranní výzvou — 7 minut každé ráno."
       CTA: "Spustit Ranní výzvu" → /app/akademie → vyzvy → Ranní výzva
    4. Notifikace 2 dny před expirací (trigger: 'smart_tour_reward_expiring')
    5. Modal v den expirace s nabídkou předplatného + "3 dny trial zdarma navíc"
```

### Flow 6 — Přechod special akce → předplatné

```
Uživatel má Tour reward membership (stripe_subscription_id: null)
Koupí předplatné (Stripe checkout):

1. Stripe webhook → vytvoří nový memberships řádek (subscription type)
2. Starý Tour reward řádek → status = 'superseded'
3. Výsledek: uživatel má aktivní subscription, DB je čistá
4. V UcetPage: zobrazit jako "Předplatné aktivní" (ne special akce)
```

---

## 💡 ŽÁROVIČKA — TECHNICKÁ SPECIFIKACE

### Umístění v TopNav:
```
TopNav vlevo:  [Avatar] [KP tlačítko]
TopNav vpravo: [Žárovička] [Bell] [Settings]
```

### Stavy:
```typescript
type BulbState = 'lit' | 'dim' | 'hidden'

// lit  → zlatá žárovička, pulzující animace (jemná, 3s cyklus)
// dim  → šedá žárovička, bez animace, kliknutelná
// hidden → element není v DOM (nebo: show_bulb_preference = false)
```

### Nový uživatel / existující uživatelé bez Tour:
- Při spuštění systému (release datum): všichni uživatelé bez `user_tour_state`
  dostanou `bulb_state = 'lit'` (batch migration nebo lazy on first load)

---

## 🌍 INTERNACIONALIZACE (i18n)

Všechny texty v `tour_steps`, `tour_chapters`, `tour_levels` jsou JSONB:

```json
{
  "cs": {
    "title": "Kontrolní pauza",
    "description": "KP je tvůj osobní ukazatel zdraví dechu. Měř ji každé ráno."
  },
  "en": {
    "title": "Control Pause",
    "description": "CP is your personal breath health indicator. Measure it every morning."
  }
}
```

Frontend načítá jazyk z `i18n` kontextu appky (nebo fallback na `cs`):
```typescript
const title = step.title[currentLang] ?? step.title['cs']
```

Přidání nového jazyka = pouze nový klíč v JSONB, žádný kód, žádný deployment.

---

## 🖥️ ADMIN PANEL — `/app/admin/napoveda`

### Umístění v sidebaru:
Sekce **KOMUNITA** (vedle Notifikace, Feedback, Uživatelé)

### Co admin může dělat:

| Akce | MVP | Later |
|------|-----|-------|
| Zobrazit všechny úrovně/kapitoly/kroky | ✅ | |
| Editovat text kroků (i18n per jazyk) | ✅ | |
| Měnit pořadí kroků drag&drop | ✅ | |
| Zapnout/vypnout krok/kapitolu | ✅ | |
| Přidat nový krok do existující kapitoly | ✅ | |
| Přidat novou kapitolu | ✅ | |
| Přidat novou úroveň | Later | ✅ |
| Cílení (jen SMART / jen FREE / jen noví) | Later | ✅ |
| A/B testing kroků | Later | ✅ |
| Analytics — průměrný drop-off krok | Later | ✅ |
| Přidání nového jazyka | Later | ✅ |

### "Release" přepínač:
Každá kapitola má `is_active` boolean. Admin může:
- Připravit novou kapitolu (`is_active = false`)
- Aktivovat ji v konkrétní datum (`active_from` — Later)
- Při aktivaci → všichni uživatelé s `bulb_state = 'hidden'` dostanou `bulb_state = 'lit'`
  (signál: "je tu něco nového")

---

## 📊 DATA KTERÁ SBÍRÁME

### Z `user_tour_progress`:
- Kdy každý krok dokončil / odložil
- Z které view ho dokončil (`view_context`)
- Co interaktivně udělal (`interaction_data`)

### Z `user_tour_state`:
- Časy každé fáze (kdy Úroveň 1/2 dokončil)
- Počet sessions (kolikrát Tour otevřel = `sessions_count`)
- Odložení (`deferred_until`)

### Využití dat:
- **AI Coach** (budoucí): vidí přesně co uživatel prošel a kdy → personalizovaná doporučení
- **Admin Analytics**: drop-off funnel — na kterém kroku nejvíc lidí odchází
- **Push notifikace**: připomenutí po X dnech odložení
- **Retence**: uživatelé kteří dokončili Tour mají výrazně vyšší retenci

---

## 🎨 DESIGN SPECIFIKACE

### Spotlight overlay:
```css
/* Tmavý overlay */
background: rgba(0, 0, 0, 0.75);
backdrop-filter: blur(2px);

/* Spotlight výřez — border-radius podle tvaru elementu */
/* Driver.js automaticky počítá pozici a rozměry */
```

### Tooltip design (TourTooltip.tsx):
```
┌─────────────────────────────────────┐
│  Krok 3 / 7          [Kapitola: KP] │
│─────────────────────────────────────│
│  Titulek kroku (bold, 16px)         │
│                                     │
│  Popis — max 2-3 věty (14px,        │
│  muted barva, line-height 1.6)      │
│─────────────────────────────────────│
│  [← Zpět]    [Odložit]  [Další →]  │
└─────────────────────────────────────┘
```

- Design tokens: `--color-teal` pro CTA, `--color-gold` pro progress, tmavé pozadí
- Max šířka na mobilu: `calc(100vw - 32px)`
- Pozice: Driver.js automaticky (nejlepší čitelnost), prefer bottom pro bottom-nav prvky

### Uvítací slide:
```
[Fullscreen, tmavé pozadí, centrovaný obsah]

    🌬️ (logo animace — breath circle)

    Vítej v DechBaru

    Práce s dechem dostupná na 2 kliky.

    ━━━━━━━━━━━━━━━━━━━━━━━━━━

    💡 Žárovička vpravo nahoře
       tě provede celou aplikací.

    🎁 Dokonči Nápovědu a získej
       3 dny členství SMART zdarma.

    ━━━━━━━━━━━━━━━━━━━━━━━━━━

    [    Jdeme na to    ]

    [Přeskočit vše]  ← malé, muted
```

---

## ⏰ TIMING KP (Kontrolní pauza v onboardingu)

KP se ideálně měří ráno (po probuzení). Appka rozlišuje:

| Čas | Chování v Tour |
|-----|----------------|
| 04:00 – 11:59 | Ranní okno → "Ideální čas! Změř si KP teď — dostaneš přesnou baseline." |
| 12:00 – 23:59 | Odpolední/večerní → "KP se měří ideálně ráno. Teď si ji změř jako první baseline — zítra ráno uvidíš rozdíl." |
| 00:00 – 03:59 | Noční → "Pozdní noc — změř si KP teď jako orientační hodnotu. Ráno po probuzení změř znovu." |

Implementace: `getTimeContext()` util → vrátí `morning | afternoon | night` → tooltip text varianta

---

## 🔔 NOTIFIKACE — nové triggery

Přidat do `notification_auto_triggers`:

| Trigger | Titulek | Zpráva | Kdy |
|---------|---------|--------|-----|
| `tour_reward_expiring` | "Tvůj SMART přístup brzy vyprší" | "Zbývají 2 dny — využij Dechové výzvy naplno." | 2 dny před expirací Tour odměny |
| `tour_reward_expired` | "SMART přístup skončil" | "Líbilo se ti to? Pokračuj s předplatným — první 3 dny zdarma." | V den expirace |
| `tour_reminder` | "Nápověda na tebe čeká" | "Zbývá ti projít část Nápovědy a získat odměnu." | 3 dny po odložení Tour |

---

## 🗺️ STROMOVÁ MAPA APLIKACE (podklad pro kapitoly)

```
DechBar App
│
├── 📅 VIEW DNES (/app tab=dnes)
│   ├── Pozdrav (time-based s jménem/oslovením)
│   ├── SMART CVIČENÍ [SMART] → ExerciseModal
│   ├── CESTA NA TRŮN [SMART] → TronModal
│   ├── Denní program (TodaysChallengeButton)
│   └── Protokoly: RÁNO / KLID / VEČER
│
├── 💪 VIEW CVIČIT (/app tab=cvicit)
│   ├── Tab: Doporučené (6 preset protokolů)
│   ├── Tab: Vlastní (max 3 FREE, ∞ SMART)
│   └── Tab: Historie (7 dní FREE, 90 dní SMART)
│
├── 🎓 VIEW AKADEMIE (/app tab=akademie)
│   ├── Kategorie: Program REŽIM
│   │   └── Programy (Séries → Lekce)
│   ├── Kategorie: Dechové výzvy [SMART]
│   │   └── Produkty (např. Ranní výzva)
│   │       └── Detail produktu → Sériové audio
│   ├── Kategorie: Kurzy [INACTIVE]
│   ├── Kategorie: Dechopedie [INACTIVE]
│   └── Kategorie: VIP sekce [INACTIVE]
│
├── 📈 VIEW POKROK (/app tab=pokrok)
│   ├── Tab: Přehled
│   │   ├── KP sekce
│   │   ├── SMART sekce
│   │   ├── Trůn sekce
│   │   ├── WeeklyDots
│   │   ├── Stats grid (Dnes/Týden/Měsíc)
│   │   └── Activity heatmap
│   ├── Tab: Komunita [COMING SOON]
│   └── Tab: TOP10 [COMING SOON]
│
├── 👤 PROFIL (/app/profil)
│   ├── Avatar + VIP badge
│   ├── Editace: Jméno / Přezdívka / Oslovení
│   ├── KP grid + Změřit KP
│   ├── Osobní rekordy
│   ├── Zdravotní dotazník (epilepsie, těhotenství, kardio, astma)
│   ├── Předplatné info
│   └── Referral sekce
│
├── ⚙️ NASTAVENÍ (/app/settings)
│   ├── Dechová cvičení (protokoly, délky)
│   ├── Nápověda centrum ← NOVÁ SEKCE
│   └── [další nastavení]
│
└── 🔑 ÚČET (/app/ucet)
    ├── Membership info + upgrade CTA
    ├── Bezpečnost (email, heslo)
    └── Smazat účet
```

---

## ✅ INTERAKTIVNÍ KROKY — přehled (MVP)

| Akce | Kapitola | Co detekujeme | Povinné pro odměnu |
|------|----------|--------------|-------------------|
| Vyplnit přezdívku | `profil-setup` | `nickname_saved` event | ✅ |
| Vyplnit oslovení | `profil-setup` | `vocative_saved` event | ✅ |
| Vyplnit zdravotní dotazník | `profil-setup` | `safety_flags_saved` event | ✅ |
| Změřit KP | `kp-measurement` | `kp_measurement_saved` event | ✅ |
| Odeslat podnět/feedback | `feedback-submit` | `feedback_submitted` event | ✅ |
| Spustit první cvičení (SMART) | `smart-cviceni` | `exercise_session_started` event | ✅ (Fáze 2) |

---

## 🚀 IMPLEMENTAČNÍ POŘADÍ

### Sprint 1 — DB + základní infrastruktura:
1. Migrace: `tour_levels`, `tour_chapters`, `tour_steps`
2. Migrace: `user_tour_progress`, `user_tour_state`
3. Migrace: rozšíření `memberships`
4. Seed data: základní úrovně, kapitoly, kroky (cs texty)
5. RLS policies na všechny nové tabulky

### Sprint 2 — Tour engine:
1. Instalace driver.js (`npm install driver.js`)
2. `NapovedaProvider.tsx` — Context + state
3. `useNapoveda.ts` hook
4. `TourOverlay.tsx` — Driver.js wrapper
5. `TourTooltip.tsx` — custom design
6. `BulbIndicator.tsx` — TopNav integrace

### Sprint 3 — Uvítací slide + interaktivní kroky:
1. `WelcomeSlide.tsx`
2. Interaktivní akce event systém
3. Reward logika (`useRewardGrant.ts`)
4. Notifikační triggery

### Sprint 4 — Admin panel:
1. `/app/admin/napoveda` route
2. `NapovedaAdmin.tsx` — CRUD úrovně/kapitoly/kroky
3. i18n editor UI

### Sprint 5 — Centrum pomoci + polish:
1. `NapovedaCentrum.tsx` v Settings
2. Žárovička stavy + animace
3. Stromová mapa (canvas/diagram)
4. Testování na reálných zařízeních

---

## 📦 KNIHOVNY — INSTALACE A VERZE

```bash
npm install driver.js                    # v1.4.0 — Spotlight overlay
npm install @onboardjs/core              # Headless state machine
npm install @onboardjs/react             # React bindings
npm install @onboardjs/supabase-plugin   # Supabase persistence
```

### OnboardJS Supabase plugin — co konkrétně dělá:

Plugin automaticky ukládá celý stav Tour (aktuální krok, dokončené kroky, kontext)
do Supabase tabulky `user_tour_onboarding_state` (JSONB `flow_data` sloupec).

**Praktické přínosy:**
- Cross-device: uživatel dokončí krok na iPhonu, pokračuje na iPadu od stejného místa
- Reinstall-safe: reinstalace appky neztratí pokrok
- AI Coach ready: každý krok má timestamp → personalizovaná doporučení v budoucnu
- Drop-off analytika: admin vidí na kterém kroku uživatelé nejčastěji odcházejí
- Zero boilerplate: plugin sám píše/čte Supabase, my jen voláme `next()`

**Konfigurace pluginu:**
```typescript
import { createSupabasePlugin } from '@onboardjs/supabase-plugin'

const supabasePlugin = createSupabasePlugin({
  client: supabaseClient,           // náš existující Supabase client
  tableName: 'user_tour_onboarding_state',
  userIdColumn: 'user_id',
  stateDataColumn: 'flow_data',
  useSupabaseAuth: true,            // automaticky propojí s auth.uid()
  onError: (error, operation) => {
    console.error(`[Tour] Supabase ${operation} failed:`, error.message)
  },
})
```

**Tabulka pro plugin** (součást migrace Sprint 1):
```sql
CREATE TABLE IF NOT EXISTS public.user_tour_onboarding_state (
  user_id   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- RLS: uživatel vidí/upravuje jen svá data
ALTER TABLE public.user_tour_onboarding_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tour_state_own" ON public.user_tour_onboarding_state
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

*Poznámka: Tato tabulka slouží OnboardJS pluginu jako cache stavu. Detailní
granulární data (každý krok s timestampem) jsou v `user_tour_progress` tabulce.*

---

## 🍎 iOS CAPACITOR — POVINNÝ FIX (driver.js)

Driver.js má zdokumentovaný problém s touch event propagation na reálných iOS zařízeních
(ne v DevTools simulaci): dotek na tooltip projde skrz overlay a trefí element pod ním.

**Toto MUSÍ být součástí TourOverlay.tsx:**

```typescript
// iOS touch fix — povinná součást TourOverlay.tsx
useEffect(() => {
  const iosDriverFix = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    // Povolíme touch na tlačítkách v tooltipu, blokujeme zbytek
    if (target.closest('.driver-popover') === null &&
        document.querySelector('.driver-popover') !== null) {
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  document.addEventListener('touchstart', iosDriverFix, { capture: true, passive: false });
  return () => document.removeEventListener('touchstart', iosDriverFix, true);
}, []);
```

**Testování na reálném zařízení:** Toto musí být otestováno na fyzickém iPhone
(ne simulátor, ne Chrome DevTools) hned v Sprint 2 — před dalším vývojem.

---

## 🎨 CSS ARCHITEKTURA — DESIGN TOKENS POVINNÉ

Veškerý CSS Nápovědy MUSÍ používat výhradně design tokeny z `src/styles/design-tokens/`.
Žádné hardcoded barvy, velikosti ani stíny.

**Soubor:** `src/styles/components/napoveda.css`

```css
/* ✅ SPRÁVNĚ — vše přes tokeny */
.tour-tooltip {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-4) var(--spacing-5);
  max-width: calc(100vw - var(--spacing-8));
}

.tour-tooltip__title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-2);
}

.tour-tooltip__description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.tour-tooltip__cta-primary {
  background: var(--color-teal);        /* #2CBEC6 */
  color: var(--color-on-teal);
  border-radius: var(--radius-md);
}

.tour-progress-bar__fill {
  background: var(--color-gold);        /* #D6A23A */
}

.bulb-indicator--lit {
  color: var(--color-gold);
  /* pulzující animace — používá spring z effects.css */
  animation: bulb-pulse 3s ease-in-out infinite;
}

.bulb-indicator--dim {
  color: var(--color-text-muted);
}

/* ❌ ZAKÁZÁNO */
/* color: #2CBEC6; — NIKDY hardcoded */
/* padding: 16px;  — NIKDY přímá hodnota */
```

**Proč:** Změna `--color-teal` v `colors.css` (1 řádek) automaticky změní barvu
CTA ve všech tooltipech, progress baru i žárovičce. Žádné hledání v kódu.

---

## ⚠️ RIZIKA A ZÁVISLOSTI

| Riziko | Dopad | Řešení |
|--------|-------|--------|
| Driver.js konflikt s Capacitor webview | Střední | Testovat na iOS/Android co nejdříve |
| DOM selektor se změní při refactoru | Střední | `element_hint` pro lidský popis + fallback na info slide |
| Apple review: povinný onboarding | Vysoký | "Přeskočit vše" tlačítko vždy přítomno |
| Membership kolize (Tour reward + purchase) | Střední | `status = 'superseded'` logika |
| Uživatel odloží Tour na týdny | Nízký | Push notifikace po 3 dnech (`tour_reminder`) |

---

## 📋 DEFINITION OF DONE

- [ ] Nový uživatel vidí WelcomeSlide při prvním přihlášení
- [ ] Tour spustí Spotlight na správném DOM elementu
- [ ] Interaktivní kroky detekují akci a automaticky postupují
- [ ] Žárovička mění stav (lit/dim/hidden) správně
- [ ] Kontextová žárovička spustí kapitolu pro aktuální view
- [ ] Fáze 1 odměna: 1 den SMART při dokončení Úrovně 1
- [ ] Fáze 2 odměna: +2 dny SMART při dokončení Úrovně 2
- [ ] Notifikace 2 dny před expirací odměny
- [ ] Modal v den expirace s Stripe checkout CTA
- [ ] Admin může editovat texty kroků bez deploymentu
- [ ] Funguje na 375px (mobile), 768px (tablet), 1280px (desktop)
- [ ] Funguje v Capacitor iOS + Android webview
- [ ] TypeScript bez chyb, ESLint prochází

---

*Specifikace připravena k předání implementačnímu agentovi.*
*Doporučení: použít @preset-nova-komponenta.md s odkazem na tento dokument.*
