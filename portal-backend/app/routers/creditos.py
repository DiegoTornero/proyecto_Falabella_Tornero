from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.services.credito_service import CreditoService
from app.schemas.schemas import SolicitudCreditoSchema, ActualizarEstadoSchema
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()
credito_service = CreditoService()


@router.get("/todos/lista")
def get_todos(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return credito_service.get_todos(db)


@router.get("/{usuario_id}")
def get_creditos(usuario_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return credito_service.get_creditos(db, usuario_id)


@router.post("/")
def solicitar(data: SolicitudCreditoSchema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return credito_service.solicitar(db, data.model_dump())


@router.put("/{credito_id}/estado")
def actualizar_estado(credito_id: str, data: ActualizarEstadoSchema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return credito_service.actualizar_estado(db, credito_id, data.estado, data.monto_aprobado)


@router.get("/{credito_id}/cronograma")
def get_cronograma(credito_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return credito_service.get_cronograma(db, credito_id)

class PagarCuotaSchema(BaseModel):
    cuenta_origen_id: int

@router.post("/{credito_id}/pagar-cuota")
def pagar_cuota(credito_id: str, data: PagarCuotaSchema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return credito_service.pagar_cuota(db, credito_id, data.cuenta_origen_id)