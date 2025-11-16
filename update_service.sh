#!/bin/bash

set -e

echo "=== Обновление конфигурации systemd сервиса ==="

APP_DIR="/opt/acoverflow-ai"
SERVICE_NAME="acoverflow-ai"

if [ "$EUID" -ne 0 ]; then 
    echo "Пожалуйста, запустите скрипт от root: sudo bash update_service.sh"
    exit 1
fi

echo "Обновление systemd сервиса с улучшенной конфигурацией перезапуска..."

cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=ACoverFlow AI Web Server
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
ExecStart=$APP_DIR/venv/bin/python $APP_DIR/webserver.py
Restart=always
RestartSec=10
StartLimitInterval=300
StartLimitBurst=5

StandardOutput=journal
StandardError=journal
SyslogIdentifier=acoverflow-ai

[Install]
WantedBy=multi-user.target
EOF

echo "Перезагрузка конфигурации systemd..."
systemctl daemon-reload

echo "Включение автозапуска при загрузке системы..."
systemctl enable ${SERVICE_NAME}

echo "Перезапуск сервиса..."
systemctl restart ${SERVICE_NAME}

echo "Проверка статуса..."
sleep 2
systemctl status ${SERVICE_NAME} --no-pager -l

echo ""
echo "=== Конфигурация обновлена! ==="
echo ""
echo "Параметры перезапуска:"
echo "  - Restart=always - автоматический перезапуск при сбое"
echo "  - RestartSec=10 - задержка 10 секунд между перезапусками"
echo "  - StartLimitInterval=300 - окно времени для ограничения перезапусков (5 минут)"
echo "  - StartLimitBurst=5 - максимум 5 перезапусков в окне времени"
echo "  - WantedBy=multi-user.target - автозапуск при загрузке системы"
echo ""
echo "Сервис будет автоматически:"
echo "  - Перезапускаться при сбое"
echo "  - Запускаться при перезагрузке сервера"
echo "  - Защищен от бесконечных перезапусков"

