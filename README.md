# Система автоматической и ручной обработки MP3-треков с жанровыми обложками

Система для автоматической обработки MP3-файлов с генерацией обложек через GPT Images API и веб-интерфейсом для ручного редактирования ID3-тегов.

## Возможности

- Автоматическое определение жанра по папке
- Автоматическое заполнение пустых ID3-тегов
- Генерация обложек через GPT Images API (только если обложка отсутствует)
- Детерминированный выбор подстиля по хэшу названия трека
- Веб-интерфейс для массового редактирования тегов
- Управление обложками (загрузка, удаление, генерация)

## Установка

1. Клонируйте репозиторий или скачайте файлы проекта

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Создайте файл `.env` на основе `.env.example`:
```bash
OPENAI_API_KEY=your_api_key_here
MUSIC_FOLDER=D:\music_source
OUTPUT_FOLDER=D:\music_with_covers
WEB_PORT=3004
```

## Запуск

### Автоматическая обработка

Запустите скрипт для автоматической обработки всех MP3-файлов:

```bash
python generate_covers.py
```

Скрипт:
- Сканирует папку `MUSIC_FOLDER` по жанровым папкам
- Определяет жанр по имени папки
- Заполняет пустые ID3-теги
- Генерирует обложки только для файлов без обложки
- Сохраняет обработанные файлы в `OUTPUT_FOLDER`

### Веб-интерфейс

Запустите веб-сервер:

```bash
python webserver.py
```

Или через uvicorn:

```bash
uvicorn webserver:app --host 0.0.0.0 --port 3004
```

Откройте в браузере: `http://localhost:3004`

## Docker

### Сборка образа

```bash
docker build -t mp3-cover-system .
```

### Запуск контейнера

```bash
docker run --rm ^
  -e OPENAI_API_KEY=your_api_key ^
  -v D:\music_source:/music_source ^
  -v D:\music_with_covers:/music_output ^
  -p 3004:3004 ^
  mp3-cover-system
```

Для Linux/Mac:

```bash
docker run --rm \
  -e OPENAI_API_KEY=your_api_key \
  -v /path/to/music_source:/music_source \
  -v /path/to/music_with_covers:/music_output \
  -p 3004:3004 \
  mp3-cover-system
```

## Структура проекта

```
project/
│ generate_covers.py      # Автоматическая обработка
│ webserver.py            # Веб-сервер FastAPI
│ genres.json             # Конфигурация жанров и подстилей
│ requirements.txt        # Зависимости Python
│ Dockerfile              # Docker конфигурация
│ README.md               # Документация
│ .env.example            # Пример конфигурации
│ utils/
│   id3.py                # Работа с ID3-тегами
│   style.py              # Определение жанра и подстиля
│   images.py             # Генерация обложек
│   files.py              # Работа с файловой системой
│ templates/
│   index.html            # Главная страница
│   editor.html           # Страница редактора
│ static/
│   css/
│     style.css           # Стили
│   js/
│     index.js            # JavaScript для главной страницы
│     editor.js           # JavaScript для редактора
```

## Жанры и подстили

Система поддерживает следующие жанры:

- **Ambient**: туман, холодные тона, мягкая дымка
  - Diffuse Mist, Soft Horizon, Deep Blur, Particle Glow

- **Chillout**: тёплые пастельные волны, текучие формы
  - Warm Waves, Liquid Shapes, Soft Circles, Velvet Gradient

- **Beautiful Music**: светлая воздушность, золотистые акценты
  - Light Bloom, Heavenly Glow, Crystal Softness, Pure Harmony

- **New Age**: космическая абстракция, мистические линии
  - Cosmic Energy, Mystic Geometry, Deep Space Fog, Spiritual Flow

Подстиль выбирается детерминированно по хэшу названия трека, поэтому один и тот же трек всегда получает один и тот же подстиль.

## Редактируемые теги

Через веб-интерфейс можно редактировать следующие ID3-теги:

- Title (TIT2)
- Artist (TPE1)
- Album (TALB)
- Genre (TCON)
- Year/Date (TYER/TDRC)
- Comment (COMM)
- Lyrics (USLT)
- Original Artist (TOPE)
- Copyright (TCOP)
- Encoder (TSSE)

## API эндпоинты

### GET /files

Получить список файлов.

Параметры:
- `genre` (опционально) - фильтр по жанру

Пример:
```bash
curl http://localhost:3004/files?genre=Ambient
```

### POST /edit

Массовое редактирование тегов.

Параметры (FormData):
- `files` - JSON массив путей к файлам
- `title`, `artist`, `album`, `genre`, `year`, `comment`, `lyrics`, `original_artist`, `copyright`, `encoder` - значения тегов

Пример:
```bash
curl -X POST http://localhost:3004/edit \
  -F "files=[\"Ambient/track1.mp3\"]" \
  -F "title=New Title" \
  -F "artist=New Artist"
```

### POST /upload-cover

Загрузить обложку вручную.

Параметры (FormData):
- `file` - путь к MP3-файлу
- `cover_file` - файл изображения

### POST /delete-cover

Удалить обложку.

Параметры (FormData):
- `file` - путь к MP3-файлу

### POST /generate-cover

Сгенерировать обложку через ИИ.

Параметры (FormData):
- `file` - путь к MP3-файлу
- `track_title` - название трека
- `genre` - жанр

## Примеры логов

### Автоматическая обработка

```
Сканирование папки: D:\music_source
Найдено жанров: 4

=== Жанр: Ambient ===
Файлов: 10

Обработка: track1.mp3
  Заполнены теги: {'title': 'Track 1', 'artist': 'Artist', 'genre': 'Ambient'}
  Генерация обложки...
  Обложка добавлена

Обработка: track2.mp3
  Обложка уже существует, пропуск

Обработка завершена
```

### Веб-интерфейс

```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:3004
INFO:     127.0.0.1:52341 - "GET / HTTP/1.1" 200 OK
INFO:     127.0.0.1:52341 - "GET /files?genre=Ambient HTTP/1.1" 200 OK
INFO:     127.0.0.1:52341 - "POST /edit HTTP/1.1" 200 OK
```

## Важные замечания

1. **Обложки не перезаписываются**: Если у файла уже есть обложка (APIC), система не будет генерировать новую автоматически.

2. **Детерминированный выбор подстиля**: Подстиль выбирается по хэшу названия трека, поэтому один и тот же трек всегда получает один и тот же подстиль.

3. **Структура папок**: Входные файлы должны быть организованы по жанровым папкам:
   ```
   MUSIC_FOLDER/
     Ambient/
     Chillout/
     Beautiful Music/
     New Age/
   ```

4. **Формат обложек**: Генерируемые обложки имеют размер 1024x1024 пикселей в формате JPEG.

5. **ID3 версия**: Файлы сохраняются с ID3v2.3 тегами.

## Требования

- Python 3.11+
- OpenAI API ключ для генерации обложек
- Мутаген для работы с ID3-тегами
- FastAPI для веб-интерфейса

## Лицензия

Проект создан для личного использования.

