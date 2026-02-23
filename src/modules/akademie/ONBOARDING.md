# Akademie Module — Agent Onboarding

Čteš toto jako nový agent pracující na Akademie modulu. Přečti si tento soubor jako první.

---

## Deep link / Magic link — jak to funguje

### Účel
Po úspěšné platbě dostane uživatel email s tlačítkem "Vstoupit do DechBaru →".
Toto tlačítko ho přenese PŘÍMO do konkrétního programu v Akademii — bez nutnosti ručně navigovat.

### URL formát

```
# Přímý vstup do konkrétního programu:
https://app.zdravedychej.cz/app?module=digitalni-ticho

# Přímý vstup do Akademie (CategoryGrid):
https://app.zdravedychej.cz/app?tab=akademie

# Budoucí produkty:
https://app.zdravedychej.cz/app?module=kdyz-je-toho-moc
https://app.zdravedychej.cz/app?module=dobrou-noc
https://app.zdravedychej.cz/app?module=jasny-smer
```

`module` = `modules.id` v Supabase (stejná hodnota, která je v `akademie_programs.module_id`)

### Technický tok (celý flow)

```
Email "Vstoupit do DechBaru →"
  → /app?module=digitalni-ticho

NavigationRouter (routes/index.tsx) — useEffect při mount:
  1. Přečte searchParams.get('module')          → 'digitalni-ticho'
  2. useAkademieNav.selectCategory('rezim')      → aktivuje správnou kategorii
  3. useAkademieNav.setPendingModuleId('digitalni-ticho')
  4. setCurrentTab('akademie')                   → přepne na Akademie tab
  5. Smaže ?module= z URL (replace: true)        → čistá URL

AkademieRoot — useEffect na programs:
  6. useAkademieCatalog načte programy pro 'rezim'
  7. Najde program kde program.module_id === 'digitalni-ticho'
  8. openProgram(program.id)                     → otevře ProgramDetail
  9. setPendingModuleId(null)                    → vyčistí stav
```

### Kde nastavit magic link (prakticky)

1. **Stripe** — v Dashboard → Product → "success_url":
   ```
   https://app.zdravedychej.cz/app?module=digitalni-ticho
   ```

2. **E-mailový systém** (Ecomail) — trigger po Stripe webhook event `checkout.session.completed`:
   - Metadata v Stripe session: `{ module_id: 'digitalni-ticho' }`
   - Ecomail dostane metadata a vloží do šablony: `{{module_id}}`
   - Výsledný odkaz: `https://app.zdravedychej.cz/app?module={{module_id}}`

3. **CheckoutSuccessPage** — tlačítko "Přejít do členské sekce" může přidat `?module=`:
   ```tsx
   // V CheckoutSuccessPage — pokud session_id + metadata obsahuje module_id
   navigate(`/app?module=${moduleId}`)
   ```
   (viz `src/pages/CheckoutSuccessPage.tsx` — zatím naviguje na `/app` bez params)

### Co je NYNÍ funkční vs. co chybí

| Krok | Stav | Kde |
|------|------|-----|
| Query param čtenář v `/app` | ✅ Hotovo | `routes/index.tsx` → `NavigationRouter` |
| `pendingModuleId` v store | ✅ Hotovo | `hooks/useAkademieNav.ts` |
| Auto-otevření programu po načtení | ✅ Hotovo | `AkademieRoot.tsx` → `useEffect` |
| Magic link z emailu (Ecomail template) | ⚠️ Chybí | Nastavit v Ecomail šabloně po platbě |
| Stripe success_url s `?module=` | ⚠️ Chybí | Nastavit v Stripe Dashboard |
| CheckoutSuccessPage s `?module=` | ⚠️ Chybí | `src/pages/CheckoutSuccessPage.tsx` L149 |

### Budoucí produkty — postup

Každý nový produkt = nový řádek v `modules` + `akademie_programs`.
Magic link se tvoří automaticky z `module_id`. Není třeba měnit kód.

---

## Co je hotové (v1.1)

