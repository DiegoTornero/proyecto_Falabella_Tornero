from pydantic import BaseModel
from typing import Optional


# ── AUTH ────────────────────────────────────────────────────
class LoginSchema(BaseModel):
    dni: str
    password: str


class RegisterSchema(BaseModel):
    nombre: str
    apellido: str
    dni: str
    email: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    ingreso_mensual: Optional[float] = 3500.0
    password: str


# ── CUENTAS ──────────────────────────────────────────────────
class NuevaCuentaSchema(BaseModel):
    usuario_id: str
    tipo: str = "ahorros"
    moneda: str = "PEN"


class DepositoSchema(BaseModel):
    cuenta_id: str
    monto: float
    descripcion: Optional[str] = "Depósito"


# ── CRÉDITOS ─────────────────────────────────────────────────
class SolicitudCreditoSchema(BaseModel):
    usuario_id: str
    monto_solicitado: float
    plazo_meses: int
    proposito: Optional[str] = None
    tipo_producto: Optional[str] = "personal"
    tasa_interes: float = 18.0


class ActualizarEstadoSchema(BaseModel):
    estado: str
    monto_aprobado: Optional[float] = None


# ── TRANSFERENCIAS ───────────────────────────────────────────
class TransferenciaSchema(BaseModel):
    cuenta_origen_id: str
    numero_cuenta_destino: str
    monto: float
    descripcion: Optional[str] = "Transferencia"


# ── USUARIOS ─────────────────────────────────────────────────
class ActualizarUsuarioSchema(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ingreso_mensual: Optional[float] = None