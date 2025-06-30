#!/usr/bin/env python
"""
Скрипт для удаления всех тегов из базы данных.

Использование:
    python clear_tags.py
    
Скрипт подключается к Django проекту и удаляет все записи из модели Tag.
Перед удалением выводит информацию о количестве существующих тегов,
после удаления проверяет, что все теги успешно удалены.

ВНИМАНИЕ: Скрипт удаляет ВСЕ теги без возможности восстановления!
"""

import os
import sys
import django
from django.db import transaction


# Настройка окружения Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ugc_market.settings')
django.setup()

# Импортируем модель Tag после настройки Django
from core.models import Tag


def clear_tags():
    """Удаляет все теги из базы данных."""
    
    try:
        # Получаем количество тегов до удаления
        tags_count = Tag.objects.count()
        print(f"В базе данных найдено {tags_count} тегов.")
        
        if tags_count == 0:
            print("Нет тегов для удаления.")
            return
            
        # Спрашиваем подтверждение
        confirm = input("Вы уверены, что хотите удалить ВСЕ теги? [y/N]: ")
        if confirm.lower() != 'y':
            print("Операция отменена.")
            return
            
        # Удаляем теги в транзакции
        with transaction.atomic():
            # Выводим первые 5 тегов для информации
            sample_tags = Tag.objects.all()[:5]
            print("\nПримеры тегов для удаления:")
            for tag in sample_tags:
                category_name = tag.category.name if tag.category else "Нет категории"
                print(f"ID: {tag.id}, Название: {tag.name}, Slug: {tag.slug}, Категория: {category_name}")
            
            # Удаляем все теги
            deleted_count, _ = Tag.objects.all().delete()
            
            # Проверяем результат
            remaining_count = Tag.objects.count()
            
            print(f"\nУдалено {deleted_count} тегов.")
            print(f"Осталось тегов в базе: {remaining_count}")
            
            if remaining_count == 0:
                print("Все теги успешно удалены!")
            else:
                print("ВНИМАНИЕ: Некоторые теги не были удалены. Проверьте права доступа и зависимости.")
                
    except Exception as e:
        print(f"Произошла ошибка при удалении тегов: {e}")


if __name__ == "__main__":
    print("Скрипт для удаления всех тегов из базы данных")
    print("==============================================\n")
    clear_tags()
