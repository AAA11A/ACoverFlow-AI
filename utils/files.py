import os
import shutil
from pathlib import Path


def scan_music_folder(music_folder):
    genres = []
    files_by_genre = {}
    
    if not os.path.exists(music_folder):
        return genres, files_by_genre
    
    for item in os.listdir(music_folder):
        item_path = os.path.join(music_folder, item)
        
        if os.path.isdir(item_path):
            genres.append(item)
            files_by_genre[item] = []
            
            for root, dirs, files in os.walk(item_path):
                for file in files:
                    if file.lower().endswith('.mp3'):
                        full_path = os.path.join(root, file)
                        files_by_genre[item].append(full_path)
    
    return genres, files_by_genre


def ensure_output_folder(output_folder, genre):
    genre_folder = os.path.join(output_folder, genre)
    os.makedirs(genre_folder, exist_ok=True)
    return genre_folder


def copy_file_to_output(source_path, output_folder, genre):
    output_genre_folder = ensure_output_folder(output_folder, genre)
    filename = os.path.basename(source_path)
    dest_path = os.path.join(output_genre_folder, filename)
    
    if not os.path.exists(dest_path):
        shutil.copy2(source_path, dest_path)
    
    return dest_path


def get_relative_path(file_path, base_folder):
    try:
        return os.path.relpath(file_path, base_folder)
    except ValueError:
        return file_path


