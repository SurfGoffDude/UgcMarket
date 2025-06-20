/**
 * Типы данных для системы уведомлений
 */

/**
 * Типы уведомлений
 */
export type NotificationType = 'order' | 'message' | 'payment' | 'review' | 'system';

/**
 * Приоритеты уведомлений
 */
export type NotificationPriority = 'high' | 'medium' | 'low';

/**
 * Интерфейс уведомления
 */
export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  link?: string | null;
  created_at: string;
  related_object_id?: number | null;
  related_object_type?: string | null;
}

/**
 * Интерфейс для параметров пагинации
 */
export interface PaginationParams {
  page: number;
  page_size: number;
}

/**
 * Интерфейс для параметров фильтрации уведомлений
 */
export interface NotificationFilterParams extends PaginationParams {
  notification_type?: NotificationType;
  is_read?: boolean;
}

/**
 * Интерфейс для ответа API с пагинацией
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Интерфейс для настроек уведомлений
 */
export interface NotificationSettings {
  id: number;
  user: number;
  email_notifications: boolean;
  push_notifications: boolean;
  order_email: boolean;
  order_push: boolean;
  message_email: boolean;
  message_push: boolean;
  payment_email: boolean;
  payment_push: boolean;
  review_email: boolean;
  review_push: boolean;
  system_email: boolean;
  system_push: boolean;
}

/**
 * Интерфейс для push-подписки
 */
export interface PushSubscription {
  id?: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  browser: string;
  device_type: string;
  active: boolean;
  created_at?: string;
}

/**
 * Интерфейс для VAPID ключей
 */
export interface VAPIDPublicKey {
  publicKey: string;
}
