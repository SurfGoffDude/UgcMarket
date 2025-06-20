### Fix services URL slash
Добавлен ведущий и завершающий слеш в URL POST-запроса при добавлении услуги в `CreatorProfilePage.tsx`, что устраняет `RuntimeError` Django.

### Profile update fields
Создана поддержка вложенных полей `user` в `CreatorProfileSerializer.update` и корректное отображение `location` на фронте.

### Creator serializer writable user
`CreatorProfileSerializer` теперь принимает вложенный объект `user` для PATCH, убрана `read_only` защита и поле `user` исключено из `read_only_fields`.
