from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── AUTH TRABAJADOR ──────────────────────────────────────────
class LoginTrabajadorSchema(BaseModel):
    codigo_empleado: str
    password: str

class RegisterTrabajadorSchema(BaseModel):
    codigo_empleado: str
    nombre: str
    email: str
    password: str
    rol: Optional[str] = "asesor"


# ── EVALUACIÓN DE CRÉDITO ────────────────────────────────────
class EvaluacionRequest(BaseModel):
    usuario_id: str
    credito_id: str
    monto_solicitado: float
    plazo_meses: int


class EvaluacionResponse(BaseModel):
    credito_id: str
    estado: str
    monto_aprobado: Optional[float]
    tasa_interes: float
    score: int
    motivo: str
    elegible: bool
    rds_porcentaje: Optional[float] = None
    rds_semaforo: Optional[str] = None
    cuota_mensual: Optional[float] = None
    ruta_aprobacion: Optional[str] = None


# ── BANDEJA CORE ─────────────────────────────────────────────
class CreditoListSchema(BaseModel):
    id: str
    monto_solicitado: float
    monto_aprobado: Optional[float]
    plazo_meses: int
    estado: str
    created_at: datetime
    usuario_nombre: str
    usuario_dni: str

    class Config:
        from_attributes = True


class AprobarRechazarSchema(BaseModel):
    estado: str              # aprobado | rechazado | observado
    trabajador_codigo: str   # ej. "GER-0001"
    comentario: Optional[str] = None
    fecha_desembolso: Optional[str] = None  # YYYY-MM-DD format if customizing disbursement date


# ── MORA ─────────────────────────────────────────────────────
class GestionMoraSchema(BaseModel):
    credito_id: str
    tipo_gestion: str       # llamada | visita | carta | email | sms
    resultado: Optional[str] = None
    comentario: Optional[str] = None


class TransicionMoraSchema(BaseModel):
    banda_destino: str      # judicial | castigo
    comentario: Optional[str] = None
