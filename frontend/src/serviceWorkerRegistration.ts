/**
 * Регистрация Service Worker для поддержки push-уведомлений
 * 
 * Этот модуль содержит функции для регистрации и обновления Service Worker
 * в браузере пользователя, что необходимо для работы push-уведомлений.
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

/**
 * Регистрация Service Worker
 * @param config - Конфигурация с колбэками для успешной регистрации и обновления
 */
export function register(config?: Config): void {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Service Worker не будет работать, если PUBLIC_URL находится на другом домене
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // На локальном хосте сначала проверяем существование Service Worker
        checkValidServiceWorker(swUrl, config);

        // Добавляем дополнительную информацию для разработки
        navigator.serviceWorker.ready.then(() => {
          console.log('Service Worker зарегистрирован в режиме разработки');
        });
      } else {
        // На продакшене сразу регистрируем Service Worker
        registerValidSW(swUrl, config);
      }
    });
  }
}

/**
 * Регистрация Service Worker с проверкой обновлений
 */
function registerValidSW(swUrl: string, config?: Config): void {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Новая версия Service Worker доступна
              console.log('Новая версия Service Worker доступна');
              
              // Выполняем колбэк при обновлении, если он предоставлен
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Service Worker установлен впервые
              console.log('Service Worker готов к использованию (кэширован для оффлайн режима)');
              
              // Выполняем колбэк при успешной установке, если он предоставлен
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Ошибка при регистрации Service Worker:', error);
    });
}

/**
 * Проверка валидности Service Worker и его регистрация
 */
function checkValidServiceWorker(swUrl: string, config?: Config): void {
  // Проверяем, доступен ли Service Worker, делая запрос к нему
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Убеждаемся, что Service Worker существует и что у нас есть валидный ответ
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // Service Worker не найден или ответ неверный. Перезагружаем страницу
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service Worker найден, регистрируем его
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('Интернет-соединение отсутствует. Приложение работает в оффлайн режиме.');
    });
}

/**
 * Отмена регистрации Service Worker
 */
export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('Ошибка при отмене регистрации Service Worker:', error);
      });
  }
}
