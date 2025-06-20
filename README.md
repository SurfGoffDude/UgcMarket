# UGC Market Platform

Платформа для заказа UGC-контента у создателей. Позволяет создателям услуг (креаторам) предлагать свои услуги, а клиентам - находить и заказывать их.

## 🚀 Основные возможности

- **Аутентификация и управление профилями**
  - Регистрация и вход для клиентов и создателей
  - Управление профилем пользователя
  - Аватарки и личная информация

- **Услуги**
  - Создание и управление услугами
  - Категории и теги
  - Гибкие настройки цен и сроков
  - Загрузка медиафайлов

- **Заказы**
  - Система заказов с отслеживанием статуса
  - Обмен сообщениями между клиентом и создателем
  - Управление сроками сдачи работы
  - Возможность запросить доработку

- **Платежи**
  - Интеграция с платежными системами (YooKassa, CloudPayments)
  - Безопасные транзакции
  - История платежей

- **Чат**
  - Встроенная система обмена сообщениями
  - Уведомления о новых сообщениях
  - Прикрепление файлов к сообщениям

- **Отзывы и рейтинги**
  - Оценка выполненных заказов
  - Отзывы с возможностью прикрепления медиа
  - Рейтинг создателей

## 🛠 Технологии

- **Бэкенд**:
  - Python 3.13+
  - Django 5.0
  - Django REST Framework 3.14
  - PostgreSQL 14+
  - Redis 7.0+
  - Celery 5.3
  - Gunicorn

- **Фронтенд**:
  - React 18+
  - TypeScript
  - Redux Toolkit
  - React Router 6
  - Material-UI 5
  - Axios

- **Инфраструктура**:
  - Docker
  - Docker Compose
  - Nginx
  - GitHub Actions (CI/CD)
  - Sentry (мониторинг ошибок)

## 🚀 Установка и запуск

### Требования

- Docker 20.10+
- Docker Compose 2.0+
- Python 3.10+
- Node.js 18+ (для фронтенда)

### Настройка окружения

1. Клонируйте репозиторий:
   ```bash
   git clone <repository-url>
   cd ugc-market
   ```

2. Создайте файл `.env` в корне проекта на основе `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Настройте переменные окружения в файле `.env`:
   ```env
   # Django
   DEBUG=True
   SECRET_KEY=your-secret-key
   ALLOWED_HOSTS=localhost,127.0.0.1
   
   # Database
   POSTGRES_DB=ugc_market
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_HOST=db
   POSTGRES_PORT=5432
   
   # Redis
   REDIS_URL=redis://redis:6379/0
   
   # Celery
   CELERY_BROKER_URL=redis://redis:6379/1
   CELERY_RESULT_BACKEND=redis://redis:6379/1
   
   # Media files
   MEDIA_URL=/media/
   MEDIA_ROOT=/app/media/
   
   # Static files
   STATIC_URL=/static/
   STATIC_ROOT=/app/staticfiles/
   ```

### Запуск с помощью Docker (рекомендуется)

1. Соберите и запустите контейнеры:
   ```bash
   docker-compose up --build -d
   ```

2. Выполните миграции:
   ```bash
   docker-compose exec web python manage.py migrate
   ```

3. Создайте суперпользователя (опционально):
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```

4. Приложение будет доступно по адресу: http://localhost:8000

### Локальная разработка (без Docker)

1. Создайте виртуальное окружение и активируйте его:
   ```bash
   python -m venv venv
   source venv/bin/activate  # На Linux/macOS
   # ИЛИ
   .\venv\Scripts\activate  # На Windows
   ```

2. Установите зависимости:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Установите и настройте PostgreSQL и Redis

4. Примените миграции:
   ```bash
   cd backend
   python manage.py migrate
   ```

5. Запустите сервер разработки:
   ```bash
   python manage.py runserver
   ```

6. В отдельном терминале запустите Celery worker:
   ```bash
   celery -A config worker -l info
   ```

7. В еще одном терминале запустите Celery beat (для периодических задач):
   ```bash
   celery -A config beat -l info
   ```