### Databáze (DEV + PROD)
- Tabulky: `akademie_categories`, `akademie_programs`, `akademie_series`, `akademie_lessons`, `user_lesson_progress`, `user_program_favorites`
- Seed: 6 kategorií, 4 programy REŽIM (1 odemčený, 3 locked), 3 série + 21 lekcí pro "Digitální ticho"
- RLS policies na všech tabulkách

### Frontend
- `types.ts` — TypeScript interfaces pro všechny entity + VM typy + nav typy
- `hooks/useAkademieNav.ts` — Zustand drill-down nav (CategoryGrid → ProgramGrid → ProgramDetail)
- `hooks/useAkademiePlayback.ts` — inline playback přes `playSticky()`, 80% completion tracking
- `api/useAkademieCatalog.ts` — kategorie + programy + access check + favorites
- `api/useAkademieProgram.ts` — série + lekce + progress merge
- `api/useAkademieProgress.ts` — mutation pro 80% completion
- `api/keys.ts` — React Query cache keys
- **UI komponenty:**
  - `CategoryGrid/` — mřížka karet kategorií (2-3 sloupce), locked state, SVG ikonky
  - `ProgramGrid/` — mřížka programů s favorites hvězdičkou, locked/owned state
  - `ProgramDetail/` — side-by-side header + inline accordion série + LessonRow
  - `AkademieRoot.tsx` — orchestrátor (CategoryGrid → ProgramGrid → ProgramDetail)
- **CSS:** `src/styles/modules/akademie/` — 6 modulárních souborů s design tokeny
- **AudioPlayer:** `playSticky(track)` akce přidána do store + types
- **BottomNav:** re-tap aktivního Akademie tabu → reset na CategoryGrid
- **Deep link:** `?module=digitalni-ticho` → přímé otevření ProgramDetail (viz sekce výše)

## Klíčová rozhodnutí (NEMĚNIT bez diskuze)

1. **Varianta A** — access control přes existující `user_modules` (žádná nová purchase pipeline)
2. **Inline playback** — `playSticky()` místo `play()` → sticky player, ne fullscreen
3. **iOS Safari** — `playSticky` musí být voláno synchronně v `onClick` (LessonRow.tsx)
4. **CSS** — vše přes `src/styles/modules/akademie/`, žádné inline styles, žádné hardcoded hodnoty
5. **Navigace** — Zustand stack (`useAkademieNav`), ne React Router

## Jak spustit lokálně

```bash
# 1. Aplikovat SQL migraci na local Supabase
supabase db push  # nebo přes Supabase dashboard

# 2. Spustit dev server
cd dechbar-app && npm run dev

# 3. Přejít na /app → klik na "Akademie" v bottom nav
```

## Seed data

Migrace obsahuje seed pro Digitální ticho (21 lekcí).
Dny 2–21 mají placeholder audio_url (`/audio/digitalni-ticho/den-XX.mp3`).
Den 1 má skutečnou URL z Bunny CDN (ochutnávka).

Po nahrání audio souborů do Bunny CDN: UPDATE `akademie_lessons` SET `audio_url` = '...' WHERE `day_number` = X.

## Jak přidat nový program nebo kategorii

Viz `README.md` → sekce "Jak přidat nový program" / "Jak přidat novou kategorii".

## Budoucí práce (Výzvy)

Výzvy jsou plánována jako druhá kategorie. Implementace bude podobná — nová `akademie_categories` row se `slug = 'vyzvy'`, programy, série, lekce.

Specifika Výzev oproti REŽIM:
- Zdarma (bez access check)
- Date picker pro start date
- Lekce bez strictl ordering (uživatel si vybere den)

Viz `MODULE_MANIFEST.json` → `features.future`.

## Kontextuální soubory pro hlubší pochopení

- `src/platform/components/AudioPlayer/store.ts` — playSticky akce
- `src/modules/public-web/components/digitalni-ticho/DigitalniTichoAudioPreview.tsx` — iOS audio pattern
- `src/modules/mvp0/components/LockedFeatureModal.tsx` — paywall modal
- `supabase/migrations/20260219120000_add_digitalni_ticho_module.sql` — původní modul migrace
