# 🏗️ Infrastructure Documentation - Index

**DechBar React App**  
**Version:** 2.48.0  
**Last Updated:** 2026-02-06

---

## 📚 Available Documentation

### 🐰 **Bunny.net CDN**
| Dokument | Popis | Čas na přečtení |
|----------|-------|-----------------|
| **BUNNYNET_CDN_INTEGRATION.md** | Kompletní průvodce Bunny.net integrací (12 sekcí) | 45 min |
| **BUNNYNET_QUICK_START.md** | Rychlý úvod pro nové agenty (30-second overview) | 5 min |

**Kdy číst:**
- Pracuješ s upload/delete souborů
- Řešíš 401/403 errors
- Potřebuješ pochopit CDN architekturu
- Implementuješ nové upload features

---

### 🗄️ **Supabase** (TODO)
| Dokument | Status |
|----------|--------|
| `SUPABASE_INTEGRATION.md` | ⏳ Chybí (vytvořit) |
| `SUPABASE_RLS_GUIDE.md` | ⏳ Chybí (vytvořit) |
| `SUPABASE_MIGRATIONS.md` | ⏳ Chybí (vytvořit) |

---

### ☁️ **Vercel** (TODO)
| Dokument | Status |
|----------|--------|
| `VERCEL_DEPLOYMENT.md` | ⏳ Chybí (vytvořit) |
| `VERCEL_ENV_VARS.md` | ⏳ Chybí (vytvořit) |

---

### 💳 **Stripe** (TODO)
| Dokument | Status |
|----------|--------|
| `STRIPE_INTEGRATION.md` | ⏳ Chybí (vytvořit) |

---

## 🎯 Quick Access

### Pro různé scénáře:

#### **Scénář: Nahrávám audio/image**
→ Čti: `BUNNYNET_QUICK_START.md` (5 min)

#### **Scénář: Řeším 401/403 error**
→ Čti: `BUNNYNET_CDN_INTEGRATION.md` → Section 8 (Troubleshooting)

#### **Scénář: Implementuji chunked upload**
→ Čti: `BUNNYNET_CDN_INTEGRATION.md` → Section 11 (Future Roadmap)

#### **Scénář: Optimalizuji costs**
→ Čti: `BUNNYNET_CDN_INTEGRATION.md` → Section 10 (Costs & Limits)

#### **Scénář: Nový agent onboarding**
→ Čti: `BUNNYNET_QUICK_START.md` → poté `BUNNYNET_CDN_INTEGRATION.md`

---

## 📊 Documentation Stats

| Kategorie | Dokumenty | Status | Progress |
|-----------|-----------|--------|----------|
| **Bunny.net** | 2 | ✅ Complete | 100% |
| **Supabase** | 0 | ⏳ Pending | 0% |
| **Vercel** | 0 | ⏳ Pending | 0% |
| **Stripe** | 0 | ⏳ Pending | 0% |
| **CELKEM** | 2/8 | 🔨 In Progress | 25% |

---

## 🚀 Next Steps

### Priority 1: Supabase dokumentace
- `SUPABASE_INTEGRATION.md` (RLS, auth, migrations)
- `SUPABASE_REALTIME.md` (subscriptions, channels)

### Priority 2: Vercel deployment
- `VERCEL_DEPLOYMENT.md` (build, deploy, env vars)

### Priority 3: Stripe payments
- `STRIPE_INTEGRATION.md` (checkout, webhooks, subscriptions)

---

## 🤝 Jak přispívat

### Vytváříš nový infrastructure doc?

1. Použij stejnou strukturu jako `BUNNYNET_CDN_INTEGRATION.md`:
   - Introduction
   - Architecture
   - Configuration
   - API Reference
   - Code Implementation
   - Security
   - Troubleshooting
   - Monitoring
   - Costs
   - Future Roadmap
   - Resources

2. Vytvoř i Quick Start verzi (5 min read)

3. Přidej do tohoto indexu

4. Commitni do git

---

## 📖 External Resources

### Infrastructure Services
- [Bunny.net Dashboard](https://dash.bunny.net/)
- [Supabase Dashboard](https://supabase.com/dashboard/project/nrlqzighwaeuxcicuhse)
- [Vercel Dashboard](https://vercel.com/dechbar)
- [Stripe Dashboard](https://dashboard.stripe.com/)

### Official Docs
- [Bunny.net Docs](https://docs.bunny.net/)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Stripe Docs](https://stripe.com/docs)

---

*Pro otázky: Kontaktuj DechBar team nebo přečti full dokumentaci*
