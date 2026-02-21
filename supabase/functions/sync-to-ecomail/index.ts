/**
 * Sync to Ecomail - Edge Function
 * 
 * Zpracovává sync queue a odesílá data do Ecomail API.
 * Volá se CRON JOBem každých 60s nebo manuálně.
 * 
 * Flow:
 * 1. Načte pending items z sync_queue (max 50)
 * 2. Pro každý item zavolá Ecomail API
 * 3. Update status (completed/failed)
 * 4. Retry logic s exponential backoff
 * 
 * @package DechBar_App
 * @subpackage Supabase/Functions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// =====================================================
// CONSTANTS
// =====================================================

const ECOMAIL_BASE_URL = 'https://api2.ecomailapp.cz';
const BATCH_SIZE = 50; // Max items to process per run
const RETRY_DELAYS = [0, 30000, 300000]; // 0s, 30s, 5min

// List IDs - Updated 2026-02-21
const LIST_IDS: Record<string, string> = {
  UNREG: Deno.env.get('ECOMAIL_LIST_UNREG') || '5',
  REG: Deno.env.get('ECOMAIL_LIST_REG') || '6',
  ENGAGED: Deno.env.get('ECOMAIL_LIST_ENGAGED') || '7',
  PREMIUM: Deno.env.get('ECOMAIL_LIST_PREMIUM') || '8',
  CHURNED: Deno.env.get('ECOMAIL_LIST_CHURNED') || '9',
  // Product-specific lists — IN = zaplatil, BEFORE = zadal email ale nezaplatil
  DIGITALNI_TICHO: Deno.env.get('ECOMAIL_LIST_DIGITALNI_TICHO') || '10',
  DIGITALNI_TICHO_BEFORE: Deno.env.get('ECOMAIL_LIST_DIGITALNI_TICHO_BEFORE') || '11',
};

// =====================================================
// TYPES
// =====================================================

interface QueueItem {
  id: string;
  user_id: string | null;
  email: string;
  event_type: string;
  payload: any;
  status: string;
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  created_at: string;
}

interface SyncResult {
  success: boolean;
  queueItemId: string;
  error?: string;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Call Ecomail API
 */
