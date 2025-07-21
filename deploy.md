# Полная инструкция по деплою UgcMarket на Debian 12

Данная инструкция описывает полный процесс деплоя проекта UgcMarket на Debian 12, начиная с чистого сервера до запущенного и полностью работоспособного приложения.

## Требования к серверу

- **ОС**: Debian 12 (Bookworm)
- **RAM**: Минимум 2 ГБ (рекомендуется 4 ГБ)
- **Диск**: Минимум 20 ГБ свободного места (рекомендуется 50 ГБ)
- **CPU**: Минимум 1 vCPU (рекомендуется 2 vCPU)
- **Сеть**: Доступ к серверу по SSH, открытые порты 80 и 443

## 1. Подготовка сервера

### 1.1. Обновление системы и установка базовых пакетов

```bash
# Обновляем систему и устанавливаем необходимые пакеты
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates git vim
```

### 1.2. Создание пользователя для приложения

```bash
# Создаем пользователя ugcmarket
sudo adduser --system --group --home /var/www/ugcmarket ugcmarket

# Добавляем пользователя в группу www-data
sudo usermod -a -G www-data ugcmarket
```

## 2. Установка необходимых компонентов

### 2.1. Установка Python и uv

```bash
# Устанавливаем Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Устанавливаем uv
pip install uv
```

### 2.2. Установка Node.js и npm

```bash
# Добавляем репозиторий Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Устанавливаем Node.js и npm
sudo apt install -y nodejs
```

### 2.3. Установка PostgreSQL

```bash
# Устанавливаем PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Запускаем и включаем автозапуск PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2.4. Установка Redis

```bash
# Устанавливаем Redis
sudo apt install -y redis-server

# Запускаем и включаем автозапуск Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 2.5. Установка Nginx

```bash
# Устанавливаем Nginx
sudo apt install -y nginx

# Запускаем и включаем автозапуск Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 3. Клонирование репозитория

```bash
# Переходим в директорию пользователя ugcmarket
sudo -u ugcmarket -i

# Клонируем репозиторий
git clone https://github.com/your-username/ugcmarket.git /var/www/ugcmarket

# Устанавливаем права на директорию
sudo chown -R ugcmarket:www-data /var/www/ugcmarket
```

## 4. Настройка бэкенда

### 4.1. Создание виртуального окружения и установка зависимостей

```bash
# Переходим в директорию проекта
cd /var/www/ugcmarket

# Переходим в директорию backend
cd backend

# Создаем виртуальное окружение
python3.11 -m venv .venv

# Активируем виртуальное окружение
source .venv/bin/activate

# Устанавливаем зависимости с помощью uv
uv pip install -r requirements.txt
```

### 4.2. Настройка переменных окружения

```bash
# Создаем файл .env
cat > /var/www/ugcmarket/backend/.env << EOF
DEBUG=False
SECRET_KEY=your_secret_key_here
ALLOWED_HOSTS=your_domain.com,www.your_domain.com,localhost,127.0.0.1
DATABASE_URL=postgres://ugcmarket:your_db_password@localhost:5432/ugcmarket
REDIS_URL=redis://localhost:6379/0
EMAIL_HOST=smtp.your_email_provider.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@example.com
EMAIL_HOST_PASSWORD=your_email_password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=your_email@example.com
MEDIA_ROOT=/var/www/ugcmarket/media
STATIC_ROOT=/var/www/ugcmarket/static
EOF

# Устанавливаем правильные права на файл .env
sudo chmod 600 /var/www/ugcmarket/backend/.env
sudo chown ugcmarket:www-data /var/www/ugcmarket/backend/.env
```

### 4.3. Настройка Django

```bash
# Выполняем миграции
python manage.py migrate

# Собираем статические файлы
python manage.py collectstatic --noinput

# Создаем суперпользователя
python manage.py createsuperuser
```

### 4.4. Настройка Gunicorn

```bash
# Устанавливаем Gunicorn
uv pip install gunicorn

# Создаем файл конфигурации Gunicorn
cat > /var/www/ugcmarket/backend/gunicorn_config.py << EOF
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
timeout = 120
keepalive = 5
errorlog = "/var/log/gunicorn/error.log"
accesslog = "/var/log/gunicorn/access.log"
loglevel = "info"
proc_name = "ugcmarket_gunicorn"
EOF

# Создаем директорию для логов
sudo mkdir -p /var/log/gunicorn
sudo chown -R ugcmarket:www-data /var/log/gunicorn
```

### 4.5. Настройка systemd для Gunicorn

```bash
# Создаем сервис для Gunicorn
sudo cat > /etc/systemd/system/ugcmarket_gunicorn.service << EOF
[Unit]
Description=UgcMarket Gunicorn daemon
After=network.target

[Service]
User=ugcmarket
Group=www-data
WorkingDirectory=/var/www/ugcmarket/backend
ExecStart=/var/www/ugcmarket/backend/.venv/bin/gunicorn -c gunicorn_config.py ugc_market.wsgi:application
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

