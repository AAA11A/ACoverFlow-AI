#!/bin/bash

set -e

echo "=== Развертывание ACoverFlow AI на VPS ==="

REPO_URL="https://github.com/AAA11A/ACoverFlow-AI.git"
APP_DIR="/opt/acoverflow-ai"
SERVICE_NAME="acoverflow-ai"

if [ "$EUID" -ne 0 ]; then 
    echo "Пожалуйста, запустите скрипт от root: sudo bash deploy.sh"
    exit 1
fi

echo "1. Обновление системы..."
apt-get update
apt-get install -y python3 python3-pip python3-venv git nginx

echo "2. Создание директории приложения..."
mkdir -p $APP_DIR
cd $APP_DIR

echo "3. Клонирование репозитория..."
if [ -d ".git" ]; then
    echo "Репозиторий уже существует, обновление..."
    git pull
else
    git clone $REPO_URL .
fi

echo "4. Создание виртуального окружения..."
python3 -m venv venv
source venv/bin/activate

echo "5. Установка зависимостей..."
pip install --upgrade pip
pip install -r requirements.txt

echo "6. Создание директорий для музыки..."
mkdir -p /var/music_source
mkdir -p /var/music_with_covers
chmod 755 /var/music_source
chmod 755 /var/music_with_covers

echo "7. Настройка переменных окружения..."
if [ ! -f .env ]; then
    echo "Создание файла .env..."
    cat > .env << EOF
MUSIC_FOLDER=/var/music_source
OUTPUT_FOLDER=/var/music_with_covers
WEB_PORT=3003
OPENAI_API_KEY=your_api_key_here
EOF
    echo "ВАЖНО: Отредактируйте файл .env и укажите ваш OPENAI_API_KEY!"
    echo "Файл находится в: $APP_DIR/.env"
else
    echo "Файл .env уже существует, пропускаем создание..."
fi

echo "8. Создание systemd сервиса..."
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=ACoverFlow AI Web Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
ExecStart=$APP_DIR/venv/bin/python $APP_DIR/webserver.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "9. Настройка Nginx..."
cat > /etc/nginx/sites-available/${SERVICE_NAME} << EOF
server {
    listen 80;
    server_name 193.176.78.85;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/${SERVICE_NAME} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "10. Перезагрузка конфигурации..."
systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl restart ${SERVICE_NAME}
systemctl restart nginx

echo "11. Проверка статуса сервиса..."
sleep 2
systemctl status ${SERVICE_NAME} --no-pager -l

echo ""
echo "=== Развертывание завершено! ==="
echo "Приложение доступно по адресу: http://193.176.78.85"
echo ""
echo "Полезные команды:"
echo "  Статус сервиса: systemctl status ${SERVICE_NAME}"
echo "  Логи сервиса: journalctl -u ${SERVICE_NAME} -f"
echo "  Перезапуск: systemctl restart ${SERVICE_NAME}"
echo "  Остановка: systemctl stop ${SERVICE_NAME}"
echo ""
echo "ВАЖНО: Не забудьте отредактировать $APP_DIR/.env и указать ваш OPENAI_API_KEY!"

