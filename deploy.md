# Полная инструкция по деплою UgcMarket на Debian 12

Данная инструкция описывает полный процесс деплоя проекта UgcMarket на Debian 12, начиная с чистого сервера до запущенного и полностью работоспособного приложения.

## Требования к серверу

- **ОС**: Debian 12 (Bookworm)
- **RAM**: Минимум 2 ГБ (рекомендуется 4 ГБ)
- **Диск**: Минимум 20 ГБ свободного места (рекомендуется 50 ГБ)
- **CPU**: Минимум 1 vCPU (рекомендуется 2 vCPU)
- **Сеть**: Доступ к серверу по SSH, открытые порты 80 и 443

## 1. Подготовка сервера

### 1.1. Обновление системы

```bash
# Обновляем список пакетов
sudo apt update

# Обновляем установленные пакеты
sudo apt upgrade -y

# Устанавливаем базовые утилиты
sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates git vim
```

### 1.2. Создание пользователя для приложения

```bash
# Создаем пользователя ugcmarket
sudo adduser --system --group --home /var/www/ugcmarket ugcmarket

# Добавляем пользователя в группу www-data
sudo usermod -a -G www-data ugcmarket
```

### 1.3. Установка и настройка Zsh

```bash
# Устанавливаем Zsh и необходимые утилиты
sudo apt install -y zsh zsh-autosuggestions zsh-syntax-highlighting fonts-powerline

# Устанавливаем Oh My Zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Настраиваем Zsh для пользователя ugcmarket
sudo usermod --shell /usr/bin/zsh ugcmarket

# Копируем конфигурацию Zsh для пользователя ugcmarket
sudo mkdir -p /var/www/ugcmarket/.oh-my-zsh
sudo cp -r ~/.oh-my-zsh/* /var/www/ugcmarket/.oh-my-zsh/
sudo chown -R ugcmarket:ugcmarket /var/www/ugcmarket/.oh-my-zsh

# Создаем файл конфигурации .zshrc
cat << 'EOF' | sudo tee /var/www/ugcmarket/.zshrc > /dev/null
export ZSH="/var/www/ugcmarket/.oh-my-zsh"
ZSH_THEME="agnoster"
plugins=(
  git
  zsh-autosuggestions
  zsh-syntax-highlighting
  docker
  docker-compose
  python
  pip
  sudo
  systemd
)
source $ZSH/oh-my-zsh.sh

export PATH="$PATH:$HOME/.local/bin"

echo "UgcMarket production environment"
EOF

# Устанавливаем владельца и права
sudo chown ugcmarket:ugcmarket /var/www/ugcmarket/.zshrc
sudo chmod 644 /var/www/ugcmarket/.zshrc

# Устанавливаем Zsh по умолчанию для текущего пользователя
sudo chsh -s $(which zsh) $USER

# Устанавливаем Zsh для пользователя ugcmarket
sudo chsh -s $(which zsh) ugcmarket

# Устанавливаем плагины для Zsh
sudo git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-/var/www/ugcmarket/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
sudo git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-/var/www/ugcmarket/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# Устанавливаем шрифт для корректного отображения тем
sudo apt install -y fonts-powerline

# Применяем изменения
source ~/.zshrc
```

### 1.4. Установка Python 3.13 и зависимостей

```bash
# Добавляем PPA с Python 3.13
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update

# Устанавливаем Python 3.13 и необходимые пакеты
sudo apt install -y python3.13 python3.13-dev python3.13-venv python3-pip
sudo apt install -y build-essential libpq-dev libssl-dev libffi-dev

# Создаем символические ссылки
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.13 1
sudo update-alternatives --set python3 /usr/bin/python3.13

# Проверяем версию Python
python3 --version  # Должна быть 3.13.x
```

### 1.4. Установка Node.js 20.x

```bash
# Добавляем репозиторий NodeSource для Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Устанавливаем Node.js
sudo apt install -y nodejs

# Проверяем установку
node --version
npm --version
```

### 1.5. Установка uv (современный менеджер пакетов Python)

```bash
# Устанавливаем uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Добавляем uv в PATH для текущей сессии
source $HOME/.cargo/env

# Проверяем установку
uv --version
```

## 2. Установка и настройка Nginx

### 2.1. Установка Nginx

```bash
# Устанавливаем Nginx
sudo apt install -y nginx

# Запускаем и включаем автозагрузку
sudo systemctl start nginx
sudo systemctl enable nginx

# Проверяем статус
sudo systemctl status nginx
```

### 2.2. Базовая настройка Nginx

