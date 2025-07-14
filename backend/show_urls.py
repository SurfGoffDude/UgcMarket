"""
Скрипт для отображения всех URL в Django проекте.
"""
import os
import sys
import django

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ugc_market.settings')
django.setup()

from django.urls import get_resolver
from django.urls.resolvers import URLPattern, URLResolver

def show_urls(urlpatterns, base=''):
    """Печатает все URL проекта."""
    for pattern in urlpatterns:
        if isinstance(pattern, URLPattern):
            pattern_str = str(pattern.pattern)
            if not pattern_str.startswith('/'):
                pattern_str = '/' + pattern_str
            print(f"{base}{pattern_str} - {pattern.callback.__name__ if hasattr(pattern.callback, '__name__') else pattern.name}")
        elif isinstance(pattern, URLResolver):
            new_base = base + str(pattern.pattern)
            if not new_base.endswith('/'):
                new_base += '/'
            show_urls(pattern.url_patterns, new_base)

if __name__ == '__main__':
    resolver = get_resolver()
    print("\nAll URLs in the project:\n")
    show_urls(resolver.url_patterns)