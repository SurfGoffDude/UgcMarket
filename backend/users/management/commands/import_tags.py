from __future__ import annotations

import pathlib
import re
from typing import Iterable

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from core.models import Tag
from orders.models import Category   # Импортируем модель Category

# Обновленное регулярное выражение для заголовков с эмодзи
# Теперь сохраняем и эмодзи, и текст категории
_HEADING_RE = re.compile(r"^###\s+(.*?)\s+\*\*(.+)\*\*")
_ITEM_RE = re.compile(r"^(\d+)\.\s+(.+)")


class Command(BaseCommand):
    help = "Import tags from markdown file into the database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            dest="file_path",
            type=str,
            default="frontend/public/tags.md",
            help=(
                "Path to markdown file with tags. Default: frontend/public/tags.md "
                "(relative to project root)."
            ),
        )

    # ---------------------------------------------------------------------
    # utils
    # ---------------------------------------------------------------------
    def _parse_markdown(self, md_path: pathlib.Path) -> Iterable[tuple[str, str]]:
        """Yield tuples (tag_name, category_name) from markdown file."""
        if not md_path.exists():
            raise CommandError(f"Markdown file not found: {md_path}")

        current_category: str | None = None
        with md_path.open("r", encoding="utf-8") as fp:
            for line in fp:
                line = line.rstrip("\n")
                heading = _HEADING_RE.match(line)
                if heading:
                    emoji = heading.group(1).strip()
                    category_text = heading.group(2).strip()
                    current_category = f"{emoji} {category_text}"
                    self.stdout.write(f"Found category: {current_category}")
                    continue

                item = _ITEM_RE.match(line)
                if item:
                    name = item.group(2).strip()
                    self.stdout.write(f"Found tag: {name} in category: {current_category or 'Без категории'}")
                    yield name, current_category or "Без категории"

    # ------------------------------------------------------------------
    # main handle
    # ------------------------------------------------------------------
    def handle(self, *args, **options):
        file_option = options["file_path"]
        md_path = pathlib.Path(file_option)
        # Если путь относительный, пробуем сперва относительно текущей cwd,
        # а затем относительно корня проекта (settings.BASE_DIR/..)
        if not md_path.is_absolute():
            if not md_path.exists():
                from django.conf import settings
                project_root = pathlib.Path(settings.BASE_DIR).parent
                md_path = project_root / md_path
        md_path = md_path.resolve()
        self.stdout.write(f"Importing tags from {md_path}…")

        created = 0
        updated = 0
        categories_stats = {}

        def _generate_unique_slug(name: str, model_class) -> str:
            """Генерирует уникальный slug для указанной модели."""
            base = slugify(name) or "item"
            slug = base
            counter = 1
            while model_class.objects.filter(slug=slug).exists():
                slug = f"{base}-{counter}"
                counter += 1
            return slug

        for tag_name, category_name in self._parse_markdown(md_path):
            # Пытаемся найти категорию или создать новую с уникальным slug
            try:
                category_obj = Category.objects.get(name=category_name)
                cat_created = False
            except Category.DoesNotExist:
                # Генерируем уникальный slug для категории
                category_slug = _generate_unique_slug(category_name, Category)
                category_obj = Category.objects.create(
                    name=category_name,
                    slug=category_slug
                )
                cat_created = True
            except Category.MultipleObjectsReturned:
                # Если найдено несколько категорий с таким именем, берем первую
                self.stdout.write(
                    self.style.WARNING(
                        f"Found multiple categories with name '{category_name}', using the first one"
                    )
                )
                category_obj = Category.objects.filter(name=category_name).first()
                cat_created = False
            
            # Ведем статистику по категориям
            if category_name not in categories_stats:
                categories_stats[category_name] = 0
            categories_stats[category_name] += 1

            # Генерируем уникальный slug для тега
            tag_slug = _generate_unique_slug(tag_name, Tag)

            tag, is_created = Tag.objects.update_or_create(
                slug=tag_slug,
                defaults={
                    "name": tag_name,
                    "category": category_obj,
                    "type": Tag.TAG_TYPE_CREATOR,
                },
            )
            if is_created:
                created += 1
            else:
                updated += 1

        # Выводим статистику по категориям
        self.stdout.write("\nTags by category:")
        for category, count in categories_stats.items():
            self.stdout.write(f"  - {category}: {count} tags")

        self.stdout.write(
            self.style.SUCCESS(
                f"Tags import finished. Created: {created}, updated: {updated}."
            )
        )