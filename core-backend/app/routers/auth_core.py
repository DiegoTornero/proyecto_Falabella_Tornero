from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Trabajador
from app.schemas.schemas import LoginTrabajadorSchema
from datetime import datetime, timedelta, timezone
import bcrypt
import os
from jose import jwt

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "clave_super_secreta_banco_falabella_2025_jwt_ultra_secure")
ALGORITHM  = os.getenv("ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 120))


@router.post("/login")
def login_trabajador(data: LoginTrabajadorSchema, db: Session = Depends(get_db)):
    """
    Login para trabajadores del Core Financiero.
    Retorna JWT con rol embebido para RBAC.
    """
    trabajador = db.query(Trabajador).filter(
        Trabajador.codigo_empleado == data.codigo_empleado,
        Trabajador.activo == True
    ).first()

    if not trabajador:
        raise HTTPException(status_code=401, detail="Código de empleado o contraseña incorrectos")

    if not trabajador.password_hash:
        raise HTTPException(status_code=401, detail="Este usuario no tiene contraseña configurada")

    if not bcrypt.checkpw(data.password.encode("utf-8"), trabajador.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Código de empleado o contraseña incorrectos")

    expire = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MIN)
    token = jwt.encode(
        {"sub": trabajador.id, "rol": trabajador.rol, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "trabajador_id": trabajador.id,
        "nombre": trabajador.nombre,
        "rol": trabajador.rol,
        "codigo_empleado": trabajador.codigo_empleado,
        "mensaje": f"Bienvenido, {trabajador.nombre}. Rol: {trabajador.rol}"
    }


@router.get("/me")
def get_me(db: Session = Depends(get_db)):
    """Endpoint de validación de token — usado por el frontend."""
    from app.dependencies import get_current_trabajador
    from fastapi import Request
    return {"mensaje": "Use Authorization header con Bearer token"}
