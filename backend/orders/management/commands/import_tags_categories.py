"""Management command to import tags from tags_orders_categories.ts TypeScript file.

This command parses the TypeScript file and imports all tags into the database.
Tags are organized by categories in the source file.

Usage:
    python manage.py import_tags_categories

Optional arguments:
    --file: Path to TypeScript file (default: frontend/public/tags_orders_categories.ts)
"""

from __future__ import annotations

import pathlib
import re
from typing import Dict, List

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify
from django.db import transaction

from orders.models import Category
from core.models import Tag  # Теперь используем модель Tag из приложения core


class Command(BaseCommand):
    help = "Import tags and categories from tags_orders_categories.ts file into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            dest="file_path",
            type=str,
            default="frontend/public/tags_orders_categories.ts",
            help=(
                "Path to TypeScript file with tags and categories. "
                "Default: frontend/public/tags_orders_categories.ts "
                "(relative to project root)."
            ),
        )

    # ---------------------------------------------------------------------
    # utils
    # ---------------------------------------------------------------------
    @staticmethod
    def _parse_typescript(ts_path: pathlib.Path) -> Dict[str, Dict]:
        """Parse TypeScript file and return structure with categories and tags."""
        if not ts_path.exists():
            raise CommandError(f"TypeScript file not found: {ts_path}")

        result = {}
        
        with ts_path.open("r", encoding="utf-8") as fp:
            content = fp.read()
            
            # Ищем все блоки категорий
            category_blocks = re.finditer(r'{\s*id:\s*"([^"]+)".*?tags:\s*\[(.*?)\],?\s*}', content, re.DOTALL)
            
            for match in category_blocks:
                category_id = match.group(1)
                # Извлекаем информацию о категории
                category_info_match = re.search(r'id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*emoji:\s*"([^"]+)"', match.group(0))
                if category_info_match:
                    category_name = category_info_match.group(2)
                    category_emoji = category_info_match.group(3)
                    
                    # Извлекаем все теги для этой категории
                    tags_block = match.group(2)
                    tags = []
                    tag_matches = re.finditer(r'{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)"\s*}', tags_block)
                    
                    for tag_match in tag_matches:
                        tag_id = tag_match.group(1)
                        tag_name = tag_match.group(2)
                        tags.append({"id": tag_id, "name": tag_name})
                    
                    result[category_id] = {
                        "name": category_name,
                        "emoji": category_emoji,
                        "tags": tags
                    }
        
        return result

    def _generate_unique_slug(self, name: str, entity_id: str, model_class) -> str:
        """Generate a unique slug based on the name."""
        base = slugify(name) or f"{model_class.__name__.lower()}-{entity_id}"
        slug = base
        counter = 1
        while model_class.objects.filter(slug=slug).exists():
            slug = f"{base}-{counter}"
            counter += 1
        return slug

    # ------------------------------------------------------------------
    # main handle
    # ------------------------------------------------------------------
    def handle(self, *args, **options):
        file_option = options["file_path"]
        ts_path = pathlib.Path(file_option)
        
        # Если путь относительный, пробуем сперва относительно текущей cwd,
        # а затем относительно корня проекта (settings.BASE_DIR/..)
        if not ts_path.is_absolute():
            if not ts_path.exists():
                from django.conf import settings
                project_root = pathlib.Path(settings.BASE_DIR).parent
                ts_path = project_root / ts_path
        ts_path = ts_path.resolve()
        self.stdout.write(f"Importing tags and categories from {ts_path}…")

        # Парсим файл
        data = self._parse_typescript(ts_path)
        
        # Статистика для вывода
        categories_created = 0
        categories_updated = 0
        tags_created = 0
        tags_updated = 0
        
        # Используем транзакцию для атомарной вставки данных
        with transaction.atomic():
            # Сначала создаём категории
            for category_id, category_data in data.items():
                # Создаём slug для категории
                slug = self._generate_unique_slug(category_data["name"], category_id, Category)
                
                # Создаём или обновляем категорию
                category, is_created = Category.objects.update_or_create(
                    slug=slug,
                    defaults={
                        "name": category_data["name"],
                        "description": f"Категория {category_data['name']} ({category_data['emoji']})",
                    }
                )
                
                if is_created:
                    categories_created += 1
                else:
                    categories_updated += 1
                
                # Создаём теги для этой категории
                for tag_data in category_data["tags"]:
                    # Используем оригинальный ID как часть slug для стабильности
                    # Не используем хеш-функцию, так как она может давать разные результаты между запусками
                    original_id = tag_data["id"]
                    
                    # Создаём стабильный slug для тега, основанный на оригинальном ID
                    tag_slug = self._generate_unique_slug(tag_data["name"], original_id, Tag)
                    
                    # Создаём или обновляем тег, используя slug как стабильный идентификатор
                    # Позволяем Django самому генерировать автоинкрементное ID
                    tag, is_created = Tag.objects.update_or_create(
                        slug=tag_slug,  # Используем slug как стабильный идентификатор
                        defaults={
                            "name": tag_data["name"],
                            "type": Tag.TAG_TYPE_ORDER,  # Явно указываем, что это тег для заказов
                        }
                    )
                    
                    # Связываем тег с категорией
                    tag.category = category
                    tag.save()
                    
                    if is_created:
                        tags_created += 1
                    else:
                        tags_updated += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Import finished. Categories: created {categories_created}, updated {categories_updated}. "
                f"Tags: created {tags_created}, updated {tags_updated}."
            )
        )