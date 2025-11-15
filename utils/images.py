import os
from openai import OpenAI
from utils.id3 import has_cover
from utils.style import get_substyle, get_genre_description, get_substyle_description
from PIL import Image
from io import BytesIO


def generate_cover(file_path, track_title, genre, api_key, check_existing=True):
    if check_existing and has_cover(file_path):
        return None
    
    substyle = get_substyle(track_title, genre)
    if not substyle:
        return None
    
    genre_desc = get_genre_description(genre)
    substyle_desc = get_substyle_description(genre, substyle['name'])
    
    prompt = f"""Create a square album cover (1024×1024) in the {genre} visual style.
Use the substyle: {substyle_desc}.
Reflect the mood and meaning of the music title: "{track_title}".
No text, letters, numbers or logos.
Abstract, atmospheric, soft lighting, high quality."""
    
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
        
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        max_size = 800
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        output = BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        
        return output.getvalue()
    except Exception as e:
        return None


def resize_image(image_data):
    try:
        img = Image.open(BytesIO(image_data))
        
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        max_size = 800
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        output = BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        
        return output.getvalue()
    except Exception as e:
        return None

