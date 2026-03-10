import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from './supabase';
import { useAuthStore } from '@/platform/auth/authStore';
import { useNavigation } from '@/platform/hooks/useNavigation';
import type { Notification } from './notificationTypes';

// ============================================================
// Query keys
// ============================================================

const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => ['notifications', userId] as const,
};

// ============================================================
// Fetch
// ============================================================

async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('user_notifications')
    .select(`
      id,
      notification_id,
      read,
      cta_clicked,
      created_at,
      notifications (
        type,
        title,
        message,
        action_url,
        action_label,
        image_url,
        is_pinned
      )
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const mapped = (data ?? []).map((row: Record<string, unknown>) => {
    const notif = row.notifications as Record<string, unknown> | null | undefined;
    return {
      id: row.id as string,
      notification_id: row.notification_id as string,
      type: (notif?.type as string) ?? 'system',
      title: (notif?.title as string) ?? '',
      message: (notif?.message as string) ?? '',
      action_url: (notif?.action_url as string | null) ?? null,
      action_label: (notif?.action_label as string | null) ?? null,
      image_url: (notif?.image_url as string | null) ?? null,
      read: row.read as boolean,
      cta_clicked: (row.cta_clicked as boolean) ?? false,
      created_at: row.created_at as string,
      is_pinned: (notif?.is_pinned as boolean) ?? false,
    };
  });

  // Pinnované notifikace vždy nahoře, ostatní seřazeny dle created_at DESC
  return [
    ...mapped.filter((n) => n.is_pinned),
    ...mapped.filter((n) => !n.is_pinned),
  ];
}

// ============================================================
// Main hook
// ============================================================

export function useNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id;
  const setUnreadNotifications = useNavigation((s) => s.setUnreadNotifications);

  const query = useQuery({
    queryKey: notificationKeys.list(userId ?? ''),
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const unreadCount = (query.data ?? []).filter((n) => !n.read).length;

  useEffect(() => {
    setUnreadNotifications(unreadCount);
  }, [unreadCount, setUnreadNotifications]);

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId ?? '') });
    },
  });

  const deleteNotificationMutation = useMutation({
    // RPC s SECURITY DEFINER — obejde RLS UPDATE problém, stats zůstanou v DB
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('soft_delete_user_notification', { p_id: id });
      if (error) throw error;
    },
    // Okamžité odstranění z UI, rollback jen při chybě sítě
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list(userId ?? '') });
      const snapshot = queryClient.getQueryData<Notification[]>(notificationKeys.list(userId ?? ''));
      queryClient.setQueryData(
        notificationKeys.list(userId ?? ''),
        (old: Notification[] | undefined) => (old ?? []).filter((n) => n.id !== id),
      );
      return { snapshot };
    },
    onError: (_err, _id, context: { snapshot?: Notification[] } | undefined) => {
      if (context?.snapshot) {
        queryClient.setQueryData(notificationKeys.list(userId ?? ''), context.snapshot);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId ?? '') });
    },
  });

  const markCtaClickedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ cta_clicked: true, cta_clicked_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId ?? '') });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId!)
        .eq('read', false)
        .is('deleted_at', null);
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list(userId ?? '') });
      const snapshot = queryClient.getQueryData<Notification[]>(notificationKeys.list(userId ?? ''));
      queryClient.setQueryData(
        notificationKeys.list(userId ?? ''),
        (old: Notification[] | undefined) => (old ?? []).map((n) => ({ ...n, read: true })),
      );
      return { snapshot };
    },
    onError: (_err, _vars, context: { snapshot?: Notification[] } | undefined) => {
      if (context?.snapshot) {
        queryClient.setQueryData(notificationKeys.list(userId ?? ''), context.snapshot);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId ?? '') });
    },
  });

  return {
    notifications: query.data ?? [],
    unreadCount,
    isLoading: query.isLoading,
    error: query.error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    markAllAsReadPending: markAllAsReadMutation.isPending,
    deleteNotification: deleteNotificationMutation.mutate,
    markCtaClicked: markCtaClickedMutation.mutate,
  };
}
