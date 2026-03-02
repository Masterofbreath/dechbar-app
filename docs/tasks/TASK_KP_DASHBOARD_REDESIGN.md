# 🎯 Agent Brief: KP Dashboard & Pokrok Page Redesign

**Datum:** 2026-03-02  
**Projekt:** dechbar-app (React + TypeScript + Supabase)  
**Priorita:** Střední — vizuální + datový redesign

---

## 📋 Kontext

DechBar je platforma pro dechová cvičení. Klíčová metrika je **Kontrolní Pauza (KP)** — čas v sekundách, po který uživatel vydrží zadržet dech po plném výdechu. Čím vyšší, tím lépe (světová průměrná hodnota je ~35s, začátečník mívá 5–15s).

KP se měří v modalu `KPCenter` (přes `BreathingCircle` komponentu) a data se ukládají do Supabase tabulky `kp_measurements`.

---

## 🚧 Co je HOTOVO (provedeného agentem)

- `useKPMeasurements.ts` — hook pro načítání/ukládání KP dat  
- `KPCenter.tsx` + `KPMeasuring.tsx` — flow měření funguje, ukládá data
- DB constrainty uvolněny: `attempt_1_seconds >= 1` (bylo 10)
- `is_valid = true` vždy — ranní okno je jen metadata, neblokuje uložení
- `bestKP` a `totalMeasurements` přidány do return hodnoty hooku
- CSS fix: `kp-center__circle-value` je nyní v středu kruhu, trend je absolute pod ním

---

## 🎯 Tvé úkoly (v pořadí priority)

### ÚKOL 1 — Pokrok Page redesign (ZÁSADNÍ)

**Problém:** Aktuální `PokrokPage` je přeplněná a nepřehledná:
- `pokrok-page__records-grid` — NEJDELŠÍ STREAK / NEJLEPŠÍ DEN / NEJDELŠÍ SEZENÍ  
- `pokrok-page__info-row` — X dní s DechBarem / CELKEM NADÝCHÁNO  
- `pokrok-page__hero-row` — AKTUÁLNÍ KP / AKTIVITNÍ STREAK  
- `pokrok-page__stats-grid` — MINUTY PRODÝCHÁNY / POČET AKTIVIT / AKTIVNÍ DNY / PRŮMĚR  

Bloky za sebou bez vizuálního rytmu, žádný graf, žádná hierarchie.

**Cíl:** Apple Premium style — méně je více. Navrhnout nové rozložení s:

1. **KP sekce** (nová samostatná sekce nahoře):
   - Velká aktuální hodnota KP (číslo + "s")
   - Mini sparkline graf vývoje posledních 10 měření (jen body + linky, žádné osy)
   - Tři sub-tiles: Nejlepší KP | 1. měření (baseline) | Počet měření
   - CTA tlačítko "Změřit KP" které otevře KPCenter modal

2. **Dechová statistika** (přepracovaný stávající obsah):
   - Zachovat weekly calendar strip (Po–Ne) — to funguje dobře
   - Zjednodušit hero karty na 2: "S DechBarem X dní" + "Celkem nadýcháno"
   - Zrušit nebo schovat records-grid (STREAK / NEJLEPŠÍ DEN / NEJDELŠÍ SEZENÍ) — moc dat najednou

3. **Aktivitní data** (zjednodušeně):
   - Jen 2 metriky místo 4: MINUTY PRODÝCHÁNY + POČET AKTIVIT pro vybraný período

**Design pravidla:**
- Font: velká čísla `64px bold`, labels `12px uppercase` s mezerami
- Spacing: 4px grid, sekce oddělené `32px` gapem
- Barvy: `var(--dechbar-gold)` pro KP highlight, `var(--color-primary)` teal pro aktivitu
- Žádné tabulky, žádné dense gridy 4 karet vedle sebe

---

### ÚKOL 2 — KP Sparkline komponenta

Vytvoř novou lightweight komponentu `KPSparkline`:

```tsx
// Umístění: src/components/kp/KPSparkline.tsx
interface KPSparklineProps {
  data: number[];        // Pole KP hodnot (nejstarší → nejnovější)
  width?: number;        // Default 200
  height?: number;       // Default 48
  color?: string;        // Default var(--dechbar-gold)
}
```

