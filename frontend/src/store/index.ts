/**
 * Конфигурация Redux store для приложения
 * 
 * Объединяет все редьюсеры и middleware для работы с глобальным состоянием.
 * Настраивает RTK Query для работы с API уведомлений.
 */
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { notificationsApi } from '../api/notificationsApi';

/**
 * Корневой Redux store приложения
 * 
 * @remarks
 * Содержит все редьюсеры, включая автоматически сгенерированные редьюсеры из RTK Query.
 * Настраивает middleware для работы с асинхронными запросами.
 * 
 * @returns Сконфигурированный Redux store
 */
export const store = configureStore({
  reducer: {
    // Добавляем редьюсеры из RTK Query API
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    // Сюда можно добавить другие редьюсеры при необходимости
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(notificationsApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Настройка слушателей для refetchOnFocus/refetchOnReconnect
setupListeners(store.dispatch);

// Экспорт типов для TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
