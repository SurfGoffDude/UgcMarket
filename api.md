# Документация по API UGC Market

## Общие сведения

- **Базовый URL**: `/api`
- **Формат запросов/ответов**: JSON
- **Аутентификация**: JWT (JSON Web Token)
- **Заголовки для авторизованных запросов**: 
  - `Authorization: Bearer <access_token>`

## Аутентификация и пользователи

### Регистрация пользователя
- **URL**: `/api/auth/register/`
- **Метод**: `POST`
- **Требует авторизации**: Нет
- **Входные данные**:
  ```json
  {
    "username": "string",
    "email": "user@example.com",
    "password": "string",
    "first_name": "string",
    "last_name": "string"
  }
  ```
- **Ответ** (201 Created):
  ```json
  {
    "id": 1,
    "username": "string",
    "email": "user@example.com",
    "first_name": "string",
    "last_name": "string"
  }
  ```
- **Примечание**: После регистрации на указанный email отправляется письмо с ссылкой для верификации.

### Верификация email
- **URL**: `/api/auth/verify-email/`
- **Метод**: `POST`
- **Требует авторизации**: Нет
- **Входные данные**:
  ```json
  {
    "token": "string"
  }
  ```
- **Ответ** (200 OK):
  ```json
  {
    "message": "Email успешно подтвержден"
  }
  ```

### Получение токена доступа
- **URL**: `/api/auth/token/`
- **Метод**: `POST`
- **Требует авторизации**: Нет
- **Входные данные**:
  ```json
  {
    "username": "string", 
    "password": "string"
  }
  ```
- **Ответ** (200 OK):
  ```json
  {
    "access": "string",
    "refresh": "string"
  }
  ```

### Обновление токена
- **URL**: `/api/auth/token/refresh/`
- **Метод**: `POST`
- **Требует авторизации**: Нет
- **Входные данные**:
  ```json
  {
    "refresh": "string"
  }
  ```
- **Ответ** (200 OK):
  ```json
  {
    "access": "string"
  }
  ```

### Получение данных текущего пользователя
- **URL**: `/api/v1/users/me/`
- **Метод**: `GET`
- **Требует авторизации**: Да
- **Ответ** (200 OK):
  ```json
  {
    "id": 1,
    "username": "string",
    "email": "user@example.com",
    "first_name": "string",
    "last_name": "string",
    "full_name": "string",
    "avatar": "url_string",
    "phone": "string",
    "bio": "string",
    "is_verified": true,
    "user_type": "Клиент",
    "date_joined": "YYYY-MM-DDThh:mm:ss",
    "has_creator_profile": false,
    "has_client_profile": true
  }
  ```

### Обновление профиля пользователя
- **URL**: `/api/v1/users/me/`
- **Метод**: `PATCH`
- **Требует авторизации**: Да
- **Входные данные**:
  ```json
  {
    "first_name": "string",
    "last_name": "string",
    "phone": "string",
    "bio": "string"
  }
  ```
- **Ответ** (200 OK):
  ```json
  {
    "id": 1,
    "username": "string",
    "email": "user@example.com",
    "first_name": "string",
    "last_name": "string",
    "full_name": "string",
    "avatar": "url_string",
    "phone": "string",
    "bio": "string",
    "is_verified": true,
    "user_type": "Клиент",
    "date_joined": "YYYY-MM-DDThh:mm:ss"
  }
  ```

### Создание профиля креатора
- **URL**: `/api/v1/users/me/creator-profile/`
- **Метод**: `POST`
- **Требует авторизации**: Да
- **Входные данные**:
  ```json
  {
    "specialization": "string",
    "experience": "string",
    "portfolio_link": "string",
    "social_links": {
      "instagram": "string",
      "behance": "string",
      "dribbble": "string"
    }
  }
  ```
- **Ответ** (201 Created):
  ```json
  {
    "id": 1,
    "user": {
      "id": 1,
      "username": "string"
    },
    "specialization": "string",
    "experience": "string",
    "portfolio_link": "string",
    "social_links": {
      "instagram": "string",
      "behance": "string",
      "dribbble": "string"
    },
    "rating": 0,
    "completed_orders": 0,
    "created_at": "YYYY-MM-DDThh:mm:ss",
    "updated_at": "YYYY-MM-DDThh:mm:ss"
  }
  ```

