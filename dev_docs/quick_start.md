## python

0. cd backend/
1. cd backend/ && uv run python3 manage.py runserver 8000
2. uv run python3 manage.py makemigrations && uv run python3 manage.py migrate
3. uv run python3 manage.py import_tags && uv run python3 manage.py import_tags_categories

## react

0. cd frontend/ && npm run dev

## git

1. git add . && git commit -m ""

## database

0. sudo rm -rf backend/*/migrations/000*.py
1. uv run python3 manage.py makemigrations && uv run python3 manage.py migrate
2. DROP DATABASE ugc_market_db;
3. CREATE DATABASE ugc_market_db OWNER ugc_market ENCODING 'UTF8';
4. ALTER USER ugc_market WITH PASSWORD 'xxx';
5. uv run python3 manage.py migrate
6. uv run python3 manage.py import_tags && uv run python3 manage.py import_tags_categories
