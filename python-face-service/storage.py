"""
Módulo de almacenamiento de fotos faciales.
Maneja guardado/carga de imágenes base64 en disco.
"""

import os
import base64
import tempfile
from pathlib import Path
from typing import Optional
from PIL import Image
import io

BASE_DIR = Path(__file__).parent
PHOTOS_DIR = BASE_DIR / "photos"
BASE_PHOTOS_DIR = PHOTOS_DIR / "base"
ATTENDANCE_PHOTOS_DIR = PHOTOS_DIR / "attendance"


def bytes_to_path(img_bytes: bytes) -> str:
    """Guarda bytes en archivo temporal y retorna la ruta."""
    fd, path = tempfile.mkstemp(suffix=".jpg")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(img_bytes)
    except Exception:
        os.close(fd)
        raise
    return path

# Asegurar directorios
BASE_PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
ATTENDANCE_PHOTOS_DIR.mkdir(parents=True, exist_ok=True)


def decode_base64_image(base64_str: str) -> bytes:
    """Decodifica una imagen base64, soportando data URLs."""
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    return base64.b64decode(base64_str)


def save_base64_image(base64_str: str, path: Path) -> str:
    """Guarda una imagen base64 en la ruta indicada y retorna la ruta absoluta."""
    img_bytes = decode_base64_image(base64_str)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "wb") as f:
        f.write(img_bytes)
    return str(path.absolute())


def load_image_bytes(path: str) -> Optional[bytes]:
    """Carga bytes de una imagen del disco."""
    if not path or not os.path.exists(path):
        return None
    with open(path, "rb") as f:
        return f.read()


def save_base_photo(user_id: str, base64_str: str) -> str:
    """Guarda la foto base registrada de un usuario."""
    path = BASE_PHOTOS_DIR / f"{user_id}.jpg"
    return save_base64_image(base64_str, path)


def get_base_photo_path(user_id: str) -> Optional[str]:
    """Retorna la ruta de la foto base de un usuario, o None."""
    path = BASE_PHOTOS_DIR / f"{user_id}.jpg"
    return str(path) if path.exists() else None


def save_attendance_photo(user_id: str, base64_str: str) -> str:
    """Guarda la foto de asistencia de un usuario (sobrescribe la última)."""
    path = ATTENDANCE_PHOTOS_DIR / f"{user_id}.jpg"
    return save_base64_image(base64_str, path)


def get_last_attendance_photo_path(user_id: str) -> Optional[str]:
    """Retorna la ruta de la última foto de asistencia de un usuario, o None."""
    path = ATTENDANCE_PHOTOS_DIR / f"{user_id}.jpg"
    return str(path) if path.exists() else None
