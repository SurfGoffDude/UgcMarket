# API документация UgcMarket

## Заказы

### Получение заказов между клиентом и креатором

**Запрос:**
```
GET /api/orders/creator-client-orders/
```

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `client` - идентификатор клиента (обязательный)
- `target_creator` - идентификатор креатора (обязательный)

**Примечания:**
- Возвращает все заказы между указанным клиентом и креатором со статусами 'in_progress', 'on_review' или 'completed'
- Используется для отображения заказов в интерфейсе чата

**Пример запроса:**
```
GET /api/orders/creator-client-orders/?client=2&target_creator=3
```

**Пример ответа:**
```json
[
  {
    "id": 5,
    "title": "Дизайн логотипа",
    "description": "Нужен логотип для нового проекта",
    "client": 2,
    "budget": 5000,
    "deadline": "2023-08-10",
    "status": "in_progress",
    "created_at": "2023-07-08T09:15:33Z",
    "updated_at": "2023-07-09T18:22:54Z"
  },
  {
    "id": 8,
    "title": "Дизайн визитной карточки",
    "description": "Разработать дизайн корпоративной визитки",
    "client": 2,
    "budget": 2500,
    "deadline": "2023-07-25",
    "status": "completed",
    "created_at": "2023-07-01T10:22:15Z",
    "updated_at": "2023-07-15T16:40:33Z"
  }
]
```

### Фильтрация заказов

**Запрос:**
```
GET /api/orders/
```

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры фильтрации:**
- `client` - идентификатор клиента
- `target_creator` - идентификатор креатора (важно: используйте target_creator вместо creator)
- `status` - статус заказа (например, 'published', 'in_progress', 'completed')
- `category` - слаг категории
- `min_budget`, `max_budget` - минимальный и максимальный бюджет
- `deadline_before`, `deadline_after` - фильтрация по дедлайну
- `is_private` - приватность заказа (true/false)
- `tags` - фильтрация по тегам (список slug через запятую)

**Пример запроса:**
```
GET /api/orders/?client=2&target_creator=3&status=in_progress
```

## Чаты и сообщения

### Получение списка доступных креаторов

**Запрос:**
```
GET /api/chats/
```

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры:**
- Нет обязательных параметров

**Пример ответа:**
```json
{
  "creators": [
    {
      "id": 3,
      "username": "creator1",
      "avatar": "/media/avatars/creator1.jpg",
      "chat_id": "3-2"
    },
    {
      "id": 4,
      "username": "creator2",
      "avatar": "/media/avatars/creator2.jpg",
      "chat_id": "4-2"
    }
  ]
}
```

### Получение чата по ID формата {creator_id}-{client_id}

**Запрос:**
```
GET /api/chats/{creator_id}-{client_id}/
```

Например: `/api/chats/3-2/` - получение чата между креатором с ID 3 и клиентом с ID 2.

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры:**
- Нет обязательных параметров

**Пример ответа:**
```json
{
  "id": 1,
  "client": {
    "id": 2,
    "username": "client1",
    "avatar": "/media/avatars/client1.jpg"
  },
  "creator": {        "id": 3,
        "username": "creator1",
        "avatar": "/media/avatars/creator1.jpg"
      },
      "order": null,
      "created_at": "2023-07-10T14:30:22Z",
      "updated_at": "2023-07-10T15:40:12Z",
      "is_active": true,
      "unread_messages_count": 0
    },
    {
      "id": 2,
      "client": {
        "id": 2,
        "username": "client1",
        "avatar": "/media/avatars/client1.jpg"
      },
      "creator": {
        "id": 4,
        "username": "creator2",
        "avatar": "/media/avatars/creator2.jpg"
      },
      "order": {
        "id": 5,
        "title": "Дизайн логотипа",
        "status": "in_progress",
        "budget": 5000
      },
      "created_at": "2023-07-08T09:15:33Z",
      "updated_at": "2023-07-09T18:22:54Z",
      "is_active": true,
      "unread_messages_count": 3
    }
  ]
}
```

### Создание нового чата

