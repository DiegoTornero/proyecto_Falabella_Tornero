import os
import bcrypt

from datetime import datetime, timedelta, timezone, date
from jose import jwt
from sqlalchemy.orm import Session
from app.models.models import Usuario

SECRET_KEY = os.getenv("SECRET_KEY", "clave_super_secreta_banco_falabella_2024")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))


class AuthRepository:
    def hash_password(self, password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def verify_password(self, plain: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
        except Exception:
            return False

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
        import uuid
        import random
        from app.models.models import CuentaAhorro, ProductoPasivo, Tarjeta, PuntoCMR, Notificacion

        # ── 1. CREAR USUARIO ──────────────────────────────────────────
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
        db.flush()  # Obtiene el ID sin cerrar la transacción

        # ── 2. CREAR CUENTA DE AHORROS AUTOMÁTICAMENTE ───────────────
        producto = db.query(ProductoPasivo).filter(ProductoPasivo.id == 1).first()
        if not producto:
            producto = db.query(ProductoPasivo).first()

        nueva_cuenta = CuentaAhorro(
            numero_cuenta="BF" + uuid.uuid4().hex[:10].upper(),
            usuario_id=usuario.id,
            producto_pasivo_id=producto.id,
            saldo_actual=0.0,
            estado="ACTIVA"
        )
        db.add(nueva_cuenta)

        # ── 3. CREAR TARJETA CMR Y PUNTOS AUTOMÁTICAMENTE ─────────────
        num_tarjeta = f"4508 •••• •••• {random.randint(1000, 9999)}"
        nueva_tarjeta = Tarjeta(
            numero_enmascarado=num_tarjeta,
            cvv=str(random.randint(100, 999)),
            fecha_expiracion="12/30",
            limite_credito=2000.0,
            saldo_disponible=2000.0,
            tipo="DEBITO_CMR",
            estado="ACTIVA",
            usuario_id=usuario.id
        )
        db.add(nueva_tarjeta)

        puntos = PuntoCMR(
            puntos_disponibles=500,
            puntos_acumulados_totales=500,
            puntos_canjeados=0,
            nivel="Verde",
            usuario_id=usuario.id
        )
        db.add(puntos)

        notif = Notificacion(
            titulo="👋 ¡Bienvenido a Banco Falabella!",
            mensaje="Tu cuenta de ahorros y tu Tarjeta Virtual Débito CMR están listas. Te hemos regalado 500 Puntos CMR de bienvenida.",
            tipo="INFO",
            leida=False,
            usuario_id=usuario.id
        )
        db.add(notif)

        # ── 4. COMMIT ÚNICO de todo junto ─────────────────────────────
        db.commit()
        db.refresh(usuario)
        return usuario