async function callEcomailAPI(
  method: string,
  endpoint: string,
  body?: any
): Promise<Response> {
  const apiKey = Deno.env.get('ECOMAIL_API_KEY');
  
  if (!apiKey) {
    throw new Error('ECOMAIL_API_KEY not configured');
  }
  
  const url = `${ECOMAIL_BASE_URL}${endpoint}`;
  
  console.log(`[Ecomail API] ${method} ${url}`);
  
  const response = await fetch(url, {
    method,
    headers: {
      'key': apiKey,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  return response;
}

/**
 * Add contact to list
 */
async function addContact(listId: string, contact: any, tags?: string[]): Promise<void> {
  const payload: any = {
    subscriber_data: {
      email: contact.email,
      name: contact.name || '',
      surname: '',
      vokativ: '',
      custom_fields: contact.custom_fields || {}
    },
    trigger_autoresponders: true,
    update_existing: true,
    resubscribe: true,
    skip_confirmation: true
  };
  
  // Add tags if provided
  if (tags && tags.length > 0) {
    payload.subscriber_data.tags = tags;
  }
  
  const response = await callEcomailAPI('POST', `/lists/${listId}/subscribe`, payload);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add contact: ${error}`);
  }
}

/**
 * Update contact fields
 * Note: Ecomail API doesn't have a separate update endpoint.
 * Use subscribe with update_existing=true instead.
 */
async function updateContact(email: string, updates: any, listId?: string): Promise<void> {
  // Default to REG list if not specified
  const targetListId = listId || LIST_IDS.REG;
  
  const response = await callEcomailAPI('POST', `/lists/${targetListId}/subscribe`, {
    subscriber_data: {
      email: email,
      custom_fields: updates.custom_fields || {}
    },
    update_existing: true,
    resubscribe: true,
    trigger_autoresponders: false,
    skip_confirmation: true
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update contact: ${error}`);
  }
}

/**
 * Add tag to contact
 * 
 * NOTE: Ecomail API v2 doesn't have /subscribers/{email}/tags endpoint!
 * Tags must be added via /lists/{listId}/subscribe with update_existing=true
 * This ensures contact exists and tags are added atomically.
 */
async function addTag(email: string, tag: string, listId?: string): Promise<void> {
  // First, get current contact to find which list they're in
  // If listId not provided, try to add to all lists where contact might exist
  // ✅ UNREG first (most new contacts start there!)
  const listsToTry = listId ? [listId] : [LIST_IDS.UNREG, LIST_IDS.REG, LIST_IDS.ENGAGED, LIST_IDS.PREMIUM];
  
  let lastError: string | null = null;
  
  for (const tryListId of listsToTry) {
    try {
      const response = await callEcomailAPI('POST', `/lists/${tryListId}/subscribe`, {
        subscriber_data: {
          email: email,
          tags: [tag] // Ecomail will merge with existing tags
        },
        update_existing: true,
        resubscribe: true,
        trigger_autoresponders: false,
        skip_confirmation: true
      });
      
      if (response.ok) {
        console.log(`[addTag] ✅ Added tag ${tag} to ${email} in list ${tryListId}`);
        return; // Success!
      }
      
      lastError = await response.text();
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  
  // If we got here, all attempts failed
  throw new Error(`Failed to add tag after trying all lists: ${lastError}`);
}

/**
 * Remove tag from contact
 * 
 * NOTE: Ecomail API v2 doesn't support tag removal via API!
 * Workaround: Update contact with all tags EXCEPT the one to remove.
 * For now, we'll just log a warning and skip (not critical).
 */
async function removeTag(email: string, tag: string): Promise<void> {
  // Ecomail API v2 doesn't support tag removal
  // This would require fetching all tags, filtering out the one to remove, 
  // and re-subscribing with the filtered list.
  // For now, just log and continue (not critical for MVP)
  console.log(`[removeTag] ⚠️ Skipping tag removal (not supported by Ecomail API v2): ${tag} from ${email}`);
}

/**
 * Move contact between lists
 */
async function moveList(
  email: string,
  fromListId: string,
  toListId: string,
  tags?: string[],
  customFields?: Record<string, unknown>,
): Promise<void> {
  const subscriberData: any = {
    email,
    tags: tags || [],
  };

  if (customFields && Object.keys(customFields).length > 0) {
    subscriberData.custom_fields = customFields;
  }

  const payload: any = {
    subscriber_data: subscriberData,
    update_existing: true,
    resubscribe: true,
    trigger_autoresponders: true,
    skip_confirmation: true,
  };
  
  console.log(`[Move List] ${email} from list ${fromListId} to ${toListId} with tags:`, JSON.stringify(tags));
  
  // Add to new list
  console.log(`[Move List] Step 1: Adding to list ${toListId}`);
  const addResponse = await callEcomailAPI('POST', `/lists/${toListId}/subscribe`, payload);
  console.log(`[Move List] Step 1 response status: ${addResponse.status}`);
  
  if (!addResponse.ok) {
    const error = await addResponse.text();
    throw new Error(`Failed to add to new list: ${error}`);
  }
  
  // Remove from old list - use unsubscribe endpoint
  console.log(`[Move List] Step 2: Unsubscribing from list ${fromListId}`);
  const deleteResponse = await callEcomailAPI('POST', `/lists/${fromListId}/unsubscribe`, {
    email: email
  });
  console.log(`[Move List] Step 2 response status: ${deleteResponse.status}`);
  
  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    const errorText = await deleteResponse.text();
    console.error(`[Move List] Unsubscribe failed with status ${deleteResponse.status}:`, errorText);
  } else {
    console.log(`[Move List] ✅ Successfully moved ${email} from ${fromListId} to ${toListId}`);
  }
}

/**
 * Process single queue item
 */
async function processQueueItem(supabase: any, item: QueueItem): Promise<SyncResult> {
  try {
    console.log(`[Sync] Processing ${item.event_type} for ${item.email}`);
    
    switch (item.event_type) {
      case 'contact_add': {
        const listId = LIST_IDS[item.payload.list_name] || item.payload.list_id;
        const tags = item.payload.tags && Array.isArray(item.payload.tags) ? item.payload.tags : [];
        await addContact(listId, item.payload.contact, tags);
        break;
      }
      
      case 'contact_update': {
        // Build subscriber data with all updates at once
        const subscriberData: any = {
          email: item.email
        };
        
        // Add custom fields if provided
        if (item.payload.custom_fields) {
          subscriberData.custom_fields = item.payload.custom_fields;
        }
        
        // Collect all tags to add
        const tagsToAdd: string[] = [];
        if (item.payload.add_tags && Array.isArray(item.payload.add_tags)) {
          tagsToAdd.push(...item.payload.add_tags.filter((tag: any) => 
            tag !== null && tag !== undefined && tag !== ''
          ));
        }
        
        // Add tags if any
        if (tagsToAdd.length > 0) {
          subscriberData.tags = tagsToAdd;
        }
        
        // Use REG list as default for contact updates
        const targetListId = LIST_IDS.REG;
        
        // Single API call to update everything atomically
        const response = await callEcomailAPI('POST', `/lists/${targetListId}/subscribe`, {
          subscriber_data: subscriberData,
          update_existing: true,
          resubscribe: true,
          trigger_autoresponders: false,
          skip_confirmation: true
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to update contact: ${error}`);
        }
        
        break;
      }
      
      case 'list_move': {
        const fromListId = LIST_IDS[item.payload.from_list_name] || item.payload.from_list;
        const toListId = LIST_IDS[item.payload.to_list_name] || item.payload.to_list;
        const tags = item.payload.tags && Array.isArray(item.payload.tags) ? item.payload.tags : [];
        const customFields = item.payload.contact?.custom_fields ?? undefined;
        await moveList(item.email, fromListId, toListId, tags, customFields);
        break;
      }
      
      case 'tag_add': {
        if (item.payload.tag !== null && item.payload.tag !== undefined && item.payload.tag !== '') {
          // Try to determine which list the contact is in from payload
          const listId = item.payload.list_id || undefined;
          await addTag(item.email, item.payload.tag, listId);
        }
        break;
      }
      
      case 'tag_remove': {
        if (item.payload.tag !== null && item.payload.tag !== undefined && item.payload.tag !== '') {
          await removeTag(item.email, item.payload.tag);
        }
        break;
      }
      
      case 'trial_activated':
      case 'trial_expired':
      case 'tariff_changed': {
        // Determine target list ID
        const targetListId = item.payload.move_to_list 
          ? LIST_IDS[item.payload.move_to_list] 
          : LIST_IDS.REG; // Default to REG list
        
        // Build subscriber data with all updates at once
        const subscriberData: any = {
          email: item.email
        };
        
        // Add custom fields if provided
        if (item.payload.custom_fields) {
          subscriberData.custom_fields = item.payload.custom_fields;
        }
        
        // Collect all tags to add
        const tagsToAdd: string[] = [];
        if (item.payload.add_tags && Array.isArray(item.payload.add_tags)) {
          tagsToAdd.push(...item.payload.add_tags.filter((tag: any) => 
            tag !== null && tag !== undefined && tag !== ''
          ));
        }
        
        // Add tags if any
        if (tagsToAdd.length > 0) {
          subscriberData.tags = tagsToAdd;
        }
        
        // Single API call to update everything atomically
        const response = await callEcomailAPI('POST', `/lists/${targetListId}/subscribe`, {
          subscriber_data: subscriberData,
          update_existing: true,
          resubscribe: true,
          trigger_autoresponders: false,
          skip_confirmation: true
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to update tariff/trial: ${error}`);
        }
        
        // Note: remove_tags is not supported by Ecomail API v2
        // We log a warning but don't fail the sync
        if (item.payload.remove_tags && Array.isArray(item.payload.remove_tags)) {
          console.log(`[Sync] ⚠️ Tag removal not supported, skipping: ${item.payload.remove_tags.join(', ')}`);
        }
        
        break;
      }
      
      case 'metrics_update': {
        // Build subscriber data with all updates at once
        const subscriberData: any = {
          email: item.email
        };
        
        // Add custom fields if provided
        if (item.payload.custom_fields) {
          subscriberData.custom_fields = item.payload.custom_fields;
        }
        
        // Collect all tags to add
        const tagsToAdd: string[] = [];
        if (item.payload.update_tags?.add) {
          tagsToAdd.push(...item.payload.update_tags.add.filter((tag: any) => 
            tag !== null && tag !== undefined && tag !== ''
          ));
        }
        
        // Add tags if any
        if (tagsToAdd.length > 0) {
          subscriberData.tags = tagsToAdd;
        }
        
        // Metrics updates typically go to REG or ENGAGED lists
        const targetListId = LIST_IDS.ENGAGED;
        
        // Single API call to update everything atomically
        const response = await callEcomailAPI('POST', `/lists/${targetListId}/subscribe`, {
          subscriber_data: subscriberData,
          update_existing: true,
          resubscribe: true,
          trigger_autoresponders: false,
          skip_confirmation: true
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to update metrics: ${error}`);
        }
        
        // Note: Tag removal not supported
        if (item.payload.update_tags?.remove) {
          console.log(`[Sync] ⚠️ Tag removal not supported, skipping tag patterns: ${item.payload.update_tags.remove.join(', ')}`);
        }
        
        break;
      }
      
      default:
        throw new Error(`Unknown event type: ${item.event_type}`);
    }
    
    // Update queue item: completed
    await supabase
      .from('ecomail_sync_queue')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', item.id);
    
    console.log(`[Sync] ✅ Completed ${item.event_type} for ${item.email}`);
    
    return {
      success: true,
      queueItemId: item.id
    };
  } catch (error) {
    console.error(`[Sync] ❌ Failed ${item.event_type} for ${item.email}:`, error);
    
    // Update queue item: failed or retry
    const newRetryCount = item.retry_count + 1;
    
    if (newRetryCount >= item.max_retries) {
      // Move to dead letter queue
      await supabase.from('ecomail_failed_syncs').insert({
        original_queue_id: item.id,
        user_id: item.user_id,
        email: item.email,
        event_type: item.event_type,
        payload: item.payload,
        error_message: error instanceof Error ? error.message : String(error),
        retry_history: Array(newRetryCount).fill({
          attempt: newRetryCount,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        }),
        requires_manual_review: true
      });
      
      // Delete from queue
      await supabase
        .from('ecomail_sync_queue')
        .delete()
        .eq('id', item.id);
      
      console.log(`[Sync] 💀 Moved to DLQ: ${item.id}`);
    } else {
      // Schedule retry
      const retryDelay = RETRY_DELAYS[newRetryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1] || 300000;
      const nextRetryAt = new Date(Date.now() + retryDelay);
      
      await supabase
        .from('ecomail_sync_queue')
        .update({
          status: 'failed',
          retry_count: newRetryCount,
          last_error: error instanceof Error ? error.message : String(error),
          next_retry_at: nextRetryAt.toISOString()
        })
        .eq('id', item.id);
      
      console.log(`[Sync] 🔄 Scheduled retry ${newRetryCount}/${item.max_retries} at ${nextRetryAt.toISOString()}`);
    }
    
    return {
      success: false,
      queueItemId: item.id,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req: Request) => {
  try {
    // 1. Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. Initialize Supabase client (ADMIN)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('[Sync] 🚀 Starting Ecomail sync...');
    
    // 3. Get pending items (including failed items ready for retry)
    const { data: queueItems, error: fetchError } = await supabase
      .from('ecomail_sync_queue')
      .select('*')
      .or(`status.eq.pending,and(status.eq.failed,next_retry_at.lte.${new Date().toISOString()})`)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!queueItems || queueItems.length === 0) {
      console.log('[Sync] ℹ️ No items to process');
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: 'No items in queue'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[Sync] 📦 Processing ${queueItems.length} items`);
    
    // 4. Process each item
    const results: SyncResult[] = [];
    
    for (const item of queueItems) {
      const result = await processQueueItem(supabase, item);
      results.push(result);
      
      // Rate limit: Wait 600ms between requests (100 req/min)
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    // 5. Calculate stats
    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`[Sync] ✅ Completed: ${succeeded} succeeded, ${failed} failed`);
    
    // 6. Return response
    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        succeeded,
        failed,
        results,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Sync] ❌ Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/* =====================================================
 * DEPLOYMENT
 * =====================================================
 * 
 * supabase functions deploy sync-to-ecomail
 * 
 * REQUIRED SECRETS:
 * - ECOMAIL_API_KEY
 * - ECOMAIL_LIST_UNREG
 * - ECOMAIL_LIST_REG
 * - ECOMAIL_LIST_ENGAGED
 * - ECOMAIL_LIST_PREMIUM
 * - ECOMAIL_LIST_CHURNED
 * 
 * CRON SETUP:
 * SELECT cron.schedule(
 *   'ecomail-sync',
 *   '* * * * *', -- Every minute
 *   $$SELECT net.http_post(
 *     url:='https://YOUR_PROJECT.supabase.co/functions/v1/sync-to-ecomail',
 *     headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
 *   )$$
 * );
 * 
 * ===================================================== */