**Запрос:**
```
POST /api/chats/
```

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "creator": 3,
  "client": 2
}
```

**Пример ответа:**
```json
{
  "id": 3,
  "client": {
    "id": 2,
    "username": "client1",
    "avatar": "/media/avatars/client1.jpg"
  },
  "creator": {
    "id": 3,
    "username": "creator1",
    "avatar": "/media/avatars/creator1.jpg"
  },
  "order": null,
  "created_at": "2023-07-10T16:45:22Z",
  "updated_at": "2023-07-10T16:45:22Z",
  "is_active": true,
  "unread_messages_count": 0
}
```

### Получение информации о чате

**Запрос:**
```
GET /api/chats/{id}/
```

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры:**
- `id` - идентификатор чата

**Пример ответа:**
```json
{
  "id": 1,
  "client": {
    "id": 2,
    "username": "client1",
    "avatar": "/media/avatars/client1.jpg"
  },
  "creator": {
    "id": 3,
    "username": "creator1",
    "avatar": "/media/avatars/creator1.jpg"
  },
  "order": null,
  "created_at": "2023-07-10T14:30:22Z",
  "updated_at": "2023-07-10T15:40:12Z",
  "is_active": true,
  "unread_messages_count": 0
}
```

### Отметка чата как прочитанного

**Запрос:**
```
POST /api/chats/{id}/mark_read/
```

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры:**
- `id` - идентификатор чата

**Пример ответа:**
```json
{
  "status": "success",
  "message": "Все сообщения в чате отмечены как прочитанные"
}
```

### Создание чата для заказа (отклик креатора)

**Запрос:**
```
POST /api/chats/create-for-order/{order_id}/
```

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры:**
- `order_id` - идентификатор заказа

**Описание:**
- Этот эндпоинт используется креаторами для отклика на заказ и создания чата с клиентом
- При успешном запросе статус заказа меняется на "in_progress" (В работе)
- В чате автоматически создается системное сообщение об отклике на заказ
- Только креаторы могут использовать этот эндпоинт, клиенты получат ошибку 403

**Пример ответа:**
```json
{
  "id": 5,
  "client": {
    "id": 2,
    "username": "client1",
    "avatar": "/media/avatars/client1.jpg"
  },
  "creator": {
    "id": 3,
    "username": "creator1",
    "avatar": "/media/avatars/creator1.jpg"
  },
  "order": {
    "id": 8,
    "title": "Дизайн логотипа для стартапа",
    "status": "in_progress",
    "budget": 10000
  },
  "created_at": "2023-07-11T14:50:22Z",
  "updated_at": "2023-07-11T14:50:22Z",
  "is_active": true,
  "unread_messages_count": 0
}
```
### Получение сообщений чата

**Запрос:**
```
GET /api/messages/
```

**Заголовки:**
```
Authorization: Bearer <token>
```

**Параметры запроса:**
- `chat` - идентификатор чата (обязательный)
- `page` - номер страницы для пагинации (опционально)
- `limit` - количество сообщений на странице (опционально)

**Пример запроса:**
```
GET /api/messages/?chat=1&page=1&limit=50
```

**Пример ответа:**
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "chat": 1,
      "sender": 2,
      "sender_details": {
        "id": 2,
        "username": "client1",
        "avatar": "/media/avatars/client1.jpg"
      },
      "content": "Здравствуйте! Хочу обсудить сотрудничество.",
      "attachment": null,
      "is_system_message": false,
      "created_at": "2023-07-10T14:30:22Z",
      "read_by_client": true,
      "read_by_creator": true
    },
    {
      "id": 2,
      "chat": 1,
      "sender": 3,
      "sender_details": {
        "id": 3,
        "username": "creator1",
        "avatar": "/media/avatars/creator1.jpg"
      },
      "content": "Добрый день! С удовольствием обсудим. Чем могу помочь?",
      "attachment": null,
      "is_system_message": false,
      "created_at": "2023-07-10T14:35:10Z",
      "read_by_client": true,
      "read_by_creator": true
    },
    {
      "id": 3,
      "chat": 1,
      "sender": null,
      "sender_details": null,
      "content": "Системное сообщение: Участники присоединились к чату",
      "attachment": null,
      "is_system_message": true,
      "created_at": "2023-07-10T14:30:22Z",
      "read_by_client": true,
      "read_by_creator": true
    }
  ]
}
```

### Отправка сообщения

**Запрос:**
```
POST /api/messages/
```

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "chat": 1,
  "content": "Меня интересует разработка логотипа для моего проекта"
}
```

**Пример ответа:**
```json
{
  "id": 4,
  "chat": 1,
  "sender": 2,
  "sender_details": {
    "id": 2,
    "username": "client1",
    "avatar": "/media/avatars/client1.jpg"
  },
  "content": "Меня интересует разработка логотипа для моего проекта",
  "attachment": null,
  "is_system_message": false,
  "created_at": "2023-07-10T16:50:22Z",
  "read_by_client": true,
  "read_by_creator": false
}
```
