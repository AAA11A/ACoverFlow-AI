import os
from openai import OpenAI
from utils.id3 import has_cover
from utils.style import get_substyle, get_genre_description, get_substyle_description
from PIL import Image
from io import BytesIO


def generate_cover(file_path, track_title, genre, api_key, check_existing=True, image_format='jpeg'):
    """
    Генерирует обложку через OpenAI API
    
    Args:
        file_path: путь к MP3 файлу
        track_title: название трека
        genre: жанр
        api_key: OpenAI API ключ
        check_existing: проверять ли наличие существующей обложки
        image_format: формат изображения ('jpeg' или 'png')
    """
    if check_existing and has_cover(file_path):
        return None
    
    substyle = get_substyle(track_title, genre)
    if not substyle:
        return None
    
    genre_desc = get_genre_description(genre)
    substyle_desc = get_substyle_description(genre, substyle['name'])
    
    # Загружаем промпты для жанра
    from utils.style import get_genre_prompts
    prompts = get_genre_prompts(genre)
    
    if not prompts or len(prompts) == 0:
        # Fallback на старый промпт
        prompt = f"""Create a square album cover (1024×1024) in the {genre} visual style.
Use the substyle: {substyle_desc}.
Reflect the mood and meaning of the music title: "{track_title}".
No text, letters, numbers or logos.
Abstract, atmospheric, soft lighting, high quality."""
    else:
        # Выбираем промпт по хэшу названия трека
        import hashlib
        hash_value = int(hashlib.md5(track_title.lower().encode('utf-8')).hexdigest(), 16)
        prompt_index = hash_value % len(prompts)
        selected_prompt = prompts[prompt_index]
        
        # Заменяем плейсхолдеры
        prompt = selected_prompt.format(
            genre=genre,
            genre_desc=genre_desc or genre,
            substyle_desc=substyle_desc or '',
            track_title=track_title
        )
    
    try:
        client = OpenAI(api_key=api_key)
        
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            n=1,
        )
        
        image_url = response.data[0].url
        
        import requests
        
        img_response = requests.get(image_url)
        img_response.raise_for_status()
        
        img = Image.open(BytesIO(img_response.content))
        
        max_size = 800
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        output = BytesIO()
        
        # Сохраняем в выбранном формате
        if image_format.lower() == 'png':
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            img.save(output, format='PNG', optimize=True)
        else:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.save(output, format='JPEG', quality=85, optimize=True)
        
        output.seek(0)
        
        return output.getvalue()
    except Exception as e:
        return None


def resize_image(image_data, image_format='jpeg'):
    """
    Изменяет размер изображения и конвертирует в нужный формат
    
    Args:
        image_data: бинарные данные изображения
        image_format: формат вывода ('jpeg' или 'png')
    """
    try:
        img = Image.open(BytesIO(image_data))
        
        max_size = 800
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        output = BytesIO()
        
        # Сохраняем в выбранном формате
        if image_format.lower() == 'png':
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            img.save(output, format='PNG', optimize=True)
        else:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.save(output, format='JPEG', quality=85, optimize=True)
        
        output.seek(0)
        
        return output.getvalue()
    except Exception as e:
        return None

