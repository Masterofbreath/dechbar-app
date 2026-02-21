# Akademie Module — Agent Onboarding

Čteš toto jako nový agent pracující na Akademie modulu. Přečti si tento soubor jako první.

## Co je hotové (v1.0)

- SQL migrace: `supabase/migrations/20260221100000_akademie_module.sql`
- TypeScript typy: `types.ts`
- Zustand navigace: `hooks/useAkademieNav.ts`
- API hooks: `api/` (catalog, program, progress)
- Playback hook: `hooks/useAkademiePlayback.ts`
- CSS: `src/styles/modules/akademie/`
- UI: CategoryPills, ProgramGrid, ProgramCard, ProgramDetail, SeriesCard, SeriesDetail, LessonRow
- AudioPlayer rozšíření: `playSticky(track)` v store.ts + types.ts

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
