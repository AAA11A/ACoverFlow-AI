#!/bin/bash

set -e

echo "=== Продолжение развертывания ACoverFlow AI ==="

APP_DIR="/opt/acoverflow-ai"

if [ "$EUID" -ne 0 ]; then 
    echo "Пожалуйста, запустите скрипт от root: sudo bash deploy_continue.sh"
    exit 1
fi

echo "1. Переход в директорию приложения..."
cd $APP_DIR

echo "2. Активация виртуального окружения..."
source venv/bin/activate

echo "3. Установка зависимостей..."
pip install --upgrade pip
pip install -r requirements.txt

echo "4. Создание директорий для музыки..."
mkdir -p /var/music_source
mkdir -p /var/music_with_covers
chmod 755 /var/music_source
chmod 755 /var/music_with_covers

echo "5. Проверка файла .env..."
if [ ! -f .env ]; then
    echo "Создание файла .env..."
    cat > .env << EOF
MUSIC_FOLDER=/var/music_source
OUTPUT_FOLDER=/var/music_with_covers
WEB_PORT=3004
OPENAI_API_KEY=your_api_key_here
EOF
    echo "ВАЖНО: Отредактируйте файл .env и укажите ваш OPENAI_API_KEY!"
    echo "Файл находится в: $APP_DIR/.env"
else
    echo "Файл .env уже существует."
fi

echo "6. Создание systemd сервиса..."
cat > /etc/systemd/system/acoverflow-ai.service << EOF
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

echo "7. Настройка Nginx..."
cat > /etc/nginx/sites-available/acoverflow-ai << EOF
server {
    listen 80;
    server_name 193.176.78.85;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3004;
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

ln -sf /etc/nginx/sites-available/acoverflow-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "8. Перезагрузка конфигурации..."
systemctl daemon-reload
systemctl enable acoverflow-ai
systemctl restart acoverflow-ai
systemctl restart nginx

echo "9. Проверка статуса сервиса..."
sleep 2
systemctl status acoverflow-ai --no-pager -l

echo ""
echo "=== Развертывание завершено! ==="
echo "Приложение доступно по адресу: http://193.176.78.85"
echo ""
echo "Полезные команды:"
echo "  Статус сервиса: systemctl status acoverflow-ai"
echo "  Логи сервиса: journalctl -u acoverflow-ai -f"
echo "  Перезапуск: systemctl restart acoverflow-ai"
echo ""
echo "ВАЖНО: Не забудьте отредактировать $APP_DIR/.env и указать ваш OPENAI_API_KEY!"

