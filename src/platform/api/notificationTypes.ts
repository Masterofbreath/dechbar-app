export type NotificationType = 'system' | 'progress' | 'achievement' | 'promo' | 'reminder';

export type NotificationTargetAudience = 'all' | 'role' | 'tier' | 'kp';

export type NotificationTier = 'ZDARMA' | 'SMART' | 'AI_COACH';

export interface Notification {
  id: string;             // user_notifications.id
  notification_id: string; // notifications.id
  type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  image_url: string | null;
  read: boolean;
  cta_clicked: boolean;
  created_at: string;
  is_pinned: boolean;
}

export interface NotificationAutoTrigger {
  trigger: string;
  enabled: boolean;
  default_title: string;
  default_message: string;
  updated_at: string;
}

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  image_url: string | null;
  is_pinned: boolean;
  target_audience: NotificationTargetAudience;
  target_role: string | null;
  target_tier: NotificationTier | null;
  target_kp_min: number | null;
  scheduled_at: string | null;
  sent_at: string | null;
  is_auto_generated: boolean;
  auto_trigger: string | null;
  created_at: string;
  read_count?: number;
  total_count?: number;
  cta_clicked_count?: number;
}

export interface CreateNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  action_url?: string | null;
  action_label?: string | null;
  image_url?: string | null;
  is_pinned?: boolean;
  target_audience: NotificationTargetAudience;
  target_role?: string | null;
  target_tier?: NotificationTier | null;
  target_kp_min?: number | null;
  scheduled_at?: string | null;
}
