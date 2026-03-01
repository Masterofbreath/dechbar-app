# Supabase Migrations

## ⚠️ Pro AI agenty — čti PRVNÍ

**Všechny historické migrace byly smazány** záměrně, protože jsou již aplikovány
na DEV i PROD databázi.

**NIKDY nepřepisuj existující tabulky/funkce bez migrační historiky!**
Schéma je živé — jakýkoli DROP TABLE / TRUNCATE / ALTER bez konzultace
může shodit produkci.

---

## Jak přidat novou migraci

```bash
# Pojmenuj soubor: YYYYMMDDHHMMSS_popis_co_delas.sql
# Příklad:
touch supabase/migrations/20260305120000_add_special_event_table.sql

# Po napsání SQL pushni na DEV:
supabase link --project-ref nrlqzighwaeuxcicuhse  # DEV
supabase db push

# Otestuj na DEV, pak pushni na PROD:
supabase link --project-ref iqyahebbteiwzwyrtmns  # PROD
supabase db push
```

## Reference IDs

| Prostředí | Project Ref | URL |
|---|---|---|
| **DEV** | `nrlqzighwaeuxcicuhse` | https://nrlqzighwaeuxcicuhse.supabase.co |
| **PROD** | `iqyahebbteiwzwyrtmns` | https://iqyahebbteiwzwyrtmns.supabase.co |

## Historie aplikovaných migrací

Celá historie je uložena v remote databázi:

```bash
supabase migration list  # zobrazí všechny aplikované migrace
```

Poslední aplikovaná migrace: `20260228240000_fix_akademie_lesson_titles`

## Klíčové tabulky (stav k 1.3.2026)

| Tabulka | Popis |
|---|---|
| `akademie_programs` | Programy akademie (duration_days, daily_minutes, launch_date) |
| `akademie_series` | Série (týdny) uvnitř programu |
| `akademie_lessons` | Lekce s day_number (pro postupné odemykání) |
| `user_active_program` | Uživatelem vybraný denní program (UNIQUE user_id) |
| `platform_featured_program` | Admin-nastavený doporučený program |
| `platform_daily_override` | Admin-naplánovaný audio override pro Dnes stránku |
| `notifications` | Systémové notifikace |
| `user_notifications` | Per-user doručení notifikací |
| `modules` | Produkty/moduly (cena, Stripe ID, Ecomail) |
| `user_roles` | Role uživatelů (admin, ceo) |
