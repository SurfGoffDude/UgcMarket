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
- `status` - статус заказа (awaiting_response, in_progress, on_review, completed, cancelled)

**Пример запроса:**
```
GET /api/orders/?target_creator=3&status=completed
```

## Чаты

### Получение списка чатов

**Запрос:**
```
GET /api/chats/
```

**Заголовки:**
```
Authorization: Bearer <token>
```

**Пример ответа:**
```json
[
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
    "order": {
      "id": 5,
      "title": "Дизайн логотипа"
    },
    "last_message": {
      "content": "Отправляю предварительный макет логотипа",
      "created_at": "2023-07-11T10:22:15Z",
      "sender_username": "creator1"
    },
    "unread_count": 2,
    "created_at": "2023-07-01T09:30:00Z",
    "updated_at": "2023-07-11T10:22:15Z"
  }
]
```

### Получение чата по ID участников

**Запрос:**
```
GET /api/chats/{creator_id}-{client_id}/
```

**Заголовки:**
```
Authorization: Bearer <token>
```

**Пример запроса:**
```
GET /api/chats/3-2/
```

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
  "order": {
    "id": 5,
    "title": "Дизайн логотипа"
  },
  "messages": [
    {
      "id": 1,
      "sender": 2,
      "sender_details": {
        "id": 2,
        "username": "client1",
        "avatar": "/media/avatars/client1.jpg"
      },
      "content": "Здравствуйте! Интересует разработка логотипа.",
      "attachment": null,
      "is_system_message": false,
      "created_at": "2023-07-01T09:35:22Z",
      "read_by_client": true,
      "read_by_creator": true
    },
    {
      "id": 2,
      "sender": 3,
      "sender_details": {
        "id": 3,
        "username": "creator1",
        "avatar": "/media/avatars/creator1.jpg"
      },
      "content": "Здравствуйте! Да, готов обсудить детали.",
      "attachment": null,
      "is_system_message": false,
      "created_at": "2023-07-01T10:15:45Z",
      "read_by_client": true,
      "read_by_creator": true
    }
  ],
  "created_at": "2023-07-01T09:30:00Z",
  "updated_at": "2023-07-11T10:22:15Z"
}
```

### Получение сообщений чата по ID участников

**Запрос:**
```
GET /api/chats/{creator_id}-{client_id}/messages/
```

**Заголовки:**
```
Authorization: Bearer <token>
```

**Пример запроса:**
```
GET /api/chats/3-2/messages/
```

**Пример ответа:**
```json
[
  {
    "id": 1,
    "chat": 1,
    "sender": 2,
    "sender_details": {
      "id": 2,
      "username": "client1",
      "avatar": "/media/avatars/client1.jpg"
    },
    "content": "Здравствуйте! Интересует разработка логотипа.",
    "attachment": null,
    "is_system_message": false,
    "created_at": "2023-07-01T09:35:22Z",
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
    "content": "Здравствуйте! Да, готов обсудить детали.",
    "attachment": null,
    "is_system_message": false,
    "created_at": "2023-07-01T10:15:45Z",
    "read_by_client": true,
    "read_by_creator": true
  }
]
```

### Отправка сообщения через ID участников

**Запрос:**
```
POST /api/chats/{creator_id}-{client_id}/messages/
```

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "content": "Меня интересует разработка логотипа для моего проекта"
}
```

**Пример запроса:**
```
POST /api/chats/3-2/messages/
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

### Отправка сообщения через стандартный API

**Запрос:**
```
POST /api/chats/{chat_id}/messages/
```

**Описание:**  
Отправляет новое сообщение в указанный чат.

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "content": "Меня интересует разработка логотипа для моего проекта"
}
```

**Пример запроса:**
```
POST /api/chats/1/messages/
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

### Отправка сообщения с вложением

**Запрос:**
```
POST /api/chats/{chat_id}/messages/
```

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Параметры формы:**
- `content` - текст сообщения
- `attachment` - прикрепляемый файл

**Пример ответа:**
```json
{
  "id": 5,
  "chat": 1,
  "sender": 2,
  "sender_details": {
    "id": 2,
    "username": "client1",
    "avatar": "/media/avatars/client1.jpg"
  },
  "content": "Вот референс для логотипа",
  "attachment": "/media/chat_attachments/reference.jpg",
  "is_system_message": false,
  "created_at": "2023-07-10T16:55:30Z",
  "read_by_client": true,
  "read_by_creator": false
}
```

### Создание отклика на заказ через чат

**Запрос:**
```
POST /api/chats/create-for-order/{chat_id}/
```

**Описание:**  
Создает отклик на указанный заказ от имени креатора, участвующего в чате. Если такой отклик уже существует, возвращает информацию о существующем отклике. Автоматически связывает чат с заказом, если он еще не связан, и добавляет системное сообщение об отклике в чат.

**Заголовки:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "order": 15,
  "price": 5000,
  "message": "Я заинтересован в выполнении этого заказа"
}
```

**Параметры запроса:**
- `order` (обязательный) - идентификатор заказа, на который создается отклик
- `price` (необязательный) - предлагаемая цена за выполнение заказа (по умолчанию равна бюджету заказа)
- `message` (необязательный) - текст сообщения в отклике

**Пример запроса:**
```
POST /api/chats/create-for-order/5/
```

**Пример ответа (новый отклик):**
```json
{
  "id": 12,
  "order": 15,
  "creator": 3,
  "price": 5000,
  "message": "Я заинтересован в выполнении этого заказа",
  "created_at": "2023-07-15T13:45:22Z",
  "status": "pending"
}
```

**Пример ответа (существующий отклик):**
```json
{
  "id": 10,
  "order": 15,
  "creator": 3,
  "price": 4500,
  "message": "Готов выполнить ваш заказ",
  "created_at": "2023-07-10T09:30:15Z",
  "status": "pending"
}
```