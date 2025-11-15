import os
import sys
from dotenv import load_dotenv
from utils.files import scan_music_folder, copy_file_to_output
from utils.style import get_genre_from_folder
from utils.id3 import read_tags, write_tags, has_cover, embed_cover, extract_title_from_filename, extract_artist_from_filename
from utils.images import generate_cover


load_dotenv()

MUSIC_FOLDER = os.getenv('MUSIC_FOLDER', 'D:\\music_source')
OUTPUT_FOLDER = os.getenv('OUTPUT_FOLDER', 'D:\\music_with_covers')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')


def process_file(file_path, genre, output_folder):
    print(f"Обработка: {os.path.basename(file_path)}")
    
    output_path = copy_file_to_output(file_path, output_folder, genre)
    
    tags = read_tags(output_path)
    
    # ВСЕГДА используем название из имени файла (приоритет оригинальному названию)
    extracted_title = extract_title_from_filename(output_path)
    extracted_artist = extract_artist_from_filename(output_path)
    
    # Название всегда берется из имени файла
    title = extracted_title or os.path.splitext(os.path.basename(output_path))[0]
    
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
        print(f"  Заполнены теги: {tags_to_write}")
    
    if not has_cover(output_path):
        print(f"  Генерация обложки...")
        cover_data = generate_cover(output_path, title, genre, OPENAI_API_KEY)
        
        if cover_data:
            if embed_cover(output_path, cover_data):
                print(f"  Обложка добавлена")
            else:
                print(f"  Ошибка встраивания обложки")
        else:
            print(f"  Не удалось сгенерировать обложку")
    else:
        print(f"  Обложка уже существует, пропуск")
    
    print()


def main():
    if not OPENAI_API_KEY:
        print("Ошибка: OPENAI_API_KEY не установлен в .env")
        sys.exit(1)
    
    if not os.path.exists(MUSIC_FOLDER):
        print(f"Ошибка: папка {MUSIC_FOLDER} не существует")
        sys.exit(1)
    
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    
    print(f"Сканирование папки: {MUSIC_FOLDER}")
    genres, files_by_genre = scan_music_folder(MUSIC_FOLDER)
    
    if not genres:
        print("Жанровые папки не найдены")
        return
    
    print(f"Найдено жанров: {len(genres)}")
    print()
    
    for genre in genres:
        print(f"=== Жанр: {genre} ===")
        files = files_by_genre.get(genre, [])
        print(f"Файлов: {len(files)}")
        print()
        
        for file_path in files:
            process_file(file_path, genre, OUTPUT_FOLDER)
    
    print("Обработка завершена")


if __name__ == '__main__':
    main()

