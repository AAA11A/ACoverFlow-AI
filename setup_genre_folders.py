import os
import shutil
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

OUTPUT_FOLDER = os.getenv('OUTPUT_FOLDER', 'D:\\music_with_covers')

def load_genres(genres_file='genres.json'):
    with open(genres_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_genre_folders():
    genres_data = load_genres()
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    
    created_folders = []
    for genre in genres_data.keys():
        genre_folder = os.path.join(OUTPUT_FOLDER, genre)
        os.makedirs(genre_folder, exist_ok=True)
        created_folders.append(genre_folder)
        print(f"Создана папка: {genre_folder}")
    
    return created_folders

def find_and_move_chillout_files():
    chillout_folder = os.path.join(OUTPUT_FOLDER, 'Chillout')
    os.makedirs(chillout_folder, exist_ok=True)
    
    search_paths = [
        OUTPUT_FOLDER,
        os.getenv('MUSIC_FOLDER', 'D:\\music_source'),
        'D:\\',
        'C:\\Users'
    ]
    
    moved_files = []
    
    for search_path in search_paths:
        if not os.path.exists(search_path):
            continue
        
        try:
            for root, dirs, files in os.walk(search_path):
                if 'Chillout' in root and root != chillout_folder:
                    for file in files:
                        if file.lower().endswith('.mp3'):
                            source_path = os.path.join(root, file)
                            dest_path = os.path.join(chillout_folder, file)
                            
                            if not os.path.exists(dest_path):
                                try:
                                    shutil.move(source_path, dest_path)
                                    moved_files.append((source_path, dest_path))
                                    print(f"Перенесен: {file} из {root} в {chillout_folder}")
                                except Exception as e:
                                    print(f"Ошибка при переносе {file}: {e}")
                            else:
                                print(f"Файл уже существует: {dest_path}")
        except PermissionError:
            continue
        except Exception as e:
            print(f"Ошибка при поиске в {search_path}: {e}")
    
    return moved_files

if __name__ == '__main__':
    print("Создание папок для всех жанров...")
    created = create_genre_folders()
    print(f"\nСоздано папок: {len(created)}")
    
    print("\nПоиск и перенос файлов Chillout...")
    moved = find_and_move_chillout_files()
    print(f"\nПеренесено файлов: {len(moved)}")
    
    if moved:
        print("\nПеренесенные файлы:")
        for source, dest in moved:
            print(f"  {os.path.basename(source)} -> {dest}")

