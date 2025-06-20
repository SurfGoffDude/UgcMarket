## POST /api/services RuntimeError

**Описание проблемы:**
Фронтенд отправлял POST-запрос на `/api/services` без завершающего слеша. При включённом `APPEND_SLASH` Django не может перенаправить POST-запрос и выбрасывает `RuntimeError`.

**Решение:**
В `frontend/src/pages/CreatorProfilePage.tsx` исправлен URL на `apiClient.post('/services/', ...)` – добавлен ведущий и завершающий `/`.

**Статус:** решено

---

## PATCH /creator-profiles/{id}/ не сохранялись first_name/last_name/bio/location

**Описание проблемы:**
Backend не обрабатывал вложенный объект `user` в сериализаторе `CreatorProfileSerializer.update`, из-за чего имя, фамилия и био не сохранялись. Также фронтенд отображал `location` только с верхнего уровня.

**Решение:**
1. В `backend/users/serializers.py` добавлена обработка `user_data` и сохранение вложенных полей.
2. В `frontend/src/pages/CreatorProfilePage.tsx` добавлен fallback для `creator.user.location`.

**Статус:** решено
