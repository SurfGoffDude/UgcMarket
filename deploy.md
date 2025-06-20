# Инструкции по деплою проекта UGC Market

## Требования к системе

- Ubuntu 22.04 LTS (рекомендуется для production)
- Python 3.13.1
- PostgreSQL 16+
- Node.js 20+
- Nginx

## Подготовка сервера

### Обновление системы

```bash
sudo apt update
sudo apt upgrade -y
```

### Установка необходимых пакетов

```bash
sudo apt install -y build-essential libssl-dev libffi-dev python3.13-dev postgresql postgresql-contrib nginx curl
```

### Установка uv (менеджер пакетов Python)

```bash
curl -sSf https://install.python-poetry.org | python3 -
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
cargo install uv
```

### Настройка PostgreSQL

```bash
sudo -u postgres psql -c "CREATE DATABASE ugc_market;"
sudo -u postgres psql -c "CREATE USER ugc_user WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "ALTER ROLE ugc_user SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE ugc_user SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE ugc_user SET timezone TO 'Europe/Moscow';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ugc_market TO ugc_user;"
```

## Настройка Backend

### Клонирование репозитория (если используется Git)

```bash
git clone <repository-url> /var/www/ugc_market
cd /var/www/ugc_market
```

### Настройка виртуального окружения и установка зависимостей

```bash
cd /var/www/ugc_market/backend
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### Настройка переменных окружения

Создайте файл `.env` в директории backend:

```bash
cat > /var/www/ugc_market/backend/.env << EOL
SECRET_KEY=your_secure_django_secret_key
DEBUG=False
ALLOWED_HOSTS=your_domain.com,www.your_domain.com
DB_NAME=ugc_market
DB_USER=ugc_user
DB_PASSWORD=secure_password
DB_HOST=localhost
DB_PORT=5432
EOL
```

### Миграция базы данных и создание суперпользователя

```bash
cd /var/www/ugc_market/backend
source .venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
```

### Настройка статических файлов

```bash
python manage.py collectstatic
```

## Настройка Frontend

### Установка зависимостей

```bash
cd /var/www/ugc_market/frontend
npm install
```

### Сборка проекта

```bash
npm run build
```

## Настройка Nginx

### Создание конфигурационного файла для Nginx

```bash
sudo nano /etc/nginx/sites-available/ugc_market
```

Содержимое файла:

```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    location /static/ {
        alias /var/www/ugc_market/backend/static/;
    }

    location /media/ {
        alias /var/www/ugc_market/backend/media/;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /admin/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/ugc_market/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### Активация конфигурации

```bash
sudo ln -s /etc/nginx/sites-available/ugc_market /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Настройка Gunicorn (WSGI сервер для Django)

### Установка Gunicorn

```bash
cd /var/www/ugc_market/backend
source .venv/bin/activate
uv pip install gunicorn
```

### Создание systemd сервиса для Gunicorn

```bash
sudo nano /etc/systemd/system/gunicorn.service
```

Содержимое файла:

```ini
[Unit]
Description=gunicorn daemon for UGC Market
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ugc_market/backend
ExecStart=/var/www/ugc_market/backend/.venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 ugc_market.wsgi:application
EnvironmentFile=/var/www/ugc_market/backend/.env
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Запуск и активация сервиса Gunicorn

```bash
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
```

## Настройка Daphne (ASGI сервер для WebSockets)

### Создание systemd сервиса для Daphne

```bash
sudo nano /etc/systemd/system/daphne.service
```

Содержимое файла:

```ini
[Unit]
Description=daphne daemon for UGC Market WebSockets
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ugc_market/backend
ExecStart=/var/www/ugc_market/backend/.venv/bin/daphne -b 127.0.0.1 -p 8001 ugc_market.asgi:application
EnvironmentFile=/var/www/ugc_market/backend/.env
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Запуск и активация сервиса Daphne

```bash
sudo systemctl start daphne
sudo systemctl enable daphne
```

### Обновление Nginx для поддержки WebSockets

Добавьте в конфигурацию Nginx:

```nginx
location /ws/ {
    proxy_pass http://localhost:8001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Перезапуск Nginx

```bash
sudo systemctl restart nginx
```

## Настройка SSL (с Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com -d www.your_domain.com
```

## Обновление проекта

### Обновление Backend

```bash
cd /var/www/ugc_market
git pull
cd backend
source .venv/bin/activate
uv pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart gunicorn
sudo systemctl restart daphne
```

### Обновление Frontend

```bash
cd /var/www/ugc_market/frontend
git pull
npm install
npm run build
```

## Мониторинг логов

### Логи Gunicorn
```bash
sudo journalctl -u gunicorn
```

### Логи Daphne
```bash
sudo journalctl -u daphne
```

### Логи Nginx
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```