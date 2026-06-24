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


class SolicitudCreditoEmpresarialSchema(BaseModel):
    empresa_id: str
    monto_solicitado: float
    plazo_meses: int
    proposito: Optional[str] = None
    cobra_seguro_desgravamen: bool = True   # True = TEA 40.92% | False = TEA 43.92%
    dia_pago: Optional[int] = 3             # User custom payment day of the month


class ActualizarEstadoSchema(BaseModel):
    estado: str
    monto_aprobado: Optional[float] = None
    fecha_desembolso: Optional[str] = None


# ── EMPRESAS ─────────────────────────────────────────────────
class RegistroEmpresaSchema(BaseModel):
    ruc: str
    razon_social: str
    tipo_empresa: Optional[str] = "micro"
    sector: Optional[str] = None
    facturacion_anual: Optional[float] = 0.0
    num_trabajadores: Optional[int] = 1
    fecha_constitucion: Optional[str] = None
    representante_legal: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None


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
    avatar: Optional[str] = None

# ── RECUPERACIÓN DE CONTRASEÑA ──────────────────────────────
class RecoveryRequestSchema(BaseModel):
    dni: str
    email: str

class PasswordResetSchema(BaseModel):
    dni: str
    otp: str
    nueva_password: str