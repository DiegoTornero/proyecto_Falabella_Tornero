from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import Usuario, Credito, Trabajador, HistorialCredito, GestionMora, Empresa, ProductoActivo
from app.schemas.schemas import EvaluacionRequest, EvaluacionResponse, AprobarRechazarSchema
from app.rules.scoring_rules import (
    calcular_score, calcular_rds, verificar_elegibilidad,
    evaluar_credito_por_score, calcular_ruta_aprobacion, puede_aprobar
)
from app.dependencies import get_current_trabajador
from datetime import date, datetime, timedelta, timezone
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


# ─── Schema solo para evaluación empresarial ──────────────────────────────────
class EvaluacionEmpresarialRequest(BaseModel):
    empresa_id: str
    credito_id: str
    monto_solicitado: float
    plazo_meses: int
    cobra_seguro_desgravamen: bool = True


@router.post("/evaluar-empresarial")
def evaluar_empresarial(data: EvaluacionEmpresarialRequest, db: Session = Depends(get_db)):
    """
    Motor de scoring para Crédito Empresarial – Micro Micro.
    Usa facturación anual como referencia de ingresos.
    TEA 40.92% con seguro / 43.92% sin seguro. Cuota fija (sistema francés).
    """
    empresa = db.query(Empresa).filter(Empresa.id == data.empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    credito = db.query(Credito).filter(Credito.id == data.credito_id).first()
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")

    producto = db.query(ProductoActivo).filter(ProductoActivo.codigo == "EMP-MICRO").first()
    if not producto:
        raise HTTPException(status_code=500, detail="Producto EMP-MICRO no configurado")

    # TEA según seguro
    tea = producto.tasa_minima if data.cobra_seguro_desgravamen else producto.tasa_maxima

    # Ingreso mensual estimado = facturación anual / 12
    ingreso_mensual = (empresa.facturacion_anual or 0.0) / 12

    # Score basado en facturación y tamaño de empresa
    score = _calcular_score_empresarial(empresa, data.monto_solicitado, data.plazo_meses)

    # RDS con tea real
    rds_info = calcular_rds(data.monto_solicitado, data.plazo_meses, tea, ingreso_mensual)

    # Cuota fija sistema francés
    cuota = _cuota_fija(data.monto_solicitado, tea, data.plazo_meses)

    # Evaluación final
    ruta = calcular_ruta_aprobacion(data.monto_solicitado)
    if score >= 600 and rds_info["semaforo"] in ("verde", "amarillo"):
        estado = "en_revision"
        monto_aprobado = data.monto_solicitado
        motivo = f"Score empresarial: {score}/1000. RDS: {rds_info['semaforo']}. Requiere revisión de {ruta}."
    elif score >= 450:
        estado = "en_revision"
        monto_aprobado = 0.0
        motivo = f"Score moderado: {score}/1000. Requiere análisis adicional."
    else:
        estado = "rechazado"
        monto_aprobado = 0.0
        motivo = f"Score insuficiente: {score}/1000. Facturación o historial no cumplen los criterios."

    # Actualizar crédito
    credito.estado = estado
    credito.score_crediticio = score
    credito.rds_valor = rds_info["rds"]
    credito.rds_semaforo = rds_info["semaforo"]
    credito.ruta_aprobacion = ruta
    credito.ingreso_cliente = ingreso_mensual
    credito.tasa_interes = tea
    credito.cobra_seguro_desgravamen = data.cobra_seguro_desgravamen
    if monto_aprobado > 0:
        credito.monto_aprobado = monto_aprobado
    db.commit()

    return {
        "credito_id": data.credito_id,
        "estado": estado,
        "score": score,
        "monto_aprobado": monto_aprobado,
        "tasa_interes": tea,
        "seguro_desgravamen": data.cobra_seguro_desgravamen,
        "cuota_mensual": round(cuota, 2),
        "rds_porcentaje": rds_info["rds_porcentaje"],
        "rds_semaforo": rds_info["semaforo"],
        "ruta_aprobacion": ruta,
        "motivo": motivo,
        "elegible": estado != "rechazado",
    }



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
        .outerjoin(Usuario, Credito.usuario_id == Usuario.id)
        .order_by(Credito.created_at.desc())
        .all()
    )
    hubo_cambios = False
    for c in creditos:
        if c.score_crediticio is None or c.rds_semaforo is None or c.ruta_aprobacion is None:
            edad = 30
            ingreso = 3500.0
            if c.usuario:
                ingreso = float(c.usuario.ingreso_mensual or 3500.0)
                if c.usuario.fecha_nacimiento:
                    hoy = date.today()
                    edad = hoy.year - c.usuario.fecha_nacimiento.year
            score = calcular_score(edad, c.monto_solicitado or 1000, c.plazo_meses or 12, False)
            rds_info = calcular_rds(c.monto_solicitado or 1000, c.plazo_meses or 12, 18.0, ingreso)
            ruta = calcular_ruta_aprobacion(c.monto_solicitado or 1000)
            
            if c.score_crediticio is None: c.score_crediticio = score
            if c.rds_valor is None: c.rds_valor = rds_info["rds"]
            if c.rds_semaforo is None: c.rds_semaforo = rds_info["semaforo"]
            if c.ruta_aprobacion is None: c.ruta_aprobacion = ruta
            hubo_cambios = True

    if hubo_cambios:
        db.commit()

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
            "usuario_nombre": f"{c.usuario.nombre} {c.usuario.apellido}" if c.usuario else (c.empresa.razon_social if c.empresa else "—"),
            "usuario_dni": c.usuario.dni if c.usuario else (f"RUC: {c.empresa.ruc}" if c.empresa else "—"),
            "dias_mora": c.dias_mora,
            "banda_mora": c.banda_mora,
            "empresa_id": c.empresa_id,
            "cobra_seguro_desgravamen": c.cobra_seguro_desgravamen,
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
        if credito.tipo_producto == "empresarial_micro":
            tasa_min = credito.producto_activo.tasa_minima if credito.producto_activo else 40.92
            tasa_max = credito.producto_activo.tasa_maxima if credito.producto_activo else 43.92
            credito.tasa_interes = tasa_min if credito.cobra_seguro_desgravamen else tasa_max
        else:
            tasa_min = credito.producto_activo.tasa_minima if credito.producto_activo else 14.0
            tasa_max = credito.producto_activo.tasa_maxima if credito.producto_activo else 18.0
            factor = max(0, min(1, (650 - (credito.score_crediticio or 500)) / 150))
            credito.tasa_interes = round(tasa_min + (tasa_max - tasa_min) * factor, 2) if credito.rds_semaforo != "rojo" else tasa_max

        # Guardar fecha de desembolso si fue ingresada por el analista
        if data.fecha_desembolso:
            try:
                # Convert YYYY-MM-DD to datetime object
                from datetime import datetime as dt_class, time
                parsed_date = date.fromisoformat(data.fecha_desembolso)
                credito.created_at = dt_class.combine(parsed_date, time.min)
            except Exception as e:
                print(f"Error parsing custom fecha_desembolso: {e}")

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