### Обновление профиля креатора
- **URL**: `/api/v1/users/me/creator-profile/`
- **Метод**: `PATCH`
- **Требует авторизации**: Да
- **Входные данные**: (любые поля из профиля креатора)
- **Ответ**: (обновленный профиль креатора)

### Получение профиля креатора по ID
- **URL**: `/api/v1/creators/{id}/`
- **Метод**: `GET`
- **Параметры запроса**:
  - `detail=true` - включить детальную информацию (навыки и портфолио)
- **Требует авторизации**: Нет
- **Ответ** (200 OK): (данные профиля креатора)

## Заказы

### Создание заказа
- **URL**: `/api/v1/orders/`
- **Метод**: `POST`
- **Требует авторизации**: Да
- **Входные данные**:
  ```json
  {
    "service_id": 1,
    "requirements": "string",
    "delivery_date": "YYYY-MM-DD",
    "selected_option_ids": [1, 2, 3]
  }
  ```
- **Ответ** (201 Created): (данные созданного заказа)

### Получение списка заказов
- **URL**: `/api/v1/orders/`
- **Метод**: `GET`
- **Требует авторизации**: Да
- **Параметры запроса**:
  - `status`: фильтр по статусу заказа
  - `page`: номер страницы для пагинации
  - `page_size`: размер страницы
- **Ответ** (200 OK):
  ```json
  {
    "count": 100,
    "next": "http://api.example.org/orders/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "service": { /* данные сервиса */ },
        "buyer": { /* краткие данные пользователя */ },
        "status": "pending",
        "requirements": "string",
        "price": 1000,
        "total_price": 1200,
        "delivery_date": "YYYY-MM-DD",
        "created_at": "YYYY-MM-DDThh:mm:ss",
        "updated_at": "YYYY-MM-DDThh:mm:ss",
        "selected_options": [ /* массив выбранных опций */ ]
      },
      /* ... другие заказы ... */
    ]
  }
  ```

### Получение деталей заказа
- **URL**: `/api/v1/orders/{id}/`
- **Метод**: `GET`
- **Требует авторизации**: Да
- **Ответ** (200 OK): (детальные данные заказа)

### Обновление заказа
- **URL**: `/api/v1/orders/{id}/`
- **Метод**: `PATCH`
- **Требует авторизации**: Да
- **Входные данные**: (поля для обновления)
- **Ответ** (200 OK): (обновленные данные заказа)

### Отмена заказа
- **URL**: `/api/v1/orders/{id}/cancel/`
- **Метод**: `POST`
- **Требует авторизации**: Да
- **Входные данные**:
  ```json
  {
    "reason": "string"
  }
  ```
- **Ответ** (200 OK):
  ```json
  {
    "id": 1,
    "status": "cancelled",
    "cancellation_reason": "string",
    "cancelled_at": "YYYY-MM-DDThh:mm:ss"
  }
  ```

## Сервисы (услуги креаторов)

### Создание сервиса
- **URL**: `/api/v1/services/`
- **Метод**: `POST`
- **Требует авторизации**: Да
- **Входные данные**:
  ```json
  {
    "title": "string",
    "description": "string",
    "category_id": 1,
    "base_price": 1000,
    "delivery_time": 7,
    "options": [
      {
        "name": "string",
        "description": "string",
        "price": 200
      }
    ],
    "tags": ["tag1", "tag2"]
  }
  ```
- **Ответ** (201 Created): (данные созданного сервиса)

### Получение списка сервисов
- **URL**: `/api/v1/services/`
- **Метод**: `GET`
- **Требует авторизации**: Нет
- **Параметры запроса**:
  - `category`: фильтр по категории
  - `creator`: фильтр по ID креатора
  - `search`: поиск по названию и описанию
  - `min_price`, `max_price`: фильтры по цене
  - `page`, `page_size`: параметры пагинации
- **Ответ** (200 OK): (список сервисов с пагинацией)

### Получение деталей сервиса
- **URL**: `/api/v1/services/{id}/`
- **Метод**: `GET`
- **Требует авторизации**: Нет
- **Ответ** (200 OK): (детальные данные сервиса)

