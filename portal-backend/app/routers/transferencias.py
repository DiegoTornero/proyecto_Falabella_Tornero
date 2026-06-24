from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.transferencia_service import TransferenciaService
from app.schemas.schemas import TransferenciaSchema
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()
transferencia_service = TransferenciaService()


@router.post("/")
def realizar(data: TransferenciaSchema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return transferencia_service.realizar(
        db, data.cuenta_origen_id, data.numero_cuenta_destino, data.monto, data.descripcion
    )


@router.get("/{cuenta_id}")
def get_transferencias(cuenta_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return transferencia_service.get_transferencias(db, cuenta_id)