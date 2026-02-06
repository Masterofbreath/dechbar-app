# 🎯 9-polový kategorizační systém - Quick Start

**Verze:** 2.48.0 | **Status:** ✅ Implementováno | **Datum:** 2026-02-06

---

## 📌 Co bylo přidáno?

### 3 nová pole pro tracky:
1. **🎯 Typ cvičení** (`exercise_format`): Dechpresso, Meditace, Breathwork
2. **💪 Fyzická intenzita** (`intensity_level`): Jemná, Střední, Vysoká, Extrémní
3. **🎙️ Styl narace** (`narration_type`): Příběh, Bez příběhu, Guided

---

## 🚀 Jak spustit?

### 1️⃣ Spusť migraci v Supabase DEV
```bash
# Otevři soubor:
supabase/MANUAL_MIGRATION_BATCH3_20260206.sql

# Zkopíruj celý SQL kód a spusť v Supabase DEV → SQL Editor
```

### 2️⃣ Restartuj dev server
```bash
cd dechbar-app/
npm run dev
```

### 3️⃣ Otestuj admin UI
```
1. Přihlaš se jako admin
2. Jdi na "Media" → "Tracks"
3. Klikni "Nový track"
4. Zkontroluj nové dropdowny: 🎯 Typ cvičení, 💪 Fyzická intenzita, 🎙️ Styl narace
5. Vyplň testovací track a ulož
6. Zkontroluj TrackTable → nové sloupce "Typ cvičení", "Intenzita"
```

---

## 📚 Dokumentace

| Soubor | Popis |
|--------|-------|
| `docs/KATEGORIZACNI_SYSTEM_TRACKU.md` | Kompletní průvodce 9-polovým systémem |
| `CHANGELOG_v2.48.0.md` | Seznam změn a testovací checklist |
| `supabase/MANUAL_MIGRATION_BATCH3_20260206.sql` | SQL migrace pro Supabase |

---

## 🎨 UI Preview

### TrackForm (nové dropdowny):
```
🎯 Typ cvičení:
   ├─ Dechpresso (krátké intenzivní)
   ├─ Meditace (delší funkční)
   └─ Breathwork (dlouhé transformační)

💪 Fyzická intenzita:
   ├─ Jemná (relaxační)
   ├─ Střední (udržovací)
   ├─ Vysoká (náročné)
   └─ Extrémní (profesionálové)

🎙️ Styl narace:
   ├─ Příběh (příběhové vedení)
   ├─ Bez příběhu (jen pokyny)
   └─ Guided (detailní vedení)
```

### TrackTable (nové sloupce):
```
| Cover | Název | Typ cvičení | Intenzita | Obtížnost | KP | Délka | Status | Akce |
```

---

## ✅ Hotovo!

Systém je **ready to use**! 🎉

**Pro více detailů:** `docs/KATEGORIZACNI_SYSTEM_TRACKU.md`
