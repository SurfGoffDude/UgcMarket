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

### Установка Python 3.13

```bash
# Добавляем репозиторий Deadsnakes для установки Python 3.13
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update

# Устанавливаем Python 3.13 и необходимые пакеты
sudo apt install -y python3.13 python3.13-venv python3.13-dev build-essential libssl-dev libffi-dev postgresql postgresql-contrib nginx curl
```

### Установка необходимых пакетов

### Установка uv (современный менеджер пакетов Python)

```bash
# Прямая установка uv без зависимости от Rust
curl -LsSf https://astral.sh/uv/install.sh | sh

# Добавление uv в PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Добавляем в файл конфигурации шелла
if [ -n "$ZSH_VERSION" ]; then
  echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.zshrc
else
  echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
fi
```

### Настройка PostgreSQL

```bash
sudo -u postgres psql -c "CREATE DATABASE ugc_market;"
sudo -u postgres psql -c "CREATE USER ugc_market WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "ALTER ROLE ugc_market SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE ugc_market SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE ugc_market SET timezone TO 'Europe/Moscow';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ugc_market_db TO ugc_market;"
```

### Установка и настройка Zsh, Oh My Zsh и Powerlevel10k

#### Установка Zsh

```bash
sudo apt install -y zsh
chsh -s $(which zsh)  # Меняем оболочку по умолчанию на Zsh
```

#### Установка Oh My Zsh

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

#### Установка Powerlevel10k

```bash
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

Откройте файл конфигурации `.zshrc`:

```bash
nano ~/.zshrc
```

Найдите строку с `ZSH_THEME` и измените ее на:

```bash
ZSH_THEME="powerlevel10k/powerlevel10k"
```

Затем перезагрузите конфигурацию:

```bash
source ~/.zshrc
```

При первом запуске будет запущен мастер настройки Powerlevel10k. Следуйте инструкциям для настройки внешнего вида.

#### Установка полезных плагинов для Oh My Zsh

```bash
# Плагин автодополнения
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# Плагин подсветки синтаксиса
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

Откройте файл `.zshrc` и найдите строку с `plugins=(git)` или подобную. Измените ее на:

```bash
plugins=(git zsh-autosuggestions zsh-syntax-highlighting docker django python pip npm node)
```

#### Установка дополнительных полезных утилит для разработки

```bash
# Установка fd (улучшенный find)
sudo apt install -y fd-find
ln -s $(which fdfind) ~/.local/bin/fd

# Установка ripgrep (улучшенный grep)
sudo apt install -y ripgrep

# Установка bat (улучшенный cat)
sudo apt install -y bat
ln -s $(which batcat) ~/.local/bin/bat

# Установка htop (улучшенный top)
sudo apt install -y htop

# Установка tmux (терминальный мультиплексор)
sudo apt install -y tmux

# Установка jq (работа с JSON в командной строке)
sudo apt install -y jq

# Установка fzf (нечеткий поиск)
git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
~/.fzf/install

# Установка pyenv (управление версиями Python)
curl https://pyenv.run | bash
```

Добавьте в конец файла `.zshrc` следующие строки для интеграции установленных утилит:

```bash
# Настройки для pyenv
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init --path)"
eval "$(pyenv init -)"

# Настройки для fzf
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# Псевдонимы для улучшенных утилит
alias cat="bat --paging=never"
alias grep="rg"
alias find="fd"
alias top="htop"

# Псевдоним для быстрого создания и активации виртуального окружения Python
alias pyenv-create="python -m venv .venv && source .venv/bin/activate"
```

Перезапустите терминал или выполните:

```bash
source ~/.zshrc
```

## Настройка Backend

### Клонирование репозитория (если используется Git)

```bash
git clone <repository-url> /var/www/ugc_market
cd /var/www/ugc_market
```

### Настройка виртуального окружения и установка зависимостей через uv

```bash
cd /var/www/ugc_market/backend
# Создание виртуального окружения через uv
uv venv
# Активация виртуального окружения
source .venv/bin/activate
# Установка зависимостей через uv (значительно быстрее pip)
uv pip sync requirements.txt
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
# Запуск Django команд через uv run для более быстрой работы
uv run python manage.py migrate
uv run python manage.py createsuperuser
```

### Настройка статических файлов

```bash
# Сбор статических файлов через uv для ускорения запуска
uv run python manage.py collectstatic
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
ExecStart=/var/www/ugc_market/backend/.venv/bin/uv run gunicorn --workers 3 --bind 127.0.0.1:8000 ugc_market.wsgi:application
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
ExecStart=/var/www/ugc_market/backend/.venv/bin/uv run daphne -b 127.0.0.1 -p 8001 ugc_market.asgi:application
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
# Синхронизация зависимостей через uv
uv pip sync requirements.txt
# Запуск команд Django через uv
uv run python manage.py migrate
uv run python manage.py collectstatic --noinput
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