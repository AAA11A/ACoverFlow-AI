# Быстрый старт

## 1. Установка зависимостей

```powershell
pip install -r requirements.txt
```

## 2. Настройка конфигурации

Создайте файл `.env` в корне проекта:

```env
OPENAI_API_KEY=your_openai_api_key_here
MUSIC_FOLDER=D:\music_source
OUTPUT_FOLDER=D:\music_with_covers
WEB_PORT=3003
```

**Важно:** Замените `your_openai_api_key_here` на ваш реальный API ключ OpenAI.

## 3. Подготовка структуры папок

Создайте папку с музыкой в следующей структуре:

```
MUSIC_FOLDER/
  Ambient/
    track1.mp3
    track2.mp3
  Chillout/
    track1.mp3
  Beautiful Music/
    track1.mp3
  New Age/
    track1.mp3
```

## 4. Запуск

### Автоматическая обработка

```powershell
python generate_covers.py
```

Скрипт обработает все MP3-файлы и сохранит результаты в `OUTPUT_FOLDER`.

### Веб-интерфейс

```powershell
python webserver.py
```

Откройте в браузере: http://localhost:3003

## 5. Проверка работы

1. Убедитесь, что файлы обработаны и сохранены в `OUTPUT_FOLDER`
2. Проверьте, что обложки добавлены в файлы (если их не было)
3. Откройте веб-интерфейс и проверьте отображение файлов
4. Попробуйте отредактировать теги через веб-интерфейс

## Возможные проблемы

- **Ошибка "OPENAI_API_KEY не установлен"** - проверьте файл `.env`
- **Папка не найдена** - проверьте пути в `.env`
- **Ошибка импорта модулей** - убедитесь, что установлены все зависимости

