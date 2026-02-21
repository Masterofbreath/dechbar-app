# Akademie Module — Program REŽIM

## Co to je

Sekce Akademie zobrazuje audio programy a výzvy. V MVP jsou implementovány programy kategorie "Program REŽIM". První program je **Digitální ticho** (21 lekcí, 7 minut/den).

## User Journey

```
Akademie tab
  → CategoryPills (Program REŽIM | ...)
    → ProgramGrid
      → [Zamknutý program] → LockedFeatureModal ("zakup na zdravedychej.cz")
      → [Vlastněný program] → ProgramDetail
        → SeriesCard (Týden 1–3)
          → SeriesDetail
            → LessonRow → tap → StickyAudioPlayer (inline)
```

## Přístupová logika (Varianta A)

Žádná nová purchase pipeline. Přístup se řídí existující tabulkou `user_modules`:

```sql
-- Uživatel vlastní Digitální ticho?
SELECT 1 FROM user_modules
WHERE user_id = $userId AND module_id = 'digitalni-ticho';
```

Nákup probíhá na webu (Stripe webhook → INSERT do `user_modules`).

## Klíčové principy

- **Inline playback**: tap na lekci = `playSticky(track)` → StickyPlayer, uživatel zůstává v seznamu
- **Progress**: 80% threshold → upsert do `user_lesson_progress`
- **iOS Safari**: `audio.play()` se volá synchronně v `onClick` (viz `LessonRow.tsx`)
- **Design**: Dark-first, Apple Premium, Less is More, žádná emoji v UI textech

## Databázové tabulky

| Tabulka | Popis |
|---|---|
| `akademie_categories` | Kategorie (REŽIM, Výzvy, ...) |
| `akademie_programs` | Programy — bridge na `modules` |
| `akademie_series` | Týdenní série |
| `akademie_lessons` | Jednotlivé lekce (audio) |
| `user_lesson_progress` | Splněné lekce (80% threshold) |
| `modules` | Existující — zdroj pricing a access |
| `user_modules` | Existující — zdroj ownership |

## Jak přidat nový program

1. INSERT do `modules` (nový `module_id`, `price_czk`, `stripe_price_id`)
2. INSERT do `akademie_programs` (propojení na kategorii)
3. INSERT do `akademie_series` (týdenní série)
4. INSERT do `akademie_lessons` (lekce s Bunny CDN URL)
5. Stripe webhook je již nakonfigurován — automaticky vloží do `user_modules` po nákupu

## Jak přidat novou kategorii

1. INSERT do `akademie_categories` (slug, name, sort_order)
2. Přidat programy do `akademie_programs` s `category_id`
3. Žádná změna v kódu — CategoryPills se generují dynamicky z DB

## Struktura souborů

```
src/modules/akademie/
├── types.ts                         ← TypeScript interfaces
├── index.ts                         ← public API
├── MODULE_MANIFEST.json
├── api/
│   ├── keys.ts                      ← React Query cache keys
│   ├── useAkademieCatalog.ts        ← categories + programs + access
│   ├── useAkademieProgram.ts        ← series + lessons
│   └── useAkademieProgress.ts       ← completion tracking
├── hooks/
│   ├── useAkademieNav.ts            ← Zustand drill-down navigation
│   └── useAkademiePlayback.ts       ← lesson → Track mapping + 80% tracking
└── components/
    ├── AkademieRoot.tsx             ← orchestrátor
    ├── CategoryPills/               ← horizontální navigace
    ├── ProgramGrid/                 ← grid karet programů
    ├── ProgramDetail/               ← detail programu + série
    └── SeriesDetail/                ← seznam lekcí + LessonRow
```
