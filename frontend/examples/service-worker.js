/**
 * Service Worker для обработки push-уведомлений в UGC Market
 * 
 * Этот файл следует разместить в корневой директории веб-сайта,
 * чтобы Service Worker имел доступ ко всей области действия сайта.
 */

// Событие при получении push-уведомления
self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Notification получено');
    
    let notificationData = {
        title: 'UGC Market',
        body: 'Новое уведомление',
        icon: '/static/images/logo.png',
        badge: '/static/images/badge.png',
        tag: 'default',
        url: '/'
    };
    
    // Пытаемся распарсить данные из уведомления
    if (event.data) {
        try {
            const data = event.data.json();
            
            // Объединяем полученные данные с данными по умолчанию
            notificationData = {
                ...notificationData,
                ...data
            };
            
            console.log('[Service Worker] Получены данные уведомления:', data);
        } catch (e) {
            console.error('[Service Worker] Ошибка при разборе данных push-уведомления:', e);
        }
    }
    
    // Показываем уведомление
    const showNotificationPromise = self.registration.showNotification(
        notificationData.title, 
        {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge, // Маленький значок для уведомлений (для Android)
            tag: notificationData.tag, // Тег для группировки уведомлений
            data: {
                url: notificationData.url, // URL для перехода при клике
                // Можно добавить любые другие данные
                notificationId: notificationData.id || Date.now()
            },
            // Действия, кнопки в уведомлении (опционально)
            actions: notificationData.actions || []
        }
    );
    
    // Уведомление должно быть показано до завершения события
    event.waitUntil(showNotificationPromise);
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Клик по уведомлению');
    
    // Закрываем уведомление
    event.notification.close();
    
    // Получаем URL из данных уведомления
    let url = '/';
    if (event.notification.data && event.notification.data.url) {
        url = event.notification.data.url;
    }
    
    // Если пользователь кликнул по действию (кнопке)
    if (event.action) {
        console.log('[Service Worker] Выбрано действие:', event.action);
        // Можно обработать разные действия по-разному
    }
    
    // Открываем или фокусируем окно с нужным URL
    const openPromise = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then(function(clientList) {
        // Проверяем, есть ли уже открытое окно
        for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            // Если окно уже открыто, фокусируемся на нем и навигируем
            if (client.url === url && 'focus' in client) {
                return client.focus();
            }
        }
        
        // Если нет открытого окна, открываем новое
        if (clients.openWindow) {
            return clients.openWindow(url);
        }
    });
    
    event.waitUntil(openPromise);
});

// Обработка закрытия уведомления
self.addEventListener('notificationclose', function(event) {
    console.log('[Service Worker] Уведомление закрыто без клика', event);
});

// Кэширование статических ресурсов (опционально)
const CACHE_NAME = 'ugc-market-cache-v1';
const urlsToCache = [
    '/',
    '/static/css/main.css',
    '/static/js/main.js',
    '/static/images/logo.png',
    '/static/images/badge.png'
];

// Установка Service Worker и кэширование
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('[Service Worker] Кэширование ресурсов');
                return cache.addAll(urlsToCache);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Активация');
    
    // Очистка старых кэшей
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName !== CACHE_NAME;
                }).map(function(cacheName) {
                    console.log('[Service Worker] Удаление старого кэша', cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
    );
    
    // Захват управления всеми клиентами сразу
    return self.clients.claim();
});