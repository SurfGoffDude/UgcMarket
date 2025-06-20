/**
 * Класс для управления push-уведомлениями в браузере
 * 
 * Этот класс обеспечивает:
 * - Проверку поддержки Push API в браузере
 * - Запрос разрешений на отправку уведомлений
 * - Регистрацию Service Worker
 * - Подписку и отписку от push-уведомлений
 * - Сохранение данных подписки на сервере
 * - Получение списка активных подписок
 */
class PushNotificationManager {
  /**
   * Конструктор класса
   * 
   * @param {Object} options Настройки push-уведомлений
   * @param {string} options.serviceWorkerPath Путь к файлу Service Worker (по умолчанию '/service-worker.js')
   * @param {string} options.vapidPublicKeyUrl URL для получения публичного VAPID-ключа (по умолчанию '/api/security/push/vapid_public_key/')
   * @param {string} options.subscribeUrl URL для сохранения подписки (по умолчанию '/api/security/push/subscribe/')
   * @param {string} options.unsubscribeUrl URL для отмены подписки (по умолчанию '/api/security/push/unsubscribe/')
   * @param {string} options.subscriptionsUrl URL для получения списка подписок (по умолчанию '/api/security/push/subscriptions/')
   */
  constructor(options = {}) {
    this.serviceWorkerPath = options.serviceWorkerPath || '/service-worker.js';
    this.vapidPublicKeyUrl = options.vapidPublicKeyUrl || '/api/security/push/vapid_public_key/';
    this.subscribeUrl = options.subscribeUrl || '/api/security/push/subscribe/';
    this.unsubscribeUrl = options.unsubscribeUrl || '/api/security/push/unsubscribe/';
    this.subscriptionsUrl = options.subscriptionsUrl || '/api/security/push/subscriptions/';
    
    // Проверяем поддержку уведомлений и Service Worker в браузере
    this.supported = ('serviceWorker' in navigator) && ('PushManager' in window);
    
    this.registration = null;
    this.vapidPublicKey = null;
  }

  /**
   * Инициализация менеджера push-уведомлений
   * 
   * @returns {Promise<boolean>} Promise, который резолвится в true если инициализация прошла успешно
   */
  async init() {
    if (!this.supported) {
      console.warn('Push-уведомления не поддерживаются в данном браузере');
      return false;
    }
    
    try {
      // Регистрируем Service Worker
      this.registration = await this.registerServiceWorker();
      
      // Получаем VAPID публичный ключ с сервера
      this.vapidPublicKey = await this.fetchVapidPublicKey();
      
      return true;
    } catch (error) {
      console.error('Ошибка при инициализации push-уведомлений:', error);
      return false;
    }
  }

