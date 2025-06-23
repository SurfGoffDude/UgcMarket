"""Management command to import tags from a markdown file.

The markdown file is expected to have the following simplified format (as in
`frontend/public/tags.md`):

### **Category Name**
1. Tag name one
2. Tag name two

Every list item line begins with an integer id followed by a dot and a space.
The integer will be used as primary key (id). If a tag with such id already
exists its name and slug will be updated.

If you need another file path you can pass it via ``--file`` argument.
"""

from __future__ import annotations

import pathlib
import re
from typing import Iterable

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from users.models import Tag

# Regex patterns for markdown parsing
_HEADING_RE = re.compile(r"^###\s+\*\*(.+)\*\*")
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
    @staticmethod
    def _parse_markdown(md_path: pathlib.Path) -> Iterable[tuple[int, str]]:
        """Yield tuples ``(id, name)`` from markdown file."""
        if not md_path.exists():
            raise CommandError(f"Markdown file not found: {md_path}")

        current_category: str | None = None
        with md_path.open("r", encoding="utf-8") as fp:
            for line in fp:
                line = line.rstrip("\n")
                heading = _HEADING_RE.match(line)
                if heading:
                    current_category = heading.group(1).strip()
                    continue

                item = _ITEM_RE.match(line)
                if item:
                    tag_id = int(item.group(1))
                    name = item.group(2).strip()
                    if current_category:
                        name = f"{name}"
                    yield tag_id, name

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
        def _generate_unique_slug(name: str, tag_id: int) -> str:
            base = slugify(name) or f"tag-{tag_id}"
            slug = base
            counter = 1
            while Tag.objects.filter(slug=slug).exclude(id=tag_id).exists():
                slug = f"{base}-{counter}"
                counter += 1
            return slug

        for tag_id, name in self._parse_markdown(md_path):
            slug = _generate_unique_slug(name, tag_id)
            tag, is_created = Tag.objects.update_or_create(
                id=tag_id,
                defaults={"name": name, "slug": slug},
            )
            if is_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Tags import finished. Created: {created}, updated: {updated}."
            )
        )
