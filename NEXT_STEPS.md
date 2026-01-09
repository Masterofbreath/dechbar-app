# Next Steps - Co dělat dál?

**Status projektu:** ✅ Enterprise struktura kompletní  
**Version:** 0.1.0  
**Připraveno k:** Vývoj funkcí

---

## 🎯 Co bylo dokončeno

✅ Kompletní dokumentační systém (35+ souborů)  
✅ Standalone projekt (žádné FOUNDATION odkazy)  
✅ Config management (Single Source of Truth)  
✅ Platform layer (hooks pro auth, membership, moduly)  
✅ Module system (template + lazy loading)  
✅ Design tokens (standalone)  
✅ Tracking (CHANGELOG, BUGS, ADRs)  
✅ Master navigation (PROJECT_GUIDE.md)

---

## 🚀 OKAMŽITĚ (teď hned):

### 1. Nainstaluj dependencies

```bash
cd /Users/DechBar/dechbar-app
npm install
```

**Přidali jsme:** `@tanstack/react-query` (pro data fetching)

### 2. Vytvoř .env.local

```bash
# Zkopíruj template
cp .env.local.example .env.local

# Otevři a vyplň Supabase credentials:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

**Kde vzít credentials:**
1. https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns
2. Settings → API
3. Zkopíruj URL a anon key

### 3. Spusť dev server

```bash
npm run dev
```

**Očekávaný výsledek:** Server běží na http://localhost:5173/

---

## 📋 DALŠÍ KROKY (podle priority):

### Krok 1: Implementace Autentizace (1-2 dny)

**Co vytvořit:**
- [ ] Login form (`src/platform/auth/components/LoginForm.tsx`)
- [ ] Registrace form
- [ ] Forgot password form
- [ ] Auth layout komponenta

**Testovat:**
- Registrace nového uživatele
- Přihlášení
- Odhlášení
- Reset hesla

**Použiješ:** `useAuth()` hook (už existuje!)

---

### Krok 2: Studio Module - MVP (3-5 dnů)

**Co vytvořit:**
- [ ] Exercise builder UI
- [ ] Breathing timer komponent
- [ ] Audio player
- [ ] List uživatelových cvičení
- [ ] Detail cvičení

**Database migration:**
```bash
supabase migration new add_exercises_table
# Vytvoř tabulky: exercises, exercise_sessions
supabase db push
```

**Použiješ:** 
- `useModuleAccess('studio')` - check přístupu
- `useAuth()` - current user
- Platform komponenty (Button, Card, etc.)

---

### Krok 3: Paywall & Payments (2-3 dny)

**Co vytvořit:**
- [ ] Paywall komponenta (když user nemá modul)
- [ ] Pricing page (zobrazí ceny z DB!)
- [ ] GoPay integrace
- [ ] Stripe integrace (later)

**Použiješ:**
- `useModules()` - načíst pricing z DB
- `useModule('studio')` - detail modulu

---

### Krok 4: Mobile Optimalizace (1-2 dny)

**Co otestovat:**
- [ ] Touch targets ≥44px
- [ ] Safe areas (iOS notch)
- [ ] Landscape/portrait
- [ ] Haptic feedback (tlačítka)
- [ ] Swipe gestures

---

### Krok 5: Deployment (1 den)

**Setup:**
- [ ] GitHub repository
- [ ] Vercel účet
- [ ] Deploy to Vercel
- [ ] Custom domain (dechbar.cz)

---

## 🤖 Pro nového AI agenta

Až založíš nového agenta, řekni mu:

```
"Přečti PROJECT_GUIDE.md a postupuj podle něj"
```

**Agent:**
1. Přečte PROJECT_GUIDE.md
2. Ví kde je co
3. Ví jak přidat funkce
4. Ví kde jsou ceny (v databázi!)
5. Připraven tvořit!

---

## 📚 Kde najít pomoc

| Potřebuji... | Kde hledat |
|--------------|------------|
| **Začít vývoj** | PROJECT_GUIDE.md |
| **Setup projekt** | docs/development/00_QUICK_START.md |
| **Přidat funkci** | docs/development/01_WORKFLOW.md |
| **Vytvořit modul** | src/modules/README.md |
| **Databáze** | docs/development/02_SUPABASE.md |
| **Design systém** | docs/design-system/00_OVERVIEW.md |
| **Platform API** | docs/api/PLATFORM_API.md |

---

## ✅ Checklist před prvním commitem

- [ ] `npm install` proběhlo
- [ ] `.env.local` vytvořen a vyplněn
- [ ] `npm run dev` funguje
- [ ] Žádné console errors
- [ ] Přečetl jsi PROJECT_GUIDE.md
- [ ] Rozumíš struktuře projektu

---

**Jsi připraven začít vyvíjet!** 🚀

**Pamatuj:** 
- Ceny vždy z databáze (nikdy hardcoded)
- Design pro 4 temperamenty (vždy!)
- Mobile-first (vždy!)
- Dokumentuj změny v CHANGELOG.md

---

*Created: 2026-01-09*
