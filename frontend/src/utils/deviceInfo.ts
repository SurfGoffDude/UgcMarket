/**
 * Утилиты для определения информации об устройстве пользователя.
 * 
 * Позволяют определить тип браузера и устройства для идентификации
 * push-подписок и корректной работы с уведомлениями.
 */

/**
 * Определяет название браузера пользователя на основе User-Agent.
 * 
 * @returns {string} Название браузера (Chrome, Firefox, Safari и т.д.)
 */
export const getBrowserName = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.match(/chrome|chromium|crios/i)) {
    return 'Chrome';
  } else if (userAgent.match(/firefox|fxios/i)) {
    return 'Firefox';
  } else if (userAgent.match(/safari/i)) {
    return 'Safari';
  } else if (userAgent.match(/opr\//i)) {
    return 'Opera';
  } else if (userAgent.match(/edg/i)) {
    return 'Edge';
  } else if (userAgent.match(/android/i)) {
    return 'Android Browser';
  } else if (userAgent.match(/iphone|ipad/i)) {
    return 'Mobile Safari';
  } else {
    return 'Unknown Browser';
  }
};

/**
 * Определяет тип устройства пользователя на основе User-Agent.
 * 
 * @returns {string} Тип устройства (desktop, tablet или mobile)
 */
export const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  
  // Проверка мобильных устройств и планшетов
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  
  if (isTablet) {
    return 'tablet';
  } else if (isMobile) {
    return 'mobile';
  } else {
    return 'desktop';
  }
};

/**
 * Проверяет, поддерживает ли браузер Service Worker API.
 * 
 * @returns {boolean} true если браузер поддерживает Service Worker API
 */
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

/**
 * Проверяет, поддерживает ли браузер Push API.
 * 
 * @returns {boolean} true если браузер поддерживает Push API
 */
export const isPushNotificationSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Проверяет, поддерживает ли браузер Notification API.
 * 
 * @returns {boolean} true если браузер поддерживает Notification API
 */
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

/**
 * Проверяет разрешение на показ уведомлений.
 * 
 * @returns {Promise<boolean>} Promise, который разрешается в true, если разрешения предоставлены
 */
export const checkNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }
  
  // Проверяем текущие разрешения
  if (Notification.permission === 'granted') {
    return true;
  }
  
  // Запрашиваем разрешение
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};
