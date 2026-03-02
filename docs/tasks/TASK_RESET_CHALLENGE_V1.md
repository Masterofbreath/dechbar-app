# 🔄 Úkol pro nového agenta: "Spustit znovu" — Reset výzvy/programu

## Status: PŘIPRAVENO K IMPLEMENTACI
## Priorita: Střední (UX enhancement)
## Odhadovaná náročnost: 4–6 h (1 agent session)

---

## 🎯 Cíl

Po dokončení celé výzvy (program/challenge) umožnit uživateli spustit ji **znovu od začátku** —
jako by ji absolvoval poprvé. Celý proces se zopakuje: Den 1, Den 2, ..., Den N s původní logikou.

---

## 📍 Kde se tlačítko zobrazí

V **detailu programu** (AkademieOverlay / program detail view) — vlevo vedle tlačítka "Denní program":

```
[Spustit znovu]   [Denní program]
```

Zobrazit POUZE pokud:
- Uživatel dokončil VŠECHNY lekce v programu (`user_lesson_progress` = 100 %)
- Program má typ `challenge` nebo má záznamy v `user_lesson_progress`

---

## 🗄️ Databáze — co resetovat

### Tabulka: `user_lesson_progress`
Reset = smazat všechny záznamy pro daného uživatele + daný program:

```sql
DELETE FROM user_lesson_progress
WHERE user_id = $user_id
  AND program_id = $program_id;
```

### Tabulka: `user_active_program` (pokud existuje)
Resetovat progress na den 1:

```sql
UPDATE user_active_program
SET current_day = 1,
    started_at = NOW(),
    completed_at = NULL
WHERE user_id = $user_id
  AND program_id = $program_id;
```

---

## 🖥️ Frontend — co implementovat

### 1. Nový Supabase RPC: `reset_program_progress`

Soubor: `supabase/migrations/YYYYMMDD_reset_program_progress_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION public.reset_program_progress(
  p_program_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete lesson progress
  DELETE FROM user_lesson_progress
  WHERE user_id = auth.uid()
    AND program_id = p_program_id;

  -- Reset active program (if exists)
  UPDATE user_active_program
  SET current_day = 1,
      started_at = NOW(),
      completed_at = NULL
  WHERE user_id = auth.uid()
    AND program_id = p_program_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_program_progress(uuid) TO authenticated;
```

### 2. Hook: `useResetProgram`

Soubor: `src/modules/akademie/api/useResetProgram.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';

export function useResetProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase.rpc('reset_program_progress', {
        p_program_id: programId,
      });
      if (error) throw error;
    },
    onSuccess: (_data, programId) => {
      // Invalidate all program-related queries
      queryClient.invalidateQueries({ queryKey: ['akademie', 'program', programId] });
      queryClient.invalidateQueries({ queryKey: ['akademie', 'lessons'] });
      queryClient.invalidateQueries({ queryKey: ['user_active_program'] });
      queryClient.invalidateQueries({ queryKey: ['platform_featured_program'] });
    },
  });
}
```

### 3. Confirmation Modal

- Zobrazit **dialog** před resetem (ne browser `confirm()`)
- Text: "Opravdu chceš spustit výzvu znovu? Tvůj dosavadní progress Den 1–N bude smazán."
- Tlačítka: "Zrušit" (outline) | "Spustit znovu" (primary, gold)
- Po potvrzení: zavolat `useResetProgram`, zobrazit toast "Výzva spuštěna znovu!", redirect zpět na Den 1

### 4. UI — Tlačítko "Spustit znovu"

Lokace: `src/modules/akademie/components/ProgramDetail/` (nebo kde je `akademie-program-detail__pin-btn`)

Podmínka zobrazení:
```typescript
const allCompleted = lessons.every((l) => l.isCompleted);
// Zobraz tlačítko POUZE když allCompleted === true
```

---

## 🎨 Design specifikace

- Tlačítko: outline styl (ne filled), border gold, text "Spustit znovu"
- Ikona: rotační šipka (reload icon), inline SVG, 16px
- Modal: temné pozadí, centrovaný, max-width 400px

---

## ✅ Acceptance kritéria

- [ ] Po kliknutí na "Spustit znovu" → zobrazí se confirmation modal
- [ ] Po potvrzení → smaže se `user_lesson_progress` pro tento program
- [ ] Lekce se znovu zamknou (Den 2+ uzamčený, Den 1 přístupný)
- [ ] Na view "Dnes" se zobrazí Den 1 výzvy v denním programu
- [ ] Toast "Výzva spuštěna znovu!" po úspěchu
- [ ] Tlačítko zmizí (nebo se změní na "Dokonáno ✓") po resetování
- [ ] Funguje na iOS PWA i desktop browser

---

## 📁 Soubory k procházení před implementací

1. `src/modules/akademie/components/SeriesDetail/LessonRow.tsx` — aktuální stav LessonRow
2. `src/modules/mvp0/hooks/usePlatformFeaturedProgram.ts` — jak se určuje "next lesson"
3. `src/modules/akademie/` — celý modul pro kontext
4. `supabase/migrations/` — příklady migrací pro vzor
5. `FOUNDATION/13_DATABASE_MIGRATIONS.md` — postup pro migraci

---

## ⚠️ Pozor

- NIKDY nemazat `audio_sessions` — ty zůstávají pro statistiky
- Test VŽDY na DEV Supabase instance nejprve!
- Confirm button v modal NESMÍ být `window.confirm()` — použij vlastní komponentu

---

*Vygenerováno: 2026-03-02 | Agent: claude-sonnet*
