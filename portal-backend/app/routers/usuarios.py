from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.usuario_service import UsuarioService
from app.schemas.schemas import ActualizarUsuarioSchema
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()
usuario_service = UsuarioService()


@router.get("/{usuario_id}")
def get_usuario(usuario_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return usuario_service.get_usuario(db, usuario_id)


@router.put("/{usuario_id}")
def update_usuario(usuario_id: str, data: ActualizarUsuarioSchema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return usuario_service.update_usuario(db, usuario_id, data.model_dump())