#!/bin/bash

echo "=== Проверка API ключа на сервере ==="

echo "1. Проверка наличия ключа в .env:"
grep OPENAI_API_KEY /opt/acoverflow-ai/.env | head -c 50
echo "..."

echo ""
echo "2. Проверка последних логов с ошибками:"
journalctl -u acoverflow-ai -n 50 --no-pager | grep -i "error\|openai\|api\|key" || echo "Ошибок не найдено"

echo ""
echo "3. Проверка последних логов генерации обложек:"
journalctl -u acoverflow-ai -n 100 --no-pager | grep -i "cover\|generate\|dall" || echo "Логов генерации не найдено"

echo ""
echo "4. Тест подключения к OpenAI API:"
cd /opt/acoverflow-ai
source venv/bin/activate
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv('OPENAI_API_KEY', '')
if api_key:
    print(f'Ключ найден: {api_key[:20]}...{api_key[-10:]}')
    print(f'Длина ключа: {len(api_key)} символов')
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        print('OpenAI клиент создан успешно')
    except Exception as e:
        print(f'Ошибка создания клиента: {e}')
else:
    print('Ключ не найден в переменных окружения')
"

