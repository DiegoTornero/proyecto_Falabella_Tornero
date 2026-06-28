from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.models import PuntoCMR, Notificacion
from app.dependencies import get_current_user
from app.security import verify_resource_ownership

router = APIRouter()

class CanjePuntosSchema(BaseModel):
    usuario_id: str
    puntos: int
    recompensa: str

@router.get("/{usuario_id}")
def get_puntos(usuario_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    verify_resource_ownership(current_user.id, usuario_id, "puntos CMR")
    puntos = db.query(PuntoCMR).filter(PuntoCMR.usuario_id == usuario_id).first()
    if not puntos:
        puntos = PuntoCMR(usuario_id=usuario_id, puntos_disponibles=500, puntos_acumulados_totales=500, puntos_canjeados=0, nivel="Verde")
        db.add(puntos)
        db.commit()
        db.refresh(puntos)
        
    return {
        "id": puntos.id,
        "puntos_disponibles": puntos.puntos_disponibles,
        "puntos_acumulados_totales": puntos.puntos_acumulados_totales,
        "puntos_canjeados": puntos.puntos_canjeados,
        "nivel": puntos.nivel
    }

@router.post("/canjear")
def canjear_puntos(data: CanjePuntosSchema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    verify_resource_ownership(current_user.id, data.usuario_id, "canje de puntos")
    puntos = db.query(PuntoCMR).filter(PuntoCMR.usuario_id == data.usuario_id).first()
    if not puntos or puntos.puntos_disponibles < data.puntos:
        raise HTTPException(status_code=400, detail="Puntos CMR insuficientes para este canje")
        
    puntos.puntos_disponibles -= data.puntos
    puntos.puntos_canjeados += data.puntos
    
    notif = Notificacion(
        titulo="🎁 Canje Exitoso CMR",
        mensaje=f"Has canjeado {data.puntos} puntos por: {data.recompensa}. ¡Disfrútalo!",
        tipo="PROMOCION",
        usuario_id=data.usuario_id
    )
    db.add(notif)
    db.commit()
    return {"mensaje": f"Canje de '{data.recompensa}' realizado con éxito", "puntos_restantes": puntos.puntos_disponibles}
