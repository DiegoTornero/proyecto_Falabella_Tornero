import random
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.services.auth_service import AuthService
from app.schemas.schemas import LoginSchema, RegisterSchema, RecoveryRequestSchema, PasswordResetSchema
from app.database import get_db
from app.models.models import Usuario
from app.repositories.auth_repository import AuthRepository
from app.security import check_rate_limit, sanitize_input

router = APIRouter()
auth_service = AuthService()
auth_repo = AuthRepository()

import json
import os

OTP_FILE = "otp_store.json"

def get_otp_store():
    if os.path.exists(OTP_FILE):
        try:
            with open(OTP_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_otp_store(store):
    try:
        with open(OTP_FILE, "w") as f:
            json.dump(store, f)
    except Exception:
        pass


@router.post("/login")
def login(data: LoginSchema, request: Request, db: Session = Depends(get_db)):
    # Defensa 4: Rate limiting anti fuerza bruta
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip, "/api/auth/login")
    # Defensa 2: Sanitizar inputs
    sanitize_input(data.dni)
    return auth_service.login(db, data.dni, data.password)


@router.post("/register")
def register(data: RegisterSchema, request: Request, db: Session = Depends(get_db)):
    # Defensa 2: Sanitizar inputs de texto libre
    if data.nombre: sanitize_input(data.nombre)
    if data.apellido: sanitize_input(data.apellido)
    if data.direccion: sanitize_input(data.direccion)
    return auth_service.register(db, data.model_dump())


@router.post("/password-recovery/request")
def request_recovery(data: RecoveryRequestSchema, request: Request, db: Session = Depends(get_db)):
    # Defensa 4: Rate limiting en recuperación de clave
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip, "/api/auth/password-recovery/request")

    usuario = db.query(Usuario).filter(Usuario.dni == data.dni, Usuario.email == data.email).first()
    if not usuario:
        # Respuesta ambigua para no revelar qué dato es incorrecto (evita enumeración)
        raise HTTPException(status_code=200, detail="Si los datos son correctos, recibirás el código en el sistema.")
    
    otp = "".join(random.choices("0123456789", k=6))
    store = get_otp_store()
    store[data.dni] = otp
    save_otp_store(store)
    
    print("\n" + "="*50)
    print(f" OTP RECOVERY PARA DNI {data.dni}: {otp} ")
    print("="*50 + "\n")
    
    return {"mensaje": "Si los datos son correctos, revisa la consola/logs del backend."}


@router.post("/password-recovery/reset")
def reset_password(data: PasswordResetSchema, db: Session = Depends(get_db)):
    store = get_otp_store()
    stored_otp = store.get(data.dni)
    if not stored_otp or stored_otp != data.otp:
        raise HTTPException(status_code=400, detail="Código OTP inválido o expirado")
    
    usuario = db.query(Usuario).filter(Usuario.dni == data.dni).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    usuario.password_hash = auth_repo.hash_password(data.nueva_password)
    db.commit()
    
    store.pop(data.dni, None)
    save_otp_store(store)
    
    return {"mensaje": "Contraseña restablecida exitosamente"}