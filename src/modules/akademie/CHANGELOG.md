# Akademie Module — Changelog

## [1.1.0] — 2026-02-21

### Přidáno
- **CategoryGrid** — nová úvodní obrazovka Akademie (mřížka karet, 2 sloupce mobile / 3 tablet+)
- **Placeholder kategorie** — "21denní výzvy", "Kurzy", "Dechopedie", "Bonusy", "VIP sekce"
- **required_module_id** na `akademie_categories` — připraveno pro budoucí zamykání
- **user_program_favorites** tabulka + mutation `useToggleFavorite`
- **ProgramDetail refactor** — side-by-side header (thumbnail vlevo, info vpravo) + inline accordion série
- **Favorites tlačítko** — hvězdička na owned kartách, oblíbené zobrazeny první
- **BottomNav re-tap reset** — klik na aktivní Akademie tab vrátí na CategoryGrid
- **3 nové programy REŽIM** v DB: "Když je toho moc", "Dobrou noc", "Jasný směr"
- **PROD migrace** — kompletní schema + seed data nasazeny na produkci

### Změněno
- `CategoryPills` nahrazeny `CategoryGrid` jako primární navigace Akademie
- `AkademieRoot` flow: CategoryGrid → ProgramGrid (v kategorii) → ProgramDetail
- `SeriesDetail` stránka odstraněna, série jsou accordion v ProgramDetail
- `useAkademiePlayback` má volitelné params a nový helper `isCurrentlyPlaying`

## [1.0.0] — 2026-02-21

### Added
- Modul `src/modules/akademie/` se strukturou dle platform conventions
- SQL migrace `20260221100000_akademie_module.sql`:
  - Tabulky: `akademie_categories`, `akademie_programs`, `akademie_series`, `akademie_lessons`, `user_lesson_progress`
  - RLS policies (public read pro obsah, own-row-only pro progress)
  - Seed: kategorie "Program REŽIM", program "Digitální ticho" (3 série, 21 lekcí)
- TypeScript typy (`types.ts`): Category, Program, Series, Lesson, Progress, Route, NavState
- Zustand navigation store (`hooks/useAkademieNav.ts`): drill-down routing uvnitř Akademie
- API hooks (`api/`):
  - `useAkademieCategories` — načítání kategorií
  - `useAkademieCatalog` — programy + access merge (owned/locked)
  - `useAkademieSeries` + `useAkademieLessons` — obsah programu
  - `useMarkLessonComplete` — upsert po 80% přehrání
- Playback hook (`hooks/useAkademiePlayback.ts`): lesson → Track mapping, iOS-safe playback
- CSS moduly (`src/styles/modules/akademie/`): variables, pills, grid, detail, series
- UI komponenty:
  - `AkademieRoot` — orchestrátor s route-based rendering
  - `CategoryPills` — horizontální scrollovatelná navigace
  - `ProgramGrid` + `ProgramCard` — grid s owned/locked stavem
  - `ProgramDetail` + `SeriesCard` — detail programu se sériemi
  - `SeriesDetail` + `LessonRow` — seznam lekcí s progress a playback
- `LockedFeatureModal` integrace (tierRequired: 'AKADEMIE', websiteUrl: zdravedychej.cz)
- Rozšíření `AudioPlayer/store.ts` a `AudioPlayer/types.ts`: `playSticky(track)` akce
- `AkademiePage.tsx` přepnut z placeholder na `<AkademieRoot />`
- `moduleRegistry.ts`: odkomentován `akademie` modul
- Dokumentace: `README.md`, `ONBOARDING.md`, `MODULE_MANIFEST.json`

### Technical notes
- iOS Safari: `playSticky` voláno synchronně v `onClick` (LessonRow.tsx)
- Access control: Varianta A — reuse `modules` + `user_modules` + Stripe webhook
- CSS: vše přes design tokeny, BEM `.akademie-*` namespace, žádné hardcoded hodnoty
