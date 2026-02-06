# ⚡ Ecomail Quick Reference

**For:** Quick lookups, copy-paste commands  
**Last Updated:** 4. února 2026

---

## 🔐 CREDENTIALS (Copy-Paste Ready)

### **API Key**
```
f21989cee8af4357bf3859e17a7bbb46b7eca7272050d7711a7afc9a09068c59
```

### **List IDs**
```
UNREG: 5
REG: 6
ENGAGED: 7
PREMIUM: 8
CHURNED: 9
```

### **Supabase Secrets**
```bash
supabase secrets set ECOMAIL_API_KEY="f21989cee8af4357bf3859e17a7bbb46b7eca7272050d7711a7afc9a09068c59"
supabase secrets set ECOMAIL_LIST_UNREG="5"
supabase secrets set ECOMAIL_LIST_REG="6"
supabase secrets set ECOMAIL_LIST_ENGAGED="7"
supabase secrets set ECOMAIL_LIST_PREMIUM="8"
supabase secrets set ECOMAIL_LIST_CHURNED="9"
```

---

## 📊 ESSENTIAL QUERIES

### **Health Check**
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'completed') as completed
FROM ecomail_sync_queue;
```

### **Recent Activity**
```sql
SELECT event_type, status, COUNT(*) 
FROM ecomail_sync_queue 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type, status;
```

### **Missing Users**
```sql
SELECT au.email FROM auth.users au
LEFT JOIN ecomail_sync_queue esq ON au.id = esq.user_id
WHERE esq.id IS NULL;
```

---

## 🚀 COMMON COMMANDS

### **Manual Trigger Sync**
```bash
curl -X POST https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/sync-to-ecomail \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHF6aWdod2FldXhjaWN1aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4Njk3OTgsImV4cCI6MjA1MjQ0NTc5OH0.aMqEJlh6Yg8TrUJLEVH7EgqO5gLN8TRgmJzEHbNZcl8"
```

### **Deploy Edge Function**
```bash
cd /Users/DechBar/dechbar-app
supabase functions deploy sync-to-ecomail
```

### **View Logs**
```bash
supabase functions logs sync-to-ecomail --tail
```

---

## 🔗 QUICK LINKS

- **Ecomail Dashboard:** https://app.ecomailapp.cz/
- **Supabase Dashboard:** https://supabase.com/dashboard/project/nrlqzighwaeuxcicuhse
- **Edge Functions:** https://supabase.com/dashboard/project/nrlqzighwaeuxcicuhse/functions
- **SQL Editor:** https://supabase.com/dashboard/project/nrlqzighwaeuxcicuhse/sql

---

## 📈 CURRENT STATS (4.2.2026)

```
Users: 231
Contacts in Ecomail: 231 (100%)
REG: 161 | UNREG: 70
Events processed: 311 (all completed)
Failed syncs: 0
```

---

For detailed docs, see: [README.md](./README.md)
