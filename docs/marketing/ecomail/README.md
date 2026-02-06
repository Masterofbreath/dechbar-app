# 📧 Ecomail Integration Documentation

**Last Updated:** 4. února 2026  
**Version:** 2.0 (Minimalist Edition)  
**Status:** ✅ Production Ready

---

## 🎯 START HERE

**New to Ecomail integration?** Read in this order:

```
1. 00_MASTER.md         (15 min) - Credentials + current state
2. 01_ARCHITECTURE.md   (10 min) - How it works
3. 02_TAXONOMY.md       (8 min)  - Lists, tags, fields
4. 03_TROUBLESHOOTING.md (7 min) - Debug guide
---
TOTAL: 40 minutes to full understanding ✅
```

---

## 📁 DOCUMENTATION STRUCTURE

### **Core Documents (4)**

| Document | Size | Purpose | When to Read |
|----------|------|---------|--------------|
| **[00_MASTER.md](./00_MASTER.md)** | 400 lines | Single source of truth | Always start here |
| **[01_ARCHITECTURE.md](./01_ARCHITECTURE.md)** | 350 lines | System design | When coding/debugging |
| **[02_TAXONOMY.md](./02_TAXONOMY.md)** | 300 lines | Lists, tags, fields | When adding tags/fields |
| **[03_TROUBLESHOOTING.md](./03_TROUBLESHOOTING.md)** | 250 lines | Debug guide | When something breaks |

**Total:** ~1300 lines (vs 5050 lines before) - **74% reduction** ✅

---

## 📊 QUICK STATS (Verified: 4.2.2026)

```
✅ Users synced: 231/231 (100%)
✅ Ecomail lists: 5 created
✅ Active contacts: 231 (REG: 161, UNREG: 70)
✅ Edge Functions: 3 deployed
✅ CRON jobs: 3 active
✅ Sync queue: 311 events processed (all completed)
✅ Failed syncs: 0
✅ Health: EXCELLENT
```

---

## 🚀 COMMON TASKS

### **Check if Integration is Working**
```sql
-- Quick health check (30 seconds)
SELECT * FROM get_ecomail_queue_status();
```

### **Re-sync Single User**
```sql
-- See: 03_TROUBLESHOOTING.md → Manual Operations
```

### **Add New Tag**
```
1. Read: 02_TAXONOMY.md → Critical Rules
2. Add to taxonomy first
3. Test in DEV
4. Deploy to PROD
```

### **Debug Sync Issue**
```
1. Read: 03_TROUBLESHOOTING.md → Quick Diagnostics
2. Run health queries
3. Check Edge Function logs
4. Follow specific issue guide
```

---

## 📦 ARCHIVED DOCUMENTATION

**Old documents (13) moved to:** `archive/`

**Why archived?**
- ❌ Outdated numbers (estimated vs real)
- ❌ Too detailed (742 lines API spec)
- ❌ Duplicate info across multiple files
- ❌ One-time tasks already completed

**When to use archive:**
- ✅ Historical reference
- ✅ Detailed SQL code
- ✅ Marketing campaign templates

**See:** [archive/README.md](./archive/README.md)

---

## 🔗 RELATED DOCUMENTATION

### **DechBar App**
- [Database Schema](../../architecture/03_DATABASE.md)
- [Database Migrations Log](../../architecture/04_DATABASE_MIGRATIONS_LOG.md)
- [Project Guide](../../../PROJECT_GUIDE.md)

### **External**
- [Ecomail API v2](https://ecomailczv2.docs.apiary.io/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PostgreSQL CRON](https://github.com/citusdata/pg_cron)

---

## ✅ INTEGRATION STATUS

### **What's Working**
- ✅ Registration → Ecomail sync (100% success rate)
- ✅ Magic link tracking (UNREG → REG movement)
- ✅ Real-time sync (triggers active)
- ✅ CRON jobs (every 3 min)
- ✅ Error handling (retry logic + DLQ)

### **What's Pending**
- ⏳ Engagement metrics sync (CRON 6h - deployed but not yet populated)
- ⏳ ENGAGED list movement (waiting for users to reach 5+ hours)
- ⏳ PREMIUM list (waiting for first paid user)
- ⏳ Tag automation (behavioral, challenge progress)

### **What's Not Used Yet**
- 💡 ecomail-webhook-handler (deployed but webhooks not configured)
- 💡 CHURNED list (no inactive users yet)
- 💡 Advanced segmentation (waiting for more data)

---

## 🎓 FOR NEW AI AGENTS

**Your onboarding:**

```
Step 1: Read 00_MASTER.md
  → Understand credentials, current state, quick start

Step 2: Read 01_ARCHITECTURE.md
  → Understand how data flows, what triggers when

Step 3: Read 02_TAXONOMY.md
  → Understand lists, tags, fields (never add tag without checking!)

Step 4: Read 03_TROUBLESHOOTING.md
  → Understand common issues and how to fix

✅ You're now ready to work on Ecomail integration!
```

**Estimated time:** 40 minutes (vs 3 hours with old docs)

---

## 📞 SUPPORT

**Technical Issues:**
1. Check: [03_TROUBLESHOOTING.md](./03_TROUBLESHOOTING.md)
2. Run: Health queries from [00_MASTER.md](./00_MASTER.md)
3. Review: Edge Function logs in Supabase Dashboard
4. Contact: Tech lead (jakub.pelik@gmail.com)

**Ecomail Platform Issues:**
- Email: podpora@ecomailapp.cz
- Phone: +420 222 747 552

---

## 📝 MAINTENANCE

**This documentation should be updated:**

- ✅ **Weekly:** If contact counts change significantly
- ✅ **Monthly:** After deploying new features
- ✅ **Always:** After changing tags/fields/lists
- ✅ **Before deployment:** Verify all info is current

**Who maintains:**
- Primary: DechBar Tech Team
- Backup: AI Agents (with human review)

---

**Status:** ✅ Clean, minimal, accurate documentation

**Philosophy:** Less is more. Quality > Quantity.

---

*Created: 4. února 2026*  
*Version: 2.0 (Minimalist Edition)*  
*Maintained by: DechBar Team*
