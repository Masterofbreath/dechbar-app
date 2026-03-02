# Supabase DEV ↔ PROD Sync Status

**Poslední aktualizace:** 2026-03-02 (noc) — Fáze D dokončena  
**DEV project:** `nrlqzighwaeuxcicuhse`  
**PROD project:** `iqyahebbteiwzwyrtmns`

---

## ✅ DOKONČENO

### Fáze 1 — DEV opravy (2026-03-02)
- ✅ `platform_featured_program.early_access_until` přidán na DEV (PROD to měl dříve)
- ✅ Stale cron `activate-smart-trial-2026-03` odstraněn z DEV
- ✅ Ecomail sync DEV: `* * * * *` → `*/5 * * * *` (shoduje se s PROD)
- ✅ Migration soubor: `20260302120000_dev_sync_phase1.sql`

### Fáze 2 — PROD additivní opravy (2026-03-02)
- ✅ `exercise_sessions.difficulty_rating` přidán na PROD (DEV to měl dříve)
- ✅ Trigger `set_updated_at_platform_daily_override` na PROD byl již přítomen
- ✅ `deactivate_smart_trial()` stored procedure na PROD ✓ aktivní
- ✅ Cron `deactivate-smart-trial-2026-03-22` na PROD: `0 23 21 3 *` — spustí se 21.3.2026 v 23:00
- ✅ Migration soubor: `20260302130000_prod_sync_phase2.sql`

### Fáze B — Edge functions deploy na DEV (2026-03-02)
- ✅ `send-welcome-blast` deploynuta na DEV
- ✅ `batch-sync-engagement` deploynuta na DEV
- ✅ `ecomail-webhook-handler` deploynuta na DEV
- ✅ `aggregate-daily-stats` deploynuta na DEV
- ✅ `public-stats` deploynuta na DEV

### Fáze C — Platební funkce sync DEV (2026-03-02 večer)
- ✅ `stripe-webhooks` v47 deploynuto na DEV z lokálního kódu
- ✅ `create-checkout-session` v32 deploynuto na DEV z lokálního kódu
- ✅ Stripe testing pravidla zakotvena v `.cursorrules`
- ⚠️ PROD stále obsahuje Mar 1 hotfix (SHA liší od lokálu) — viz 3D výše

### Fáze D — PROD → DEV kritický sync (2026-03-02 noc)
Migrace `20260302200000_prod_to_dev_sync_phase_d.sql` aplikována na DEV.

**Sloupce přidány na DEV:**
- ✅ `profiles.welcome_email_sent_at` (TIMESTAMPTZ, NULL)
- ✅ `user_roles.id` (UUID, gen_random_uuid())
- ✅ `user_roles.assigned_at` (TIMESTAMPTZ, nyní = `created_at`)
- ✅ `user_roles.assigned_by` (UUID, NULL)
- ✅ `user_roles.notes` (TEXT, NULL)
- ✅ `ecomail_failed_syncs.original_queue_item_id` (UUID, alias pro `original_queue_id`)
- ✅ `ecomail_failed_syncs.retry_count` (INTEGER, default 0)
- ✅ `ecomail_failed_syncs.original_created_at` (TIMESTAMPTZ, NULL)

**SQL funkce přidány na DEV:**
- ✅ `deactivate_smart_trial()` — PROD ho volá přes cron SQL, DEV volá edge fn
- ✅ `user_has_role(uuid, text)` — utility pro přístupová práva
- ✅ `user_has_any_role(uuid, text[])` — utility pro přístupová práva
- ✅ `user_is_admin(uuid)` — utility pro admin check
- ✅ `get_user_roles(uuid)` — vrátí role s `assigned_at`
- ✅ `get_daily_new_registrations(from, to)` — analytics
- ✅ `get_ecomail_queue_status()` — monitoring fronty
- ✅ `trigger_challenge_registrations_updated_at()` — trigger fn (alias k DEV `update_*` verzi)

**RLS politiky přidány na DEV:**
- ✅ `challenge_registrations`: `allow_service_role_all`
- ✅ `ecomail_failed_syncs`: `Admins can view ecomail_failed_syncs`
- ✅ `ecomail_sync_queue`: `Admins can view ecomail_sync_queue`
- ✅ `exercise_sessions`: `sessions_admin_all`
- ✅ `exercises`: `exercises_admin_all`
- ✅ `kp_measurements`: `kp_admin_all`

**Cron přidán na DEV:**
- ✅ `ecomail-batch-sync`: `0 */6 * * *` — každých 6h volá `batch-sync-engagement` edge fn

### Oprava SYNC_STATUS (2026-03-02)
- ✅ Bod 3B (`platform_featured_program` chybějící sloupce) byl **chybný** — tabulka je identická na DEV i PROD. `launch_date` patří do `akademie_programs`, ne `platform_featured_program`.

---

## ⏳ ZBÝVAJÍCÍ DIVERGENCE (Fáze E + F + Cleanup)

### 🟢 FÁZE E — DEV → PROD (nové featury, nespěchá)

Tyto věci DEV má a PROD nemá — přijdou na PROD až budou stabilní a otestované:

| Item | DEV | PROD | Poznámka |
|------|-----|------|---------|
| `challenge_registrations.smart_access_granted` | ✅ | ❌ | SMART trial přístup ke challenges |
| `memberships.challenge_smart_access` | ✅ | ❌ | SMART přístup flag |
| `memberships.challenge_smart_expires_at` | ✅ | ❌ | Expiry SMART challenge přístupu |
| Ecomail queue trigger funkce | ✅ | ❌ | Auto-queue při user events |
| `albums`, `tracks` tabulky | ✅ | ❌ | Audio content (stabilizovat nejdřív) |
| `challenge_progress` tabulka | ✅ | ❌ | Progres výzvy (stabilizovat nejdřív) |
| `kp_measurements` tabulka | ✅ | ❌ | KP měření (otestovat nejdřív) |
| `user_feedback` tabulka | ✅ | ❌ | Zpětná vazba (stabilizovat nejdřív) |

