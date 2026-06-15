"""
Motor de reconocimiento facial ultra-seguro.
Usa DeepFace con ArcFace + RetinaFace.
"""

import os
from typing import Optional
import numpy as np
from deepface import DeepFace

import storage

# ── Configuración ───────────────────────────────────────────────────
MODEL_NAME = "ArcFace"
DETECTOR_BACKEND = "opencv"
VERIFY_THRESHOLD = 0.20
REUSE_THRESHOLD = 0.08
_arcface_model = None


def precargar_modelo():
    """Precarga el modelo ArcFace para evitar demoras."""
    global _arcface_model
    try:
        print("[FACE] Precargando modelo ArcFace...")
        _arcface_model = DeepFace.build_model(MODEL_NAME)
        print("[FACE] Modelo precargado correctamente.")
    except Exception as e:
        print(f"[FACE] Error precargando modelo: {e}")


def detect_face(img_bytes: bytes) -> dict:
    """Detecta rostros en la imagen. Valida que exista exactamente 1 rostro."""
    path = None
    try:
        path = storage.bytes_to_path(img_bytes)
        faces = DeepFace.extract_faces(
            img_path=path,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=False,
        )
        if not faces or len(faces) == 0:
            return {"face_detected": False, "confidence": None, "message": "No se detectó ningún rostro."}

        if len(faces) > 1:
            return {"face_detected": False, "confidence": None, "message": "Se detectó más de un rostro. Asegúrate de que solo haya una persona en la imagen."}

        best = faces[0]
        conf = float(best.get("confidence", 0))

        if conf < 0.5:
            return {"face_detected": False, "confidence": conf, "message": "Confianza de detección muy baja."}

        return {"face_detected": True, "confidence": conf, "message": "Rostro detectado correctamente."}
    except Exception as e:
        return {"face_detected": False, "confidence": None, "message": f"Error en detección: {str(e)}"}
    finally:
        if path and os.path.exists(path):
            os.remove(path)


def register_face(image_base64: str, user_id: str) -> dict:
    """Guarda la foto base y extrae embedding."""
    path = None
    try:
        import base64
        img_bytes = base64.b64decode(image_base64.split(",")[1] if "," in image_base64 else image_base64)
        path = storage.bytes_to_path(img_bytes)

        detect_result = detect_face(img_bytes)
        if not detect_result["face_detected"]:
            return {"success": False, "embedding": None, "error": detect_result["message"]}

        saved_path = storage.save_base_photo(user_id, image_base64)

        reps = DeepFace.represent(
            img_path=path,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=False,
        )
        if not reps or len(reps) == 0:
            return {"success": False, "embedding": None, "error": "No se pudo extraer el embedding facial."}

        embedding = reps[0]["embedding"]
        return {"success": True, "embedding": embedding, "error": None, "photo_path": saved_path}
    except Exception as e:
        return {"success": False, "embedding": None, "error": str(e)}
    finally:
        if path and os.path.exists(path):
            os.remove(path)


def verify_faces(base_path: str, verify_path: str) -> dict:
    """
    Compara dos imágenes faciales usando DeepFace.verify() (más rápido).
    """
    if not os.path.exists(base_path):
        return {"verified": False, "distance": None, "threshold": VERIFY_THRESHOLD, "message": "Foto base no encontrada."}
    if not os.path.exists(verify_path):
        return {"verified": False, "distance": None, "threshold": VERIFY_THRESHOLD, "message": "Foto de verificación no encontrada."}

    try:
        result = DeepFace.verify(
            img1_path=base_path,
            img2_path=verify_path,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            distance_metric="cosine",
            threshold=VERIFY_THRESHOLD,
            enforce_detection=False,
        )
        distance = float(result.get("distance", 1.0))
        verified = result.get("verified", False)
        message = "Coincidencia confirmada." if verified else "Las caras no coinciden."
        return {
            "verified": verified,
            "distance": distance,
            "threshold": VERIFY_THRESHOLD,
            "message": message,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"verified": False, "distance": None, "threshold": VERIFY_THRESHOLD, "message": f"Error en verificación: {str(e)}"}


def verify_secure(base_path: Optional[str], verify_path: str, last_path: Optional[str]) -> dict:
    """
    Verificación segura de 2 capas:
    1. Coincidencia base
    2. No reutilización de última foto
    """
    if not base_path or not os.path.exists(base_path):
        return {
            "verified": False,
            "details": {"error": "Foto base no encontrada"},
            "message": "El usuario no tiene foto base registrada.",
        }

    # Capa 1: detectar rostro
    with open(verify_path, "rb") as f:
        verify_bytes = f.read()
    detect_result = detect_face(verify_bytes)
    face_detected = detect_result["face_detected"]

    # Capa 2: coincidencia con base
    base_result = verify_faces(base_path, verify_path)
    base_match = base_result["verified"]
    base_distance = base_result["distance"]

    if not face_detected:
        base_match = False

    # Capa 3: reutilización
    last_photo_exists = bool(last_path and os.path.exists(last_path))
    last_photo_reused = False
    last_photo_distance = None

    if last_photo_exists and last_path:
        last_result = verify_faces(last_path, verify_path)
        last_photo_distance = last_result["distance"]
        if last_photo_distance is not None and last_photo_distance < REUSE_THRESHOLD:
            last_photo_reused = True

    verified = base_match and not last_photo_reused

    if not face_detected:
        message = "No se detectó un rostro válido en la imagen."
    elif not base_result["verified"]:
        message = "El rostro no coincide con el registrado."
    elif last_photo_reused:
        message = "Reutilización de foto detectada."
    else:
        message = "Verificación facial aprobada."

    return {
        "verified": verified,
        "details": {
            "anti_spoofing_passed": face_detected,
            "base_match": base_match,
            "base_distance": base_distance,
            "last_photo_exists": last_photo_exists,
            "last_photo_reused": last_photo_reused,
            "last_photo_distance": last_photo_distance,
        },
        "message": message,
    }
