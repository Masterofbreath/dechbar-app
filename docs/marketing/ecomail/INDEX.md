# 📚 Ecomail Documentation Index

**Version:** 2.0 (Minimalist Edition)  
**Last Updated:** 4. února 2026  
**Total Documents:** 8 active, 18 archived

---

## 🎯 START HERE (New Agent Onboarding)

```
┌─────────────────────────────────────────────────┐
│  READ IN THIS ORDER (40 minutes total):        │
├─────────────────────────────────────────────────┤
│  1. README.md          (5 min)  - Overview      │
│  2. 00_MASTER.md       (15 min) - Current state │
│  3. 01_ARCHITECTURE.md (10 min) - How it works  │
│  4. 02_TAXONOMY.md     (8 min)  - What exists   │
│  5. 03_TROUBLESHOOTING (7 min)  - Debug guide   │
└─────────────────────────────────────────────────┘
          ✅ You're ready to contribute!
```

---

## 📁 DOCUMENT HIERARCHY

```
ecomail/
│
├─── 📖 README.md (START HERE)
│     └─ Navigation guide + quick overview
│
├─── 🔐 00_MASTER.md ⭐ MOST IMPORTANT
│     ├─ Credentials (API key, list IDs, secrets)
│     ├─ Current state (verified 4.2.2026)
│     ├─ Real numbers (231 users, 161 REG, 70 UNREG)
│     ├─ Edge Functions status
│     ├─ CRON jobs
│     ├─ Known issues
│     └─ Verification queries
│
├─── 🏗️ 01_ARCHITECTURE.md
│     ├─ System overview diagram
│     ├─ Database schema (3 tables)
│     ├─ Triggers (4 active)
│     ├─ Functions (5 database functions)
│     ├─ Edge Functions (3 deployed)
│     ├─ CRON jobs (3 active)
│     ├─ Data flow (registration → ecomail)
│     └─ Error handling
│
├─── 🏷️ 02_TAXONOMY.md
│     ├─ Lists (5) with REAL counts
│     ├─ Tags (100+) organized by category
│     ├─ Custom Fields (25)
│     ├─ Naming conventions
│     └─ Auto-update logic
│
├─── 🔧 03_TROUBLESHOOTING.md
│     ├─ Quick diagnostics (30s health check)
│     ├─ Common issues + solutions
│     ├─ Debug queries
│     ├─ Manual operations
│     └─ Emergency procedures
│
├─── ⚡ QUICK_REFERENCE.md
│     ├─ Credentials (copy-paste)
│     ├─ Essential queries
│     └─ Common commands
│
├─── 📝 REORGANIZATION_LOG.md
│     └─ Audit trail of this migration
│
├─── 📊 MIGRATION_SUMMARY.md
│     └─ Before/after comparison
│
├─── 📋 INDEX.md (this file)
│     └─ Complete navigation map
│
└─── 📦 archive/
      ├─ README.md (why archived)
      └─ [18 old documents]
```

---

## 🎯 QUICK NAVIGATION

### **I need to...**

| Task | Go to |
|------|-------|
| **Find API key** | 00_MASTER.md → Credentials |
| **Check current status** | 00_MASTER.md → Current State |
| **Understand how it works** | 01_ARCHITECTURE.md |
| **Add new tag** | 02_TAXONOMY.md → Critical Rules |
| **Debug sync issue** | 03_TROUBLESHOOTING.md |
| **Quick lookup** | QUICK_REFERENCE.md |
| **Understand this reorganization** | MIGRATION_SUMMARY.md |

---

## 📊 STATISTICS

### **Documentation Metrics**

```
Core Documents:     8 files
Archive:           18 files
Total Lines:     3384 lines (core only)
Avg Doc Length:   423 lines

Before Migration:
Documents:        18 files (scattered)
Total Lines:    5050+ lines
Avg Doc Length:   280 lines (but spread across many files)
```

### **Quality Improvements**

```
Data Accuracy:   Estimates → Verified ✅
Maintenance:     14 docs → 4 docs (71% less) ✅
Onboarding:      3 hours → 40 min (78% faster) ✅
API Key Spread:  3 locations → 1 location ✅
```

---

## 🔄 UPDATE PROTOCOL

### **When to Update Docs**

**00_MASTER.md:**
- ✅ When contact counts change significantly (>10%)
- ✅ When API keys rotate
- ✅ When CRON schedules change
- ✅ When Edge Functions updated
- ✅ Monthly verification (run queries, update numbers)

**01_ARCHITECTURE.md:**
- ✅ When database schema changes
- ✅ When new triggers added
- ✅ When Edge Functions logic changes

**02_TAXONOMY.md:**
- ✅ ALWAYS before adding new tag/field
- ✅ When lists created/deleted
- ✅ When automation logic changes

**03_TROUBLESHOOTING.md:**
- ✅ When new issues discovered
- ✅ When solutions verified
- ✅ After debugging sessions

---

## ✅ VERIFICATION CHECKLIST

**Run before trusting docs:**

```sql
-- 1. Verify user count
SELECT COUNT(*) FROM auth.users;
-- Should match 00_MASTER.md

-- 2. Verify contact counts
SELECT 
  payload->>'list_name',
  COUNT(DISTINCT email)
FROM ecomail_sync_queue
WHERE event_type = 'contact_add'
GROUP BY payload->>'list_name';
-- Should match 02_TAXONOMY.md

-- 3. Verify triggers exist
SELECT COUNT(*) FROM information_schema.triggers
WHERE trigger_name LIKE '%ecomail%';
-- Should return: 4 (or 5 if duplicate)

-- 4. Verify CRON jobs
SELECT COUNT(*) FROM cron.job WHERE active = true;
-- Should include 3 ecomail jobs
```

**All match?** ✅ Docs are accurate!  
**Mismatch?** ⚠️ Update 00_MASTER.md with current values

---

## 🎓 BEST PRACTICES

### **For Maintaining These Docs**

1. ✅ **Update 00_MASTER.md monthly** with fresh queries
2. ✅ **Add "Last Updated" date** when you edit
3. ✅ **Keep it minimal** - resist urge to add more docs
4. ✅ **Verify before documenting** - query real data
5. ✅ **Cross-reference** - link related sections

### **For Using These Docs**

1. ✅ **Always start with 00_MASTER.md** (current state)
2. ✅ **Use QUICK_REFERENCE.md** for fast lookups
3. ✅ **Trust the data** (it's verified from production)
4. ✅ **Update if you find errors** (maintain quality)
5. ✅ **Don't re-invent** - if it's documented, use it

---

## 📞 FEEDBACK

**Docs unclear?** Update them!  
**Found outdated info?** Fix it!  
**Missing something?** Add it (to appropriate doc)!

**These docs are living - improve them as you use them.**

---

**Created:** 4. února 2026  
**Status:** ✅ Active Index  
**Maintained by:** DechBar Team

*Last verified: 4. února 2026, 18:24 CET*
