/**
 * API-клиент для работы с уведомлениями
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  Notification, 
  NotificationFilterParams, 
  NotificationSettings, 
  PaginatedResponse,
  PushSubscription,
  VAPIDPublicKey
} from '../types/notifications';
import { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

/**
 * Базовый URL для API запросов
 */
const API_BASE_URL = '/api/notifications';

/**
 * RTK Query API для работы с уведомлениями
 * 
 * Примечание: В данный момент функционал уведомлений не реализован на бэкенде,
 * поэтому здесь используются заглушки вместо реальных запросов к API.
 */
export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  tagTypes: ['Notifications', 'NotificationSettings', 'PushSubscriptions'],
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      // Получаем токен из localStorage
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  // Определение базового обработчика ошибок, который перехватывает 404 и возвращает заглушки
  // для API уведомлений, которые пока не реализованы на бэкенде
  baseQueryWithErrorHandler: ((args, api, extraOptions) => {
    // Оборачиваем оригинальный baseQuery и перехватываем ошибки
    const baseQueryFn = fetchBaseQuery({ 
      baseUrl: API_BASE_URL,
      credentials: 'include',
      prepareHeaders: (headers) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
      }
    });

    return baseQueryFn(args, api, extraOptions).then(result => {
      // Если произошла ошибка 404, возвращаем заглушки для определенных эндпоинтов
      if (result.error && 'status' in result.error && result.error.status === 404) {
        const url = typeof args === 'string' ? args : args.url;

        // Заглушка для эндпоинта notifications/
        if (url.includes('/notifications/') && !url.includes('/unread-count/')) {
          return { data: { results: [], count: 0, next: null, previous: null } };
        }

        // Заглушка для эндпоинта unread-count/
        if (url.includes('/unread-count/')) {
          return { data: { unread_count: 0 } };
        }

        // Заглушка для эндпоинта settings/
        if (url.includes('/settings/')) {
          return { data: [{
            id: 1,
            email_notifications: true,
            push_notifications: false,
            order_status_changes: true,
            new_messages: true,
            promotions: false,
            system_notifications: true
          }] };
        }
      }
      return result;
    });
  }) as BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>,

  endpoints: (builder: any) => ({
    /**
     * Получение списка уведомлений с фильтрацией и пагинацией
     */
    /**
     * Получение списка уведомлений с фильтрацией и пагинацией
     * Примечание: Временно возвращает пустой список, так как API не реализовано
     */
    getNotifications: builder.query({
      query: (params) => ({
        url: '/notifications/',
        params: { ...params },
      }),
      providesTags: (result) => 
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'Notifications' as const, id })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),

    /**
     * Получение количества непрочитанных уведомлений
     */
    /**
     * Получение количества непрочитанных уведомлений
     * Примечание: Временно возвращает 0, так как API не реализовано
     */
    getUnreadCount: builder.query({
      query: () => '/notifications/unread-count/',
      providesTags: [{ type: 'Notifications', id: 'COUNT' }],
    }),

    /**
     * Отметка уведомления как прочитанное
     */
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/mark-read/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notifications', id },
        { type: 'Notifications', id: 'COUNT' },
      ],
    }),

    /**
     * Отметка всех уведомлений как прочитанные
     */
    markAllAsRead: builder.mutation({
      query: () => ({
        url: '/notifications/mark-all-read/',
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'COUNT' },
      ],
    }),

    /**
     * Удаление уведомления
     */
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notifications', id },
        { type: 'Notifications', id: 'COUNT' },
      ],
    }),

    /**
     * Очистка всех уведомлений
     */
    clearAllNotifications: builder.mutation({
      query: () => ({
        url: '/notifications/clear-all/',
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'COUNT' },
      ],
    }),

    /**
     * Получение настроек уведомлений
     */
    getNotificationSettings: builder.query({
      query: () => '/settings/',
      transformResponse: (response: any) => response[0],
      providesTags: ['NotificationSettings'],
    }),

    /**
     * Обновление настроек уведомлений
     */
    updateNotificationSettings: builder.mutation({
      query: (settings) => ({
        url: `/settings/${settings.id}/`,
        method: 'PATCH',
        body: settings,
      }),
      invalidatesTags: ['NotificationSettings'],
    }),

    /**
     * Получение публичного VAPID ключа для push-уведомлений
     */
    getVapidPublicKey: builder.query({
      query: () => '/push/public-key/',
    }),

    /**
     * Создание новой push-подписки
     */
    createPushSubscription: builder.mutation({
      query: (subscription) => ({
        url: '/push/',
        method: 'POST',
        body: subscription,
      }),
      invalidatesTags: ['PushSubscriptions'],
    }),

    /**
     * Удаление push-подписки
     */
    deletePushSubscription: builder.mutation({
      query: (endpoint) => ({
        url: '/push/unsubscribe/',
        method: 'POST',
        body: { endpoint },
      }),
      invalidatesTags: ['PushSubscriptions'],
    }),
  }),
});

/**
 * Экспорт хуков для взаимодействия с API
 */
export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useGetVapidPublicKeyQuery,
  useCreatePushSubscriptionMutation,
  useDeletePushSubscriptionMutation,
} = notificationsApi;
