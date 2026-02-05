                                  pg_get_functiondef                                   
---------------------------------------------------------------------------------------
 CREATE OR REPLACE FUNCTION public.handle_new_user()                                  +
  RETURNS trigger                                                                     +
  LANGUAGE plpgsql                                                                    +
  SECURITY DEFINER                                                                    +
 AS $function$                                                                        +
 BEGIN                                                                                +
   INSERT INTO public.profiles (user_id, email, created_at, updated_at)               +
   VALUES (NEW.id, NEW.email, NOW(), NOW())                                           +
   ON CONFLICT (user_id) DO NOTHING;                                                  +
   RETURN NEW;                                                                        +
 EXCEPTION                                                                            +
   WHEN OTHERS THEN                                                                   +
     RAISE WARNING 'Failed to create profile: %', SQLERRM;                            +
     RETURN NEW;                                                                      +
 END;                                                                                 +
 $function$                                                                           +
 
 CREATE OR REPLACE FUNCTION public.queue_ecomail_on_challenge_registration()          +
  RETURNS trigger                                                                     +
  LANGUAGE plpgsql                                                                    +
  SECURITY DEFINER                                                                    +
 AS $function$                                                                        +
 DECLARE                                                                              +
   user_email TEXT;                                                                   +
 BEGIN                                                                                +
   -- Použít email PŘÍMO z NEW (challenge_registrations.email)                        +
   user_email := NEW.email;                                                           +
                                                                                      +
   -- Skip pokud email chybí                                                          +
   IF user_email IS NULL THEN                                                         +
     RETURN NEW;                                                                      +
   END IF;                                                                            +
                                                                                      +
   -- Přidat do sync queue - VŽDY do UNREG                                            +
   INSERT INTO ecomail_sync_queue (                                                   +
     user_id,                                                                         +
     email,                                                                           +
     event_type,                                                                      +
     payload                                                                          +
   ) VALUES (                                                                         +
     NEW.user_id,  -- Může být NULL, to je OK                                         +
     user_email,                                                                      +
     'contact_add',                                                                   +
     jsonb_build_object(                                                              +
       'list_name', 'UNREG',  -- VŽDY UNREG při registraci!                           +
       'contact', jsonb_build_object(                                                 +
         'email', user_email,                                                         +
         'custom_fields', jsonb_build_object(                                         +
           'KP_VALUE', COALESCE(NEW.kp_value, 0),                                     +
           'KP_FIRST', COALESCE(NEW.kp_value, 0),                                     +
           'REGISTRATION_DATE', TO_CHAR(NEW.created_at, 'YYYY-MM-DD'),                +
           'CONVERSION_SOURCE', COALESCE(NEW.conversion_source, 'unknown')            +
         )                                                                            +
       ),                                                                             +
       'tags', jsonb_build_array(                                                     +
         'MAGIC_LINK_SENT',                                                           +
         'CHALLENGE_REGISTERED',                                                      +
         'TARIF_ZDARMA',                                                              +
         CASE                                                                         +
           WHEN NEW.kp_value IS NULL OR NEW.kp_value = 0 THEN 'KP_NOT_MEASURED'       +
           WHEN NEW.kp_value <= 10 THEN 'KP_CRITICAL'                                 +
           WHEN NEW.kp_value <= 20 THEN 'KP_POOR'                                     +
           WHEN NEW.kp_value <= 30 THEN 'KP_AVERAGE'                                  +
           WHEN NEW.kp_value <= 40 THEN 'KP_GOOD'                                     +
           ELSE 'KP_EXCELLENT'                                                        +
         END,                                                                         +
         'SOURCE_' || UPPER(COALESCE(NEW.conversion_source, 'UNKNOWN'))               +
       )                                                                              +
     )                                                                                +
   );                                                                                 +
                                                                                      +
   RETURN NEW;                                                                        +
 END;                                                                                 +
 $function$                                                                           +
 
 CREATE OR REPLACE FUNCTION public.queue_ecomail_on_membership_change()               +
  RETURNS trigger                                                                     +
  LANGUAGE plpgsql                                                                    +
  SECURITY DEFINER                                                                    +
 AS $function$                                                                        +
 DECLARE                                                                              +
   user_email TEXT;                                                                   +
   is_trial BOOLEAN;                                                                  +
 BEGIN                                                                                +
   -- Get user email                                                                  +
   SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;               +
                                                                                      +
   -- Skip if no email                                                                +
   IF user_email IS NULL THEN                                                         +
     RETURN NEW;                                                                      +
   END IF;                                                                            +
                                                                                      +
   -- Determine if trial                                                              +
   IF NEW.metadata IS NOT NULL AND NEW.metadata->>'is_trial' IS NOT NULL THEN         +
     is_trial := (NEW.metadata->>'is_trial')::boolean;                                +
   ELSE                                                                               +
     is_trial := (NEW.type = 'trial');                                                +
   END IF;                                                                            +
                                                                                      +
   -- INSERT (new membership)                                                         +
   IF TG_OP = 'INSERT' THEN                                                           +
     -- ❌ SKIP pokud je ZDARMA (zůstane v REG listu)                                 +
     IF NEW.plan = 'ZDARMA' THEN                                                      +
       -- Jen update tagu, NEpřesouvej                                                +
       INSERT INTO ecomail_sync_queue (                                               +
         user_id,                                                                     +
         email,                                                                       +
         event_type,                                                                  +
         payload                                                                      +
       ) VALUES (                                                                     +
         NEW.user_id,                                                                 +
         user_email,                                                                  +
         'tag_add',                                                                   +
         jsonb_build_object(                                                          +
           'tag', 'TARIF_ZDARMA',                                                     +
           'list_id', '6'  -- REG list                                                +
         )                                                                            +
       );                                                                             +
       RETURN NEW;                                                                    +
     END IF;                                                                          +
                                                                                      +
     -- ✅ POUZE pro SMART/AI_COACH → PREMIUM                                         +
     IF is_trial THEN                                                                 +
       -- Trial activated                                                             +
       INSERT INTO ecomail_sync_queue (                                               +
         user_id,                                                                     +
         email,                                                                       +
         event_type,                                                                  +
         payload                                                                      +
       ) VALUES (                                                                     +
         NEW.user_id,                                                                 +
         user_email,                                                                  +
         'trial_activated',                                                           +
         jsonb_build_object(                                                          +
           'add_tags', jsonb_build_array('TRIAL_ACTIVE', 'TARIF_' || UPPER(NEW.plan)),+
           'remove_tags', jsonb_build_array('TRIAL_ELIGIBLE', 'TARIF_ZDARMA'),        +
           'custom_fields', jsonb_build_object(                                       +
             'TARIFF', NEW.plan,                                                      +
             'TARIFF_START_DATE', TO_CHAR(NEW.purchased_at, 'YYYY-MM-DD'),            +
             'TRIAL_END_DATE', TO_CHAR(NEW.expires_at, 'YYYY-MM-DD')                  +
           ),                                                                         +
           'move_to_list', 'PREMIUM'                                                  +
         )                                                                            +
       );                                                                             +
     ELSE                                                                             +
       -- Regular purchase (SMART/AI_COACH)                                           +
       INSERT INTO ecomail_sync_queue (                                               +
         user_id,                                                                     +
         email,                                                                       +
         event_type,                                                                  +
         payload                                                                      +
       ) VALUES (                                                                     +
         NEW.user_id,                                                                 +
         user_email,                                                                  +
         'tariff_changed',                                                            +
         jsonb_build_object(                                                          +
           'add_tags', jsonb_build_array('TARIF_' || UPPER(NEW.plan)),                +
           'remove_tags', jsonb_build_array('TARIF_ZDARMA'),                          +
           'custom_fields', jsonb_build_object(                                       +
             'TARIFF', NEW.plan,                                                      +
             'TARIFF_START_DATE', TO_CHAR(NEW.purchased_at, 'YYYY-MM-DD')             +
           ),                                                                         +
           'move_to_list', 'PREMIUM'                                                  +
         )                                                                            +
       );                                                                             +
     END IF;                                                                          +
   END IF;                                                                            +
                                                                                      +
   -- UPDATE (status change)                                                          +
   IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN                              +
     IF NEW.status = 'expired' THEN                                                   +
       -- Trial/membership expired → zpět do REG                                      +
       INSERT INTO ecomail_sync_queue (                                               +
         user_id,                                                                     +
         email,                                                                       +
         event_type,                                                                  +
         payload                                                                      +
       ) VALUES (                                                                     +
         NEW.user_id,                                                                 +
         user_email,                                                                  +
         'list_move',                                                                 +
         jsonb_build_object(                                                          +
           'from_list_name', 'PREMIUM',                                               +
           'to_list_name', 'REG',                                                     +
           'tags', jsonb_build_array('TRIAL_EXPIRED', 'TARIF_ZDARMA')                 +
         )                                                                            +
       );                                                                             +
     END IF;                                                                          +
   END IF;                                                                            +
                                                                                      +
   RETURN NEW;                                                                        +
 END;                                                                                 +
 $function$                                                                           +
 
(3 rows)

