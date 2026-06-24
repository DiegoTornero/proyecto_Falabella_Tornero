from app.services.auth_service import AuthService
from app.schemas.schemas import LoginSchema, RegisterSchema
from app.database import get_db
from fastapi import Depends
from sqlalchemy.orm import Session

auth_service = AuthService()


class AuthController:
    def login(self, data: LoginSchema, db: Session = Depends(get_db)):
        return auth_service.login(db, data.dni, data.password)

    def register(self, data: RegisterSchema, db: Session = Depends(get_db)):
        return auth_service.register(db, data.model_dump())