from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.models import CuentaAhorro, MovimientoAhorro

class TransferenciaService:
    def realizar(self, db: Session, cuenta_origen_id: str, numero_cuenta_destino: str, monto: float, descripcion: str):
        # 1. Obtener cuenta origen
        origen = db.query(CuentaAhorro).filter(CuentaAhorro.id == cuenta_origen_id).first()
        if not origen:
            raise HTTPException(status_code=404, detail="Cuenta origen no encontrada")
        
        if origen.estado != "ACTIVA":
            raise HTTPException(status_code=400, detail="La cuenta de origen no está activa")

        if float(origen.saldo_actual) < monto:
            raise HTTPException(status_code=400, detail="Saldo insuficiente")

        # 2. Obtener cuenta destino
        destino = db.query(CuentaAhorro).filter(CuentaAhorro.numero_cuenta == numero_cuenta_destino).first()
        if not destino:
            raise HTTPException(status_code=404, detail="Cuenta destino no encontrada")
            
        if destino.estado != "ACTIVA":
            raise HTTPException(status_code=400, detail="La cuenta destino no está activa")

        # 3. Actualizar saldos
        origen.saldo_actual -= monto
        destino.saldo_actual += monto

        # 4. Registrar movimientos
        movimiento_salida = MovimientoAhorro(
            cuenta_ahorro_id=origen.id,
            tipo_movimiento="TRANSFERENCIA",
            monto=monto,
            saldo_resultante=origen.saldo_actual,
            descripcion=descripcion or f"Transferencia a {numero_cuenta_destino}"
        )
        
        movimiento_entrada = MovimientoAhorro(
            cuenta_ahorro_id=destino.id,
            tipo_movimiento="DEPOSITO",
            monto=monto,
            saldo_resultante=destino.saldo_actual,
            descripcion=f"Transferencia recibida de {origen.numero_cuenta}"
        )

        db.add(movimiento_salida)
        db.add(movimiento_entrada)
        db.commit()

        return {"mensaje": "Transferencia realizada correctamente"}

    def get_transferencias(self, db: Session, cuenta_id: str):
        # Este método ya no es estrictamente necesario si usamos /ahorros/movimientos, 
        # pero lo actualizamos por consistencia.
        movimientos = db.query(MovimientoAhorro).filter(
            MovimientoAhorro.cuenta_ahorro_id == cuenta_id,
            MovimientoAhorro.tipo_movimiento == "TRANSFERENCIA"
        ).order_by(MovimientoAhorro.fecha_movimiento.desc()).all()
        
        return [
            {
                "id": str(m.id),
                "cuenta_id": str(m.cuenta_ahorro_id),
                "tipo": "transferencia",
                "monto": m.monto,
                "descripcion": m.descripcion,
                "created_at": m.fecha_movimiento
            } for m in movimientos
        ]