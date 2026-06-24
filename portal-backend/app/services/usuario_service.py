from app.repositories.usuario_repository import UsuarioRepository
from fastapi import HTTPException
from sqlalchemy.orm import Session

usuario_repo = UsuarioRepository()


class UsuarioService:
    def get_usuario(self, db: Session, usuario_id: str):
        usuario = usuario_repo.get_by_id(db, usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return usuario

    def update_usuario(self, db: Session, usuario_id: str, data: dict):
        data_filtrada = {k: v for k, v in data.items() if v is not None and v != ""}
        usuario = usuario_repo.update(db, usuario_id, data_filtrada)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return usuario