8. Приложение будет доступно по адресу: http://127.0.0.1:8000

## 🏗 Структура проекта

```
ugc-market/
├── .github/                  # GitHub Actions workflows
├── backend/                   # Django проект
│   ├── apps/
│   │   ├── accounts/         # Аутентификация и профили пользователей
│   │   ├── orders/           # Заказы и управление заказами
│   │   ├── services/         # Услуги и категории
│   │   ├── messaging/        # Система обмена сообщениями
│   │   ├── payments/         # Интеграция с платежными системами
│   │   ├── reviews/          # Отзывы и рейтинги
│   │   └── storage/          # Управление файлами и медиа
│   ├── config/               # Настройки Django
│   │   ├── settings/         # Настройки для разных окружений
│   │   ├── urls.py           # Основные URL-маршруты
│   │   └── asgi.py/wsgi.py   # ASGI/WSGI конфигурация
│   ├── static/               # Статические файлы
│   ├── media/                # Загруженные медиафайлы
│   ├── manage.py             # Управление Django
│   └── requirements/         # Зависимости
│       ├── base.txt
│       ├── dev.txt
│       └── prod.txt
├── frontend/                 # React приложение
│   ├── public/               # Статические файлы
│   ├── src/                  # Исходный код
│   │   ├── assets/           # Изображения, шрифты и т.д.
│   │   ├── components/       # Переиспользуемые компоненты
│   │   ├── features/         # Функциональные модули
│   │   ├── hooks/            # Кастомные React хуки
│   │   ├── layouts/          # Макеты страниц
│   │   ├── pages/            # Страницы приложения
│   │   ├── services/         # API сервисы
│   │   ├── store/            # Redux store
│   │   ├── types/            # TypeScript типы
│   │   ├── utils/            # Вспомогательные функции
│   │   ├── App.tsx           # Корневой компонент
│   │   └── index.tsx         # Точка входа
│   ├── package.json          # Зависимости и скрипты
│   └── tsconfig.json         # Настройки TypeScript
├── docker/                   # Docker конфигурации
├── docs/                     # Документация
├── scripts/                  # Вспомогательные скрипты
├── .dockerignore             # Игнорируемые файлы для Docker
├── .env.example              # Пример переменных окружения
├── .gitignore               # Игнорируемые файлы Git
├── docker-compose.yml        # Docker Compose конфигурация
├── Dockerfile               # Dockerfile для продакшена
├── Dockerfile.dev           # Dockerfile для разработки
└── README.md               # Документация
```

## 🔧 Администрирование

### Команды управления

- Создать суперпользователя:
  ```bash
  docker-compose exec web python manage.py createsuperuser
  ```

- Выполнить миграции:
  ```bash
  docker-compose exec web python manage.py migrate
  ```

- Собрать статические файлы:
  ```bash
  docker-compose exec web python manage.py collectstatic --noinput
  ```

- Очистить кеш:
  ```bash
  docker-compose exec web python manage.py clear_cache
  ```

- Удалить устаревшие временные файлы:
  ```bash
  docker-compose exec web python manage.py cleanup_temp_files
  ```

### Планировщик задач (Cron)

В проекте настроены следующие периодические задачи:

- Ежедневная очистка устаревших временных файлов
- Еженедельная архивация старых логов
- Ежемесячная генерация отчетов

## 📚 API документация

API документация доступна после запуска приложения по адресу:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для вашей функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add some amazing feature'`)
4. Отправьте изменения в форк (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📜 Лицензия

Этот проект распространяется под лицензией MIT. См. файл `LICENSE` для получения дополнительной информации.

## 📞 Контакты

По всем вопросам обращайтесь: [ваш.email@example.com](mailto:ваш.email@example.com)

---

<div align="center">
  <sub>Создано с ❤️ для UGC Market Platform</sub>
</div>
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       ├── store/
│       └── styles/
└── docker/                   # Docker конфигурация
    ├── nginx/
    └── postgres/
```

## Разработка

Для запуска в режиме разработки:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

## Лицензия

MIT