# ─── HELPERS EMPRESARIALES ────────────────────────────────────────────────────

def _calcular_score_empresarial(empresa, monto: float, plazo: int) -> int:
    """
    Score para Crédito Empresarial Micro.
    Basado en facturación anual, número de trabajadores y relación monto/facturación.
    """
    score = 500

    facturacion = empresa.facturacion_anual or 0.0

    # Factor facturación anual
    if facturacion >= 1_500_000:
        score += 150
    elif facturacion >= 800_000:
        score += 100
    elif facturacion >= 400_000:
        score += 50
    elif facturacion >= 100_000:
        score += 0
    else:
        score -= 100

    # Factor: relación monto / facturación (no pedir más del 30% de facturación)
    if facturacion > 0:
        ratio = monto / facturacion
        if ratio <= 0.10:
            score += 100
        elif ratio <= 0.20:
            score += 50
        elif ratio <= 0.30:
            score += 0
        elif ratio <= 0.50:
            score -= 50
        else:
            score -= 150

    # Factor trabajadores
    trabajadores = empresa.num_trabajadores or 1
    if trabajadores >= 10:
        score += 80
    elif trabajadores >= 5:
        score += 40
    elif trabajadores >= 2:
        score += 10

    # Factor plazo
    if plazo <= 12:
        score += 50
    elif plazo <= 24:
        score += 20
    elif plazo <= 36:
        score -= 20
    else:
        score -= 60

    return max(0, min(1000, score))


def _cuota_fija(monto: float, tea: float, plazo: int) -> float:
    """Sistema francés: todas las cuotas son iguales."""
    i = (1 + tea / 100) ** (1 / 12) - 1
    if i == 0 or plazo == 0:
        return monto / max(plazo, 1)
    return (monto * i * (1 + i) ** plazo) / ((1 + i) ** plazo - 1)
