## POST /api/services RuntimeError

**Описание проблемы:**
Фронтенд отправлял POST-запрос на `/api/services` без завершающего слеша. При включённом `APPEND_SLASH` Django не может перенаправить POST-запрос и выбрасывает `RuntimeError`.

**Решение:**
В `frontend/src/pages/CreatorProfilePage.tsx` исправлен URL на `apiClient.post('/services/', ...)` – добавлен ведущий и завершающий `/`.

**Статус:** решено
