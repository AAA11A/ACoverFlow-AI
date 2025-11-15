import os
import base64
from typing import List
from fastapi import FastAPI, Request, Form, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
from utils.files import scan_music_folder, get_relative_path, ensure_output_folder, copy_file_to_output
from utils.style import get_genre_from_folder
from utils.id3 import read_tags, write_tags, has_cover, embed_cover, delete_cover, get_cover_data, extract_title_from_filename, extract_artist_from_filename, has_tag
from utils.images import generate_cover, resize_image
from utils.style import load_genres
import shutil


load_dotenv()

MUSIC_FOLDER = os.getenv('MUSIC_FOLDER', 'D:\\music_source')
OUTPUT_FOLDER = os.getenv('OUTPUT_FOLDER', 'D:\\music_with_covers')
WEB_PORT = int(os.getenv('WEB_PORT', '3003'))
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')

app = FastAPI()

def create_all_genre_folders():
    genres_data = load_genres()
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    
    for genre in genres_data.keys():
        ensure_output_folder(OUTPUT_FOLDER, genre)

@app.on_event("startup")
async def startup_event():
    create_all_genre_folders()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


def get_file_path(relative_path, folder):
    full_path = os.path.join(folder, relative_path)
    if not os.path.exists(full_path):
        return None
    return full_path


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    genres_data = load_genres()
    genres = list(genres_data.keys())
    return templates.TemplateResponse("index.html", {"request": request, "genres": genres, "genres_data": genres_data})


@app.get("/files")
async def get_files(genre: str = None):
    folder = OUTPUT_FOLDER if os.path.exists(OUTPUT_FOLDER) else MUSIC_FOLDER
    genres, files_by_genre = scan_music_folder(folder)
    
    if genre:
        files = files_by_genre.get(genre, [])
    else:
        files = []
        for genre_files in files_by_genre.values():
            files.extend(genre_files)
    
    result = []
    for file_path in files:
        rel_path = get_relative_path(file_path, folder)
        tags = read_tags(file_path)
        has_cover_flag = has_cover(file_path)
        
        cover_data = None
        if has_cover_flag:
            cover_bytes = get_cover_data(file_path)
            if cover_bytes:
                cover_data = base64.b64encode(cover_bytes).decode('utf-8')
        
        result.append({
            "path": rel_path,
            "full_path": file_path,
            "title": tags.get('title', ''),
            "artist": tags.get('artist', ''),
            "album": tags.get('album', ''),
            "genre": tags.get('genre', ''),
            "year": tags.get('year', ''),
            "comment": tags.get('comment', ''),
            "lyrics": tags.get('lyrics', ''),
            "original_artist": tags.get('original_artist', ''),
            "copyright": tags.get('copyright', ''),
            "encoder": tags.get('encoder', ''),
            "has_cover": has_cover_flag,
            "cover_data": cover_data
        })
    
    return JSONResponse(content={"files": result})


@app.post("/edit")
async def edit_tags(
    files: str = Form(...),
    title: str = Form(None),
    artist: str = Form(None),
    album: str = Form(None),
    genre: str = Form(None),
    year: str = Form(None),
    comment: str = Form(None),
    lyrics: str = Form(None),
    original_artist: str = Form(None),
    copyright: str = Form(None),
    encoder: str = Form(None)
):
    import json
    file_list = json.loads(files)
    folder = OUTPUT_FOLDER if os.path.exists(OUTPUT_FOLDER) else MUSIC_FOLDER
    
    updated = []
    errors = []
    
    tags_to_update = {}
    if title is not None and title != '':
        tags_to_update['title'] = title
    if artist is not None and artist != '':
        tags_to_update['artist'] = artist
    if album is not None and album != '':
        tags_to_update['album'] = album
    if genre is not None and genre != '':
        tags_to_update['genre'] = genre
    if year is not None and year != '':
        tags_to_update['year'] = year
    if comment is not None:
        tags_to_update['comment'] = comment
    if lyrics is not None and lyrics != '':
        tags_to_update['lyrics'] = lyrics
    if original_artist is not None and original_artist != '':
        tags_to_update['original_artist'] = original_artist
    if copyright is not None and copyright != '':
        tags_to_update['copyright'] = copyright
    if encoder is not None and encoder != '':
        tags_to_update['encoder'] = encoder
    
    for rel_path in file_list:
        file_path = get_file_path(rel_path, folder)
        if not file_path:
            errors.append(f"Файл не найден: {rel_path}")
            continue
        
        if write_tags(file_path, tags_to_update):
            updated.append(rel_path)
        else:
            errors.append(f"Ошибка обновления: {rel_path}")
    
    return JSONResponse(content={"updated": updated, "errors": errors})