  /**
   * Регистрация Service Worker
   * 
   * @returns {Promise<ServiceWorkerRegistration>} Promise, который резолвится в регистрацию Service Worker
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register(this.serviceWorkerPath);
      console.log('Service Worker успешно зарегистрирован:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Ошибка при регистрации Service Worker:', error);
      throw error;
    }
  }

  /**
   * Получение публичного VAPID-ключа с сервера
   * 
   * @returns {Promise<string>} Promise, который резолвится в публичный VAPID-ключ
   */
  async fetchVapidPublicKey() {
    try {
      const response = await fetch(this.vapidPublicKeyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ошибка! Статус: ${response.status}`);
      }
      
      const data = await response.json();
      return data.vapidPublicKey;
    } catch (error) {
      console.error('Ошибка при получении VAPID-ключа:', error);
      throw error;
    }
  }

  /**
   * Преобразование base64 строки в Uint8Array
   * 
   * @param {string} base64String Base64 строка
   * @returns {Uint8Array} Массив байтов
   */
  urlBase64ToUint8Array(base64String) {
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
   * Запрос разрешения на отправку уведомлений
   * 
   * @returns {Promise<string>} Promise, который резолвится в строку со статусом разрешения
   */
  async requestNotificationPermission() {
    if (!this.supported) {
      return 'unsupported';
    }
    
    try {
      // Запрашиваем разрешение на получение уведомлений
      const permission = await Notification.requestPermission();
      console.log('Разрешение на уведомления:', permission);
      return permission;
    } catch (error) {
      console.error('Ошибка при запросе разрешения на уведомления:', error);
      return 'error';
    }
  }

  /**
   * Проверка текущего состояния подписки
   * 
   * @returns {Promise<boolean>} Promise, который резолвится в true, если пользователь подписан
   */
  async isSubscribed() {
    if (!this.supported || !this.registration) {
      return false;
    }
    
    try {
      const subscription = await this.registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Ошибка при проверке состояния подписки:', error);
      return false;
    }
  }

  /**
   * Получение текущей подписки или создание новой
   * 
   * @returns {Promise<PushSubscription>} Promise, который резолвится в объект подписки
   */
  async getSubscription() {
    if (!this.supported || !this.registration || !this.vapidPublicKey) {
      throw new Error('Push-уведомления не поддерживаются или инициализация не завершена');
    }
    
    // Проверяем существующую подписку
    let subscription = await this.registration.pushManager.getSubscription();
    
    if (subscription) {
      return subscription;
    }
    
    // Если подписки нет, создаем новую
    const permission = await this.requestNotificationPermission();
    
    if (permission !== 'granted') {
      throw new Error('Разрешение на отправку уведомлений не предоставлено');
    }
    
    // Создаем новую подписку
    const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
    
    subscription = await this.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });
    
    return subscription;
  }

  /**
   * Подписка на push-уведомления
   * 
   * @returns {Promise<boolean>} Promise, который резолвится в true, если подписка успешна
   */
  async subscribe() {
    try {
      // Получаем подписку
      const subscription = await this.getSubscription();
      
      // Отправляем данные подписки на сервер
      const response = await fetch(this.subscribeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCsrfToken()
        },
        credentials: 'include',
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ошибка! Статус: ${response.status}`);
      }
      
      console.log('Успешная подписка на push-уведомления');
      return true;
    } catch (error) {
      console.error('Ошибка при подписке на push-уведомления:', error);
      return false;
    }
  }

  /**
   * Отписка от push-уведомлений
   * 
   * @returns {Promise<boolean>} Promise, который резолвится в true, если отписка успешна
   */
  async unsubscribe() {
    if (!this.supported || !this.registration) {
      return false;
    }
    
    try {
      // Получаем существующую подписку
      const subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('Нет активной подписки для отмены');
        return true;
      }
      
      // Получаем данные подписки перед отменой
      const subscriptionData = subscription.toJSON();
      
      // Отменяем подписку на стороне браузера
      const unsubscribed = await subscription.unsubscribe();
      
      if (unsubscribed) {
        // Отправляем запрос на сервер для удаления подписки
        const response = await fetch(this.unsubscribeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.getCsrfToken()
          },
          credentials: 'include',
          body: JSON.stringify({
            subscription: subscriptionData
          })
        });
        
        if (!response.ok) {
          console.warn('Не удалось удалить подписку на сервере:', response.statusText);
        }
        
        console.log('Успешная отписка от push-уведомлений');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Ошибка при отписке от push-уведомлений:', error);
      return false;
    }
  }

  /**
   * Получение списка активных подписок пользователя
   * 
   * @returns {Promise<Array>} Promise, который резолвится в массив активных подписок
   */
  async getSubscriptions() {
    try {
      const response = await fetch(this.subscriptionsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ошибка! Статус: ${response.status}`);
      }
      
      const data = await response.json();
      return data.subscriptions || [];
    } catch (error) {
      console.error('Ошибка при получении списка подписок:', error);
      return [];
    }
  }

  /**
   * Получение CSRF-токена из cookies
   * 
   * @returns {string} CSRF-токен или пустая строка
   */
  getCsrfToken() {
    const tokenMatch = document.cookie.match(/csrftoken=([^;]+)/);
    return tokenMatch ? tokenMatch[1] : '';
  }
}

export default PushNotificationManager;