## Доставка работ

### Добавление доставки к заказу
- **URL**: `/api/v1/orders/{order_id}/deliveries/`
- **Метод**: `POST`
- **Требует авторизации**: Да
- **Входные данные**:
  ```json
  {
    "message": "string",
    "file_ids": [1, 2, 3]
  }
  ```
- **Ответ** (201 Created): (данные созданной доставки)

### Подтверждение доставки
- **URL**: `/api/v1/orders/{order_id}/approve/`
- **Метод**: `POST`
- **Требует авторизации**: Да
- **Ответ** (200 OK):
  ```json
  {
    "id": 1,
    "status": "completed",
    "completed_at": "YYYY-MM-DDThh:mm:ss"
  }
  ```

## Отзывы и рейтинги

### Создание отзыва
- **URL**: `/api/v1/orders/{order_id}/reviews/`
- **Метод**: `POST`
- **Требует авторизации**: Да
- **Входные данные**:
  ```json
  {
    "content": "string",
    "rating": 5
  }
  ```
- **Ответ** (201 Created): (данные созданного отзыва)

### Получение отзывов о креаторе
- **URL**: `/api/v1/creators/{creator_id}/reviews/`
- **Метод**: `GET`
- **Требует авторизации**: Нет
- **Параметры запроса**: параметры пагинации
- **Ответ** (200 OK): (список отзывов с пагинацией)

## Чат и сообщения

### Получение списка диалогов
- **URL**: `/api/v1/conversations/`
- **Метод**: `GET`
- **Требует авторизации**: Да
- **Ответ** (200 OK): (список диалогов пользователя)

### Создание нового диалога
- **URL**: `/api/v1/conversations/`
- **Метод**: `POST`
- **Требует авторизации**: Да
- **Входные данные**:
  ```json
  {
    "recipient_id": 2
  }
  ```
- **Ответ** (201 Created): (данные созданного диалога)

### Получение сообщений диалога
- **URL**: `/api/v1/conversations/{id}/messages/`
- **Метод**: `GET`
- **Требует авторизации**: Да
- **Параметры запроса**: параметры пагинации
- **Ответ** (200 OK): (список сообщений с пагинацией)

### WebSocket для сообщений в реальном времени
- **URL**: `/ws/conversations/{conversation_id}/`
- **Метод**: WebSocket
- **Требует авторизации**: Да (токен как параметр запроса)
- **Входящие сообщения**:
  ```json
  {
    "message": "string"
  }
  ```
- **Исходящие сообщения**:
  ```json
  {
    "id": 1,
    "sender": {
      "id": 1,
      "username": "string",
      "avatar": "url_string"
    },
    "message": "string",
    "timestamp": "YYYY-MM-DDThh:mm:ss"
  }
  ```

## Уведомления

### Получение уведомлений
- **URL**: `/api/v1/notifications/`
- **Метод**: `GET`
- **Требует авторизации**: Да
- **Параметры запроса**:
  - `read`: фильтр по статусу прочитано/не прочитано
  - параметры пагинации
- **Ответ** (200 OK): (список уведомлений с пагинацией)

### Отметка уведомления как прочитанного
- **URL**: `/api/v1/notifications/{id}/mark-as-read/`
- **Метод**: `POST`
- **Требует авторизации**: Да
- **Ответ** (200 OK):
  ```json
  {
    "id": 1,
    "is_read": true
  }
  ```

### WebSocket для уведомлений в реальном времени
- **URL**: `/ws/notifications/`
- **Метод**: WebSocket
- **Требует авторизации**: Да (токен как параметр запроса)
- **Исходящие сообщения**:
  ```json
  {
    "id": 1,
    "type": "new_order",
    "message": "У вас новый заказ!",
    "data": { /* дополнительная информация */ },
    "created_at": "YYYY-MM-DDThh:mm:ss",
    "is_read": false
  }
  ```

## Загрузка файлов

