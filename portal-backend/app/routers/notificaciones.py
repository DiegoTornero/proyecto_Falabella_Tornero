from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Notificacion
from app.dependencies import get_current_user
from app.security import verify_resource_ownership

router = APIRouter()

@router.get("/{usuario_id}")
def get_notificaciones(usuario_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    verify_resource_ownership(current_user.id, usuario_id, "notificaciones")
    notifs = db.query(Notificacion).filter(Notificacion.usuario_id == usuario_id).order_by(Notificacion.fecha.desc()).all()
    
    # Si no tiene ninguna, creamos una de bienvenida por defecto
    if not notifs:
        bienvenida = Notificacion(
            titulo="👋 ¡Bienvenido a Banco Falabella!",
            mensaje="Tu cuenta de ahorros virtual está lista. Además te hemos acreditado 500 Puntos CMR de bienvenida y tu Tarjeta Débito Digital.",
            tipo="INFO",
            leida=False,
            usuario_id=usuario_id
        )
        db.add(bienvenida)
        db.commit()
        db.refresh(bienvenida)
        notifs = [bienvenida]
        
    return [
        {
            "id": n.id,
            "titulo": n.titulo,
            "mensaje": n.mensaje,
            "leida": n.leida,
            "tipo": n.tipo,
            "fecha": n.fecha
        } for n in notifs
    ]

@router.put("/{notif_id}/leer")
def marcar_como_leida(notif_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    notif = db.query(Notificacion).filter(Notificacion.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    verify_resource_ownership(current_user.id, notif.usuario_id, "lectura de notificación")
    
    notif.leida = True
    db.commit()
    return {"mensaje": "Notificación marcada como leída"}
