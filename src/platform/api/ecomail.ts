/**
 * Ecomail API Wrapper
 * 
 * Client-side wrapper pro Ecomail integraci.
 * 
 * SECURITY NOTE:
 * Tento wrapper NEVOLÁ Ecomail API přímo!
 * Místo toho volá Supabase Edge Functions, které obsahují API klíč.
 * 
 * Architecture:
 * Frontend → API Wrapper → Supabase DB (sync_queue) → Edge Function → Ecomail API
 * 
 * See: docs/marketing/ecomail/01_ARCHITECTURE.md
 * 
 * @package DechBar_App
 * @subpackage Platform/API
 */

import { supabase } from './supabase';
import type {
  EcomailContact,
  EcomailTag,
  ApiResponse,
  TagOperation,
  CustomFields
} from './ecomail.types';
import {
  ECOMAIL_LISTS,
  SYNC_EVENT_TYPES,
  getListId
} from './ecomail.constants';

// =====================================================
// CORE FUNCTIONS (Queue-based)
// =====================================================

/**
 * Přidá kontakt do seznamu
 * 
 * IMPORTANT: Tato funkce NEvolá Ecomail API přímo.
 * Ukládá požadavek do sync_queue, který zpracuje Edge Function.
 * 
 * @param listName - Název seznamu (UNREG, REG, ENGAGED, PREMIUM, CHURNED)
 * @param contact - Kontaktní data
 * @returns Promise s výsledkem
 */