### Загрузка файла
- **URL**: `/api/v1/files/upload/`
- **Метод**: `POST`
- **Требует авторизации**: Да
- **Входные данные**: multipart/form-data с файлом
- **Ответ** (201 Created):
  ```json
  {
    "id": 1,
    "name": "string",
    "url": "string",
    "size": 1024,
    "content_type": "image/jpeg",
    "uploaded_at": "YYYY-MM-DDThh:mm:ss"
  }
  ```

### Получение списка файлов
- **URL**: `/api/v1/files/`
- **Метод**: `GET`
- **Требует авторизации**: Да
- **Параметры запроса**: параметры пагинации
- **Ответ** (200 OK): (список файлов пользователя)

### Удаление файла
- **URL**: `/api/v1/files/{id}/`
- **Метод**: `DELETE`
- **Требует авторизации**: Да
- **Ответ** (204 No Content)

## Навыки и портфолио креатора

### Получение списка навыков
- **URL**: `/api/skills/`
- **Метод**: `GET`
- **Требует авторизации**: Нет
- **Параметры запроса**:
  - `search`: поиск навыка по имени или описанию
  - `page`: номер страницы для пагинации
  - `page_size`: размер страницы
- **Ответ** (200 OK):
  ```json
  {
    "count": 10,
    "next": "http://example.com/api/skills/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "name": "Photoshop",
        "description": "Редактирование изображений"
      },
      {
        "id": 2,
        "name": "Illustrator",
        "description": "Векторная графика"
      }
    ]
  }
  ```

### Получение информации о конкретном навыке
- **URL**: `/api/skills/{id}/`
- **Метод**: `GET`
- **Требует авторизации**: Нет
- **Ответ** (200 OK):
  ```json
  {
    "id": 1,
    "name": "Photoshop",
    "description": "Редактирование изображений"
  }
  ```

### Получение навыков креатора
- **URL**: `/api/creator-skills/`
- **Метод**: `GET`
- **Требует авторизации**: Да
- **Параметры запроса**:
  - `creator_profile_id`: идентификатор профиля креатора
  - `page`: номер страницы для пагинации
  - `page_size`: размер страницы
- **Ответ** (200 OK):
  ```json
  {
    "count": 3,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "skill": {
          "id": 1,
          "name": "Photoshop",
          "description": "Редактирование изображений"
        },
        "level": 4,
        "creator_profile": 1
      },
      {
        "id": 2,
        "skill": {
          "id": 2,
          "name": "Illustrator",
          "description": "Векторная графика"
        },
        "level": 5,
        "creator_profile": 1
      }
    ]
  }
  ```

### Добавление навыка к профилю креатора
- **URL**: `/api/creator-skills/`
- **Метод**: `POST`
- **Требует авторизации**: Да
- **Входные данные**:
  ```json
  {
    "skill": 1,
    "level": 4
  }
  ```
- **Ответ** (201 Created):
  ```json
  {
    "id": 1,
    "skill": {
      "id": 1,
      "name": "Photoshop",
      "description": "Редактирование изображений"
    },
    "level": 4,
    "creator_profile": 1
  }
  ```

### Обновление навыка креатора
- **URL**: `/api/creator-skills/{id}/`
- **Метод**: `PUT` или `PATCH`
- **Требует авторизации**: Да
- **Входные данные**:
  ```json
  {
    "level": 5
  }
  ```
- **Ответ** (200 OK):
  ```json
  {
    "id": 1,
    "skill": {
      "id": 1,
      "name": "Photoshop",
      "description": "Редактирование изображений"
    },
    "level": 5,
    "creator_profile": 1
  }
  ```

### Удаление навыка креатора
- **URL**: `/api/creator-skills/{id}/`
- **Метод**: `DELETE`
- **Требует авторизации**: Да
- **Ответ** (204 No Content)

### Массовое добавление/обновление навыков
- **URL**: `/api/creator-skills/bulk_update/`
- **Метод**: `POST`
- **Требует авторизации**: Да
- **Входные данные**:
  ```json
  [
    {"skill_id": 1, "level": 3},
    {"skill_id": 2, "level": 5},
    {"skill_id": 3, "level": 4}
  ]
  ```