```bash
# Создаем каталог для логов
sudo mkdir -p /var/log/nginx/ugcmarket
sudo chown -R www-data:www-data /var/log/nginx/ugcmarket

# Создаем конфигурацию сайта
sudo tee /etc/nginx/sites-available/ugcmarket.conf > /dev/null << 'EOL'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Логирование
    access_log /var/log/nginx/ugcmarket/access.log;
    error_log /var/log/nginx/ugcmarket/error.log;
    
    # Перенаправляем все HTTP-запросы на HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # Пути к SSL-сертификатам (будут добавлены позже)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Настройки SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # HSTS (раскомментировать после настройки SSL)
    # add_header Strict-Transport-Security "max-age=63072000" always;
    
    # Логирование
    access_log /var/log/nginx/ugcmarket/ssl_access.log;
    error_log /var/log/nginx/ugcmarket/ssl_error.log;
    
    # Корневая директория
    root /var/www/ugcmarket/frontend/build;
    index index.html;
    
    # Обработка статических файлов
    location /static/ {
        alias /var/www/ugcmarket/backend/static/;
        expires 30d;
        access_log off;
        add_header Cache-Control "public";
    }
    
    # Обработка медиа файлов
    location /media/ {
        alias /var/www/ugcmarket/backend/media/;
        expires 30d;
        access_log off;
        add_header Cache-Control "public";
    }
    
    # Прокси для API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Прокси для WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $server_name;
    }
    
    # Обработка SPA маршрутов
    location / {
        try_files $uri /index.html;
    }
}
EOL

# Активируем конфигурацию
sudo ln -s /etc/nginx/sites-available/ugcmarket.conf /etc/nginx/sites-enabled/

# Удаляем дефолтную конфигурацию
sudo rm /etc/nginx/sites-enabled/default

# Проверяем конфигурацию Nginx
sudo nginx -t

# Перезагружаем Nginx
sudo systemctl reload nginx
```

### 2.3. Настройка Let's Encrypt SSL

```bash
# Устанавливаем Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получаем SSL-сертификат (замените your-email@example.com на реальный email)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --email your-email@example.com --agree-tos --non-interactive --redirect

# Настраиваем автоматическое продление сертификатов
echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'systemctl reload nginx'" | sudo tee -a /etc/cron.d/certbot

# Разрешаем HTTPS в брандмауэре
sudo ufw allow 'Nginx Full'
```

## 3. Установка и настройка PostgreSQL 15

### 2.1. Установка PostgreSQL

```bash
# Устанавливаем PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-client-15 postgresql-contrib-15

# Запускаем и включаем автозапуск
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Проверяем статус
sudo systemctl status postgresql
```

### 2.2. Настройка PostgreSQL

```bash
# Переключаемся на пользователя postgres
sudo -u postgres psql

# В psql выполняем следующие команды:
```

```sql
-- Создаем базу данных
CREATE DATABASE ugcmarket;

-- Создаем пользователя с сильным паролем
CREATE USER ugcmarket WITH PASSWORD 'UgcMarket2024!SecurePassword';

-- Настраиваем кодировку и параметры
ALTER ROLE ugcmarket SET client_encoding TO 'utf8';
ALTER ROLE ugcmarket SET default_transaction_isolation TO 'read committed';
ALTER ROLE ugcmarket SET timezone TO 'UTC';

-- Предоставляем все права на базу данных
GRANT ALL PRIVILEGES ON DATABASE ugcmarket TO ugcmarket;

-- Предоставляем права на создание баз данных (для тестов)
ALTER USER ugcmarket CREATEDB;

-- Выходим из psql
\q
```

### 2.3. Настройка подключений PostgreSQL

```bash
# Редактируем конфигурацию PostgreSQL
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Найдите и измените следующие параметры:

```ini
# Разрешаем подключения с localhost
listen_addresses = 'localhost'

# Увеличиваем максимальное количество подключений
max_connections = 100

# Настраиваем память
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

Редактируем файл аутентификации:

```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Убедитесь, что есть строка:

```
local   all             ugcmarket                               md5
host    all             ugcmarket       127.0.0.1/32            md5
```

Перезапускаем PostgreSQL:

```bash
sudo systemctl restart postgresql
```

## 3. Установка и настройка Redis

### 3.1. Установка Redis

```bash
# Устанавливаем Redis
sudo apt install -y redis-server

# Запускаем и включаем автозапуск
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Проверяем статус
sudo systemctl status redis-server
```

### 3.2. Настройка Redis

```bash
# Редактируем конфигурацию Redis
sudo nano /etc/redis/redis.conf
```

Найдите и измените следующие параметры:

```ini
# Привязываем к localhost
bind 127.0.0.1

# Устанавливаем пароль (раскомментируйте и установите сильный пароль)
requirepass UgcMarketRedis2024!SecurePassword

# Настраиваем максимальную память
maxmemory 512mb
maxmemory-policy allkeys-lru

# Включаем сохранение на диск
save 900 1
save 300 10
save 60 10000
```

Перезапускаем Redis:

```bash
sudo systemctl restart redis-server

# Тестируем подключение
redis-cli -a 'UgcMarketRedis2024!SecurePassword' ping
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
