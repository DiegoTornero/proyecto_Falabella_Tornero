from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import CuentaAhorro, MovimientoAhorro, ProductoPasivo, Usuario
from app.dependencies import get_current_trabajador
from datetime import date
from pydantic import BaseModel

router = APIRouter()

class AperturaCuentaSchema(BaseModel):
    usuario_id: str
    producto_pasivo_id: int
    monto_inicial: float

class TransaccionAhorroSchema(BaseModel):
    cuenta_id: int
    monto: float
    descripcion: str = ""

@router.post("/apertura")
def abrir_cuenta(data: AperturaCuentaSchema, db: Session = Depends(get_db)):
    """
    Apertura una nueva cuenta de ahorros o CTS.
    """
    usuario = db.query(Usuario).filter(Usuario.id == data.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    producto = db.query(ProductoPasivo).filter(ProductoPasivo.id == data.producto_pasivo_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto Pasivo no encontrado")

    import uuid
    nueva_cuenta = CuentaAhorro(
        numero_cuenta="BF" + uuid.uuid4().hex[:10].upper(),
        usuario_id=data.usuario_id,
        producto_pasivo_id=data.producto_pasivo_id,
        saldo_actual=data.monto_inicial
    )
    db.add(nueva_cuenta)
    db.commit()
    db.refresh(nueva_cuenta)

    if data.monto_inicial > 0:
        mov = MovimientoAhorro(
            cuenta_ahorro_id=nueva_cuenta.id,
            tipo_movimiento="DEPOSITO",
            monto=data.monto_inicial,
            saldo_resultante=data.monto_inicial,
            descripcion="Depósito inicial por apertura"
        )
        db.add(mov)
        db.commit()

    return {
        "mensaje": "Cuenta abierta exitosamente",
        "numero_cuenta": nueva_cuenta.numero_cuenta,
        "saldo": nueva_cuenta.saldo_actual,
        "producto": producto.nombre
    }

@router.post("/depositar")
def depositar(data: TransaccionAhorroSchema, db: Session = Depends(get_db)):
    cuenta = db.query(CuentaAhorro).filter(CuentaAhorro.id == data.cuenta_id).first()
    if not cuenta or cuenta.estado != "ACTIVA":
        raise HTTPException(status_code=400, detail="Cuenta inválida o inactiva")

    if data.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")

    cuenta.saldo_actual += data.monto
    mov = MovimientoAhorro(
        cuenta_ahorro_id=cuenta.id,
        tipo_movimiento="DEPOSITO",
        monto=data.monto,
        saldo_resultante=cuenta.saldo_actual,
        descripcion=data.descripcion or "Depósito en ventanilla"
    )
    db.add(mov)
    db.commit()

    return {"mensaje": "Depósito exitoso", "nuevo_saldo": cuenta.saldo_actual}

@router.post("/retirar")
def retirar(data: TransaccionAhorroSchema, db: Session = Depends(get_db)):
    cuenta = db.query(CuentaAhorro).filter(CuentaAhorro.id == data.cuenta_id).first()
    if not cuenta or cuenta.estado != "ACTIVA":
        raise HTTPException(status_code=400, detail="Cuenta inválida o inactiva")

    if data.monto <= 0 or data.monto > cuenta.saldo_actual:
        raise HTTPException(status_code=400, detail="Fondos insuficientes o monto inválido")

    cuenta.saldo_actual -= data.monto
    mov = MovimientoAhorro(
        cuenta_ahorro_id=cuenta.id,
        tipo_movimiento="RETIRO",
        monto=data.monto,
        saldo_resultante=cuenta.saldo_actual,
        descripcion=data.descripcion or "Retiro en ventanilla"
    )
    db.add(mov)
    db.commit()

    return {"mensaje": "Retiro exitoso", "nuevo_saldo": cuenta.saldo_actual}

@router.post("/cierre-diario-ahorros")
def ejecutar_cierre_ahorros(db: Session = Depends(get_db)):
    """
    Simula el proceso batch nocturno para cuentas de ahorro.
    1. Calcula el devengo diario de intereses (TREA).
    2. Lo abona a la cuenta (simulando abono mensual pero de forma diaria para demostración).
    """
    cuentas = db.query(CuentaAhorro).filter(CuentaAhorro.estado == "ACTIVA").all()
    cuentas_actualizadas = 0

    for cuenta in cuentas:
        producto = cuenta.producto
        if not producto or producto.trea_maxima <= 0: continue

        # Cálculo de TREA (tasa de rendimiento efectivo anual)
        # Asumimos que todos ganan la TREA máxima para simplificar la demostración
        tasa_diaria = producto.trea_maxima / 100 / 360
        interes_del_dia = cuenta.saldo_actual * tasa_diaria

        if interes_del_dia > 0.01:
            cuenta.saldo_actual = round(cuenta.saldo_actual + interes_del_dia, 2)
            mov = MovimientoAhorro(
                cuenta_ahorro_id=cuenta.id,
                tipo_movimiento="PAGO_INTERES",
                monto=round(interes_del_dia, 2),
                saldo_resultante=cuenta.saldo_actual,
                descripcion="Abono de intereses TREA"
            )
            db.add(mov)
            cuentas_actualizadas += 1

    db.commit()
    return {"mensaje": "Cierre diario de ahorros ejecutado", "cuentas_procesadas": cuentas_actualizadas}
