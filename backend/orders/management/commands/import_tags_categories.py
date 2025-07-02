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
import json
from typing import Dict, List, Any
from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify
from django.db import transaction
from orders.models import Category
from core.models import Tag  # Используем модель Tag из приложения core


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

    def _convert_ts_to_json(self, ts_content: str) -> str:
        """Convert TypeScript code to JSON format."""
        # Удаляем комментарии из TypeScript
        ts_content = re.sub(r'\/\*\*[\s\S]*?\*\/', '', ts_content)
        ts_content = re.sub(r'\/\/.*', '', ts_content)
        
        # Находим массив категорий
        match = re.search(r'export\s+const\s+tagCategories\s*:\s*TagCategory\[\]\s*=\s*(\[[\s\S]*?\]);', ts_content)
        if not match:
            raise CommandError("Failed to find tagCategories array in the TypeScript file")
        
        json_array = match.group(1)
        
        # Преобразуем TypeScript объекты в формат JSON
        # Заменяем имена свойств id: "value" на "id": "value"
        json_array = re.sub(r'(\w+):\s*', r'"\1": ', json_array)
        
        # Исправляем возможные запятые перед закрывающими скобками
        json_array = re.sub(r',\s*\]', ']', json_array)
        json_array = re.sub(r',\s*\}', '}', json_array)
        
        return json_array

    def _parse_typescript(self, ts_path: pathlib.Path) -> Dict[str, Dict]:
        """Parse TypeScript file and return structure with categories and tags."""
        if not ts_path.exists():
            raise CommandError(f"TypeScript file not found: {ts_path}")
        
        with ts_path.open("r", encoding="utf-8") as fp:
            content = fp.read()
        
        # Преобразуем TypeScript в JSON
        json_array = self._convert_ts_to_json(content)
        
        try:
            # Пытаемся разобрать JSON
            categories_data = json.loads(json_array)
        except json.JSONDecodeError as e:
            self.stdout.write(self.style.ERROR(f"Failed to parse TypeScript as JSON: {e}"))
            self.stdout.write(f"Problematic JSON: {json_array[:200]}...")
            raise CommandError(f"Failed to parse TypeScript file: {e}")
        
        # Преобразуем список категорий в словарь, где ключ - id категории
        result = {}
        for category in categories_data:
            category_id = category.get("id")
            if not category_id:
                continue
                
            result[category_id] = {
                "name": category.get("name", ""),
                "emoji": category.get("emoji", ""),
                "tags": category.get("tags", [])
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
        try:
            data = self._parse_typescript(ts_path)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to parse TypeScript file: {e}"))
            return
        
        # Статистика для вывода
        categories_created = 0
        categories_updated = 0
        tags_created = 0
        tags_updated = 0
        
        # Используем транзакцию для атомарной вставки данных
        with transaction.atomic():
            # Сначала создаём категории
            for category_id, category_data in data.items():
                if not category_data["name"]:
                    self.stdout.write(
                        self.style.WARNING(f"Skipping category with empty name: {category_id}")
                    )
                    continue
                
                # Создаём slug для категории
                slug = self._generate_unique_slug(category_data["name"], category_id, Category)
                
                # Создаём или обновляем категорию
                try:
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
                        tag_id = tag_data.get("id")
                        tag_name = tag_data.get("name")
                        
                        if not tag_id or not tag_name:
                            self.stdout.write(
                                self.style.WARNING(f"Skipping tag with empty id or name: {tag_data}")
                            )
                            continue
                        
                        # Создаём стабильный slug для тега, основанный на оригинальном ID
                        tag_slug = self._generate_unique_slug(tag_name, tag_id, Tag)
                        
                        # Создаём или обновляем тег, используя slug как стабильный идентификатор
                        try:
                            tag, is_created = Tag.objects.update_or_create(
                                slug=tag_slug,  # Используем slug как стабильный идентификатор
                                defaults={
                                    "name": tag_name,
                                    "type": Tag.TAG_TYPE_ORDER,  # Явно указываем, что это тег для заказов
                                    "category": category,  # Связываем тег с категорией сразу
                                }
                            )
                            
                            if is_created:
                                tags_created += 1
                            else:
                                tags_updated += 1
                                
                        except Exception as e:
                            self.stdout.write(
                                self.style.ERROR(f"Error creating/updating tag {tag_name}: {e}")
                            )
                            
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"Error creating/updating category {category_data['name']}: {e}")
                    )
            
        self.stdout.write(
            self.style.SUCCESS(
                f"Import finished. Categories: created {categories_created}, updated {categories_updated}. "
                f"Tags: created {tags_created}, updated {tags_updated}."
            )
        )