- SVG-based, žádné chart library (příliš těžké)
- Čárkový graf s vyplněnou plochou pod čárou (area chart)
- Poslední hodnota zvýrazněna tečkou
- Žádné osy, žádné popisky — jen vizuální trend
- Animace: fade-in při načtení

Data pro sparklinu: `measurements.map(m => m.value_seconds).reverse()` (nejstarší první)

---

### ÚKOL 3 — KP sekce na ProfilPage (drobná)

`ProfilPage.tsx` má KP grid který zobrazuje:
- Aktuální KP ✅ (funguje)  
- Nejlepší KP ✅ (funguje po fix)
- Měření ✅ (funguje po fix)

**Přidej:** Malý sparkline pod KP gridem (posledních 7 měření, výška 32px)  
**Oprav:** "Změřit KP" button — přidat ikonu stopek + zvýraznit jako primary action

---

### ÚKOL 4 — KP History v KPCenter (rozšíření)

Aktuální `KPCenter` v "ready" view zobrazuje jen aktuální hodnotu.

**Přidej pod existující kruhy:**
- Sekce "Poslední měření" — 3–5 řádků s datem + hodnotou + ikonou trend
- Formát: `23. února` | `35s` | ↑ nebo ↓ šipka
- Jen pro authenticated users s ≥2 měřeními

Soubor pro historii: `src/platform/components/kp/views/` — vytvoř `KPHistoryList.tsx`

---

## 🔑 Klíčové soubory pro orientaci

```
src/modules/mvp0/pages/PokrokPage.tsx          — Hlavní stránka (redesignovat)
src/styles/pages/profil.css                     — Profil styly
src/platform/components/KPCenter.tsx            — KP modal orchestrátor
src/platform/api/useKPMeasurements.ts           — Data hook (viz interface níže)
src/components/kp/                              — Existující KP komponenty
src/styles/components/kp-center.css             — KP styly
```

### Interface `useKPMeasurements` return:

```typescript
{
  currentKP: number | null;        // Poslední KP hodnota
  firstKP: number | null;          // První ever KP (baseline)
  bestKP: number;                  // Nejvyšší KP ever
  totalMeasurements: number;       // Celkový počet měření
  measurements: KPMeasurement[];   // Všechna měření (newest first)
  stats: KPStats;                  // Celý stats objekt
  saveKP: (data: SaveKPData) => Promise<...>;
  isLoading: boolean;
  isSaving: boolean;
}
```

### `KPMeasurement` interface (klíčová pole):

```typescript
{
  id: string;
  value_seconds: number;       // Výsledná KP hodnota
  measured_at: string;          // ISO timestamp
  is_morning_measurement: boolean;  // true = ranní (4-9h) → nejpřesnější
  is_valid: boolean;            // vždy true
  is_first_measurement: boolean;
  attempt_1_seconds: number;
  attempt_2_seconds: number | null;
  attempt_3_seconds: number | null;
  attempts_count: number;       // 1 nebo 3
}
```

---

## ❓ Otázky k zamyšlení (design intent)

Před implementací se zeptej uživatele:

1. **Ranní vs. celodenní měření v grafech** — Chceš zobrazovat všechna měření v sparklině, nebo jen ranní (nejpřesnější baseline)?

2. **KP cíl** — Bude mít uživatel možnost nastavit si cílovou hodnotu KP (např. "chci dosáhnout 40s")? Sparkline by pak mohl zobrazovat progress k cíli.

3. **Sdílení pokroku** — Bude uživatel moci sdílet screenshot svého KP progressu? (ovlivňuje design karet)

4. **Frekvence měření** — Plánuješ připomínky/notifikace pro ranní měření? Pokud ano, "streak" (kolik dní v řadě jsi měřil KP) je důležitá metrika do Pokrok stránky.

---

## 🏁 Definition of Done

- [ ] PokrokPage má KP sekci se sparklinou
- [ ] PokrokPage je čitelnější — max 2 sekce, žádné dense gridy
- [ ] `KPSparkline` komponenta funguje a je použita na Pokrok i Profil
- [ ] KPCenter "ready" view zobrazuje historii posledních měření
- [ ] Žádné linter chyby
- [ ] Otestováno na mobile (375px) i tablet (768px)
