from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date, timedelta
from app.database import get_db
from app.models.models import DepositoPlazo, CuentaAhorro, MovimientoAhorro
from app.dependencies import get_current_user
from app.security import verify_resource_ownership

router = APIRouter()

class AperturaInversionSchema(BaseModel):
    usuario_id: str
    cuenta_ahorro_id: int
    monto: float
    plazo_meses: int

@router.get("/{usuario_id}")
def get_inversiones(usuario_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    verify_resource_ownership(current_user.id, usuario_id, "inversiones")
    inversiones = db.query(DepositoPlazo).filter(DepositoPlazo.usuario_id == usuario_id).all()
    return [
        {
            "id": inv.id,
            "monto_invertido": inv.monto_invertido,
            "plazo_meses": inv.plazo_meses,
            "trea": inv.trea,
            "ganancia_estimada": inv.ganancia_estimada,
            "fecha_apertura": inv.fecha_apertura,
            "fecha_vencimiento": inv.fecha_vencimiento,
            "estado": inv.estado
        } for inv in inversiones
    ]

@router.post("/apertura")
def abrir_inversion(data: AperturaInversionSchema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    verify_resource_ownership(current_user.id, data.usuario_id, "apertura de inversión")
    
    if data.monto < 100:
        raise HTTPException(status_code=400, detail="El monto mínimo de inversión es S/ 100.00")
        
    cuenta = db.query(CuentaAhorro).filter(CuentaAhorro.id == data.cuenta_ahorro_id).first()
    if not cuenta or cuenta.usuario_id != data.usuario_id:
        raise HTTPException(status_code=404, detail="Cuenta de ahorros no válida")
        
    if cuenta.saldo_actual < data.monto:
        raise HTTPException(status_code=400, detail="Saldo insuficiente en la cuenta de ahorros")
        
    # Calcular TREA según plazo
    trea_map = {6: 5.5, 12: 6.8, 24: 7.5}
    trea = trea_map.get(data.plazo_meses, 6.0)
    ganancia = round(data.monto * ((1 + trea/100)**(data.plazo_meses/12) - 1), 2)
    vencimiento = date.today() + timedelta(days=data.plazo_meses * 30)
    
    # Debitar de cuenta
    cuenta.saldo_actual = round(cuenta.saldo_actual - data.monto, 2)
    mov = MovimientoAhorro(
        cuenta_ahorro_id=cuenta.id,
        tipo_movimiento="RETIRO",
        monto=data.monto,
        saldo_resultante=cuenta.saldo_actual,
        descripcion=f"Apertura Depósito a Plazo Fijo ({data.plazo_meses} meses)"
    )
    db.add(mov)
    
    inv = DepositoPlazo(
        monto_invertido=data.monto,
        plazo_meses=data.plazo_meses,
        trea=trea,
        ganancia_estimada=ganancia,
        fecha_vencimiento=vencimiento,
        estado="ACTIVO",
        usuario_id=data.usuario_id
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    
    return {
        "mensaje": "Depósito a Plazo Fijo abierto exitosamente",
        "id": inv.id,
        "trea": trea,
        "ganancia_estimada": ganancia,
        "fecha_vencimiento": str(vencimiento)
    }
