import os
import bcrypt as bcrypt_lib
from datetime import datetime, timedelta, timezone, date
from jose import jwt
from sqlalchemy.orm import Session
from app.models.models import Usuario

SECRET_KEY = os.getenv("SECRET_KEY", "clave_super_secreta_banco_falabella_2024")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))


class AuthRepository:
    def hash_password(self, password: str) -> str:
        salt = bcrypt_lib.gensalt()
        return bcrypt_lib.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def verify_password(self, plain: str, hashed: str) -> bool:
        return bcrypt_lib.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

    def create_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    def get_by_dni(self, db: Session, dni: str) -> Usuario | None:
        return db.query(Usuario).filter(Usuario.dni == dni).first()

    def get_by_email(self, db: Session, email: str) -> Usuario | None:
        return db.query(Usuario).filter(Usuario.email == email).first()

    def create_usuario(self, db: Session, data: dict) -> Usuario:
        usuario = Usuario(
            nombre=data["nombre"],
            apellido=data["apellido"],
            dni=data["dni"],
            email=data["email"],
            password_hash=self.hash_password(data["password"]),
            telefono=data.get("telefono"),
            direccion=data.get("direccion"),
            ingreso_mensual=float(data.get("ingreso_mensual") or 3500.0),
            fecha_nacimiento=(
                datetime.strptime(data["fecha_nacimiento"], "%Y-%m-%d").date()
                if data.get("fecha_nacimiento") else None
            ),
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        return usuario