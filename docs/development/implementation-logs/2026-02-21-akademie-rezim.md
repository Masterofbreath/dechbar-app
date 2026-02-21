# Implementation Log — Akademie Module, Program REŽIM

**Datum:** 2026-02-21  
**Agent:** AI Agent (claude-4.6-sonnet-medium-thinking)  
**Čas:** ~2h implementace  
**Stav:** ✅ Hotovo — připraveno pro aplikaci SQL migrace a test

---

## Kontext a rozhodnutí

### Proč Varianta A pro přístupová práva
Zvažovaly se dvě varianty:
- **Varianta A**: Reuse existující `modules` + `user_modules` tabulky a Stripe webhook
- **Varianta B**: Nová `akademie_access` tabulka s vlastní purchase pipeline

Zvolena **Varianta A** — žádná duplicitní logika, Stripe webhook je již hotový pro Digitální ticho.

### Proč Zustand pro drill-down navigaci (ne React Router)
Tab navigace v celé aplikaci je řízena Zustandem (`useNavigation`). Bylo by nekonzistentní a složitější používat React Router pouze pro drill-down uvnitř jednoho tabu. Zustand stack je jednoduchý, zachovává stav při přepnutí tabů, a neinterferuje s React Router konfigurací.

### Proč playSticky místo play
Existující `play()` akce nastavuje `mode: 'fullscreen'` — otevírá fullscreen player. Pro Akademie lekce chceme inline playback (uživatel zůstává v seznamu lekcí, StickyPlayer dole). Proto přidána nová akce `playSticky(track)` s `mode: 'sticky'`.

### iOS Safari audio constraint
Klíčový pattern z `DigitalniTichoAudioPreview.tsx`: `audio.play()` musí být voláno synchronně v onClick handleru. V implementaci to zajišťuje `LessonRow.tsx` → `handlePlay()` → `playback.playLesson(lesson)` → `playSticky(track)`. Žádný async kód před voláním playSticky.

### CSS architektura
Všechny styly v `src/styles/modules/akademie/` (5 souborů + index.css). BEM namespace `.akademie-*`. Vše přes design tokeny. Jeden import v `globals.css`. Umožňuje přepsat celý look modulu z `_variables.css`.

---

## Soubory vytvořené / modifikované

### Nové soubory
```
supabase/migrations/20260221100000_akademie_module.sql
src/modules/akademie/
  ├── MODULE_MANIFEST.json
  ├── README.md
  ├── ONBOARDING.md
  ├── CHANGELOG.md
  ├── index.ts
  ├── types.ts
  ├── api/
  │   ├── keys.ts
  │   ├── useAkademieCatalog.ts
  │   ├── useAkademieProgram.ts
  │   └── useAkademieProgress.ts
  ├── hooks/
  │   ├── useAkademieNav.ts
  │   └── useAkademiePlayback.ts
  └── components/
      ├── AkademieRoot.tsx
      ├── CategoryPills/CategoryPills.tsx + index.ts
      ├── ProgramGrid/ProgramGrid.tsx + ProgramCard.tsx + index.ts
      ├── ProgramDetail/ProgramDetail.tsx + SeriesCard.tsx + index.ts
      └── SeriesDetail/SeriesDetail.tsx + LessonRow.tsx + types.ts + index.ts
src/styles/modules/akademie/
  ├── _variables.css
  ├── _category-pills.css
  ├── _program-grid.css
  ├── _program-detail.css
  ├── _series-detail.css
  └── index.css
```

### Modifikované soubory
```
src/platform/components/AudioPlayer/types.ts     — přidán playSticky do AudioPlayerState
src/platform/components/AudioPlayer/store.ts     — implementace playSticky akce
src/modules/mvp0/pages/AkademiePage.tsx          — přepnut na <AkademieRoot />
src/app/moduleRegistry.ts                        — odkomentován akademie modul
src/styles/globals.css                           — přidán @import akademie/index.css
```

---

## Co je třeba udělat před prvním testem

1. **Aplikovat SQL migraci** na dev/test Supabase instanci:
   ```bash
   supabase db push
   # nebo přes Supabase dashboard → SQL editor → spustit migraci
   ```

2. **Doplnit audio URL** pro dny 2–21 v `akademie_lessons`:
   ```sql
   UPDATE akademie_lessons
   SET audio_url = 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-02.mp3'
   WHERE day_number = 2 AND module_id = 'digitalni-ticho';
   -- opakovat pro dny 3-21
   ```

3. **Ověřit user_modules** — pro test zamknutého/odemknutého stavu:
   ```sql
   -- Přidat test přístup (lokálně)
   INSERT INTO user_modules (user_id, module_id) VALUES ('[tvůj-user-uuid]', 'digitalni-ticho');
   ```

---

## Testovací checklist

Viz plán v `/.cursor/plans/akademie_-_program_režim_42fb7490.plan.md`:

- [ ] CategoryPills zobrazuje "Program REŽIM", klik nezmění URL ale filtruje programy
- [ ] ProgramCard zamknutého → LockedFeatureModal s URL zdravedychej.cz
- [ ] ProgramCard vlastněného → otevře ProgramDetail se sériemi
- [ ] Back button v ProgramDetail → zpět na ProgramGrid
- [ ] SeriesCard → SeriesDetail se 7 lekcemi
- [ ] LessonRow tap → StickyPlayer se spustí (NE fullscreen)
- [ ] Po 80% přehrání → lekce dostane checkmark (upsert do user_lesson_progress)
- [ ] Tab switch Akademie → Dnes → Akademie: navigation stack zachován
- [ ] Mobile 375px: CategoryPills scrollovatelné, bez překrytí
- [ ] Žádná emoji v UI textech (Tone of Voice)

---

## Potenciální problémy

### `useAkademieCatalog` — join přes kategorie
Supabase join filtrace přes `akademie_categories.slug` může v některých verzích PostgREST nefungovat jako expected. Hook má fallback — načte kategorii zvlášť a pak filtruje programy přes `category_id`. Testovat první.

### `LockedFeatureModal.tierRequired`
Modal má `tierRequired: 'AKADEMIE'` — ověřit, že LockedFeatureModal má tento typ definovaný (má: `'SMART' | 'AI_COACH' | 'STUDIO' | 'CHALLENGES' | 'AKADEMIE'`).

### iOS Safari + StickyPlayer
`playSticky()` nastavuje stav synchronně. Skutečné `audio.load()` + `audio.play()` musí probíhat v StickyPlayer komponentě jako reakce na změnu `currentTrack`. Ověřit, že StickyPlayer správně reaguje na `mode: 'sticky'`.
