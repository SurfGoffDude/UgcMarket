# API документация UgcMarket

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
