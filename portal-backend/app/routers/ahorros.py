from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import CuentaAhorro, MovimientoAhorro, ProductoPasivo, Usuario
from app.dependencies import get_current_user
from datetime import date
from pydantic import BaseModel
from app.security import verify_account_ownership, sanitize_input

router = APIRouter()

class AperturaCuentaSchema(BaseModel):
    usuario_id: str
    producto_pasivo_id: int
    monto_inicial: float

class TransaccionAhorroSchema(BaseModel):
    cuenta_id: int
    monto: float
    descripcion: str = ""

# ─────────────────────────────────────────────────
# IMPORTANTE: Las rutas específicas DEBEN ir ANTES
# que las rutas con parámetros (/{usuario_id})
# para evitar conflictos de routing en FastAPI.
# ─────────────────────────────────────────────────

@router.get("/movimientos/{cuenta_id}")
def get_movimientos(cuenta_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Defensa 3: IDOR — verificar que la cuenta pertenece al usuario autenticado
    cuenta = db.query(CuentaAhorro).filter(CuentaAhorro.id == cuenta_id).first()
    verify_account_ownership(current_user, cuenta)
    movimientos = (
        db.query(MovimientoAhorro)
        .filter(MovimientoAhorro.cuenta_ahorro_id == cuenta_id)
        .order_by(MovimientoAhorro.fecha_movimiento.desc())
        .all()
    )
    return [
        {
            "id": str(m.id),
            "cuenta_id": str(m.cuenta_ahorro_id),
            "tipo": "deposito" if m.tipo_movimiento == "DEPOSITO"
                    else ("retiro" if m.tipo_movimiento == "RETIRO"
                    else ("interes" if m.tipo_movimiento == "PAGO_INTERES" else "transferencia")),
            "monto": m.monto,
            "descripcion": m.descripcion,
            "created_at": m.fecha_movimiento
        } for m in movimientos
    ]

@router.post("/apertura")
def abrir_cuenta(data: AperturaCuentaSchema, db: Session = Depends(get_db)):
    """Apertura una nueva cuenta de ahorros o CTS."""
    usuario = db.query(Usuario).filter(Usuario.id == data.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    producto = db.query(ProductoPasivo).filter(ProductoPasivo.id == data.producto_pasivo_id).first()
    if not producto:
        raise HTTPException(
            status_code=404,
            detail=f"Producto Pasivo con id={data.producto_pasivo_id} no encontrado. Verifica que el SQL de seed fue ejecutado."
        )

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
        "producto": producto.nombre,
        "trea": producto.trea_maxima
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
    Calcula el devengo diario de intereses (TREA) y lo abona.
    Las cuentas TREA 0% no generan intereses (por diseño).
    """
    cuentas = db.query(CuentaAhorro).filter(CuentaAhorro.estado == "ACTIVA").all()
    cuentas_actualizadas = 0
    cuentas_sin_trea = 0

    for cuenta in cuentas:
        producto = cuenta.producto
        if not producto:
            continue
        if producto.trea_maxima <= 0:
            cuentas_sin_trea += 1
            continue  # TREA 0% no genera intereses

        tasa_diaria = producto.trea_maxima / 100 / 360
        interes_del_dia = cuenta.saldo_actual * tasa_diaria

        if interes_del_dia > 0.001:
            cuenta.saldo_actual = round(cuenta.saldo_actual + interes_del_dia, 2)
            mov = MovimientoAhorro(
                cuenta_ahorro_id=cuenta.id,
                tipo_movimiento="PAGO_INTERES",
                monto=round(interes_del_dia, 4),
                saldo_resultante=cuenta.saldo_actual,
                descripcion=f"Interés TREA ({producto.trea_maxima}% anual)"
            )
            db.add(mov)
            cuentas_actualizadas += 1

    db.commit()
    return {
        "mensaje": "Cierre diario ejecutado",
        "cuentas_con_interes": cuentas_actualizadas,
        "cuentas_trea_cero": cuentas_sin_trea,
        "nota": "Las cuentas TREA 0% no generan intereses por diseño del producto."
    }

# ─── Esta ruta DEBE ir ÚLTIMA para no interceptar las anteriores ───
@router.get("/productos")
def get_productos(db: Session = Depends(get_db)):
    """Lista todos los productos de ahorro disponibles para apertura."""
    productos = db.query(ProductoPasivo).filter(ProductoPasivo.activo == True).all()
    return [
        {
            "id": p.id,
            "nombre": p.nombre,
            "trea_minima": p.trea_minima,
            "trea_maxima": p.trea_maxima,
            "costo_mantenimiento": p.costo_mantenimiento,
        } for p in productos
    ]

@router.get("/{usuario_id}")
def get_cuentas(usuario_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Defensa 3: IDOR — solo puede ver sus propias cuentas
    from app.security import verify_resource_ownership
    verify_resource_ownership(current_user.id, usuario_id, "cuentas de ahorro")
    cuentas = db.query(CuentaAhorro).filter(CuentaAhorro.usuario_id == usuario_id).all()
    return [
        {
            "id": str(c.id),
            "numero_cuenta": c.numero_cuenta,
            "tipo": c.producto.nombre if c.producto else "Ahorros",
            "trea": c.producto.trea_maxima if c.producto else 0,
            "saldo": float(c.saldo_actual),
            "moneda": "PEN",
            "estado": c.estado
        } for c in cuentas
    ]
