# Инструкции по деплою UgcMarket

Данная инструкция описывает полный процесс деплоя проекта UgcMarket, начиная с чистого Linux-сервера до запущенного и полностью работоспособного приложения.

## Требования к серверу

- Ubuntu 22.04 LTS или выше
- Минимум 2 ГБ RAM
- Минимум 20 ГБ свободного места на диске
- Доступ к серверу по SSH

## 1. Подготовка сервера

### 1.1. Обновление системы

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2. Установка необходимых пакетов

```bash
sudo apt install -y build-essential python3-dev python3-pip python3-venv nginx postgresql postgresql-contrib redis-server git
```

### 1.3. Настройка PostgreSQL

```bash
sudo -u postgres psql -c "CREATE DATABASE ugcmarket;"
sudo -u postgres psql -c "CREATE USER ugcmarket WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "ALTER ROLE ugcmarket SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE ugcmarket SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE ugcmarket SET timezone TO 'UTC';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ugcmarket TO ugcmarket;"
```

Замените 'secure_password' на сложный пароль.

### 1.4. Настройка Redis

Redis должен быть запущен после установки:

```bash
sudo systemctl status redis-server
```

## 2. Клонирование и настройка проекта

### 2.1. Клонирование репозитория

```bash
mkdir -p /var/www/
cd /var/www/
git clone <URL_репозитория> ugcmarket
cd ugcmarket
```

### 2.2. Создание и активация виртуального окружения

```bash
python3 -m venv venv
source venv/bin/activate
```

### 2.3. Установка uv и зависимостей

```bash
pip install uv
uv pip install -r backend/requirements.txt
```

### 2.4. Создание файла .env

```bash
cd backend
nano .env
```

Добавьте следующие переменные окружения:

```
DEBUG=False
SECRET_KEY=<сгенерированный_секретный_ключ>
ALLOWED_HOSTS=localhost,127.0.0.1,<ваш_домен>

# Database
DATABASE_URL=postgres://ugcmarket:secure_password@localhost:5432/ugcmarket

# Email
EMAIL_HOST=<smtp_сервер>
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<email_пользователь>
EMAIL_HOST_PASSWORD=<email_пароль>
DEFAULT_FROM_EMAIL=<email_отправителя>

# Redis
REDIS_URL=redis://localhost:6379/0
```

Замените все значения в угловых скобках на ваши собственные.

## 3. Настройка бэкенда

### 3.1. Применение миграций

```bash
cd /var/www/ugcmarket/backend
source ../venv/bin/activate
python manage.py migrate
```

### 3.2. Сбор статических файлов

```bash
python manage.py collectstatic --noinput
```

### 3.3. Создание суперпользователя

```bash
python manage.py createsuperuser
```

## 4. Настройка фронтенда

### 4.1. Установка Node.js и npm

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 4.2. Сборка фронтенда

```bash
cd /var/www/ugcmarket/frontend
npm install
npm run build
```

## 5. Настройка Gunicorn и Supervisor

### 5.1. Установка Supervisor

```bash
sudo apt install -y supervisor
```

### 5.2. Создание конфигурации Supervisor для Django

```bash
sudo nano /etc/supervisor/conf.d/ugcmarket_django.conf
```

Добавьте следующее содержимое:

```ini
[program:ugcmarket_django]
directory=/var/www/ugcmarket/backend
command=/var/www/ugcmarket/venv/bin/gunicorn ugc_market.wsgi:application --bind 127.0.0.1:8000 --workers 3
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/ugcmarket_django.log
environment=
    DEBUG="False",
    SECRET_KEY="<сгенерированный_секретный_ключ>",
    ALLOWED_HOSTS="localhost,127.0.0.1,<ваш_домен>",
    DATABASE_URL="postgres://ugcmarket:secure_password@localhost:5432/ugcmarket",
    EMAIL_HOST="<smtp_сервер>",
    EMAIL_PORT="587",
    EMAIL_USE_TLS="True",
    EMAIL_HOST_USER="<email_пользователь>",
    EMAIL_HOST_PASSWORD="<email_пароль>",
    DEFAULT_FROM_EMAIL="<email_отправителя>",
    REDIS_URL="redis://localhost:6379/0"
```

### 5.3. Создание конфигурации Supervisor для Daphne (WebSockets)

```bash
sudo nano /etc/supervisor/conf.d/ugcmarket_daphne.conf
```

Добавьте следующее содержимое:

