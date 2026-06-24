from sqlalchemy.orm import Session
from app.models.models import Usuario


class UsuarioRepository:
    def get_by_id(self, db: Session, usuario_id: str) -> Usuario | None:
        return db.query(Usuario).filter(Usuario.id == usuario_id).first()

    def create(self, db: Session, data: dict) -> Usuario:
        usuario = Usuario(**data)
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        return usuario

    def update(self, db: Session, usuario_id: str, data: dict) -> Usuario | None:
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario:
            return None
        for key, value in data.items():
            setattr(usuario, key, value)
        db.commit()
        db.refresh(usuario)
        return usuario