- **Ответ** (200 OK):
  ```json
  [
    {
      "id": 1,
      "skill_id": 1,
      "skill_name": "Photoshop",
      "level": 3,
      "created": false
    },
    {
      "id": 2,
      "skill_id": 2,
      "skill_name": "Illustrator",
      "level": 5,
      "created": false
    },
    {
      "id": 3,
      "skill_id": 3,
      "skill_name": "After Effects",
      "level": 4,
      "created": true
    }
  ]
  ```

### Получение списка элементов портфолио
- **URL**: `/api/portfolio/`
- **Метод**: `GET`
- **Требует авторизации**: Да (для получения собственного портфолио) / Нет (для просмотра чужого портфолио)
- **Параметры запроса**:
  - `creator_profile_id`: идентификатор профиля креатора
  - `page`: номер страницы для пагинации
  - `page_size`: размер страницы
- **Ответ** (200 OK):
  ```json
  {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "title": "Дизайн логотипа",
        "description": "Разработка логотипа для компании",
        "cover_image": "http://example.com/media/portfolio/covers/logo.jpg",
        "images": [
          {
            "id": 1,
            "image": "http://example.com/media/portfolio/images/logo1.jpg",
            "caption": "Вариант 1",
            "order": 1
          },
          {
            "id": 2,
            "image": "http://example.com/media/portfolio/images/logo2.jpg",
            "caption": "Вариант 2",
            "order": 2
          }
        ],
        "created_at": "2025-06-15T12:00:00Z",
        "updated_at": "2025-06-15T12:00:00Z",
        "creator_profile": 1
      },
      {
        "id": 2,
        "title": "Дизайн сайта",
        "description": "Разработка дизайна сайта",
        "cover_image": "http://example.com/media/portfolio/covers/website.jpg",
        "images": [
          {
            "id": 3,
            "image": "http://example.com/media/portfolio/images/site1.jpg",
            "caption": "Главная страница",
            "order": 1
          }
        ],
        "created_at": "2025-06-10T12:00:00Z",
        "updated_at": "2025-06-10T12:00:00Z",
        "creator_profile": 1
      }
    ]
  }
  ```

### Создание элемента портфолио
- **URL**: `/api/portfolio/`
- **Метод**: `POST`
- **Тип содержимого**: `multipart/form-data`
- **Требует авторизации**: Да
- **Входные данные**:
  ```
  title: "Дизайн логотипа"
  description: "Разработка логотипа для компании"
  cover_image: [файл изображения]
  ```
- **Ответ** (201 Created):
  ```json
  {
    "id": 1,
    "title": "Дизайн логотипа",
    "description": "Разработка логотипа для компании",
    "cover_image": "http://example.com/media/portfolio/covers/logo.jpg",
    "images": [],
    "created_at": "2025-06-16T12:00:00Z",
    "updated_at": "2025-06-16T12:00:00Z",
    "creator_profile": 1
  }
  ```

### Получение информации о элементе портфолио
- **URL**: `/api/portfolio/{id}/`
- **Метод**: `GET`
- **Требует авторизации**: Да (для собственного портфолио) / Нет (для чужого портфолио)
- **Ответ** (200 OK):
  ```json
  {
    "id": 1,
    "title": "Дизайн логотипа",
    "description": "Разработка логотипа для компании",
    "cover_image": "http://example.com/media/portfolio/covers/logo.jpg",
    "images": [
      {
        "id": 1,
        "image": "http://example.com/media/portfolio/images/logo1.jpg",
        "caption": "Вариант 1",
        "order": 1
      },
      {
        "id": 2,
        "image": "http://example.com/media/portfolio/images/logo2.jpg",
        "caption": "Вариант 2",
        "order": 2
      }
    ],
    "created_at": "2025-06-15T12:00:00Z",
    "updated_at": "2025-06-15T12:00:00Z",
    "creator_profile": 1
  }
  ```

### Обновление элемента портфолио
- **URL**: `/api/portfolio/{id}/`
- **Метод**: `PUT` или `PATCH`
- **Тип содержимого**: `multipart/form-data`
- **Требует авторизации**: Да
- **Входные данные**:
  ```
  title: "Обновленный дизайн логотипа"
  description: "Обновленное описание"
  cover_image: [файл изображения] (опционально)
  ```
