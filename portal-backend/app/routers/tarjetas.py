from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import random
from app.database import get_db
from app.models.models import Tarjeta
from app.dependencies import get_current_user
from app.security import verify_resource_ownership

router = APIRouter()

class BloquearTarjetaSchema(BaseModel):
    tarjeta_id: str
    estado: str  # ACTIVA | BLOQUEADA

class SolicitarTarjetaSchema(BaseModel):
    usuario_id: str
    tipo: str  # DEBITO_CMR | CREDITO_CMR

@router.get("/{usuario_id}")
def get_tarjetas(usuario_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    verify_resource_ownership(current_user.id, usuario_id, "tarjetas")
    tarjetas = db.query(Tarjeta).filter(Tarjeta.usuario_id == usuario_id).all()
    return [
        {
            "id": t.id,
            "numero_enmascarado": t.numero_enmascarado,
            "cvv": t.cvv,
            "fecha_expiracion": t.fecha_expiracion,
            "limite_credito": t.limite_credito,
            "saldo_disponible": t.saldo_disponible,
            "tipo": t.tipo,
            "estado": t.estado
        } for t in tarjetas
    ]

@router.post("/solicitar")
def solicitar_tarjeta(data: SolicitarTarjetaSchema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    verify_resource_ownership(current_user.id, data.usuario_id, "solicitud de tarjeta")
    
    num_rnd = f"4508 •••• •••• {random.randint(1000, 9999)}"
    nueva = Tarjeta(
        numero_enmascarado=num_rnd,
        cvv=str(random.randint(100, 999)),
        fecha_expiracion="12/29",
        limite_credito=3000.0 if data.tipo == "CREDITO_CMR" else 1500.0,
        saldo_disponible=3000.0 if data.tipo == "CREDITO_CMR" else 1500.0,
        tipo=data.tipo,
        estado="ACTIVA",
        usuario_id=data.usuario_id
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"mensaje": "Tarjeta generada exitosamente", "id": nueva.id}

@router.put("/estado")
def cambiar_estado_tarjeta(data: BloquearTarjetaSchema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    tarjeta = db.query(Tarjeta).filter(Tarjeta.id == data.tarjeta_id).first()
    if not tarjeta:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    verify_resource_ownership(current_user.id, tarjeta.usuario_id, "estado de tarjeta")
    
    if data.estado not in ["ACTIVA", "BLOQUEADA"]:
        raise HTTPException(status_code=400, detail="Estado inválido")
        
    tarjeta.estado = data.estado
    db.commit()
    return {"mensaje": f"Tarjeta cambiada a estado {data.estado}"}
