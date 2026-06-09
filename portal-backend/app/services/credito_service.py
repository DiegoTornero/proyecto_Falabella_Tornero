from app.repositories.credito_repository import CreditoRepository
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import requests

credito_repo = CreditoRepository()


class CreditoService:
    def get_creditos(self, db: Session, usuario_id: str):
        return credito_repo.get_by_usuario(db, usuario_id)

    def get_todos(self, db: Session):
        return credito_repo.get_all(db)

    def solicitar(self, db: Session, data: dict):
        """
        1. Crea el crédito en BD
        2. Llama al Core (puerto 8001) para evaluación inmediata
        3. Actualiza estado en BD con el resultado del scoring
        """
        # Obtener ingreso del usuario
        from app.models.models import Usuario
        usuario = db.query(Usuario).filter(Usuario.id == data["usuario_id"]).first()
        ingreso = float(usuario.ingreso_mensual) if usuario and usuario.ingreso_mensual else 3500.0

        credito = credito_repo.create(db, {
            "usuario_id": data["usuario_id"],
            "monto_solicitado": data["monto_solicitado"],
            "plazo_meses": data["plazo_meses"],
            "tasa_interes": data.get("tasa_interes", 18.0),
            "proposito": data.get("proposito"),
            "tipo_producto": data.get("tipo_producto", "personal"),
            "ingreso_cliente": ingreso,
            "estado": "enviado"
        })

        # Enviar al Core Financiero para scoring
        try:
            core_payload = {
                "usuario_id": data["usuario_id"],
                "credito_id": credito.id,
                "monto_solicitado": data["monto_solicitado"],
                "plazo_meses": data["plazo_meses"]
            }
            res = requests.post("http://127.0.0.1:8001/scoring/evaluar", json=core_payload, timeout=5)
            if res.status_code == 200:
                core_data = res.json()
                credito.estado = core_data.get("estado", "enviado")
                credito.score_crediticio = core_data.get("score")
                credito.rds_valor = (core_data.get("rds_porcentaje", 0) or 0) / 100
                credito.rds_semaforo = core_data.get("rds_semaforo")
                credito.ruta_aprobacion = core_data.get("ruta_aprobacion")
                if core_data.get("monto_aprobado"):
                    credito.monto_aprobado = core_data["monto_aprobado"]
                    credito.tasa_interes = core_data.get("tasa_interes", credito.tasa_interes)
                db.commit()
                db.refresh(credito)
        except Exception as e:
            print(f"⚠️  Core Financiero no disponible (se continúa sin scoring): {e}")

        return credito

    def actualizar_estado(self, db: Session, credito_id: str, estado: str, monto_aprobado: float = None):
        estados_validos = ["enviado", "en_revision", "aprobado", "rechazado", "desembolsado", "castigado"]
        if estado not in estados_validos:
            raise HTTPException(status_code=400, detail="Estado no válido")

        update_data = {"estado": estado}
        if monto_aprobado is not None:
            update_data["monto_aprobado"] = monto_aprobado

        credito_repo.update_estado(db, credito_id, update_data)

        if estado == "desembolsado":
            credito = credito_repo.get_by_id(db, credito_id)
            self._generar_cronograma(db, credito)

        return {"mensaje": f"Estado actualizado a {estado}"}

    def _generar_cronograma(self, db: Session, credito):
        tasa_mensual = float(credito.tasa_interes) / 100 / 12
        monto = float(credito.monto_aprobado or credito.monto_solicitado)
        plazo = credito.plazo_meses
        if tasa_mensual > 0:
            cuota = (monto * tasa_mensual * (1 + tasa_mensual) ** plazo) / ((1 + tasa_mensual) ** plazo - 1)
        else:
            cuota = monto / plazo

        cronograma = []
        for i in range(1, plazo + 1):
            fecha = datetime.now() + timedelta(days=30 * i)
            cronograma.append({
                "credito_id": credito.id,
                "numero_cuota": i,
                "fecha_vencimiento": fecha.date(),
                "monto_cuota": round(cuota, 2),
                "estado": "pendiente"
            })
        credito_repo.create_cronograma(db, cronograma)

    def get_cronograma(self, db: Session, credito_id: str):
        return credito_repo.get_cronograma(db, credito_id)

    def pagar_cuota(self, db: Session, credito_id: str, cuenta_origen_id: int):
        from app.models.models import CronogramaPago, CuentaAhorro, MovimientoAhorro, Credito
        
        credito = db.query(Credito).filter(Credito.id == credito_id).first()
        if not credito:
            raise HTTPException(status_code=404, detail="Crédito no encontrado")
            
        # Buscar próxima cuota pendiente
        cuota = db.query(CronogramaPago).filter(
            CronogramaPago.credito_id == credito_id,
            CronogramaPago.estado == "pendiente"
        ).order_by(CronogramaPago.numero_cuota.asc()).first()
        
        if not cuota:
            raise HTTPException(status_code=400, detail="No hay cuotas pendientes para este crédito")
            
        monto_a_pagar = cuota.monto_cuota
        
        # Verificar saldo
        cuenta = db.query(CuentaAhorro).filter(CuentaAhorro.id == cuenta_origen_id).first()
        if not cuenta:
            raise HTTPException(status_code=404, detail="Cuenta de origen no encontrada")
            
        if cuenta.saldo_actual < monto_a_pagar:
            raise HTTPException(status_code=400, detail="Saldo insuficiente en la cuenta de ahorros")
            
        # Descontar y registrar movimiento
        cuenta.saldo_actual -= monto_a_pagar
        movimiento = MovimientoAhorro(
            cuenta_ahorro_id=cuenta.id,
            tipo_movimiento="RETIRO",
            monto=monto_a_pagar,
            saldo_resultante=cuenta.saldo_actual,
            descripcion=f"Pago de Préstamo - Cuota {cuota.numero_cuota}",
            fecha_movimiento=datetime.now()
        )
        db.add(movimiento)
        
        # Actualizar cuota
        cuota.estado = "pagado"
        
        db.commit()
        return {"mensaje": f"Cuota {cuota.numero_cuota} pagada con éxito"}