# Сравнение API бэкенда и запросов фронтенда

## 1. Эндпоинты профиля креатора

### Бэкенд (предоставляет)

#### Эндпоинт `creator-profiles/`
- **URL**: `/api/creator-profiles/`
- **Методы**: GET, POST, PUT, PATCH, DELETE
- **ViewSet**: `CreatorProfileViewSet`
- **Функционал**: CRUD операции для профилей креаторов
- **JSON структура (ответ)**:
```
{
  "id": number,
  "user": {
    "id": number,
    "username": string,
    "email": string,
    "first_name": string,
    "last_name": string,
    "full_name": string,
    "avatar": string | null,
    "phone": string | null,
    "bio": string | null,
    "location": string | null,
    "is_verified": boolean,
    "user_type": string,
    "date_joined": string,
    "has_creator_profile": boolean,
    "has_client_profile": boolean,
    "creator_profile_id": number
  },
  "nickname": string | null,
  "full_name": string,
  "username": string,
  "avatar": string | null,
  "bio": string | null,
  "location": string | null,
  "specialization": string,
  "experience": string,
  "portfolio_link": string | null,
  "cover_image": string | null,
  "is_online": boolean,
  "available_for_hire": boolean,
  "social_links": array,
  "rating": string,
  "review_count": number,
  "completed_orders": number,
  "average_response_time": string | null,
  "created_at": string,
  "updated_at": string
}
```

#### Эндпоинт `creator-profiles/me/`
- **URL**: `/api/creator-profiles/me/`
- **Методы**: GET, POST, PUT, PATCH
- **Action**: Custom action в `CreatorProfileViewSet`
- **Функционал**: Получение и обновление профиля текущего креатора
- **JSON структура**: Как у creator-profiles/

#### Эндпоинт `creator-profile/`
- **URL**: `/api/creator-profile/`
- **Методы**: GET, PUT, PATCH
- **View**: `CurrentCreatorProfileView`
- **Функционал**: Получение и обновление профиля текущего креатора
- **JSON структура**: Как у creator-profiles/, но с дополнительными полями (при detail=true):
```
{
  // Все поля как у creator-profiles/
  "skills": [
    {
      "id": number,
      "skill": {
        "id": number,
        "name": string,
        "description": string | null
      },
      "level": number,
      "creator_profile": number
    }
  ],
  "portfolio": [
    {
      "id": number,
      "title": string,
      "description": string | null,
      "cover_image": string,
      "image": string | null,
      "images": array,
      "created_at": string,
      "updated_at": string,
      "creator_profile": number
    }
  ]
}
```

### Фронтенд (запрашивает)

#### В hooks/useCreatorProfile.ts
- **URL для получения своего профиля**: `GET api/creator-profile/`
- **URL для получения профиля по ID**: `GET api/creator-profiles/${id}/`
- **JSON структура (ожидаемая)**: Соответствует структуре ответа бэкенда

#### В hooks/useApi.ts
- **URL для получения своего профиля**: `GET api/creator-profile/`
- **URL для получения профиля по ID**: `GET api/creator-profiles/${id}/`
- **JSON структура (ожидаемая)**: Соответствует структуре ответа бэкенда

#### В api/auth.ts
- **URL для получения профиля**: `GET api/creator-profiles/me/?detail=${detailed}`
- **URL для создания профиля**: `POST api/creator-profiles/me/`
- **URL для обновления профиля**: `PATCH api/creator-profiles/me/`
- **JSON структура (ожидаемая)**: Соответствует структуре ответа бэкенда

#### В pages/CreatorProfilePage.tsx
- **URL для создания профиля**: `POST api/creator-profiles/`
- **URL для обновления статуса**: `PATCH api/creator-profiles/${id}/update_status/`
- **URL для обновления навыков**: `PATCH api/creator-profiles/${id}/`
- **URL для обновления социальных ссылок**: `PATCH api/creator-profiles/${id}/`
- **JSON структура (отправляемая для навыков)**:
```
{
  "skills": array // список навыков в формате, который может не соответствовать ожидаемому бэкендом
}
```
- **JSON структура (отправляемая для соц.сетей)**:
```
{
  "social_links": array // список соц.сетей в формате, который может не соответствовать ожидаемому бэкендом
}
```

## 2. Выявленные несоответствия

1. **Использование разных эндпоинтов для одной цели**:
   - Фронтенд использует смесь эндпоинтов `creator-profile/` и `creator-profiles/`
   - Также используется `creator-profiles/me/` в некоторых местах, который является custom action в ViewSet

2. **Проблема с обновлением вложенных объектов**:
   - Поля, которые на бэкенде находятся в модели `User` (bio, avatar, location), доступны только для чтения в `CreatorProfileSerializer`
   - При PATCH-запросе к `/api/creator-profiles/{id}/` эти поля будут игнорироваться
   - Нет явного механизма для обновления полей User в контексте профиля креатора

3. **Несогласованность формата для навыков и соц.сетей**:
   - Бэкенд ожидает определенные структуры данных для навыков и соц.сетей
   - Фронтенд может отправлять эти данные в формате, который не совпадает с ожидаемым бэкендом

4. **Отсутствие формы редактирования основных данных профиля**:
   - На фронтенде нет компонентов для редактирования полей bio, avatar, location, nickname
   - При этом эти поля отображаются в профиле креатора

## 3. Рекомендации по устранению

1. **Унификация эндпоинтов**:
   - Стандартизировать использование эндпоинтов на фронтенде
   - Использовать только один подход: либо `creator-profile/`, либо `creator-profiles/me/`

2. **Доработка CreatorProfileSerializer**:
   - Добавить логику обновления полей User в методе update
   - Сделать поля bio, avatar, location доступными для записи

3. **Создание компонента редактирования профиля**:
   - Добавить на фронтенде диалог или форму для редактирования основных данных профиля
   - Использовать правильный эндпоинт для обновления этих данных

4. **Обновление API документации**:
   - Актуализировать api.md в соответствии с реальными эндпоинтами
   - Добавить четкое описание JSON структур запросов и ответов