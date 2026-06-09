from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Trabajador
import os

SECRET_KEY = os.getenv("SECRET_KEY", "clave_super_secreta_banco_falabella_2025_jwt_ultra_secure")
ALGORITHM  = os.getenv("ALGORITHM", "HS256")

security = HTTPBearer(auto_error=False)

ROL_JERARQUIA = ["asesor", "jefe_regional", "riesgos", "comite", "gerencia"]


def get_current_trabajador(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Trabajador:
    if not credentials:
        raise HTTPException(status_code=401, detail="Token de autenticación requerido")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        trabajador_id: str = payload.get("sub")
        if not trabajador_id:
            raise HTTPException(status_code=401, detail="Token inválido: sin identificador")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    trabajador = db.query(Trabajador).filter(Trabajador.id == trabajador_id, Trabajador.activo == True).first()
    if not trabajador:
        raise HTTPException(status_code=401, detail="Trabajador no encontrado o inactivo")
    return trabajador


def require_rol(*roles):
    """
    Factoría de dependencias RBAC.
    Uso: Depends(require_rol('riesgos', 'comite', 'gerencia'))
    Devuelve 403 si el rol no está en la lista.
    """
    def checker(current: Trabajador = Depends(get_current_trabajador)):
        if current.rol not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Roles autorizados: {', '.join(roles)}. Su rol: '{current.rol}'"
            )
        return current
    return checker


def require_nivel_minimo(nivel_minimo: str):
    """
    Exige que el rol del trabajador sea al menos 'nivel_minimo' en la jerarquía.
    """
    def checker(current: Trabajador = Depends(get_current_trabajador)):
        if nivel_minimo not in ROL_JERARQUIA:
            raise HTTPException(status_code=500, detail="Nivel mínimo inválido en configuración")
        jerarquia_actual   = ROL_JERARQUIA.index(current.rol) if current.rol in ROL_JERARQUIA else -1
        jerarquia_requerida = ROL_JERARQUIA.index(nivel_minimo)
        if jerarquia_actual < jerarquia_requerida:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere rol '{nivel_minimo}' o superior. Su rol actual: '{current.rol}'"
            )
        return current
    return checker
