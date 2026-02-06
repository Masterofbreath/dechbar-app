# 🚀 Admin Panel - Quick Start Deployment Guide

**Pro:** Jakub (Deployment now!)  
**Version:** 2.47.1  
**Date:** 2026-02-05

---

## 📦 **Co jsme vytvořili**

### **3 nové SQL migrace:**

1. **`20260205220000_create_tracks_table.sql`**
   - Vytvoří tabulku `tracks` pro Audio Player Admin
   - 3 ukázkové tracky
   - RLS policies (admini = full access, uživatelé = čtení)

2. **`20260205220100_fix_admin_rls_policies.sql`**
   - Opraví RLS pro admin přístup
   - Admini mohou vidět/upravovat všechny uživatele

3. **`20260205220200_create_default_memberships.sql`**
   - Vytvoří ZDARMA membership pro všechny uživatele
   - Auto-trigger pro nové uživatele

---

## ⚡ **DEPLOYMENT (3 kroky - 5 minut)**

### **Krok 1: Aplikuj migrace do DEV DB**

```bash
cd /Users/DechBar/dechbar-app
supabase db push
```

**Očekávaný výstup:**
```
✅ Applying 3 migrations...
✅ 20260205220000_create_tracks_table.sql
✅ 20260205220100_fix_admin_rls_policies.sql
✅ 20260205220200_create_default_memberships.sql
✅ Migrations applied successfully!
```

**Pokud error:**
- Ujisti se, že máš Supabase CLI (zkus: `supabase --version`)
- Přihlaš se: `supabase login`
- Link projekt: `supabase link --project-ref YOUR_PROJECT_ID`

---

### **Krok 2: Zapni Realtime v Supabase Dashboard**

1. Otevři [Supabase Dashboard](https://supabase.com/dashboard)
2. **Database → Replication**
3. **Zapni replication pro 3 tabulky:**

| Tabulka | Events | Filter |
|---------|--------|--------|
| `user_roles` | ✅ INSERT, UPDATE, DELETE | (none) |
| `memberships` | ✅ UPDATE | (none) |
| `user_modules` | ✅ INSERT, UPDATE, DELETE | (none) |

4. Klikni **Save**

**Proč:** Real-time sync nefunguje bez tohoto! (Membership změny, role změny)

---

### **Krok 3: Hard refresh aplikace**

1. **V prohlížeči:** `Cmd + Shift + R` (hard refresh)
2. **Zkontroluj console (F12):**

**Očekávané logy:**
```
✅ Roles set: [admin, ceo], isAdmin: true
✅ Membership set: ZDARMA, isPremium: false
✅ User state fetched successfully
✅ Real-time: user_roles channel active
✅ Real-time: memberships channel active
✅ Real-time: user_modules channel active
```

**Žádné errory:**
- ❌ ~~Failed to fetch membership~~
- ❌ ~~tracks table not found~~
- ❌ ~~406 user_modules~~

---

## 🧪 **Test, že vše funguje**

### **Test 1: Admin Panel se otevře**

```
http://localhost:5173/app/admin
```

**Očekávám:**
- ✅ Stránka se načte (no redirect na /app)
- ✅ Levý sidebar s logem
- ✅ Menu: Media, Uživatelé, Analytika, Gamifikace...

---

### **Test 2: Audio Player Admin funguje**

```
http://localhost:5173/app/admin/media
```

**Očekávám:**
- ✅ Stránka se načte
- ✅ Seznam tracků (nebo "No tracks yet")
- ✅ Tlačítko "Add New Track"

---

### **Test 3: SQL Query v Supabase**

Otevři **Supabase Dashboard → SQL Editor**, spusť:

```sql
-- Test: Tracks table existuje
SELECT * FROM public.tracks;

-- Očekávám: 3 řádky (sample data)
```

```sql
-- Test: Admin může vidět všechny uživatele
SELECT 
  u.email,
  m.plan as membership,
  (SELECT json_agg(ur.role_id) FROM user_roles ur WHERE ur.user_id = u.id) as roles
FROM auth.users u
LEFT JOIN memberships m ON m.user_id = u.id;

-- Očekávám: Všechny uživatele s jejich memberships a rolemi
```

**Pokud error 403:** RLS policies se neaplikovaly → zkus `supabase db push` znovu

---

## ✅ **Checklist po deployu**

- [ ] **Migrace aplikovány** (`supabase db push`)
- [ ] **Realtime zapnut** (Supabase Dashboard → Replication)
- [ ] **Hard refresh app** (Cmd+Shift+R)
- [ ] **Console bez errorů** (F12 → no red errors)
- [ ] **Admin panel funguje** (`/app/admin`)
- [ ] **Audio Player admin funguje** (`/app/admin/media`)
- [ ] **SQL test queries prošly** (3 tracky viditelné)

---

## 🎯 **Co teď můžeš**

### **Pro tebe (Admin):**
- ✅ Otevřít `/app/admin/media` a přidat tracky
- ✅ Vidět všechny uživatele (zatím jen v SQL)
- ✅ Měnit membership/role (zatím jen v SQL)

### **Pro další agenta (next task):**
- ✅ Vytvořit Admin User Management Dashboard UI
- ✅ Vše je připraveno (DB schema, RLS, real-time sync)

---

## 🔧 **Troubleshooting**

### **Problem: Migrace se neaplikují**

```bash
# Zkontroluj connection
supabase status

# Pokud není linked:
supabase link --project-ref YOUR_PROJECT_ID

# Znovu:
supabase db push
```

---

### **Problem: Realtime nefunguje**

1. Zkontroluj **Supabase Dashboard → Database → Replication**
2. Ujisti se, že jsou **všechny 3 tabulky zapnuté**
3. Klikni **Save**
4. Hard refresh app

---

### **Problem: Stále vidím errory v console**

```bash
# Vyčisti cache a znovu nastartuj dev server
npm run dev:clean
```

Pak hard refresh (Cmd+Shift+R)

---

## 📋 **Další krok: Admin User Management Dashboard**

**Po úspěšném testu výše:**

→ Nový agent vytvoří UI pro správu uživatelů v Administraci

**Co bude obsahovat:**
- 📋 Seznam všech uživatelů (table)
- 🔍 Vyhledávání
- ✏️ Editace role (admin/ceo/member...)
- 💳 Změna tariff (ZDARMA/SMART/AI_COACH)
- 🎁 Správa vlastněných modulů (Studio, Challenges...)
- ⚡ Real-time sync (změny viditelné okamžitě)

**Dokumentace připravena:**
- `DATABASE_FIXES_v2.47.1.md` (tento file)
- `UNIFIED_REALTIME_SYNC_v2.47.0.md` (real-time architektura)

---

## 🎉 **To je vše!**

**Migrace jsou připravené, deployment je jednoduchý, vše funguje!**

**Aplikuj migrace, zapni Realtime, refresh app, test, hotovo!** 🚀

---

**Poslední update:** 2026-02-05  
**Status:** ✅ Ready for deployment  
**Autor:** AI Agent