@app.post("/upload-cover")
async def upload_cover(
    file: str = Form(...),
    cover_file: UploadFile = File(...),
    image_format: str = Form('jpeg')
):
    folder = OUTPUT_FOLDER if os.path.exists(OUTPUT_FOLDER) else MUSIC_FOLDER
    file_path = get_file_path(file, folder)
    
    if not file_path:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Валидация формата
    if image_format.lower() not in ['jpeg', 'png']:
        image_format = 'jpeg'
    
    cover_data = await cover_file.read()
    
    resized_data = resize_image(cover_data, image_format)
    if not resized_data:
        raise HTTPException(status_code=500, detail="Ошибка обработки изображения")
    
    if embed_cover(file_path, resized_data, image_format):
        return JSONResponse(content={"success": True, "message": "Обложка загружена"})
    else:
        raise HTTPException(status_code=500, detail="Ошибка загрузки обложки")


@app.post("/delete-cover")
async def delete_cover_endpoint(file: str = Form(...)):
    folder = OUTPUT_FOLDER if os.path.exists(OUTPUT_FOLDER) else MUSIC_FOLDER
    file_path = get_file_path(file, folder)
    
    if not file_path:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    if delete_cover(file_path):
        return JSONResponse(content={"success": True, "message": "Обложка удалена"})
    else:
        raise HTTPException(status_code=500, detail="Ошибка удаления обложки")


@app.post("/generate-cover")
async def generate_cover_endpoint(
    file: str = Form(...),
    track_title: str = Form(...),
    genre: str = Form(...),
    image_format: str = Form('jpeg')
):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY не установлен")
    
    folder = OUTPUT_FOLDER if os.path.exists(OUTPUT_FOLDER) else MUSIC_FOLDER
    file_path = get_file_path(file, folder)
    
    if not file_path:
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Валидация формата
    if image_format.lower() not in ['jpeg', 'png']:
        image_format = 'jpeg'
    
    cover_data = generate_cover(file_path, track_title, genre, OPENAI_API_KEY, check_existing=False, image_format=image_format)
    
    if cover_data:
        if embed_cover(file_path, cover_data, image_format):
            return JSONResponse(content={"success": True, "message": "Обложка сгенерирована"})
        else:
            raise HTTPException(status_code=500, detail="Ошибка встраивания обложки")
    else:
        raise HTTPException(status_code=500, detail="Ошибка генерации обложки")


