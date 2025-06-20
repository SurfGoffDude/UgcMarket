/**
 * Service Worker для обработки push-уведомлений
 * 
 * Этот скрипт регистрируется в браузере и работает в фоновом режиме,
 * позволяя принимать push-уведомления даже при закрытом браузере.
 */

// Обработка установки Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker установлен');
  self.skipWaiting();
});

// Обработка активации Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker активирован');
  return self.clients.claim();
});

/**
 * Обработчик push-уведомлений
 * Принимает зашифрованные данные, расшифровывает их и показывает уведомление
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push-уведомление получено, но не содержит данных');
    return;
  }

  try {
    // Получаем данные уведомления
    const data = event.data.json();
    console.log('Push-уведомление получено:', data);

    // Формируем объект опций для уведомления
    const options = {
      body: data.message || 'Новое уведомление',
      icon: '/icons/notification-icon.png',
      badge: '/icons/notification-badge.png',
      vibrate: [100, 50, 100],
      data: data,
      actions: [],
    };

    // Добавляем действия в зависимости от типа уведомления
    if (data.notification_type === 'message') {
      options.actions.push({
        action: 'view-message',
        title: 'Открыть сообщение'
      });
    } else if (data.notification_type === 'order') {
      options.actions.push({
        action: 'view-order',
        title: 'Просмотр заказа'
      });
    }

    // Показываем уведомление
    event.waitUntil(
      self.registration.showNotification(data.title || 'UgcMarket', options)
    );
  } catch (error) {
    console.error('Ошибка при обработке push-уведомления:', error);
  }
});

/**
 * Обработчик клика по уведомлению
 * Открывает нужную страницу приложения в зависимости от типа уведомления
 */
self.addEventListener('notificationclick', (event) => {
  console.log('Клик по уведомлению');
  
  // Закрываем уведомление
  event.notification.close();

  // Получаем данные уведомления
  const data = event.notification.data;
  let url = '/notifications';

  // Определяем URL для перехода в зависимости от действия или типа уведомления
  if (event.action === 'view-message') {
    url = `/messages/${data.related_object_id || ''}`;
  } else if (event.action === 'view-order') {
    url = `/orders/${data.related_object_id || ''}`;
  } else if (data.link) {
    url = data.link;
  } else {
    // В зависимости от типа уведомления
    switch (data.notification_type) {
      case 'message':
        url = '/messages';
        break;
      case 'order':
        url = '/orders';
        break;
      case 'payment':
        url = '/payments';
        break;
      case 'review':
        url = '/reviews';
        break;
      default:
        url = '/notifications';
    }
  }

  // Открываем или фокусируем вкладку с нашим приложением
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientsArr) => {
      // Проверяем, есть ли уже открытые вкладки с нашим приложением
      const hadWindowToFocus = clientsArr.some((windowClient) => {
        if (windowClient.url === url) {
          // Уже есть вкладка с нужным URL, фокусируемся на ней
          return windowClient.focus();
        }
        return false;
      });

      // Если вкладки нет, открываем новую
      if (!hadWindowToFocus) {
        return self.clients
          .openWindow(url)
          .then((windowClient) => (windowClient ? windowClient.focus() : null));
      }
    })
  );
});

/**
 * Обработчик закрытия уведомления
 */
self.addEventListener('notificationclose', (event) => {
  console.log('Уведомление закрыто');
});
