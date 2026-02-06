# 🚀 PROD Supabase Setup - Ecomail Integration

**PROD Project ID:** `iqyahebbteiwzwyrtmns`  
**PROD URL:** `https://iqyahebbteiwzwyrtmns.supabase.co`

**DEV Project ID:** `nrlqzighwaeuxcicuhse` (reference)

---

## 📋 Checklist:

- [ ] **Step 1:** Database Migration
- [ ] **Step 2:** Edge Functions Deployment
- [ ] **Step 3:** Secrets Configuration
- [ ] **Step 4:** CRON Jobs Setup
- [ ] **Step 5:** Vercel Environment Variables
- [ ] **Step 6:** End-to-End Test

---

## 🔧 Step 1: Database Migration

### 1.1 Jdi do PROD Supabase SQL Editor:

**URL:** https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns/sql

### 1.2 Spusť tento SQL script:

```sql
-- ============================================================================
-- ECOMAIL SYNC QUEUE SYSTEM FOR PROD
-- ============================================================================
-- Created: 2026-01-29
-- Purpose: Queue-based async synchronization to Ecomail
-- Project: iqyahebbteiwzwyrtmns (PROD)
-- ============================================================================

-- Step 1: Create ecomail_sync_queue table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ecomail_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'contact_add', 
    'contact_update', 
    'list_move', 
    'tag_add', 
    'tag_remove', 
    'tariff_changed'
  )),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0 AND retry_count <= 5)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ecomail_sync_queue_status ON public.ecomail_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_ecomail_sync_queue_created_at ON public.ecomail_sync_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_ecomail_sync_queue_user_id ON public.ecomail_sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_ecomail_sync_queue_email ON public.ecomail_sync_queue(email);

-- Step 2: Create ecomail_failed_syncs (Dead Letter Queue)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ecomail_failed_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_queue_item_id UUID,
  user_id UUID,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  error_message TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  original_created_at TIMESTAMPTZ
);

-- Index for monitoring
CREATE INDEX IF NOT EXISTS idx_ecomail_failed_syncs_failed_at ON public.ecomail_failed_syncs(failed_at);
CREATE INDEX IF NOT EXISTS idx_ecomail_failed_syncs_email ON public.ecomail_failed_syncs(email);

-- Step 3: Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.ecomail_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecomail_failed_syncs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can do anything
CREATE POLICY "Service role full access to ecomail_sync_queue"
  ON public.ecomail_sync_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to ecomail_failed_syncs"
  ON public.ecomail_failed_syncs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Admins can view all (read-only for monitoring)
CREATE POLICY "Admins can view ecomail_sync_queue"
  ON public.ecomail_sync_queue
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id = 'admin'
    )
  );

CREATE POLICY "Admins can view ecomail_failed_syncs"
  ON public.ecomail_failed_syncs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id = 'admin'
    )
  );

-- Step 4: Trigger Functions
-- ============================================================================

-- 4.1: Challenge Registration Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.queue_ecomail_on_challenge_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.ecomail_sync_queue (user_id, email, event_type, payload)
  VALUES (
    NEW.user_id,
    NEW.email,
    'contact_add',
    jsonb_build_object(
      'list_name', 'UNREG',
      'contact', jsonb_build_object(
        'email', NEW.email,
        'custom_fields', jsonb_build_object(
          'KP_VALUE', NEW.kp_value,
          'KP_FIRST', NEW.kp_value,
          'REGISTRATION_DATE', TO_CHAR(NEW.created_at, 'YYYY-MM-DD'),
          'CONVERSION_SOURCE', NEW.conversion_source
        )
      ),
      'tags', jsonb_build_array(
        'MAGIC_LINK_SENT', 'CHALLENGE_REGISTERED',
        CASE
          WHEN NEW.kp_value IS NULL THEN 'KP_NOT_MEASURED'
          WHEN NEW.kp_value <= 10 THEN 'KP_CRITICAL'
          WHEN NEW.kp_value <= 20 THEN 'KP_POOR'
          WHEN NEW.kp_value <= 30 THEN 'KP_AVERAGE'
          WHEN NEW.kp_value <= 40 THEN 'KP_GOOD'
          ELSE 'KP_EXCELLENT'
        END,
        'SOURCE_' || UPPER(NEW.conversion_source)
      )
    )
  );
  RETURN NEW;
END;
$$;

-- 4.2: Auth Confirmed (Magic Link Clicked) Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.queue_ecomail_on_auth_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  existing_tags JSONB;
  all_tags JSONB;
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Get existing tags from latest contact_add event
    SELECT payload->'tags' INTO existing_tags
    FROM public.ecomail_sync_queue
    WHERE email = NEW.email
      AND event_type = 'contact_add'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Merge existing tags with new tag
    IF existing_tags IS NULL OR jsonb_array_length(existing_tags) = 0 THEN
      all_tags := jsonb_build_array('MAGIC_LINK_CLICKED');
    ELSE
      all_tags := (
        SELECT jsonb_agg(DISTINCT value)
        FROM (
          SELECT jsonb_array_elements_text(existing_tags) AS value
          UNION
          SELECT 'MAGIC_LINK_CLICKED'
        ) t
      );
    END IF;
    
    INSERT INTO public.ecomail_sync_queue (user_id, email, event_type, payload)
    VALUES (
      NEW.id, NEW.email, 'list_move',
      jsonb_build_object(
        'from_list_name', 'UNREG',
        'to_list_name', 'REG',
        'tags', all_tags
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 4.3: Onboarding Complete Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.queue_ecomail_on_onboarding_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (NEW.metadata->>'onboarding_completed')::boolean = true 
     AND (OLD.metadata IS NULL OR (OLD.metadata->>'onboarding_completed')::boolean = false) THEN
    
    INSERT INTO public.ecomail_sync_queue (user_id, email, event_type, payload)
    VALUES (
      NEW.user_id, NEW.email, 'tag_add',
      jsonb_build_object(
        'tags', jsonb_build_array('ONBOARDING_COMPLETE')
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 4.4: Membership Change (Tariff) Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.queue_ecomail_on_membership_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  
  IF user_email IS NOT NULL THEN
    INSERT INTO public.ecomail_sync_queue (user_id, email, event_type, payload)
    VALUES (
      NEW.user_id, user_email, 'tariff_changed',
      jsonb_build_object(
        'add_tags', jsonb_build_array('TARIF_' || UPPER(NEW.plan::text)),
        'remove_tags', jsonb_build_array('TARIF_' || UPPER(OLD.plan::text)),
        'move_to_list', 'PREMIUM',
        'custom_fields', jsonb_build_object(
          'TARIFF', UPPER(NEW.plan::text),
          'TARIFF_START_DATE', TO_CHAR(NEW.purchased_at, 'YYYY-MM-DD'),
          'LIFETIME_VALUE_CZK', COALESCE(NEW.amount_czk, 0)
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Step 5: Attach Triggers to Tables
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_queue_ecomail_on_challenge_registration ON public.challenge_registrations;
CREATE TRIGGER trigger_queue_ecomail_on_challenge_registration
  AFTER INSERT ON public.challenge_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_ecomail_on_challenge_registration();

DROP TRIGGER IF EXISTS trigger_queue_ecomail_on_auth_confirmed ON auth.users;
CREATE TRIGGER trigger_queue_ecomail_on_auth_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_ecomail_on_auth_confirmed();

DROP TRIGGER IF EXISTS trigger_queue_ecomail_on_onboarding_complete ON public.profiles;
CREATE TRIGGER trigger_queue_ecomail_on_onboarding_complete
  AFTER UPDATE OF metadata ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_ecomail_on_onboarding_complete();

DROP TRIGGER IF EXISTS trigger_queue_ecomail_on_membership_change ON public.memberships;
CREATE TRIGGER trigger_queue_ecomail_on_membership_change
  AFTER INSERT OR UPDATE OF plan ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_ecomail_on_membership_change();

-- Step 6: Utility Functions for Monitoring
-- ============================================================================

-- Get queue status
CREATE OR REPLACE FUNCTION public.get_ecomail_queue_status()
RETURNS TABLE (
  pending_count BIGINT,
  processing_count BIGINT,
  failed_count BIGINT,
  oldest_pending TIMESTAMPTZ,
  avg_processing_time_seconds NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    MIN(created_at) FILTER (WHERE status = 'pending') as oldest_pending,
    AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) FILTER (WHERE status = 'completed') as avg_processing_time_seconds
  FROM public.ecomail_sync_queue
  WHERE created_at > NOW() - INTERVAL '24 hours';
$$;

-- ============================================================================
-- DONE! Database setup complete
-- ============================================================================
```

