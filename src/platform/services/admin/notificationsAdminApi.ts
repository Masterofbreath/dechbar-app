/**
 * Notifications Admin API
 *
 * Admin-only operations: browsing sent notifications, creating new ones (with fanout),
 * and managing auto-trigger settings.
 *
 * @package DechBar_App
 * @subpackage Platform/Services/Admin
 */

import { supabase } from '@/platform/api/supabase';
import type {
  AdminNotification,
  CreateNotificationPayload,
  NotificationAutoTrigger,
} from '@/platform/api/notificationTypes';

// ============================================================
// Get sent notifications with basic read stats
// ============================================================

export async function getNotifications(): Promise<AdminNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const notifications = data ?? [];

  const ids = notifications.map((n) => n.id);
  if (ids.length === 0) return [];

  const { data: stats } = await supabase
    .from('user_notifications')
    .select('notification_id, read, cta_clicked')
    .in('notification_id', ids);

  const statsByNotif: Record<string, { total: number; read: number; cta_clicked: number }> = {};
  for (const row of stats ?? []) {
    if (!statsByNotif[row.notification_id]) {
      statsByNotif[row.notification_id] = { total: 0, read: 0, cta_clicked: 0 };
    }
    statsByNotif[row.notification_id].total++;
    if (row.read) statsByNotif[row.notification_id].read++;
    if (row.cta_clicked) statsByNotif[row.notification_id].cta_clicked++;
  }

  return notifications.map((n) => ({
    ...n,
    read_count: statsByNotif[n.id]?.read ?? 0,
    total_count: statsByNotif[n.id]?.total ?? 0,
    cta_clicked_count: statsByNotif[n.id]?.cta_clicked ?? 0,
  })) as AdminNotification[];
}

// Kompletní seznam rolí definovaných v systému (dle roleHelpers.ts)
// + merge s rolemi z DB (pokud by byly přidány custom role)
const KNOWN_ROLES = ['ceo', 'admin', 'teacher', 'student', 'member', 'vip_member'] as const;

export async function getAvailableRoles(): Promise<string[]> {
  const { data } = await supabase
    .from('user_roles')
    .select('role');
  const dbRoles = (data ?? []).map((r: { role: string }) => r.role);
  // Union: known roles vždy, plus jakékoliv extra role z DB
  return [...new Set([...KNOWN_ROLES, ...dbRoles])];
}

// ============================================================
// Create notification + fanout to user_notifications
// ============================================================

async function resolveTargetUserIds(payload: CreateNotificationPayload): Promise<string[]> {
  if (payload.target_audience === 'all') {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id');
    if (error) throw error;
    return (data ?? []).map((r: { user_id: string }) => r.user_id);
  }

  if (payload.target_audience === 'tier' && payload.target_tier) {
    // Using user_modules table — subscription_status column
    const { data, error } = await supabase
      .from('user_modules')
      .select('user_id')
      .eq('subscription_status', payload.target_tier);
    if (error) throw error;
    return [...new Set((data ?? []).map((r: { user_id: string }) => r.user_id))];
  }

  if (payload.target_audience === 'role' && payload.target_role) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', payload.target_role);
    if (error) throw error;
    return (data ?? []).map((r: { user_id: string }) => r.user_id);
  }

  if (payload.target_audience === 'kp' && payload.target_kp_min != null) {
    // Uživatelé, jejichž nejlepší validní KP >= threshold
    const { data, error } = await supabase
      .from('kp_measurements')
      .select('user_id, value_seconds')
      .eq('is_valid', true)
      .gte('value_seconds', payload.target_kp_min);
    if (error) throw error;
    return [...new Set((data ?? []).map((r: { user_id: string }) => r.user_id))];
  }

  return [];
}

