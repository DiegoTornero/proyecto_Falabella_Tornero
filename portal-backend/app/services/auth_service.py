from app.repositories.auth_repository import AuthRepository
from fastapi import HTTPException
from sqlalchemy.orm import Session

auth_repo = AuthRepository()


class AuthService:
    def login(self, db: Session, dni: str, password: str):
        usuario = auth_repo.get_by_dni(db, dni)
        if not usuario or not auth_repo.verify_password(password, usuario.password_hash):
            raise HTTPException(status_code=401, detail="DNI o clave incorrectos")

        token = auth_repo.create_token({"sub": usuario.id, "dni": usuario.dni})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": usuario.id,
            "mensaje": "Login exitoso"
        }

    def register(self, db: Session, data: dict):
        if auth_repo.get_by_dni(db, data["dni"]):
            raise HTTPException(status_code=400, detail="El DNI ya está registrado")
        if auth_repo.get_by_email(db, data["email"]):
            raise HTTPException(status_code=400, detail="El email ya está registrado")

        usuario = auth_repo.create_usuario(db, data)
        token = auth_repo.create_token({"sub": usuario.id, "dni": usuario.dni})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": usuario.id,
            "mensaje": "Registro exitoso"
        }