from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os
import re

class TagsView(APIView):
    """Возвращает список тегов из markdown-файла в формате JSON

    Формат элемента:
    {
        "id": int,
        "name": str,
        "category": str
    }
    """
    FILE_NAME = "tags.md"

    def get(self, request, *args, **kwargs):
        file_path = self._find_file()
        if not file_path:
            return Response({"detail": "tags.md not found"}, status=status.HTTP_404_NOT_FOUND)
        with open(file_path, "r", encoding="utf-8") as f:
            md = f.read()
        return Response(self._parse(md))

    def _find_file(self) -> str | None:
        # Ищем файл сначала в корне проекта, затем в папке frontend/public
        candidates = [
            os.path.join(settings.BASE_DIR, "tags.md"),
            os.path.join(settings.BASE_DIR, "..", "frontend", "public", "tags.md"),
        ]
        for path in candidates:
            if os.path.exists(path):
                return path
        return None

    def _parse(self, md: str):
        lines = md.splitlines()
        current_category = ""
        result = []
        for line in lines:
            heading = re.match(r"^### .*?\*\*(.+)\*\*", line)
            if heading:
                current_category = heading.group(1).strip()
                continue
            item = re.match(r"^(\d+)\.\s+(.+)", line)
            if item:
                result.append({
                    "id": int(item.group(1)),
                    "name": item.group(2).strip(),
                    "category": current_category,
                })
        return result
