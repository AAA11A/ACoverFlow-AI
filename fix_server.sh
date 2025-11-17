#!/bin/bash

set -e

echo "=== Исправление и обновление ACoverFlow AI на сервере ==="

APP_DIR="/opt/acoverflow-ai"
SERVICE_NAME="acoverflow-ai"

if [ "$EUID" -ne 0 ]; then 
    echo "Пожалуйста, запустите скрипт от root: sudo bash fix_server.sh"
    exit 1
fi

echo "1. Переход в директорию приложения..."
cd $APP_DIR

echo "2. Обновление кода из репозитория..."
if [ -d ".git" ]; then
    git pull
else
    echo "ОШИБКА: Репозиторий не найден. Убедитесь, что код находится в $APP_DIR"
    exit 1
fi

echo "3. Активация виртуального окружения..."
source venv/bin/activate

echo "4. Обновление зависимостей..."
pip install --upgrade pip
pip install -r requirements.txt

echo "5. Проверка файла .env..."
if [ ! -f .env ]; then
    echo "Создание файла .env..."
    cat > .env << EOF
MUSIC_FOLDER=/var/music_source
OUTPUT_FOLDER=/var/music_with_covers
WEB_PORT=3004
WEB_HOST=0.0.0.0
OPENAI_API_KEY=your_api_key_here
EOF
    echo "ВАЖНО: Отредактируйте файл .env и укажите ваш OPENAI_API_KEY!"
else
    if ! grep -q "WEB_HOST" .env; then
        echo "Добавление WEB_HOST в .env..."
        echo "WEB_HOST=0.0.0.0" >> .env
    fi
    echo "Файл .env проверен."
fi

echo "6. Перезагрузка конфигурации systemd..."
systemctl daemon-reload

echo "7. Перезапуск сервиса..."
systemctl restart ${SERVICE_NAME}

echo "8. Проверка статуса сервиса..."
sleep 3
systemctl status ${SERVICE_NAME} --no-pager -l

echo ""
echo "=== Обновление завершено! ==="
echo ""
echo "Проверьте логи, если есть проблемы:"
echo "  journalctl -u ${SERVICE_NAME} -n 50 --no-pager"
echo ""
echo "Проверьте, что сервер слушает порт 3004:"
echo "  netstat -tlnp | grep 3004"
echo ""

