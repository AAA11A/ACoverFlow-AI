from mutagen.id3 import ID3, ID3NoHeaderError, APIC, TIT2, TPE1, TALB, TCON, TYER, TDRC, COMM, USLT, TOPE, TCOP, TSSE, TXXX, WXXX
from mutagen.mp3 import MP3
import os


def read_tags(file_path):
    try:
        audio = MP3(file_path, ID3=ID3)
        tags = {}
        
        if audio.tags is None:
            return tags
        
        tags['title'] = str(audio.tags.get('TIT2', [''])[0]) if 'TIT2' in audio.tags else ''
        tags['artist'] = str(audio.tags.get('TPE1', [''])[0]) if 'TPE1' in audio.tags else ''
        tags['album'] = str(audio.tags.get('TALB', [''])[0]) if 'TALB' in audio.tags else ''
        tags['genre'] = str(audio.tags.get('TCON', [''])[0]) if 'TCON' in audio.tags else ''
        
        if 'TYER' in audio.tags:
            tags['year'] = str(audio.tags.get('TYER', [''])[0])
        elif 'TDRC' in audio.tags:
            tags['year'] = str(audio.tags.get('TDRC', [''])[0])
        else:
            tags['year'] = ''
        
        tags['comment'] = str(audio.tags.get('COMM', [''])[0]) if 'COMM' in audio.tags else ''
        tags['lyrics'] = str(audio.tags.get('USLT', [''])[0]) if 'USLT' in audio.tags else ''
        tags['original_artist'] = str(audio.tags.get('TOPE', [''])[0]) if 'TOPE' in audio.tags else ''
        tags['copyright'] = str(audio.tags.get('TCOP', [''])[0]) if 'TCOP' in audio.tags else ''
        tags['encoder'] = str(audio.tags.get('TSSE', [''])[0]) if 'TSSE' in audio.tags else ''
        
        return tags
    except Exception as e:
        return {}


def has_tag(file_path, tag_name):
    """Проверяет наличие тега в файле (независимо от его значения)"""
    try:
        audio = MP3(file_path, ID3=ID3)
        if audio.tags is None:
            return False
        
        tag_map = {
            'title': 'TIT2',
            'artist': 'TPE1',
            'album': 'TALB',
            'genre': 'TCON',
            'year': 'TYER',
            'comment': 'COMM',
            'lyrics': 'USLT',
            'original_artist': 'TOPE',
            'copyright': 'TCOP',
            'encoder': 'TSSE'
        }
        
        id3_tag = tag_map.get(tag_name)
        if not id3_tag:
            return False
        
        if id3_tag == 'TYER':
            return 'TYER' in audio.tags or 'TDRC' in audio.tags
        
        return id3_tag in audio.tags
    except Exception:
        return False


def has_cover(file_path):
    try:
        audio = MP3(file_path, ID3=ID3)
        if audio.tags is None:
            return False
        return 'APIC:' in audio.tags or any(key.startswith('APIC') for key in audio.tags.keys())
    except Exception:
        return False


def embed_cover(file_path, cover_data):
    try:
        audio = MP3(file_path, ID3=ID3)
        if audio.tags is None:
            audio.add_tags()
        
        audio.tags.delall('APIC')
        
        audio.tags.add(APIC(
            encoding=3,
            mime='image/jpeg',
            type=3,
            desc='Cover',
            data=cover_data
        ))
        
        audio.save(v2_version=3)
        return True
    except Exception as e:
        return False


def write_tags(file_path, tags_dict):
    try:
        audio = MP3(file_path, ID3=ID3)
        if audio.tags is None:
            audio.add_tags()
        
        if 'title' in tags_dict and tags_dict['title']:
            audio.tags.setall('TIT2', [TIT2(encoding=3, text=tags_dict['title'])])
        
        if 'artist' in tags_dict and tags_dict['artist']:
            audio.tags.setall('TPE1', [TPE1(encoding=3, text=tags_dict['artist'])])
        
        if 'album' in tags_dict and tags_dict['album']:
            audio.tags.setall('TALB', [TALB(encoding=3, text=tags_dict['album'])])
        
        if 'genre' in tags_dict and tags_dict['genre']:
            audio.tags.setall('TCON', [TCON(encoding=3, text=tags_dict['genre'])])
        
        if 'year' in tags_dict and tags_dict['year']:
            audio.tags.delall('TYER')
            audio.tags.delall('TDRC')
            audio.tags.setall('TDRC', [TDRC(encoding=3, text=tags_dict['year'])])
        
        if 'comment' in tags_dict:
            audio.tags.setall('COMM', [COMM(encoding=3, lang='eng', desc='', text=tags_dict['comment'])])
        
        if 'lyrics' in tags_dict and tags_dict['lyrics']:
            audio.tags.setall('USLT', [USLT(encoding=3, lang='eng', desc='', text=tags_dict['lyrics'])])
        
        if 'original_artist' in tags_dict and tags_dict['original_artist']:
            audio.tags.setall('TOPE', [TOPE(encoding=3, text=tags_dict['original_artist'])])
        
        if 'copyright' in tags_dict and tags_dict['copyright']:
            audio.tags.setall('TCOP', [TCOP(encoding=3, text=tags_dict['copyright'])])
        
        if 'encoder' in tags_dict and tags_dict['encoder']:
            audio.tags.setall('TSSE', [TSSE(encoding=3, text=tags_dict['encoder'])])
        
        audio.save(v2_version=3)
        return True
    except Exception as e:
        return False


def delete_cover(file_path):
    try:
        audio = MP3(file_path, ID3=ID3)
        if audio.tags is None:
            return True
        
        audio.tags.delall('APIC')
        audio.save(v2_version=3)
        return True
    except Exception:
        return False


def get_cover_data(file_path):
    try:
        audio = MP3(file_path, ID3=ID3)
        if audio.tags is None:
            return None
        
        for key in audio.tags.keys():
            if key.startswith('APIC'):
                return audio.tags[key].data
        
        return None
    except Exception:
        return None


def extract_title_from_filename(file_path):
    filename = os.path.basename(file_path)
    name_without_ext = os.path.splitext(filename)[0]
    
    if ' - ' in name_without_ext:
        parts = name_without_ext.split(' - ', 1)
        return parts[1] if len(parts) > 1 else name_without_ext
    
    return name_without_ext


def extract_artist_from_filename(file_path):
    filename = os.path.basename(file_path)
    name_without_ext = os.path.splitext(filename)[0]
    
    if ' - ' in name_without_ext:
        parts = name_without_ext.split(' - ', 1)
        return parts[0] if len(parts) > 0 else ''
    
    return ''