@app.post("/upload-multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    genre: str = Form(...),
    image_format: str = Form('jpeg')
):
    """Загрузка и обработка файлов одновременно"""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY не установлен")
    
    if len(files) == 0:
        raise HTTPException(status_code=400, detail="Не выбрано ни одного файла")
    
    genres_data = load_genres()
    if genre not in genres_data:
        raise HTTPException(status_code=400, detail="Неверный жанр")
    
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    genre_folder = ensure_output_folder(OUTPUT_FOLDER, genre)
    
    results = []
    errors = []
    
    for idx, file in enumerate(files):
        try:
            if not file.filename.lower().endswith('.mp3'):
                errors.append(f"{file.filename}: Разрешены только MP3 файлы")
                continue
            
            file_path = os.path.join(genre_folder, file.filename)
            
            # Сохраняем файл
            with open(file_path, 'wb') as f:
                content = await file.read()
                f.write(content)
            
            # Обрабатываем файл
            tags = read_tags(file_path)
            has_artist_tag = has_tag(file_path, 'artist')
            has_genre_tag = has_tag(file_path, 'genre')
            
            existing_artist = (tags.get('artist') or '').strip()
            existing_genre = (tags.get('genre') or '').strip()
            
            extracted_title = extract_title_from_filename(file_path)
            extracted_artist = extract_artist_from_filename(file_path)
            title = extracted_title or os.path.splitext(file.filename)[0]
            
            tags_to_write = {}
            tags_to_write['title'] = title
            
            if has_artist_tag:
                artist = existing_artist
            else:
                artist = extracted_artist
                if artist:
                    tags_to_write['artist'] = artist
            
            if not has_genre_tag:
                tags_to_write['genre'] = genre
            
            if tags_to_write:
                result = write_tags(file_path, tags_to_write)
                if not result:
                    errors.append(f"{file.filename}: Ошибка записи тегов")
                    continue
            
            # Валидация формата
            if image_format.lower() not in ['jpeg', 'png']:
                image_format = 'jpeg'
            
            # Генерируем обложку, если её нет
            if not has_cover(file_path):
                cover_data = generate_cover(file_path, title, genre, OPENAI_API_KEY, image_format=image_format)
                if cover_data:
                    embed_cover(file_path, cover_data, image_format)
            
            rel_path = get_relative_path(file_path, OUTPUT_FOLDER)
            
            results.append({
                "success": True,
                "filename": file.filename,
                "path": rel_path,
                "index": idx + 1,
                "total": len(files)
            })
            
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")
    
    return JSONResponse(content={
        "success": True,
        "message": f"Обработано файлов: {len(results)} из {len(files)}",
        "processed": len(results),
        "total": len(files),
        "results": results,
        "errors": errors
    })


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    genre: str = Form(...),
    use_custom_cover: str = Form('false'),
    cover: UploadFile = File(None),
    image_format: str = Form('jpeg')
):
    if not file.filename.lower().endswith('.mp3'):
        raise HTTPException(status_code=400, detail="Разрешены только MP3 файлы")
    
    use_custom = use_custom_cover.lower() == 'true'
    
    # OPENAI_API_KEY требуется только если не используется пользовательская обложка
    if not use_custom and not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY не установлен")
    
    genres_data = load_genres()
    if genre not in genres_data:
        raise HTTPException(status_code=400, detail="Неверный жанр")
    
    try:
        os.makedirs(OUTPUT_FOLDER, exist_ok=True)
        genre_folder = ensure_output_folder(OUTPUT_FOLDER, genre)
        
        file_path = os.path.join(genre_folder, file.filename)
        
        with open(file_path, 'wb') as f:
            content = await file.read()
            f.write(content)
        
        tags = read_tags(file_path)
        
        # Проверяем наличие тегов в файле (не только их значения)
        has_artist_tag = has_tag(file_path, 'artist')
        has_genre_tag = has_tag(file_path, 'genre')
        
        existing_artist = (tags.get('artist') or '').strip()
        existing_genre = (tags.get('genre') or '').strip()
        
        # ВСЕГДА используем название из имени файла (приоритет оригинальному названию)
        extracted_title = extract_title_from_filename(file_path)
        extracted_artist = extract_artist_from_filename(file_path)
        
        # Название всегда берется из имени файла
        title = extracted_title or os.path.splitext(file.filename)[0]
        
        tags_to_write = {}
        # ВСЕГДА записываем название из имени файла
        tags_to_write['title'] = title
        
        # Исполнитель: сохраняем существующий, если есть, иначе из имени файла
        if has_artist_tag:
            artist = existing_artist
        else:
            artist = extracted_artist
            if artist:
                tags_to_write['artist'] = artist
        
        # Жанр: записываем только если его не было
        if not has_genre_tag:
            tags_to_write['genre'] = genre
        
        if tags_to_write:
            result = write_tags(file_path, tags_to_write)
            if not result:
                raise HTTPException(status_code=500, detail="Ошибка записи тегов")
        
        # Валидация формата
        if image_format.lower() not in ['jpeg', 'png']:
            image_format = 'jpeg'
        
        # Обработка обложки
        use_custom = use_custom_cover.lower() == 'true'
        
        if use_custom:
            # Используем загруженную пользователем обложку
            if cover and cover.filename:
                cover_data = await cover.read()
                if cover_data:
                    resized_data = resize_image(cover_data, image_format)
                    if resized_data:
                        embed_cover(file_path, resized_data, image_format)
            # Если обложка не загружена - оставляем файл без обложки
        else:
            # Генерируем обложку через ИИ, если её нет
            if not has_cover(file_path):
                cover_data = generate_cover(file_path, title, genre, OPENAI_API_KEY, image_format=image_format)
                if cover_data:
                    embed_cover(file_path, cover_data, image_format)
        
        rel_path = get_relative_path(file_path, OUTPUT_FOLDER)
        
        return JSONResponse(content={
            "success": True,
            "message": "Файл загружен и обработан",
            "path": rel_path,
            "filename": file.filename
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки файла: {str(e)}")


def process_file_in_place(file_path, genre, image_format='jpeg'):
    """
    Обрабатывает файл на месте (без копирования): обновляет теги, генерирует обложку если её нет.
    Не перезаписывает обложку, если она уже существует.
    """
    try:
        # Проверяем наличие обложки
        if has_cover(file_path):
            # Если обложка есть - только обновляем теги
            tags = read_tags(file_path)
            extracted_title = extract_title_from_filename(file_path)
            extracted_artist = extract_artist_from_filename(file_path)
            filename = os.path.basename(file_path)
            title = extracted_title or os.path.splitext(filename)[0]
            existing_artist = tags.get('artist', '').strip()
            artist = existing_artist if existing_artist else extracted_artist
            
            tags_to_write = {}
            tags_to_write['title'] = title
            
            if not tags.get('artist') and artist:
                tags_to_write['artist'] = artist
            
            if not tags.get('genre'):
                tags_to_write['genre'] = genre
            
            if tags_to_write:
                write_tags(file_path, tags_to_write)
            
            return True, "Файл уже имеет обложку, обновлены только теги"
        
        # Если обложки нет - обрабатываем как обычно
        tags = read_tags(file_path)
        extracted_title = extract_title_from_filename(file_path)
        extracted_artist = extract_artist_from_filename(file_path)
        filename = os.path.basename(file_path)
        title = extracted_title or os.path.splitext(filename)[0]
        existing_artist = tags.get('artist', '').strip()
        artist = existing_artist if existing_artist else extracted_artist
        
        tags_to_write = {}
        tags_to_write['title'] = title
        
        if not tags.get('artist') and artist:
            tags_to_write['artist'] = artist
        
        if not tags.get('genre'):
            tags_to_write['genre'] = genre
        
        if tags_to_write:
            write_tags(file_path, tags_to_write)
        
        # Валидация формата
        if image_format.lower() not in ['jpeg', 'png']:
            image_format = 'jpeg'
        
        # Генерируем обложку, если её нет
        if not has_cover(file_path):
            cover_data = generate_cover(file_path, title, genre, OPENAI_API_KEY, image_format=image_format)
            if cover_data:
                embed_cover(file_path, cover_data, image_format)
        
        return True, "Файл успешно обработан"
        
    except Exception as e:
        return False, str(e)


def process_single_file(file_path, genre, source_folder=MUSIC_FOLDER, output_folder=OUTPUT_FOLDER, image_format='jpeg'):
    """
    Обрабатывает один файл: копирует, заполняет теги, генерирует обложку.
    Не перезаписывает файл, если он уже существует и имеет обложку.
    """
    try:
        genre_folder = ensure_output_folder(output_folder, genre)
        filename = os.path.basename(file_path)
        output_path = os.path.join(genre_folder, filename)
        
        # Проверяем, существует ли файл в выходной папке и имеет ли обложку
        file_exists = os.path.exists(output_path)
        has_existing_cover = False
        
        if file_exists:
            has_existing_cover = has_cover(output_path)
            # Если файл существует и имеет обложку - не перезаписываем
            if has_existing_cover:
                # Только обновляем теги, если нужно
                tags = read_tags(output_path)
                extracted_title = extract_title_from_filename(output_path)
                extracted_artist = extract_artist_from_filename(output_path)
                title = extracted_title or os.path.splitext(filename)[0]
                existing_artist = tags.get('artist', '').strip()
                artist = existing_artist if existing_artist else extracted_artist
                
                tags_to_write = {}
                tags_to_write['title'] = title
                
                if not tags.get('artist') and artist:
                    tags_to_write['artist'] = artist
                
                if not tags.get('genre'):
                    tags_to_write['genre'] = genre
                
                if tags_to_write:
                    write_tags(output_path, tags_to_write)
                
                return True, "Файл уже обработан (обложка существует), обновлены только теги"
        
        # Копируем файл (если не существует или не имеет обложки)
        if not file_exists or not has_existing_cover:
            shutil.copy2(file_path, output_path)
        
        # Читаем теги
        tags = read_tags(output_path)
        
        # ВСЕГДА используем название из имени файла
        extracted_title = extract_title_from_filename(output_path)
        extracted_artist = extract_artist_from_filename(output_path)
        
        # Название всегда берется из имени файла
        title = extracted_title or os.path.splitext(filename)[0]
        
        # Исполнитель: используем существующий, если есть, иначе из имени файла
        existing_artist = tags.get('artist', '').strip()
        artist = existing_artist if existing_artist else extracted_artist
        
        tags_to_write = {}
        # ВСЕГДА записываем название из имени файла
        tags_to_write['title'] = title
        
        # Исполнитель: записываем только если его не было
        if not tags.get('artist'):
            if artist:
                tags_to_write['artist'] = artist
        
        # Жанр: записываем только если его не было
        if not tags.get('genre'):
            tags_to_write['genre'] = genre
        
        if tags_to_write:
            write_tags(output_path, tags_to_write)
        
        # Валидация формата
        if image_format.lower() not in ['jpeg', 'png']:
            image_format = 'jpeg'
        
        # Генерируем обложку, если её нет
        if not has_cover(output_path):
            cover_data = generate_cover(output_path, title, genre, OPENAI_API_KEY, image_format=image_format)
            if cover_data:
                embed_cover(output_path, cover_data, image_format)
        
        return True, "Файл успешно обработан"
        
    except Exception as e:
        return False, str(e)


@app.post("/process-all")
async def process_all_files():
    """Автоматическая обработка всех файлов из MUSIC_FOLDER"""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY не установлен")
    
    if not os.path.exists(MUSIC_FOLDER):
        raise HTTPException(status_code=404, detail=f"Папка {MUSIC_FOLDER} не найдена")
    
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    
    genres, files_by_genre = scan_music_folder(MUSIC_FOLDER)
    
    if not genres:
        return JSONResponse(content={
            "success": True,
            "message": "Файлы не найдены",
            "processed": 0,
            "errors": []
        })
    
    processed = 0
    errors = []
    
    for genre in genres:
        files = files_by_genre.get(genre, [])
        
        for file_path in files:
            success, message = process_single_file(file_path, genre, MUSIC_FOLDER, OUTPUT_FOLDER)
            if success:
                processed += 1
            else:
                errors.append(f"{os.path.basename(file_path)}: {message}")
    
    return JSONResponse(content={
        "success": True,
        "message": f"Обработано файлов: {processed}",
        "processed": processed,
        "errors": errors
    })


@app.post("/process-selected")
async def process_selected_files(files: str = Form(...)):
    """Обработка выбранных файлов из OUTPUT_FOLDER"""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY не установлен")
    
    import json
    try:
        file_list = json.loads(files)
    except:
        raise HTTPException(status_code=400, detail="Неверный формат списка файлов")
    
    if not file_list:
        return JSONResponse(content={
            "success": False,
            "message": "Не выбрано ни одного файла",
            "processed": 0,
            "errors": []
        })
    
    folder = OUTPUT_FOLDER if os.path.exists(OUTPUT_FOLDER) else MUSIC_FOLDER
    
    processed = 0
    errors = []
    
    for rel_path in file_list:
        file_path = get_file_path(rel_path, folder)
        
        if not file_path:
            errors.append(f"Файл не найден: {rel_path}")
            continue
        
        if not os.path.exists(file_path):
            errors.append(f"Файл не существует: {rel_path}")
            continue
        
        # Определяем жанр из пути файла или из тегов
        tags = read_tags(file_path)
        genre = tags.get('genre', '').strip()
        
        if not genre:
            # Пытаемся определить жанр из папки
            folder_path = os.path.dirname(file_path)
            genre = os.path.basename(folder_path)
            
            # Проверяем, что это валидный жанр
            genres_data = load_genres()
            if genre not in genres_data:
                errors.append(f"Не удалось определить жанр для файла: {rel_path}")
                continue
        
        # Обрабатываем файл
        # Если файл уже в OUTPUT_FOLDER, обрабатываем его на месте
        # Иначе копируем из текущей папки в OUTPUT_FOLDER
        if folder == OUTPUT_FOLDER:
            # Файл уже в OUTPUT_FOLDER - обрабатываем на месте
            success, message = process_file_in_place(file_path, genre)
        else:
            # Файл в другой папке - копируем в OUTPUT_FOLDER
            success, message = process_single_file(file_path, genre, folder, OUTPUT_FOLDER)
        
        if success:
            processed += 1
        else:
            errors.append(f"{os.path.basename(file_path)}: {message}")
    
    return JSONResponse(content={
        "success": True,
        "message": f"Обработано файлов: {processed}",
        "processed": processed,
        "errors": errors
    })


@app.get("/prompts", response_class=HTMLResponse)
async def prompts_page(request: Request):
    """Страница управления промптами"""
    genres_data = load_genres()
    genres = list(genres_data.keys())
    return templates.TemplateResponse("prompts.html", {"request": request, "genres": genres})

@app.get("/prompts/{genre}")
async def get_genre_prompts(genre: str):
    """Получить промпты для жанра"""
    from utils.style import get_genre_prompts
    prompts = get_genre_prompts(genre)
    return JSONResponse(content={"prompts": prompts, "genre": genre})

@app.post("/save-prompts")
async def save_prompts(
    genre: str = Form(...),
    prompts: str = Form(...)  # JSON массив промптов
):
    """Сохранить промпты для жанра"""
    import json
    genres_data = load_genres()
    
    if genre not in genres_data:
        raise HTTPException(status_code=400, detail="Жанр не найден")
    
    try:
        prompts_list = json.loads(prompts)
        if not isinstance(prompts_list, list):
            raise HTTPException(status_code=400, detail="Промпты должны быть массивом")
        
        genres_data[genre]['prompts'] = prompts_list
        
        with open('genres.json', 'w', encoding='utf-8') as f:
            json.dump(genres_data, f, ensure_ascii=False, indent=2)
        
        return JSONResponse(content={
            "success": True,
            "message": f"Промпты для жанра '{genre}' сохранены",
            "count": len(prompts_list)
        })
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Неверный формат JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения: {str(e)}")

@app.get("/editor", response_class=HTMLResponse)
async def editor(request: Request):
    genres_data = load_genres()
    genres = list(genres_data.keys())
    return templates.TemplateResponse("editor.html", {"request": request, "genres": genres})


@app.post("/create-genre")
async def create_genre(
    name: str = Form(...),
    description: str = Form(...),
    substyles: str = Form(None)
):
    import json
    
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Название жанра обязательно")
    
    name = name.strip()
    
    genres_data = load_genres()
    
    if name in genres_data:
        raise HTTPException(status_code=400, detail=f"Жанр '{name}' уже существует")
    
    substyles_dict = {}
    if substyles:
        try:
            substyles_data = json.loads(substyles)
            if isinstance(substyles_data, dict):
                substyles_dict = substyles_data
            elif isinstance(substyles_data, list):
                for item in substyles_data:
                    if isinstance(item, dict) and 'name' in item:
                        substyles_dict[item['name']] = item.get('description', '')
        except:
            pass
    
    if not substyles_dict:
        substyles_dict = {
            "Default Style 1": "Default description for style 1.",
            "Default Style 2": "Default description for style 2.",
            "Default Style 3": "Default description for style 3.",
            "Default Style 4": "Default description for style 4."
        }
    
    # Создаем жанр с пустым массивом промптов
    genres_data[name] = {
        "description": description.strip() if description else "",
        "substyles": substyles_dict,
        "prompts": []  # Пустой массив промптов, пользователь добавит их через интерфейс
    }
    
    try:
        with open('genres.json', 'w', encoding='utf-8') as f:
            json.dump(genres_data, f, ensure_ascii=False, indent=2)
        
        ensure_output_folder(OUTPUT_FOLDER, name)
        
        return JSONResponse(content={
            "success": True,
            "message": f"Жанр '{name}' успешно создан",
            "genre": name
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания жанра: {str(e)}")

@app.delete("/delete-genre/{genre_name}")
async def delete_genre(genre_name: str):
    """Удалить жанр и все связанные данные"""
    genres_data = load_genres()
    
    if genre_name not in genres_data:
        raise HTTPException(status_code=404, detail=f"Жанр '{genre_name}' не найден")
    
    genre_folder = os.path.join(OUTPUT_FOLDER, genre_name)
    
    try:
        if os.path.exists(genre_folder):
            shutil.rmtree(genre_folder)
        
        del genres_data[genre_name]
        
        import json
        with open('genres.json', 'w', encoding='utf-8') as f:
            json.dump(genres_data, f, ensure_ascii=False, indent=2)
        
        return JSONResponse(content={
            "success": True,
            "message": f"Жанр '{genre_name}' и все связанные данные успешно удалены"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении жанра: {str(e)}")


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=WEB_PORT)

