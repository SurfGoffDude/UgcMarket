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
  endpoints: (builder: any) => ({
    /**
     * Получение списка уведомлений с фильтрацией и пагинацией
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
