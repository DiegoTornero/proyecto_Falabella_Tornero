from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import Usuario, Credito, Trabajador, HistorialCredito, GestionMora
from app.schemas.schemas import EvaluacionRequest, EvaluacionResponse, AprobarRechazarSchema
from app.rules.scoring_rules import (
    calcular_score, calcular_rds, verificar_elegibilidad,
    evaluar_credito_por_score, calcular_ruta_aprobacion, puede_aprobar
)
from app.dependencies import get_current_trabajador
from datetime import date, datetime, timedelta, timezone

router = APIRouter()


@router.post("/evaluar", response_model=EvaluacionResponse)
def evaluar_solicitud(data: EvaluacionRequest, db: Session = Depends(get_db)):
    """
    Motor de evaluación de crédito:
    1. Verifica elegibilidad del solicitante
    2. Calcula score determinístico
    3. Calcula RDS con semáforo
    4. Determina ruta de aprobación
    5. Actualiza el crédito en BD
    """
    usuario = db.query(Usuario).filter(Usuario.id == data.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # ── Calcular edad ──
    edad = 30
    if usuario.fecha_nacimiento:
        hoy = date.today()
        edad = (hoy.year - usuario.fecha_nacimiento.year
                - ((hoy.month, hoy.day) < (usuario.fecha_nacimiento.month, usuario.fecha_nacimiento.day)))

    # ── Verificar elegibilidad ──
    # Buscar en cuentas_ahorro (estado 'ACTIVA')
    tiene_cuenta_activa = False
    if hasattr(usuario, "cuentas_ahorro") and usuario.cuentas_ahorro:
        tiene_cuenta_activa = any(c.estado == "ACTIVA" for c in usuario.cuentas_ahorro)
    # Si no tiene ninguna, igual le damos elegibilidad (el usuario acaba de registrarse)
    if not tiene_cuenta_activa:
        tiene_cuenta_activa = True  # Por política: permitir solicitar crédito sin cuenta previa

    # Contar rechazos REALES por score en últimos 6 meses (excluye rechazos por inelegibilidad con score=0)
    hace_6_meses = datetime.now(timezone.utc) - timedelta(days=180)
    rechazos_recientes = db.query(func.count(Credito.id)).filter(
        Credito.usuario_id == data.usuario_id,
        Credito.estado.in_(["rechazado"]),
        Credito.score_crediticio > 0,  # Solo rechazos con scoring real
        Credito.created_at >= hace_6_meses
    ).scalar() or 0

    elegibilidad = verificar_elegibilidad(edad, tiene_cuenta_activa, rechazos_recientes)

    credito = db.query(Credito).filter(Credito.id == data.credito_id).first()
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")

    if not elegibilidad["elegible"]:
        credito.estado = "rechazado"
        credito.score_crediticio = 0
        db.commit()
        return EvaluacionResponse(
            credito_id=data.credito_id,
            estado="rechazado",
            monto_aprobado=0.0,
            tasa_interes=0.0,
            score=0,
            motivo=elegibilidad["motivo"],
            elegible=False
        )

    # ── Historial crediticio: negativo solo si hay 2+ rechazos reales ──
    tiene_historial_negativo = rechazos_recientes >= 2

    # ── Scoring ──
    score = calcular_score(edad, data.monto_solicitado, data.plazo_meses, tiene_historial_negativo)

    # ── RDS ──
    ingreso = float(usuario.ingreso_mensual or 3500.0)
    rds_info = calcular_rds(data.monto_solicitado, data.plazo_meses, 18.0, ingreso)

    # ── Evaluación final ──
    tasa_min = credito.producto_activo.tasa_minima if credito.producto_activo else 14.0
    tasa_max = credito.producto_activo.tasa_maxima if credito.producto_activo else 18.0

    estado, monto_aprobado, tasa, motivo = evaluar_credito_por_score(
        score, data.monto_solicitado, rds_info["semaforo"], tasa_min, tasa_max
    )
    ruta = calcular_ruta_aprobacion(data.monto_solicitado)

    # ── Actualizar crédito en BD compartida ──
    credito.estado = estado
    credito.score_crediticio = score
    credito.rds_valor = rds_info["rds"]
    credito.rds_semaforo = rds_info["semaforo"]
    credito.ruta_aprobacion = ruta
    credito.ingreso_cliente = ingreso
    if estado == "aprobado_automatico" or estado == "en_revision":
        credito.monto_aprobado = monto_aprobado
        credito.tasa_interes = tasa
    db.commit()

    return EvaluacionResponse(
        credito_id=data.credito_id,
        estado=estado,
        monto_aprobado=monto_aprobado,
        tasa_interes=tasa,
        score=score,
        motivo=motivo,
        elegible=True,
        rds_porcentaje=rds_info["rds_porcentaje"],
        rds_semaforo=rds_info["semaforo"],
        cuota_mensual=rds_info["cuota_mensual"],
        ruta_aprobacion=ruta
    )


@router.get("/bandeja")
def get_bandeja(db: Session = Depends(get_db)):
    """Bandeja de créditos para analistas del Core. Incluye score y RDS."""
    creditos = (
        db.query(Credito)
        .join(Usuario)
        .order_by(Credito.created_at.desc())
        .all()
    )
    resultado = []
    for c in creditos:
        resultado.append({
            "id": c.id,
            "monto_solicitado": c.monto_solicitado,
            "monto_aprobado": c.monto_aprobado,
            "plazo_meses": c.plazo_meses,
            "tasa_interes": c.tasa_interes,
            "estado": c.estado,
            "tipo_producto": c.tipo_producto or "personal",
            "score_crediticio": c.score_crediticio,
            "rds_valor": c.rds_valor,
            "rds_semaforo": c.rds_semaforo,
            "ruta_aprobacion": c.ruta_aprobacion,
            "created_at": c.created_at,
            "usuario_nombre": f"{c.usuario.nombre} {c.usuario.apellido}",
            "usuario_dni": c.usuario.dni,
            "dias_mora": c.dias_mora,
            "banda_mora": c.banda_mora,
        })
    return resultado


@router.put("/bandeja/{credito_id}")
def actualizar_estado_credito(
    credito_id: str,
    data: AprobarRechazarSchema,
    db: Session = Depends(get_db),
    current: Trabajador = Depends(get_current_trabajador)
):
    """
    Aprueba, rechaza u observa un crédito.
    Valida que el rol del trabajador sea suficiente para el monto.
    """
    credito = db.query(Credito).filter(Credito.id == credito_id).first()
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")

    if data.estado not in ["aprobado", "rechazado", "observado"]:
        raise HTTPException(status_code=400, detail="Estado inválido. Use: aprobado, rechazado, observado")

    # ── RBAC por monto ──
    if data.estado == "aprobado":
        if not puede_aprobar(current.rol, credito.monto_solicitado):
            ruta = calcular_ruta_aprobacion(credito.monto_solicitado)
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Monto S/ {credito.monto_solicitado:,.2f} requiere aprobación de '{ruta}' o superior. "
                    f"Su rol '{current.rol}' no tiene autorización."
                )
            )

    credito.estado = data.estado
    credito.trabajador_asignado_id = current.id

    if data.estado == "aprobado":
        credito.monto_aprobado = credito.monto_solicitado
        tasa_min = credito.producto_activo.tasa_minima if credito.producto_activo else 14.0
        tasa_max = credito.producto_activo.tasa_maxima if credito.producto_activo else 18.0
        factor = max(0, min(1, (650 - (credito.score_crediticio or 500)) / 150))
        credito.tasa_interes = round(tasa_min + (tasa_max - tasa_min) * factor, 2) if credito.rds_semaforo != "rojo" else tasa_max

        # ── Desembolso: acreditar en cuenta del cliente ──
        from sqlalchemy import text
        import uuid as _uuid
        cuenta = db.execute(
            text("SELECT id, saldo_actual FROM cuentas_ahorro WHERE usuario_id = :uid AND estado = 'ACTIVA' LIMIT 1"),
            {"uid": credito.usuario_id}
        ).fetchone()
        if cuenta:
            nuevo_saldo = float(cuenta[1]) + float(credito.monto_aprobado)
            db.execute(text("UPDATE cuentas_ahorro SET saldo_actual = :s WHERE id = :cid"), {"s": nuevo_saldo, "cid": cuenta[0]})
            db.execute(
                text("INSERT INTO movimientos_ahorro (cuenta_ahorro_id, tipo_movimiento, monto, saldo_resultante, descripcion, fecha_movimiento) "
                     "VALUES (:cid, 'DEPOSITO', :monto, :s, 'Desembolso de Crédito Aprobado', NOW())"),
                {"cid": cuenta[0], "monto": credito.monto_aprobado, "s": nuevo_saldo}
            )

    historial = HistorialCredito(
        credito_id=credito.id,
        trabajador_id=current.id,
        accion=data.estado.upper(),
        comentario=data.comentario or "Sin comentarios adicionales"
    )
    db.add(historial)
    db.commit()

    return {
        "mensaje": f"Crédito {data.estado} exitosamente",
        "aprobado_por": current.nombre,
        "rol": current.rol
    }
