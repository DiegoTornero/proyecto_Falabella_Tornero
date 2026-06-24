from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.usuario_service import UsuarioService
from app.schemas.schemas import ActualizarUsuarioSchema
from app.database import get_db
from app.dependencies import get_current_user
from pydantic import BaseModel
from app.repositories.auth_repository import AuthRepository
from app.security import verify_resource_ownership, sanitize_input

router = APIRouter()
usuario_service = UsuarioService()
auth_repo = AuthRepository()


class CambiarPasswordSchema(BaseModel):
    password_actual: str
    nueva_password: str


@router.get("/{usuario_id}")
def get_usuario(usuario_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Defensa 3: IDOR — solo puede ver su propio perfil
    verify_resource_ownership(current_user.id, usuario_id, "perfil de usuario")
    return usuario_service.get_usuario(db, usuario_id)


@router.put("/{usuario_id}")
def update_usuario(usuario_id: str, data: ActualizarUsuarioSchema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Defensa 3: IDOR — solo puede modificar su propio perfil
    verify_resource_ownership(current_user.id, usuario_id, "perfil de usuario")
    # Defensa 2: Sanitizar campos de texto libre
    update_data = data.model_dump()
    for campo in ["nombre", "apellido", "direccion", "email"]:
        if update_data.get(campo):
            update_data[campo] = sanitize_input(str(update_data[campo]))
    return usuario_service.update_usuario(db, usuario_id, update_data)


@router.put("/{usuario_id}/password")
def cambiar_password(usuario_id: str, data: CambiarPasswordSchema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Defensa 3: IDOR — solo puede cambiar su propia contraseña
    verify_resource_ownership(current_user.id, usuario_id, "contraseña")
    usuario = usuario_service.get_usuario(db, usuario_id)
    if not auth_repo.verify_password(data.password_actual, usuario.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
        
    usuario.password_hash = auth_repo.hash_password(data.nueva_password)
    db.commit()
    return {"mensaje": "Contraseña actualizada exitosamente"}