```ini
[program:ugcmarket_daphne]
directory=/var/www/ugcmarket/backend
command=/var/www/ugcmarket/venv/bin/daphne -p 8001 ugc_market.asgi:application
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/ugcmarket_daphne.log
environment=
    DEBUG="False",
    SECRET_KEY="<сгенерированный_секретный_ключ>",
    ALLOWED_HOSTS="localhost,127.0.0.1,<ваш_домен>",
    DATABASE_URL="postgres://ugcmarket:secure_password@localhost:5432/ugcmarket",
    EMAIL_HOST="<smtp_сервер>",
    EMAIL_PORT="587",
    EMAIL_USE_TLS="True",
    EMAIL_HOST_USER="<email_пользователь>",
    EMAIL_HOST_PASSWORD="<email_пароль>",
    DEFAULT_FROM_EMAIL="<email_отправителя>",
    REDIS_URL="redis://localhost:6379/0"
```

### 5.4. Перезагрузка Supervisor

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart all
```

## 6. Настройка Nginx

### 6.1. Создание конфигурации Nginx

```bash
sudo nano /etc/nginx/sites-available/ugcmarket
```

Добавьте следующее содержимое:

```nginx
server {
    listen 80;
    server_name <ваш_домен>;

    # Статические и медиа файлы
    location /static/ {
        alias /var/www/ugcmarket/backend/static/;
    }

    location /media/ {
        alias /var/www/ugcmarket/backend/media/;
    }

    # Проксирование запросов API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Проксирование запросов для WebSockets (для чатов)
    location /ws {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Проксирование запросов для админки
    location /admin {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Все остальные запросы направлять на фронтенд
    location / {
        root /var/www/ugcmarket/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

### 6.2. Активация конфигурации и перезапуск Nginx

```bash
sudo ln -s /etc/nginx/sites-available/ugcmarket /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. Настройка HTTPS с помощью Certbot

### 7.1. Установка Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2. Получение SSL-сертификата

```bash
sudo certbot --nginx -d <ваш_домен>
```

Следуйте инструкциям Certbot для завершения настройки HTTPS.

## 8. Специфические настройки для чатов

Модуль чатов требует работающего Redis и настроенного Daphne для WebSocket соединений. 
Убедитесь, что:

1. Redis правильно настроен и работает:
   ```bash
   sudo systemctl status redis-server
   ```

2. Daphne запущен через Supervisor (как настроено в разделе 5.3).

3. Nginx правильно настроен для проксирования WebSocket соединений (раздел 6.1).

## 9. Проверка работоспособности

### 9.1. Проверка бэкенда

```bash
curl -I http://<ваш_домен>/api/auth/user/
```

### 9.2. Проверка фронтенда

Откройте в браузере http://<ваш_домен>/ и убедитесь, что фронтенд загружается.

### 9.3. Проверка WebSocket для чатов

Откройте в браузере http://<ваш_домен>/chats/ и убедитесь, что соединение устанавливается.

## 10. Настройка резервного копирования

### 10.1. Создание скрипта для резервного копирования

```bash
sudo nano /var/www/ugcmarket/backup.sh
```

Добавьте следующее содержимое:

```bash
#!/bin/bash

# Переменные
BACKUP_DIR="/var/backups/ugcmarket"
DATETIME=$(date +%Y%m%d_%H%M%S)
DB_NAME="ugcmarket"
DB_USER="ugcmarket"
DB_PASS="secure_password"
PROJECT_DIR="/var/www/ugcmarket"

# Создаем директорию для резервных копий, если она не существует
mkdir -p $BACKUP_DIR

# Бэкап базы данных
PGPASSWORD="$DB_PASS" pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/db_$DATETIME.sql

# Бэкап медиа-файлов
tar -czf $BACKUP_DIR/media_$DATETIME.tar.gz $PROJECT_DIR/backend/media

# Удаление старых резервных копий (старше 30 дней)
find $BACKUP_DIR -name "db_*.sql" -type f -mtime +30 -delete
find $BACKUP_DIR -name "media_*.tar.gz" -type f -mtime +30 -delete

echo "Backup completed: $(date)"
```

### 10.2. Настройка прав и cron-задачи

```bash
sudo chmod +x /var/www/ugcmarket/backup.sh
sudo crontab -e
```

Добавьте строку для ежедневного запуска резервного копирования в 2:00:

```
0 2 * * * /var/www/ugcmarket/backup.sh >> /var/log/ugcmarket_backup.log 2>&1
```

## 11. Обновление приложения

Для обновления приложения выполните следующие шаги:

```bash
cd /var/www/ugcmarket
git pull
source venv/bin/activate

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
sudo supervisorctl restart all
sudo systemctl restart nginx
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
   sudo tail -f /var/log/supervisor/ugcmarket_django.log
   sudo tail -f /var/log/supervisor/ugcmarket_daphne.log
   ```