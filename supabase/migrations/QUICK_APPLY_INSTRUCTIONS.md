# 🚀 Rychlá Aplikace Migrace - Session Audio & Haptics

## 📋 Co aplikujeme:

1. **`background_tracks` tabulka** - Pro background music
2. **`is_meditation_mode` sloupec** - Pro Meditation Mode v cvičeních

---

## ✅ Postup (5 minut):

### **Krok 1: Otevři Supabase Dashboard**

1. Přejdi na: **https://supabase.com/dashboard/project/nrlqzighwaeuxcicuhse**
2. Klikni na **SQL Editor** (ikona `<>` v levém menu)
3. Klikni **"+ New query"** (nahoře vpravo)

### **Krok 2: Zkopíruj a spusť SQL**

Zkopíruj celý obsah souboru `APPLY_TO_DEV.sql` (je ve stejné složce) a vlož do SQL Editoru.

**Nebo zkopíruj přímo odsud:**

```sql
-- Apply both migrations at once for DEV DB
-- Date: 2026-02-06

-- Migration 1: Add background_tracks table
CREATE TABLE IF NOT EXISTS public.background_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER NOT NULL,
  cdn_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  required_tier TEXT NOT NULL DEFAULT 'ZDARMA',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.background_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tracks"
  ON public.background_tracks FOR SELECT
  USING (is_active = true);

CREATE INDEX background_tracks_category_idx ON public.background_tracks(category);
CREATE INDEX background_tracks_tier_idx ON public.background_tracks(required_tier);
CREATE INDEX background_tracks_slug_idx ON public.background_tracks(slug);

COMMENT ON TABLE public.background_tracks IS 'Background music tracks for breathing sessions';
COMMENT ON COLUMN public.background_tracks.slug IS 'URL-friendly identifier (e.g., nature-forest)';
COMMENT ON COLUMN public.background_tracks.cdn_url IS 'Full Bunny.net CDN URL';
COMMENT ON COLUMN public.background_tracks.required_tier IS 'Minimum membership tier required (ZDARMA, SMART, AI_COACH)';

INSERT INTO public.background_tracks (name, slug, category, description, duration_seconds, cdn_url, file_size_bytes, required_tier, sort_order)
VALUES
  ('Příroda - Les', 'nature-forest', 'nature', 'Zpěv ptáků a šumění stromů', 120, 'https://cdn.dechbar.cz/audio/ambient/nature-forest-120s.aac', 4000000, 'ZDARMA', 1),
  ('Příroda - Oceán', 'nature-ocean', 'nature', 'Vlny a mořský vítr', 120, 'https://cdn.dechbar.cz/audio/ambient/nature-ocean-120s.aac', 4000000, 'ZDARMA', 2),
  ('Tibetské mísy', 'tibetan-bowls', 'tibetan', 'Zpívající mísy v ladění 528 Hz', 90, 'https://cdn.dechbar.cz/audio/ambient/tibetan-bowls-90s.aac', 3000000, 'ZDARMA', 3);

-- Migration 2: Add meditation mode support
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS is_meditation_mode BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.exercises.is_meditation_mode IS 'If true, session runs as meditation (no breathing pattern guidance)';

CREATE INDEX IF NOT EXISTS exercises_meditation_idx 
  ON public.exercises(is_meditation_mode) 
  WHERE is_meditation_mode = true;
```

### **Krok 3: Spusť**

- Klikni **"Run"** (nebo zmáčkni `Cmd+Enter`)
- Počkej ~2 sekundy
- Mělo by se objevit: **"Success. No rows returned"**

### **Krok 4: Ověř**

Spusť tento SQL pro ověření:

```sql
-- Check background_tracks table
SELECT COUNT(*) as tracks_count FROM public.background_tracks;

-- Check meditation mode column
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'exercises' AND column_name = 'is_meditation_mode';
```

**Očekávaný výsledek:**
- `tracks_count`: **3** (3 seed tracky)
- `column_name`: **is_meditation_mode** ✅

---

## 🎉 Hotovo!

Migrace jsou aplikované! Nyní můžeš:

1. **Refresh browser** (aplikace načte nové tracky)
2. **Otevřít Settings Page** (`/app/settings`)
3. **Testovat Background Music selector**

---

## 🆘 V případě problémů:

### **"duplicate key value violates unique constraint"**
- Seed data už byla vložena (OK, ignoruj)
- Nebo smaž existující data: `DELETE FROM public.background_tracks;` a spusť znovu

### **"column already exists"**
- `is_meditation_mode` už existuje (OK, `IF NOT EXISTS` to ošetřuje)

### **"permission denied"**
- Ujisti se, že jsi přihlášen jako vlastník projektu (martin@zdravedychej.cz)

---

## 📊 Co jsme přidali:

### 1. **background_tracks table** 
- 3 seed tracky (ZDARMA tier)
- RLS policies
- Indexy pro rychlé queries

### 2. **is_meditation_mode column**
- Boolean flag v `exercises` table
- Index pro rychlé filtrování
- Default: `false`

---

**Status:** ✅ SQL Ready | ⏳ Čeká na aplikaci v Dashboard

**Next:** Po aplikaci migrace otestuj Settings Page! 🚀