### 🔴 VYSOKÉ RIZIKO — Dříve Fáze 3 (přidat až po pečlivém review)

#### 3A — Chybějící tabulka `kp_measurements` na PROD
- DEV má tabulku `kp_measurements` (KP hodnoty z breath testů)
- PROD tuto tabulku nemá
- ⚠️ **Akce:** Ověřit, zda je DEV implementace dokončena a otestována, pak přidat migration
- **Blocker:** Nestabilní feature, nespěchá

#### 3B — ~~`platform_featured_program` rozšíření na PROD~~ ZRUŠENO
- ✅ Analýza potvrdila: DEV i PROD mají identické sloupce. `launch_date` je v `akademie_programs`.

#### 3C — RLS polícy audit
- DEV i PROD mají různé RLS politiky na tabulkách `user_lesson_progress` a `audio_sessions`
- ⚠️ **Akce:** Porovnat polícy ručně, sjednotit
- **Priority:** STŘEDNÍ — bezpečnostní implikace

#### 3D — `stripe-webhooks` + `create-checkout-session` ← ČÁSTEČNĚ VYŘEŠENO
- ✅ DEV: `stripe-webhooks` v47 + `create-checkout-session` v32 deploynuto z lokálního kódu (2026-03-02)
- ⚠️ SHA256 PROD ≠ DEV: PROD byl manuálně hotfixován 1.3.2026 s neznámými změnami
  - `stripe-webhooks` PROD SHA: `8c5bc03b` | DEV SHA: `48e0934b`
  - `create-checkout-session` PROD SHA: `84a6f623` | DEV SHA: `30db89b6`
- ✅ PROD funguje — poslední úspěšná platba 2026-02-27 (vojtech.jaska → digitalni-ticho)
- ✅ Lokální kód odpovídá PROD logickému chování (stejné debug log kroky)
- 📋 **Zbývá:** Při příštím změně těchto funkcí projít DEV → PROD a SHA se sjednotí
- **Priority:** NÍZKÁ — PROD funguje, DEV má aktuální lokální kód

### 🟡 STŘEDNÍ RIZIKO — Edge functions chybějící na DEV

| Funkce | DEV | PROD | Akce |
|--------|-----|------|------|
| `send-welcome-blast` | ✅ deploynuto 2026-03-02 | ✅ v1 | ✅ Hotovo |
| `batch-sync-engagement` | ✅ deploynuto 2026-03-02 | ✅ v4 | ✅ Hotovo |
| `ecomail-webhook-handler` | ✅ deploynuto 2026-03-02 | ✅ v2 | ✅ Hotovo |
| `aggregate-daily-stats` | ✅ deploynuto 2026-03-02 | ✅ v1 | ✅ Hotovo |
| `public-stats` | ✅ deploynuto 2026-03-02 | ✅ v1 | ✅ Hotovo |

### 🟢 NÍZKÉ RIZIKO — Fáze 4 (cleanup)

#### 4A — Ecomail sync backlog na PROD
- PROD tabulka `ecomail_sync_queue` má 1,234 řádků ve stavu `pending` (backlog)
- ⚠️ **Akce:** Ověřit, zda se fronta zpracovává (`sync-to-ecomail` edge function)
- Pokud ne → spustit manuálně nebo debugovat

#### 4B — PROD `exercise_sessions` orphaned columns
- PROD má sloupec `session_type` (string), DEV nemá
- PROD nemá `difficulty_rating` (přidáno dnes) → nyní synced
- **Akce:** Zkontrolovat, zda `session_type` je využíván

### 🟢 FÁZE F — Cleanup

#### F1 — RLS duplicity na DEV
- DEV nasbíral během iterací duplicitní politiky (např. 2× admin SELECT na `exercise_sessions`)
- **Akce:** Jednou za čas spustit audit a odstranit duplicity

#### F2 — `ecomail-bulk-resync` na PROD — potenciální duplikát
- PROD má: `ecomail-bulk-resync` (jobid=4) i `ecomail-batch-sync` (jobid=8), oba `0 */6 * * *`
- Pravděpodobně duplikát — jeden z nich může být odstraněn
- **Akce:** Ověřit, co každý dělá, odebrat stale

#### F3 — `ecomail_failed_syncs.original_queue_id` → cleanup
- DEV: `original_queue_id` | PROD: `original_queue_item_id`
- DEV nyní má oba sloupce jako aliasy (additivní sync)
- **Akce:** Až kód přejde na `original_queue_item_id`, smazat `original_queue_id` z DEV

---

## 📋 WORKFLOW PRO BUDOUCÍ PRÁCI

### Přidat nový feature:
```
1. Napiš migration → supabase/migrations/YYYYMMDDHHMMSS_feature_name.sql
2. apply_migration na DEV (project_id: nrlqzighwaeuxcicuhse)
3. Otestuj
4. git add + git commit
5. apply_migration na PROD (project_id: iqyahebbteiwzwyrtmns)
6. Aktualizuj tento soubor
```

### Jak zjistit, které migrace jít na PROD:
```sql
-- Na PROD zjistit poslední aplikovanou migraci:
SELECT version FROM supabase_migrations.schema_migrations ORDER BY inserted_at DESC LIMIT 5;

-- Pak porovnej s obsahem složky supabase/migrations/
-- Všechny soubory s VYŠŠÍM timestampem = nové pro PROD
```

---

*Tento soubor aktualizuj po každé Fázi.*
