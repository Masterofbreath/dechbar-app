# 📚 Database Quick Reference

**Purpose:** Rychlá referenční příručka pro všechny tabulky a jejich vztahy  
**Audience:** AI Agents, Developers  
**Last Updated:** 2026-01-28

---

## 🗂️ TABLE OVERVIEW (12 Tables)

| # | Table | Purpose | Records (estimate) |
|---|-------|---------|-------------------|
| 1 | `profiles` | User profiles | 5,000+ |
| 2 | `modules` | Product definitions | 10-20 |
| 3 | `user_modules` | Purchased modules | 1,000+ |
| 4 | `memberships` | Membership tiers | 5,000+ |
| 5 | `roles` | Role definitions | 6 |
| 6 | `user_roles` | User role assignments | 5,000+ |
| 7 | `challenge_registrations` | Challenge sign-ups | 10,000+ |
| 8 | `kp_measurements` | KP tracking | 50,000+ |
| 9 | `ecomail_sync_queue` | Ecomail sync queue | 1,000-10,000 |
| 10 | `ecomail_failed_syncs` | Failed syncs | 0-100 |

---

## 🔗 RELATIONSHIP MAP

```
auth.users (Supabase Auth)
    ↓
    ├─→ profiles (1:1)
    │       ↓
    │       ├─→ memberships (1:1) - SMART/AI_COACH subscription
    │       ├─→ user_modules (1:N) - Purchased lifetime modules
    │       ├─→ user_roles (N:M via junction) - Roles (member, admin, etc.)
    │       ├─→ challenge_registrations (1:N) - Challenge sign-ups
    │       ├─→ kp_measurements (1:N) - KP history
    │       └─→ ecomail_sync_queue (1:N) - Ecomail events
    │
    └─→ modules (N) - Product catalog

ecomail_sync_queue → ecomail_failed_syncs (on max retries)
```

---

## 🎯 COMMON QUERIES

### Get User's Complete Profile

```sql
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.metadata->>'onboarding_completed' as onboarded,
  m.plan as membership_plan,
  m.status as membership_status,
  m.metadata->>'is_trial' as is_on_trial,
  array_agg(DISTINCT um.module_id) as owned_modules,
  array_agg(DISTINCT ur.role_id) as roles,
  cr.kp_value as challenge_kp,
  cr.smart_trial_eligible,
  (SELECT COUNT(*) FROM kp_measurements WHERE user_id = p.id) as kp_count
FROM profiles p
LEFT JOIN memberships m ON p.id = m.user_id
LEFT JOIN user_modules um ON p.id = um.user_id AND um.subscription_status = 'active'
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN challenge_registrations cr ON p.id = cr.user_id
WHERE p.id = '[USER_ID]'
GROUP BY p.id, p.email, p.full_name, p.metadata, m.plan, m.status, m.metadata, cr.kp_value, cr.smart_trial_eligible;
```

### Check Module Access

```sql
-- Check if user owns specific module
SELECT EXISTS (
  SELECT 1 FROM user_modules
  WHERE user_id = '[USER_ID]'
  AND module_id = 'studio'
  AND subscription_status = 'active'
) as has_access;
```

### Get Challenge Stats

```sql
-- Registration stats by conversion source
SELECT 
  conversion_source,
  COUNT(*) as total_registrations,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(kp_value) FILTER (WHERE kp_value IS NOT NULL) as avg_kp,
  COUNT(*) FILTER (WHERE onboarding_completed = true) as onboarded,
  COUNT(*) FILTER (WHERE smart_trial_activated_at IS NOT NULL) as trials_activated
FROM challenge_registrations
WHERE created_at >= '2026-01-26'
GROUP BY conversion_source
ORDER BY total_registrations DESC;
```

### Ecomail Sync Health

