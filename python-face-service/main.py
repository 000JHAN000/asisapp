"""
Microservicio de Reconocimiento Facial  
FastAPI + DeepFace (ArcFace + RetinaFace)

Endpoints:
  POST /detect         -> Detecta si hay un rostro real en la imagen
  POST /register       -> Guarda foto base y extrae embedding ArcFace
  POST /verify         -> Compara dos imágenes faciales (básico)
  POST /verify-secure  -> Verificación de 3 capas (anti-spoofing + base + historial)
  POST /update-last-photo -> Actualiza la última foto de asistencia

Las imágenes se reciben como Base64 y se persisten en disco.
"""

import os
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import storage
from face_engine import detect_face, register_face, verify_faces, verify_secure, precargar_modelo

@asynccontextmanager
async def lifespan(app: FastAPI):
    precargar_modelo()
    yield

app = FastAPI(
    title="ChronoGest Face Recognition Service — Ultra Secure",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ─────────────────────────────────────────────────────────-

class DetectResponse(BaseModel):
    success: bool
    face_detected: bool = False
    confidence: Optional[float] = None
    message: str = ""


class RegisterResponse(BaseModel):
    success: bool
    embedding: Optional[list] = None
    photo_path: Optional[str] = None
    error: Optional[str] = None


class VerifyResponse(BaseModel):
    success: bool
    verified: bool = False
    distance: Optional[float] = None
    threshold: float = 0.25
    message: str = ""


class VerifySecureResponse(BaseModel):
    success: bool
    verified: bool = False
    details: dict = {}
    message: str = ""


class UpdateLastPhotoResponse(BaseModel):
    success: bool
    photo_path: Optional[str] = None
    error: Optional[str] = None

class DetectRequest(BaseModel):
    image: str

class RegisterRequest(BaseModel):
    image: str
    user_id: str

class VerifyRequest(BaseModel):
    base_image: str
    verify_image: str

class VerifySecureRequest(BaseModel):
    verify_image: str
    base_image: Optional[str] = None
    last_image: Optional[str] = None
    user_id: Optional[str] = None

class UpdateLastPhotoRequest(BaseModel):
    image: str
    user_id: str


# ── Helpers ──────────────────────────────────────────────────────────

def _b64_to_bytes(b64: str) -> bytes:
    import base64
    if "," in b64:
        b64 = b64.split(",")[1]
    # Limpiar BOM, espacios y saltos de linea que algunos clientes incluyen
    b64 = b64.strip().replace("\ufeff", "").replace("\n", "").replace("\r", "").replace(" ", "")
    return base64.b64decode(b64)


# ── Endpoints ────────────────────────────────────────────────────────

@app.post("/detect", response_model=DetectResponse)
async def detect(req: DetectRequest):
    """
    Detecta si hay al menos un rostro real en la imagen.
    Útil para dar feedback visual antes de capturar.
    """
    try:
        img_bytes = _b64_to_bytes(req.image)
        result = detect_face(img_bytes)
        return DetectResponse(
            success=True,
            face_detected=result["face_detected"],
            confidence=result["confidence"],
            message=result["message"],
        )
    except Exception as e:
        return DetectResponse(success=False, face_detected=False, message=str(e))


@app.post("/register", response_model=RegisterResponse)
async def register(req: RegisterRequest):
    """
    Guarda la foto base de un usuario y extrae su embedding facial con ArcFace.
    """
    try:
        result = register_face(req.image, req.user_id)
        return RegisterResponse(
            success=result["success"],
            embedding=result.get("embedding"),
            photo_path=result.get("photo_path"),
            error=result.get("error"),
        )
    except Exception as e:
        return RegisterResponse(success=False, error=str(e))


@app.post("/verify", response_model=VerifyResponse)
async def verify(req: VerifyRequest):
    """
    Compara la imagen base contra la imagen de verificación.
    Usa ArcFace con umbral estricto (0.25).
    """
    base_path = None
    verify_path = None
    try:
        base_bytes = _b64_to_bytes(req.base_image)
        verify_bytes = _b64_to_bytes(req.verify_image)
        
        base_path = storage.bytes_to_path(base_bytes)
        verify_path = storage.bytes_to_path(verify_bytes)
        
        result = verify_faces(base_path, verify_path)
        return VerifyResponse(
            success=True,
            verified=result["verified"],
            distance=result["distance"],
            threshold=result["threshold"],
            message=result["message"],
        )
    except Exception as e:
        return VerifyResponse(success=False, message=str(e))
    finally:
        for p in (base_path, verify_path):
            if p and os.path.exists(p):
                os.remove(p)


@app.post("/verify-secure", response_model=VerifySecureResponse)
async def verify_secure_endpoint(req: VerifySecureRequest):
    """
    Verificación ultra-segura de 3 capas:
    1. Anti-spoofing (¿persona viva?)
    2. Coincidencia con foto base
    3. NO reutilización de última foto de asistencia
    
    Puedes enviar base_image/last_image como base64, o user_id para que
    el servicio las cargue del disco.
    """
    base_path = None
    verify_path = None
    last_path = None
    
    try:
        # Resolver foto base
        if req.base_image:
            base_bytes = _b64_to_bytes(req.base_image)
            base_path = storage.bytes_to_path(base_bytes)
        elif req.user_id:
            base_path = storage.get_base_photo_path(req.user_id)
        
        # Resolver foto de verificación
        verify_bytes = _b64_to_bytes(req.verify_image)
        verify_path = storage.bytes_to_path(verify_bytes)
        
        # Resolver última foto de asistencia
        if req.last_image:
            last_bytes = _b64_to_bytes(req.last_image)
            last_path = storage.bytes_to_path(last_bytes)
        elif req.user_id:
            last_path = storage.get_last_attendance_photo_path(req.user_id)
        
        result = verify_secure(base_path, verify_path, last_path)
        return VerifySecureResponse(
            success=True,
            verified=result["verified"],
            details=result["details"],
            message=result["message"],
        )
    except Exception as e:
        return VerifySecureResponse(success=False, message=str(e))
    finally:
        for p in (base_path, verify_path, last_path):
            if p and os.path.exists(p):
                os.remove(p)


@app.post("/update-last-photo", response_model=UpdateLastPhotoResponse)
async def update_last_photo(req: UpdateLastPhotoRequest):
    """
    Actualiza la última foto de asistencia de un usuario.
    Se usa después de que la asistencia fue aprobada.
    """
    try:
        img_bytes = _b64_to_bytes(req.image)
        # Convertir a string para el storage (que espera base64 string)
        img_b64_str = req.image  # ya viene como base64 string
        saved = storage.save_attendance_photo(req.user_id, img_b64_str)
        return UpdateLastPhotoResponse(success=True, photo_path=saved)
    except Exception as e:
        return UpdateLastPhotoResponse(success=False, error=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "engine": "deepface-arcface-retinaface", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