export async function createNotification(payload: CreateNotificationPayload): Promise<void> {
  const now = new Date();
  const scheduledAt = payload.scheduled_at ? new Date(payload.scheduled_at) : null;

  // Pokud je scheduled_at v budoucnosti → uložíme bez fanoutu (sent_at = null)
  // Pokud je null nebo v minulosti → okamžitý fanout (sent_at = now)
  const isFutureScheduled = scheduledAt !== null && scheduledAt > now;
  const sentAt = isFutureScheduled ? null : now.toISOString();

  const { data: notifData, error: notifError } = await supabase
    .from('notifications')
    .insert({
      type: payload.type,
      title: payload.title,
      message: payload.message,
      action_url: payload.action_url ?? null,
      action_label: payload.action_label ?? null,
      image_url: payload.image_url ?? null,
      is_pinned: payload.is_pinned ?? false,
      target_audience: payload.target_audience,
      target_role: payload.target_role ?? null,
      target_tier: payload.target_tier ?? null,
      target_kp_min: payload.target_kp_min ?? null,
      scheduled_at: payload.scheduled_at ?? null,
      sent_at: sentAt,
      is_auto_generated: false,
    })
    .select('id')
    .single();

  if (notifError) throw notifError;

  // Naplánovaná notifikace se neodesílá — fanout proběhne při ručním odeslání z Přehledu
  if (isFutureScheduled) return;

  const notificationId = notifData.id;
  const userIds = await resolveTargetUserIds(payload);

  if (userIds.length === 0) return;

  const rows = userIds.map((userId) => ({
    user_id: userId,
    notification_id: notificationId,
    read: false,
  }));

  // Insert in batches of 500 to avoid payload limits
  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase.from('user_notifications').insert(batch);
    if (insertError) throw insertError;
  }
}

// Odeslat naplánovanou notifikaci (manuální trigger z Přehledu)
export async function sendScheduledNotification(notificationId: string): Promise<void> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('notifications')
    .update({ sent_at: now })
    .eq('id', notificationId)
    .is('sent_at', null)
    .select('id, target_audience, target_role, target_tier')
    .single();

  if (error) throw error;

  const userIds = await resolveTargetUserIds({
    type: 'system',
    title: '',
    message: '',
    target_audience: data.target_audience,
    target_role: data.target_role,
    target_tier: data.target_tier,
  });

  if (userIds.length === 0) return;

  const rows = userIds.map((userId) => ({
    user_id: userId,
    notification_id: notificationId,
    read: false,
  }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase
      .from('user_notifications')
      .upsert(batch, { onConflict: 'user_id,notification_id', ignoreDuplicates: true });
    if (insertError) throw insertError;
  }
}

// ============================================================
// Akademie deep link helpers (for URL picker in compose form)
// ============================================================

export interface AkademieCategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface AkademieProgramOption {
  id: string;
  name: string;
  module_id: string;
}

export async function getAkademieCategoriesForAdmin(): Promise<AkademieCategoryOption[]> {
  const { data, error } = await supabase
    .from('akademie_categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as AkademieCategoryOption[];
}

export async function getAkademieProgramsForAdmin(
  categoryId: string
): Promise<AkademieProgramOption[]> {
  const { data, error } = await supabase
    .from('akademie_programs')
    .select('id, module_id, modules!inner(name)')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: (row.modules as Record<string, unknown> | null)?.name ?? row.module_id,
    module_id: row.module_id as string,
  }));
}

// ============================================================
// Auto-triggers
// ============================================================

export async function getAutoTriggers(): Promise<NotificationAutoTrigger[]> {
  const { data, error } = await supabase
    .from('notification_auto_triggers')
    .select('*')
    .order('trigger', { ascending: true });

  if (error) throw error;
  return (data ?? []) as NotificationAutoTrigger[];
}

// ============================================================
// Admin: hard-delete notifications (cascade user_notifications)
// ============================================================

export async function adminDeleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================
// Admin: update notification (title, message, urls…)
// ============================================================

export type UpdateNotificationPayload = Partial<
  Pick<
    AdminNotification,
    'title' | 'message' | 'action_url' | 'action_label' | 'image_url' | 'is_pinned'
  >
>;

export async function adminUpdateNotification(
  id: string,
  updates: UpdateNotificationPayload
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

// ============================================================
// Auto-triggers
// ============================================================

export async function updateAutoTrigger(
  trigger: string,
  updates: Partial<Pick<NotificationAutoTrigger, 'enabled' | 'default_title' | 'default_message'>>
): Promise<void> {
  const { error } = await supabase
    .from('notification_auto_triggers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('trigger', trigger);

  if (error) throw error;
}