```sql
-- Quick health check
SELECT * FROM get_ecomail_sync_health();

-- Detailed queue status
SELECT 
  status,
  event_type,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(retry_count) as max_retries,
  COUNT(*) FILTER (WHERE retry_count >= max_retries) as exceeded_retries
FROM ecomail_sync_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status, event_type
ORDER BY status, count DESC;
```

---

## 🔑 KEY CONCEPTS

### Membership vs Modules

**Membership (1 per user):**
- `ZDARMA` (default) → Basic access
- `SMART` (249 Kč/měsíc) → Smart tracking + recommendations
- `AI_COACH` (490 Kč/měsíc) → AI personalization + advanced analytics

**Modules (0-N per user):**
- `studio` (990 Kč lifetime) → Exercise builder
- `challenges` (490 Kč lifetime) → 21-day challenges
- `akademie` (1490 Kč lifetime) → Educational courses

**Example:**
```
User has SMART membership + studio module
→ Access to: SMART features + exercise builder
→ But NOT: challenges or akademie
```

### Challenge Flow

```
1. User → /vyzva → Fill email
2. Magic link sent → INSERT challenge_registrations
3. Trigger → Queue Ecomail sync (List UNREG)
4. User clicks link → Email confirmed
5. Trigger → Queue list move (UNREG → REG)
6. User completes onboarding → UPDATE profiles.metadata
7. Trigger → Queue tags (ONBOARDING_COMPLETE)
8. CRON activates SMART trial (2026-02-26)
9. Trigger → Queue tags (TRIAL_ACTIVE)
```

### KP Categories

```typescript
// Auto-categorization for Ecomail tags
if (kp <= 10) return 'KP_CRITICAL';   // 🔴 Red
if (kp <= 20) return 'KP_POOR';       // 🟠 Orange
if (kp <= 30) return 'KP_AVERAGE';    // 🟡 Yellow
if (kp <= 40) return 'KP_GOOD';       // 🟢 Green
return 'KP_EXCELLENT';                // 🔵 Blue
```

---

## 🚨 EMERGENCY QUERIES

### Find User by Email

```sql
SELECT p.id, p.email, p.full_name, p.created_at
FROM profiles p
WHERE p.email ILIKE '%jakub%'
ORDER BY p.created_at DESC;
```

### Check Why User Can't Access Module

```sql
-- Debug access issue
SELECT 
  p.email,
  m.plan as membership,
  array_agg(um.module_id) as modules,
  m.status as membership_status,
  m.expires_at
FROM profiles p
LEFT JOIN memberships m ON p.id = m.user_id
LEFT JOIN user_modules um ON p.id = um.user_id
WHERE p.email = 'user@example.com'
GROUP BY p.email, m.plan, m.status, m.expires_at;
```

### Find Stuck Sync Events

```sql
-- Events stuck in queue > 1 hour
SELECT 
  id,
  email,
  event_type,
  status,
  retry_count,
  last_error,
  created_at,
  NOW() - created_at as age
FROM ecomail_sync_queue
WHERE status IN ('pending', 'processing')
AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at ASC;
```

### Manually Retry Failed Sync

```sql
-- Move from failed_syncs back to queue
INSERT INTO ecomail_sync_queue (user_id, email, event_type, payload)
SELECT user_id, email, event_type, payload
FROM ecomail_failed_syncs
WHERE id = '[FAILED_SYNC_ID]';

-- Mark as resolved
UPDATE ecomail_failed_syncs
SET resolved_at = NOW(), resolved_by = auth.uid()
WHERE id = '[FAILED_SYNC_ID]';
```

---

## 📖 RELATED DOCS

- [03_DATABASE.md](./03_DATABASE.md) - Complete schema documentation
- [04_DATABASE_MIGRATIONS_LOG.md](./04_DATABASE_MIGRATIONS_LOG.md) - Migration history
- [ECOMAIL_DB_SETUP.md](../marketing/ECOMAIL_DB_SETUP.md) - Ecomail SQL

---

*Last updated: 2026-01-28*