### 1.3 Ověř, že vše proběhlo:

```sql
-- Test query
SELECT * FROM public.get_ecomail_queue_status();
```

✅ Měl bys vidět:
```
pending_count: 0
processing_count: 0
failed_count: 0
...
```

---

## 🚀 Step 2: Edge Functions Deployment

### 2.1 Deploy sync-to-ecomail na PROD:

```bash
cd /Users/DechBar/dechbar-app
supabase functions deploy sync-to-ecomail --project-ref iqyahebbteiwzwyrtmns --no-verify-jwt
```

---

## 🔐 Step 3: Secrets Configuration

### 3.1 Nastav Ecomail API key:

```bash
supabase secrets set ECOMAIL_API_KEY="tvůj-ecomail-api-key" --project-ref iqyahebbteiwzwyrtmns
```

---

## ⏰ Step 4: CRON Jobs Setup

### 4.1 Enable pg_cron extension:

V Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
```

### 4.2 Create CRON job:

```sql
SELECT cron.schedule(
  'ecomail-sync-every-3-minutes',
  '*/3 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://iqyahebbteiwzwyrtmns.supabase.co/functions/v1/sync-to-ecomail',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### 4.3 Verify CRON job:

```sql
SELECT * FROM cron.job;
```

---

## 🌐 Step 5: Vercel Environment Variables

### 5.1 Jdi do Vercel Dashboard:

**URL:** https://vercel.com/dechbars-projects/dechbar-app-tleh/settings/environment-variables

### 5.2 Přidej/aktualizuj tyto proměnné pro PRODUCTION:

```
VITE_SUPABASE_URL=https://iqyahebbteiwzwyrtmns.supabase.co
VITE_SUPABASE_ANON_KEY=<tvůj-prod-anon-key>
```

**Kde najdeš PROD keys:**
https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns/settings/api

### 5.3 Redeploy Vercel:

Po změně ENV vars musíš redeploy:
- Jdi do Deployments
- Klikni "..." na posledním deployu
- "Redeploy"

---

## ✅ Step 6: End-to-End Test

### 6.1 Test registration flow:

1. Jdi na `https://dechbar.cz/vyzva`
2. Zadej test email: `prod-test@dechbar.cz`
3. Zkontroluj Supabase queue:

```sql
SELECT * FROM public.ecomail_sync_queue 
WHERE email = 'prod-test@dechbar.cz'
ORDER BY created_at DESC;
```

4. Počkej 3 minuty (CRON job)
5. Zkontroluj Ecomail - kontakt by měl být v "UNREG" listu s tagy

---

## 📊 Monitoring Queries (PROD):

```sql
-- Queue status
SELECT * FROM public.get_ecomail_queue_status();

-- Recent events
SELECT 
  event_type,
  status,
  email,
  created_at,
  processed_at,
  last_error
FROM public.ecomail_sync_queue
ORDER BY created_at DESC
LIMIT 20;

-- Failed syncs
SELECT * FROM public.ecomail_failed_syncs
ORDER BY failed_at DESC
LIMIT 10;

-- CRON job history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🎯 Ready to go live!

Po dokončení všech kroků máš:
- ✅ PROD database s Ecomail queue
- ✅ Edge Functions běží
- ✅ CRON automatizace
- ✅ Vercel připojený na PROD Supabase

**Soft launch je LIVE!** 🚀
