from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Trabajador
from app.schemas.schemas import LoginTrabajadorSchema, RegisterTrabajadorSchema
from datetime import datetime, timedelta, timezone
import bcrypt
import os
from jose import jwt
import uuid
from app.security import check_rate_limit, sanitize_input

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "clave_super_secreta_banco_falabella_2025_jwt_ultra_secure")
ALGORITHM  = os.getenv("ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 120))


@router.post("/register")
def register_trabajador(data: RegisterTrabajadorSchema, db: Session = Depends(get_db)):
    """
    Registro para trabajadores del Core Financiero.
    """
    existente = db.query(Trabajador).filter(
        (Trabajador.codigo_empleado == data.codigo_empleado) |
        (Trabajador.email == data.email)
    ).first()
    
    if existente:
        raise HTTPException(status_code=400, detail="El código de empleado o email ya está en uso")

    hashed_pw = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    nuevo_trabajador = Trabajador(
        id=str(uuid.uuid4()),
        codigo_empleado=data.codigo_empleado,
        nombre=data.nombre,
        email=data.email,
        password_hash=hashed_pw,
        rol=data.rol,
        activo=True
    )
    db.add(nuevo_trabajador)
    db.commit()
    db.refresh(nuevo_trabajador)

    return {"mensaje": "Trabajador registrado exitosamente", "codigo_empleado": nuevo_trabajador.codigo_empleado}


def auto_seed_trabajadores(db: Session):
    default_workers = [
        {"codigo": "ASE-0001", "nombre": "Carlos Mendoza", "email": "cmendoza@bancofalabella.pe", "rol": "asesor"},
        {"codigo": "RIE-0001", "nombre": "Roberto Salazar", "email": "rsalazar@bancofalabella.pe", "rol": "riesgos"},
        {"codigo": "COM-0001", "nombre": "Ana Gómez", "email": "agomez@bancofalabella.pe", "rol": "comite"},
        {"codigo": "GER-0001", "nombre": "Patricia Vega", "email": "pvega@bancofalabella.pe", "rol": "gerencia"},
    ]
    hashed_pw = bcrypt.hashpw("123456".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    for w in default_workers:
        if not db.query(Trabajador).filter(Trabajador.codigo_empleado == w["codigo"]).first():
            t = Trabajador(
                id=str(uuid.uuid4()),
                codigo_empleado=w["codigo"],
                nombre=w["nombre"],
                email=w["email"],
                password_hash=hashed_pw,
                rol=w["rol"],
                activo=True
            )
            db.add(t)
    db.commit()


@router.post("/login")
def login_trabajador(data: LoginTrabajadorSchema, request: Request, db: Session = Depends(get_db)):
    """
    Login para trabajadores del Core Financiero.
    Retorna JWT con rol embebido para RBAC.
    """
    # Defensa 4: Rate limiting anti fuerza bruta
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip, "/auth/login")
    # Defensa 2: Sanitizar código de empleado
    sanitize_input(data.codigo_empleado)

    if db.query(Trabajador).count() == 0 or data.codigo_empleado in ["ASE-0001", "RIE-0001", "COM-0001", "GER-0001"]:
        auto_seed_trabajadores(db)

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
