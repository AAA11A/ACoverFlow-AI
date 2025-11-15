import json
import os
import hashlib


def load_genres(genres_file='genres.json'):
    with open(genres_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_genre_from_folder(folder_path):
    folder_name = os.path.basename(folder_path.rstrip(os.sep))
    genres = load_genres()
    
    if folder_name in genres:
        return folder_name
    
    return None


def get_substyle(track_title, genre):
    genres = load_genres()
    
    if genre not in genres:
        return None
    
    substyles = genres[genre]['substyles']
    
    if isinstance(substyles, dict):
        substyle_names = list(substyles.keys())
    else:
        substyle_names = [s['name'] if isinstance(s, dict) else s for s in substyles]
    
    track_title_lower = track_title.lower()
    hash_value = int(hashlib.md5(track_title_lower.encode('utf-8')).hexdigest(), 16)
    index = hash_value % len(substyle_names)
    
    selected_name = substyle_names[index]
    
    if isinstance(substyles, dict):
        return {
            'name': selected_name,
            'description': substyles[selected_name]
        }
    else:
        for substyle in substyles:
            if isinstance(substyle, dict) and substyle.get('name') == selected_name:
                return substyle
        return {'name': selected_name, 'description': selected_name}


def get_genre_description(genre):
    genres = load_genres()
    
    if genre not in genres:
        return None
    
    return genres[genre]['description']


def get_substyle_description(genre, substyle_name):
    genres = load_genres()
    
    if genre not in genres:
        return None
    
    substyles = genres[genre]['substyles']
    
    if isinstance(substyles, dict):
        return substyles.get(substyle_name, None)
    else:
        for substyle in substyles:
            if isinstance(substyle, dict) and substyle.get('name') == substyle_name:
                return substyle.get('description', None)
    
    return None

