from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.auth_service import AuthService
from app.schemas.schemas import LoginSchema, RegisterSchema
from app.database import get_db

router = APIRouter()
auth_service = AuthService()


@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    return auth_service.login(db, data.dni, data.password)


@router.post("/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    return auth_service.register(db, data.model_dump())