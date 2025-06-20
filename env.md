# Переменные окружения для системы уведомлений UGC Market

## Email настройки
```
# SMTP-сервер для отправки электронных писем
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=notifications@yourservice.com
EMAIL_HOST_PASSWORD=your_secure_password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=UGC Market <notifications@yourservice.com>

# Настройки для тестирования в режиме разработки (опционально)
# EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

## Push-уведомления
```
# Firebase Cloud Messaging для веб-push уведомлений
FCM_API_KEY=your_firebase_api_key
FCM_SENDER_ID=your_firebase_sender_id
FCM_APP_ID=your_firebase_app_id
FCM_PROJECT_ID=your_firebase_project_id
FCM_MEASUREMENT_ID=your_firebase_measurement_id
```

## Web Push VAPID ключи (альтернатива Firebase)
```
# Публичный и приватный VAPID ключи для Web Push API
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_ADMIN_EMAIL=admin@yourservice.com
```

## Redis/Celery (для управления очередями уведомлений)
```
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

Примечание: Для генерации VAPID ключей можно использовать пакет `web-push`:
```bash
npx web-push generate-vapid-keys
```

Для Firebase проекта, ключи нужно получить в Firebase Console после создания проекта.