- **Ответ** (200 OK):
  ```json
  {
    "id": 1,
    "title": "Обновленный дизайн логотипа",
    "description": "Обновленное описание",
    "cover_image": "http://example.com/media/portfolio/covers/logo.jpg",
    "images": [
      {
        "id": 1,
        "image": "http://example.com/media/portfolio/images/logo1.jpg",
        "caption": "Вариант 1",
        "order": 1
      },
      {
        "id": 2,
        "image": "http://example.com/media/portfolio/images/logo2.jpg",
        "caption": "Вариант 2",
        "order": 2
      }
    ],
    "created_at": "2025-06-15T12:00:00Z",
    "updated_at": "2025-06-16T12:00:00Z",
    "creator_profile": 1
  }
  ```

### Удаление элемента портфолио
- **URL**: `/api/portfolio/{id}/`
- **Метод**: `DELETE`
- **Требует авторизации**: Да
- **Ответ** (204 No Content)

### Добавление изображения к элементу портфолио
- **URL**: `/api/portfolio-images/`
- **Метод**: `POST`
- **Тип содержимого**: `multipart/form-data`
- **Требует авторизации**: Да
- **Входные данные**:
  ```
  portfolio_item: 1
  image: [файл изображения]
  caption: "Вариант 1"
  order: 1
  ```
- **Ответ** (201 Created):
  ```json
  {
    "id": 1,
    "image": "http://example.com/media/portfolio/images/logo1.jpg",
    "caption": "Вариант 1",
    "order": 1,
    "portfolio_item": 1
  }
  ```

### Получение списка изображений элемента портфолио
- **URL**: `/api/portfolio-images/`
- **Метод**: `GET`
- **Требует авторизации**: Да
- **Параметры запроса**:
  - `portfolio_item_id`: идентификатор элемента портфолио
- **Ответ** (200 OK):
  ```json
  {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "image": "http://example.com/media/portfolio/images/logo1.jpg",
        "caption": "Вариант 1",
        "order": 1,
        "portfolio_item": 1
      },
      {
        "id": 2,
        "image": "http://example.com/media/portfolio/images/logo2.jpg",
        "caption": "Вариант 2",
        "order": 2,
        "portfolio_item": 1
      }
    ]
  }
  ```

### Обновление информации об изображении
- **URL**: `/api/portfolio-images/{id}/`
- **Метод**: `PUT` или `PATCH`
- **Тип содержимого**: `multipart/form-data`
- **Требует авторизации**: Да
- **Входные данные**:
  ```
  caption: "Новое описание"
  order: 3
  image: [файл изображения] (опционально)
  ```
- **Ответ** (200 OK):
  ```json
  {
    "id": 1,
    "image": "http://example.com/media/portfolio/images/logo1.jpg",
    "caption": "Новое описание",
    "order": 3,
    "portfolio_item": 1
  }
  ```

### Удаление изображения
- **URL**: `/api/portfolio-images/{id}/`
- **Метод**: `DELETE`
- **Требует авторизации**: Да
- **Ответ** (204 No Content)

### Получение детальной информации об услуге
- **URL**: `/api/services/{id}/`
- **Метод**: `GET`
- **Требует авторизации**: Нет
- **Ответ** (200 OK):
  ```json
  {
    "id": 0,
    "creator_profile": 0,
    "creator_username": "string",
    "title": "string",
    "description": "string",
    "price": "string",
    "estimated_time": "string",
    "allows_modifications": true,
    "modifications_price": "string",
    "is_active": true,
    "created_at": "2024-06-22T18:00:00Z",
    "updated_at": "2024-06-22T18:00:00Z"
  }
  ```

## Коды ошибок

- **400** - Некорректный запрос
  ```json
  {"error": "Сообщение об ошибке"}
  ```
- **401** - Требуется авторизация
  ```json
  {"detail": "Учетные данные не были предоставлены."}
  ```
- **403** - Доступ запрещен
  ```json
  {"detail": "У вас недостаточно прав для выполнения данного действия."}
  ```
- **404** - Ресурс не найден
  ```json
  {"detail": "Страница не найдена."}
  ```
- **409** - Конфликт (например, заказ уже в другом статусе)
- **422** - Ошибка валидации данных
- **500** - Внутренняя ошибка сервера