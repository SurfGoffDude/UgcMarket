/**
 * Сервис-воркер для обработки push-уведомлений
 */

// Версия кэша для инвалидации
const CACHE_VERSION = 'v1';
const CACHE_NAME = `ugc-market-cache-${CACHE_VERSION}`;

// Обработчик события установки сервис-воркера
self.addEventListener('install', (event) => {
  console.log('Service Worker устанавливается');
  self.skipWaiting(); // Немедленно активировать новую версию
});

// Обработчик события активации сервис-воркера
self.addEventListener('activate', (event) => {
  console.log('Service Worker активирован');
  
  // Очистка старых кэшей
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: удаление старого кэша', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Захват управления всеми клиентами
  return self.clients.claim();
});

// Обработчик события push-уведомлений
self.addEventListener('push', (event) => {
  console.log('Push уведомление получено', event);
  
  // Проверяем наличие данных в push-событии
  if (!event.data) {
    console.log('Push событие без данных');
    return;
  }
  
  try {
    // Пытаемся разобрать данные как JSON
    const data = event.data.json();
    
    // Формируем объект уведомления
    const notificationOptions = {
      body: data.body || 'Новое уведомление от UGC Market',
      icon: data.icon || '/logo192.png',
      badge: data.badge || '/notification-badge.png',
      data: data.data || {},
      tag: data.data?.notification_id?.toString() || Date.now().toString(),
      renotify: true,
      requireInteraction: data.data?.priority === 'high',
      actions: [],
      vibrate: [100, 50, 100]
    };
    
    // Добавляем действия в зависимости от типа уведомления
    if (data.data?.notification_type === 'message') {
      notificationOptions.actions.push({
        action: 'view',
        title: 'Просмотреть'
      }, {
        action: 'reply',
        title: 'Ответить'
      });
    } else if (data.data?.url) {
      notificationOptions.actions.push({
        action: 'open',
        title: 'Открыть'
      });
    }
    
    // Отправляем уведомление
    event.waitUntil(
      self.registration.showNotification(data.title || 'UGC Market', notificationOptions)
    );
  } catch (error) {
    console.error('Ошибка обработки push-уведомления:', error);
    
    // Показываем дефолтное уведомление в случае ошибки
    event.waitUntil(
      self.registration.showNotification('UGC Market', {
        body: 'У вас новое уведомление',
        icon: '/logo192.png'
      })
    );
  }
});

// Обработчик нажатия на уведомление
self.addEventListener('notificationclick', (event) => {
  console.log('Нажатие на уведомление', event);
  
  // Закрываем уведомление
  event.notification.close();
  
  // Получаем действие и данные
  const action = event.action;
  const notificationData = event.notification.data || {};
  const url = notificationData.url || '/';
  
  // Определяем действие
  let targetUrl = url;
  
  if (action === 'view' || action === 'open') {
    targetUrl = url;
  } else if (action === 'reply' && notificationData.notification_type === 'message') {
    targetUrl = `/messages?chat=${notificationData.chat_id || ''}`;
  } else if (action === '') {
    // Действие по умолчанию при нажатии на уведомление без выбора действия
    targetUrl = url;
  }
  
  // Открываем или фокусируем вкладку
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Проверяем, есть ли уже открытые окна
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Если нет открытых окон, открываем новое
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Обработчик закрытия уведомления
self.addEventListener('notificationclose', (event) => {
  console.log('Уведомление закрыто', event);
  
  // Можно добавить аналитику или другие действия при закрытии уведомления
});

// Обработчик fetch для оффлайн-функциональности (не обязательно для push-уведомлений)
self.addEventListener('fetch', (event) => {
  // Базовая стратегия сетевого взаимодействия
  // Сначала пытаемся получить из сети, если не получается - из кэша
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
