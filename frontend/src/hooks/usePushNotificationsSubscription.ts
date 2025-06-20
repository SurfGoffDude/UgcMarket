/**
 * Хук для управления подпиской на push-уведомления.
 * 
 * Предоставляет функциональность для проверки поддержки push-уведомлений,
 * управления подпиской и обновления статуса подписки.
 */
import { useState, useEffect, useCallback } from 'react';
import { useGetVapidPublicKeyQuery, useCreatePushSubscriptionMutation, useDeletePushSubscriptionMutation } from '../api/notificationsApi';
import { getBrowserName, getDeviceType, isPushNotificationSupported, isServiceWorkerSupported, checkNotificationPermission } from '../utils/deviceInfo.ts';
import { VAPIDPublicKey } from '../types/notifications';

/**
 * Преобразует base64 строку в Uint8Array для использования в applicationServerKey
 * @param base64String - Строка в формате base64 URL
 * @returns Массив Uint8Array для использования в applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Интерфейс возвращаемого объекта хука
 */
interface PushNotificationsSubscriptionResult {
  isPushSupported: boolean;          // Поддерживаются ли push-уведомления в этом браузере
  isSubscribed: boolean;             // Подписан ли пользователь на push-уведомления
  isSubscribing: boolean;            // Выполняется ли процесс подписки/отписки
  subscriptionError: string | null;  // Ошибка подписки, если есть
  subscribeUserToPush: () => Promise<boolean>;      // Метод для подписки пользователя
  unsubscribeUserFromPush: () => Promise<boolean>;  // Метод для отписки пользователя
}

/**
 * Хук для работы с push-уведомлениями
 */
export const usePushNotificationsSubscription = (): PushNotificationsSubscriptionResult => {
  // Получаем публичный VAPID ключ для шифрования
  const { data: vapidKey } = useGetVapidPublicKeyQuery({});
  
  // Мутации API для создания и удаления подписки
  const [createSubscription] = useCreatePushSubscriptionMutation();
  const [deleteSubscription] = useDeletePushSubscriptionMutation();
  
  // Состояния
  const [isPushSupported, setIsPushSupported] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  
  /**
   * При монтировании компонента проверяем поддержку Push API
   * и текущий статус подписки
   */
  useEffect(() => {
    const checkPushSupport = async () => {
      try {
        // Проверяем наличие Service Worker API, Push API и Notification API
        const swSupported = isServiceWorkerSupported();
        const pushSupported = isPushNotificationSupported();
        const notificationSupported = await checkNotificationPermission();
        
        const supported = swSupported && pushSupported && notificationSupported;
        setIsPushSupported(supported);
        
        if (supported) {
          // Проверяем статус существующей подписки
          await checkSubscriptionStatus();
        }
      } catch (error) {
        console.error('Ошибка при проверке поддержки push-уведомлений:', error);
        setIsPushSupported(false);
      }
    };
    
    checkPushSupport();
  }, []);
  
  /**
   * Проверяет текущий статус подписки пользователя на push-уведомления
   */
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      if (!isPushSupported) return;
      
      // Получаем регистрацию Service Worker
      const registration = await navigator.serviceWorker.ready;
      
      // Получаем текущую подписку
      const subscription = await registration.pushManager.getSubscription();
      
      setIsSubscribed(!!subscription);
      return !!subscription;
    } catch (error) {
      console.error('Ошибка при проверке статуса подписки:', error);
      setSubscriptionError('Не удалось проверить статус подписки');
      return false;
    }
  }, [isPushSupported]);
  
  /**
   * Подписывает пользователя на push-уведомления
   */
  const subscribeUserToPush = async (): Promise<boolean> => {
    try {
      if (!isPushSupported) {
        setSubscriptionError('Push-уведомления не поддерживаются');
        return false;
      }
      
      const typedVapidKey = vapidKey as VAPIDPublicKey;
      
      if (!typedVapidKey || !typedVapidKey.publicKey) {
        setSubscriptionError('Отсутствует VAPID ключ для шифрования');
        return false;
      }
      
      setIsSubscribing(true);
      setSubscriptionError(null);
      
      // Запрашиваем разрешение на показ уведомлений
      const permission = await checkNotificationPermission();
      if (!permission) {
        setSubscriptionError('Необходимо разрешить показ уведомлений в браузере');
        setIsSubscribing(false);
        return false;
      }
      
      // Получаем регистрацию Service Worker
      const registration = await navigator.serviceWorker.ready;
      
      // Отписываемся от существующей подписки, если есть
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      }
      
      // Создаем новую подписку
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(typedVapidKey.publicKey)
      });
      
      // Преобразуем подписку в JSON для сервера
      const subscriptionJson = newSubscription.toJSON();
      
      // Сохраняем подписку на сервере
      await createSubscription({
        endpoint: subscriptionJson.endpoint,
        p256dh: subscriptionJson.keys?.p256dh || '',
        auth: subscriptionJson.keys?.auth || '',
        browser: getBrowserName(),
        device_type: getDeviceType(),
        active: true
      });
      
      setIsSubscribed(true);
      setIsSubscribing(false);
      return true;
    } catch (error) {
      console.error('Ошибка при подписке на push-уведомления:', error);
      setSubscriptionError('Ошибка при подписке на push-уведомления');
      setIsSubscribing(false);
      return false;
    }
  };
  
  /**
   * Отписывает пользователя от push-уведомлений
   */
  const unsubscribeUserFromPush = async (): Promise<boolean> => {
    try {
      if (!isPushSupported) return false;
      
      setIsSubscribing(true);
      setSubscriptionError(null);
      
      // Получаем регистрацию Service Worker
      const registration = await navigator.serviceWorker.ready;
      
      // Получаем текущую подписку
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Отправляем запрос на удаление подписки на сервере
        await deleteSubscription(subscription.endpoint);
        
        // Отменяем подписку в браузере
        await subscription.unsubscribe();
        
        setIsSubscribed(false);
      }
      
      setIsSubscribing(false);
      return true;
    } catch (error) {
      console.error('Ошибка при отписке от push-уведомлений:', error);
      setSubscriptionError('Ошибка при отписке от push-уведомлений');
      setIsSubscribing(false);
      return false;
    }
  };
  
  return {
    isPushSupported,
    isSubscribed,
    isSubscribing,
    subscriptionError,
    subscribeUserToPush,
    unsubscribeUserFromPush
  };
};


