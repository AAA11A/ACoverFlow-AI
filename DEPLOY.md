# Инструкция по развертыванию ACoverFlow AI на VPS

## Быстрое развертывание

### 1. Подключитесь к VPS серверу

```bash
ssh root@193.176.78.85
```

### 2. Запустите скрипт развертывания

```bash
wget https://raw.githubusercontent.com/AAA11A/ACoverFlow-AI/main/deploy.sh
chmod +x deploy.sh
sudo bash deploy.sh
```

Или скопируйте содержимое `deploy.sh` на сервер и запустите:

```bash
sudo bash deploy.sh
```

### 3. Настройте переменные окружения

После развертывания отредактируйте файл `.env`:

```bash
nano /opt/acoverflow-ai/.env
```

Укажите ваш OpenAI API ключ:

```env
MUSIC_FOLDER=/var/music_source
OUTPUT_FOLDER=/var/music_with_covers
WEB_PORT=3003
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 4. Перезапустите сервис

```bash
systemctl restart acoverflow-ai
```

## Ручное развертывание

### 1. Установка зависимостей системы

```bash
apt-get update
apt-get install -y python3 python3-pip python3-venv git nginx
```

### 2. Клонирование репозитория

```bash
mkdir -p /opt/acoverflow-ai
cd /opt/acoverflow-ai
git clone https://github.com/AAA11A/ACoverFlow-AI.git .
```

### 3. Создание виртуального окружения

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Создание директорий для музыки

```bash
mkdir -p /var/music_source
mkdir -p /var/music_with_covers
chmod 755 /var/music_source
chmod 755 /var/music_with_covers
```

### 5. Настройка переменных окружения

```bash
nano .env
```

Содержимое файла `.env`:

```env
MUSIC_FOLDER=/var/music_source
OUTPUT_FOLDER=/var/music_with_covers
WEB_PORT=3003
OPENAI_API_KEY=your_api_key_here
```

### 6. Создание systemd сервиса

```bash
nano /etc/systemd/system/acoverflow-ai.service
```

Содержимое:

```ini
[Unit]
Description=ACoverFlow AI Web Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/acoverflow-ai
Environment="PATH=/opt/acoverflow-ai/venv/bin"
ExecStart=/opt/acoverflow-ai/venv/bin/python /opt/acoverflow-ai/webserver.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Активация сервиса:

```bash
systemctl daemon-reload
systemctl enable acoverflow-ai
systemctl start acoverflow-ai
```

### 7. Настройка Nginx

```bash
nano /etc/nginx/sites-available/acoverflow-ai
```

Содержимое:

```nginx
server {
    listen 80;
    server_name 193.176.78.85;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активация конфигурации:

```bash
ln -s /etc/nginx/sites-available/acoverflow-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx
```

## Управление сервисом

### Просмотр статуса

```bash
systemctl status acoverflow-ai
```

### Просмотр логов

```bash
journalctl -u acoverflow-ai -f
```

### Перезапуск

```bash
systemctl restart acoverflow-ai
```

### Остановка

```bash
systemctl stop acoverflow-ai
```

### Запуск

```bash
systemctl start acoverflow-ai
```

## Обновление приложения

```bash
cd /opt/acoverflow-ai
git pull
source venv/bin/activate
pip install -r requirements.txt
systemctl restart acoverflow-ai
```

## Доступ к приложению

После развертывания приложение будет доступно по адресу:

- HTTP: http://193.176.78.85

## Настройка SSL (опционально)

Для использования HTTPS установите Let's Encrypt:

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

## Устранение неполадок

### Проверка портов

```bash
netstat -tlnp | grep 3003
```

### Проверка логов Nginx

```bash
tail -f /var/log/nginx/error.log
```

### Проверка прав доступа

```bash
ls -la /opt/acoverflow-ai
ls -la /var/music_source
ls -la /var/music_with_covers
```