export async function addContact(
  listName: keyof typeof ECOMAIL_LISTS,
  contact: EcomailContact
): Promise<ApiResponse<{ queued: boolean }>> {
  try {
    // Get user ID if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    // Queue sync event
    const { error } = await supabase
      .from('ecomail_sync_queue')
      .insert({
        user_id: user?.id || null,
        email: contact.email,
        event_type: SYNC_EVENT_TYPES.CONTACT_ADD,
        payload: {
          list_id: getListId(listName),
          list_name: listName,
          contact: contact
        }
      });
    
    if (error) {
      console.error('[Ecomail] Failed to queue contact_add:', error);
      return {
        success: false,
        error: 'Failed to queue contact for sync'
      };
    }
    
    return {
      success: true,
      data: { queued: true }
    };
  } catch (error) {
    console.error('[Ecomail] addContact error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Aktualizuje kontakt (custom fields + tags)
 * 
 * @param email - Email kontaktu
 * @param updates - Data k aktualizaci
 * @returns Promise s výsledkem
 */
export async function updateContact(
  email: string,
  updates: Partial<EcomailContact>
): Promise<ApiResponse<{ queued: boolean }>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('ecomail_sync_queue')
      .insert({
        user_id: user?.id || null,
        email: email,
        event_type: SYNC_EVENT_TYPES.CONTACT_UPDATE,
        payload: {
          updates: updates
        }
      });
    
    if (error) {
      console.error('[Ecomail] Failed to queue contact_update:', error);
      return {
        success: false,
        error: 'Failed to queue contact update'
      };
    }
    
    return {
      success: true,
      data: { queued: true }
    };
  } catch (error) {
    console.error('[Ecomail] updateContact error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Přidá tag kontaktu
 * 
 * @param email - Email kontaktu
 * @param tag - Tag k přidání
 * @returns Promise s výsledkem
 */
export async function addTag(
  email: string,
  tag: EcomailTag
): Promise<ApiResponse<{ queued: boolean }>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('ecomail_sync_queue')
      .insert({
        user_id: user?.id || null,
        email: email,
        event_type: SYNC_EVENT_TYPES.TAG_ADD,
        payload: {
          tag: tag
        }
      });
    
    if (error) {
      console.error('[Ecomail] Failed to queue tag_add:', error);
      return {
        success: false,
        error: 'Failed to queue tag addition'
      };
    }
    
    return {
      success: true,
      data: { queued: true }
    };
  } catch (error) {
    console.error('[Ecomail] addTag error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Odebere tag
 * 
 * @param email - Email kontaktu
 * @param tag - Tag k odebrání
 * @returns Promise s výsledkem
 */
export async function removeTag(
  email: string,
  tag: EcomailTag
): Promise<ApiResponse<{ queued: boolean }>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('ecomail_sync_queue')
      .insert({
        user_id: user?.id || null,
        email: email,
        event_type: SYNC_EVENT_TYPES.TAG_REMOVE,
        payload: {
          tag: tag
        }
      });
    
    if (error) {
      console.error('[Ecomail] Failed to queue tag_remove:', error);
      return {
        success: false,
        error: 'Failed to queue tag removal'
      };
    }
    
    return {
      success: true,
      data: { queued: true }
    };
  } catch (error) {
    console.error('[Ecomail] removeTag error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Přesune kontakt mezi seznamy
 * 
 * @param email - Email kontaktu
 * @param fromList - Zdrojový seznam
 * @param toList - Cílový seznam
 * @returns Promise s výsledkem
 */
export async function moveList(
  email: string,
  fromList: keyof typeof ECOMAIL_LISTS,
  toList: keyof typeof ECOMAIL_LISTS
): Promise<ApiResponse<{ queued: boolean }>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('ecomail_sync_queue')
      .insert({
        user_id: user?.id || null,
        email: email,
        event_type: SYNC_EVENT_TYPES.LIST_MOVE,
        payload: {
          from_list: getListId(fromList),
          to_list: getListId(toList),
          from_list_name: fromList,
          to_list_name: toList
        }
      });
    
    if (error) {
      console.error('[Ecomail] Failed to queue list_move:', error);
      return {
        success: false,
        error: 'Failed to queue list move'
      };
    }
    
    return {
      success: true,
      data: { queued: true }
    };
  } catch (error) {
    console.error('[Ecomail] moveList error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// =====================================================
// BATCH OPERATIONS
// =====================================================

/**
 * Bulk add kontaktů (optimalizované)
 * 
 * @param listName - Název seznamu
 * @param contacts - Array kontaktů
 * @returns Promise s výsledkem
 */
export async function bulkAddContacts(
  listName: keyof typeof ECOMAIL_LISTS,
  contacts: EcomailContact[]
): Promise<ApiResponse<{ queued: number }>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Queue all contacts
    const queueItems = contacts.map(contact => ({
      user_id: user?.id || null,
      email: contact.email,
      event_type: SYNC_EVENT_TYPES.CONTACT_ADD,
      payload: {
        list_id: getListId(listName),
        list_name: listName,
        contact: contact
      }
    }));
    
    const { error } = await supabase
      .from('ecomail_sync_queue')
      .insert(queueItems);
    
    if (error) {
      console.error('[Ecomail] Failed to queue bulk contacts:', error);
      return {
        success: false,
        error: 'Failed to queue contacts'
      };
    }
    
    return {
      success: true,
      data: { queued: contacts.length }
    };
  } catch (error) {
    console.error('[Ecomail] bulkAddContacts error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Bulk update tagů
 * 
 * @param operations - Array operací (add/remove tag)
 * @returns Promise s výsledkem
 */
export async function bulkUpdateTags(
  operations: TagOperation[]
): Promise<ApiResponse<{ queued: number }>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const queueItems = operations.map(op => ({
      user_id: user?.id || null,
      email: op.email,
      event_type: op.action === 'add' ? SYNC_EVENT_TYPES.TAG_ADD : SYNC_EVENT_TYPES.TAG_REMOVE,
      payload: {
        tag: op.tag
      }
    }));
    
    const { error } = await supabase
      .from('ecomail_sync_queue')
      .insert(queueItems);
    
    if (error) {
      console.error('[Ecomail] Failed to queue bulk tags:', error);
      return {
        success: false,
        error: 'Failed to queue tag operations'
      };
    }
    
    return {
      success: true,
      data: { queued: operations.length }
    };
  } catch (error) {
    console.error('[Ecomail] bulkUpdateTags error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Získá stav sync queue pro daný email
 * 
 * Užitečné pro debugging a monitoring.
 * 
 * @param email - Email kontaktu
 * @returns Promise s queue items
 */
export async function getSyncQueueStatus(email: string) {
  const { data, error } = await supabase
    .from('ecomail_sync_queue')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('[Ecomail] Failed to get sync queue status:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

/**
 * Vrátí pending sync items count
 * 
 * Užitečné pro monitoring health sync queue.
 * 
 * @returns Promise s počtem pending items
 */
export async function getPendingSyncCount(): Promise<number> {
  const { count, error } = await supabase
    .from('ecomail_sync_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  if (error) {
    console.error('[Ecomail] Failed to get pending sync count:', error);
    return 0;
  }
  
  return count || 0;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Queue metrics update pro uživatele
 * 
 * Volá se z batch CRON jobu nebo při významné změně.
 * 
 * @param email - Email uživatele
 * @param metrics - Metriky k aktualizaci
 * @returns Promise s výsledkem
 */
export async function queueMetricsUpdate(
  email: string,
  metrics: Partial<CustomFields>
): Promise<ApiResponse<{ queued: boolean }>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('ecomail_sync_queue')
      .insert({
        user_id: user?.id || null,
        email: email,
        event_type: SYNC_EVENT_TYPES.METRICS_UPDATE,
        payload: {
          custom_fields: metrics
        }
      });
    
    if (error) {
      console.error('[Ecomail] Failed to queue metrics_update:', error);
      return {
        success: false,
        error: 'Failed to queue metrics update'
      };
    }
    
    return {
      success: true,
      data: { queued: true }
    };
  } catch (error) {
    console.error('[Ecomail] queueMetricsUpdate error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Log Ecomail event for debugging
 */
function logEvent(event: string, data: any) {
  if (import.meta.env.DEV) {
    console.log(`[Ecomail] ${event}`, data);
  }
}