# Создаем сервис для Daphne (WebSocket)
sudo cat > /etc/systemd/system/ugcmarket_daphne.service << EOF
[Unit]
Description=UgcMarket Daphne daemon
After=network.target

[Service]
User=ugcmarket
Group=www-data
WorkingDirectory=/var/www/ugcmarket/backend
ExecStart=/var/www/ugcmarket/backend/.venv/bin/daphne -b 127.0.0.1 -p 8001 ugc_market.asgi:application
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

# Перезагружаем systemd, запускаем и включаем автозапуск сервисов
sudo systemctl daemon-reload
sudo systemctl start ugcmarket_gunicorn ugcmarket_daphne
sudo systemctl enable ugcmarket_gunicorn ugcmarket_daphne
```

## 5. Настройка фронтенда

```bash
# Переходим в директорию фронтенда
cd /var/www/ugcmarket/frontend

# Устанавливаем зависимости
npm install

# Собираем проект
npm run build
```

## 6. Настройка базы данных

```bash
# Входим в PostgreSQL
sudo -u postgres psql

# Создаем пользователя и базу данных
CREATE USER ugcmarket WITH PASSWORD 'your_db_password';
CREATE DATABASE ugcmarket OWNER ugcmarket;
ALTER USER ugcmarket CREATEDB;
\q
```

## 7. Настройка веб-сервера

```bash
# Создаем конфигурацию Nginx
sudo cat > /etc/nginx/sites-available/ugcmarket << EOF
server {
    listen 80 default_server;
    server_name 95.215.56.138;

    # favicon — не логируем
    location = /favicon.ico {
        access_log off;
        log_not_found off;
    }

    # Статика Django
    location /static/ {
        alias /var/www/ugcmarket/backend/staticfiles/;
    }

    # Медиа Django
    location /media/ {
        alias /var/www/ugcmarket/backend/media/;
    }

    # WebSocket (если используется)
    location /ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Админка Django
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Статика React (CSS, JS, изображения)
    location /assets/ {
        root /var/www/ugcmarket/frontend/dist;
        access_log off;
    }

    # React SPA (включая index.html)
    location / {
        root /var/www/ugcmarket/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
}
EOF

# Активируем конфигурацию
sudo ln -s /etc/nginx/sites-available/ugcmarket /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Проверяем конфигурацию и перезапускаем Nginx
sudo nginx -t
sudo systemctl restart nginx
```

## 8. Настройка SSL с Let's Encrypt

```bash
# Устанавливаем Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получаем SSL-сертификат
sudo certbot --nginx -d your_domain.com -d www.your_domain.com

# Настраиваем автоматическое обновление сертификата
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## 9. Резервное копирование

### 9.1. Создание скрипта резервного копирования

```bash
cat > /var/www/ugcmarket/backup.sh << EOF
#!/bin/bash

# Настройки
BACKUP_DIR="/var/backups/ugcmarket"
DB_NAME="ugcmarket"
DB_USER="ugcmarket"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")

# Создаем директорию для резервных копий, если она не существует
mkdir -p \$BACKUP_DIR

# Резервное копирование базы данных
echo "Backing up database..."
pg_dump -U \$DB_USER \$DB_NAME | gzip > "\$BACKUP_DIR/db_\$TIMESTAMP.sql.gz"

# Резервное копирование медиафайлов
echo "Backing up media files..."
tar -czf "\$BACKUP_DIR/media_\$TIMESTAMP.tar.gz" -C /var/www/ugcmarket media

# Удаляем старые резервные копии (старше 30 дней)
echo "Removing old backups..."
find \$BACKUP_DIR -name "db_*.sql.gz" -type f -mtime +30 -delete
find \$BACKUP_DIR -name "media_*.tar.gz" -type f -mtime +30 -delete

echo "Backup completed: \$(date)"
EOF

# Настраиваем права и cron-задачу
sudo chmod +x /var/www/ugcmarket/backup.sh
sudo crontab -e
```

Добавьте строку для ежедневного запуска резервного копирования в 2:00:

```
0 2 * * * /var/www/ugcmarket/backup.sh >> /var/log/ugcmarket_backup.log 2>&1
```

## 10. Обновление приложения

Для обновления приложения выполните следующие шаги:

```bash
cd /var/www/ugcmarket
git pull
cd backend
source .venv/bin/activate

# Обновление бэкенда
cd backend
uv pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# Обновление фронтенда
cd ../frontend
npm install
npm run build

# Перезапуск сервисов
systemctl restart ugcmarket_gunicorn ugcmarket_daphne && systemctl restart nginx
```

## Примечания по безопасности

1. Регулярно обновляйте систему и зависимости:

   ```bash
   sudo apt update && sudo apt upgrade
   ```

2. Настройте брандмауэр, разрешающий только необходимые порты:

   ```bash
   sudo apt install -y ufw
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   sudo ufw enable
   ```

3. Настройте fail2ban для защиты от атак перебором:

   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

4. Регулярно проверяйте логи на наличие ошибок или подозрительной активности:

   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/gunicorn/error.log
   sudo journalctl -u ugcmarket_gunicorn
   sudo journalctl -u ugcmarket_daphne
   ```