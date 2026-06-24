from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import Credito, Usuario, GestionMora, Trabajador, HistorialCredito
from app.dependencies import get_current_trabajador, require_nivel_minimo, ROL_JERARQUIA
from app.schemas.schemas import GestionMoraSchema, TransicionMoraSchema
from app.rules.scoring_rules import BANDAS_MORA, ROL_MINIMO_TRANSICION, calcular_banda_mora

router = APIRouter()


# ─────────────────────────────────────────────────────────────
# R1 — Bandeja de mora con KPIs por banda
# ─────────────────────────────────────────────────────────────
@router.get("/bandeja")
def get_bandeja_mora(
    db: Session = Depends(get_db),
    current: Trabajador = Depends(get_current_trabajador)
):
    """
    R1: Consulta la cartera morosa clasificada por bandas.
    Incluye KPIs: ratio de mora, monto por banda, conteo.
    """
    creditos_mora = (
        db.query(Credito)
        .join(Usuario)
        .filter(Credito.dias_mora > 0)
        .all()
    )

    total_cartera = db.query(func.sum(Credito.monto_aprobado)).filter(
        Credito.monto_aprobado != None,
        Credito.estado.in_(["desembolsado", "en_revision", "aprobado"])
    ).scalar() or 0.0

    total_mora = sum((c.monto_aprobado or c.monto_solicitado) for c in creditos_mora)
    ratio_mora = round((total_mora / total_cartera * 100), 2) if total_cartera > 0 else 0.0

    bandas_resultado = {}
    for b in BANDAS_MORA:
        items = [c for c in creditos_mora if b["min_dias"] <= (c.dias_mora or 0) <= b["max_dias"]]
        bandas_resultado[b["nombre"]] = {
            "label": b["label"],
            "count": len(items),
            "monto_total": round(sum((c.monto_aprobado or c.monto_solicitado) for c in items), 2),
            "creditos": [_format_credito_mora(c) for c in items]
        }

    return {
        "resumen": {
            "total_cartera": round(float(total_cartera), 2),
            "cartera_morosa": round(float(total_mora), 2),
            "ratio_mora_pct": ratio_mora,
            "total_creditos_mora": len(creditos_mora),
        },
        "bandas": bandas_resultado
    }


def _format_credito_mora(c: Credito) -> dict:
    return {
        "id": c.id,
        "usuario_nombre": f"{c.usuario.nombre} {c.usuario.apellido}",
        "usuario_dni": c.usuario.dni,
        "monto": round(float(c.monto_aprobado or c.monto_solicitado), 2),
        "dias_mora": c.dias_mora,
        "banda_mora": c.banda_mora,
        "estado": c.estado,
        "tipo_producto": c.tipo_producto or "personal",
    }


# ─────────────────────────────────────────────────────────────
# R2 — Registrar gestión de cobranza
# ─────────────────────────────────────────────────────────────
@router.post("/gestiones")
def registrar_gestion(
    data: GestionMoraSchema,
    db: Session = Depends(get_db),
    current: Trabajador = Depends(get_current_trabajador)
):
    """
    R2: Registra una gestión de cobranza (llamada, visita, carta, email, sms).
    Accesible a todos los roles autenticados.
    """
    credito = db.query(Credito).filter(Credito.id == data.credito_id).first()
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")

    gestion = GestionMora(
        credito_id=data.credito_id,
        trabajador_id=current.id,
        tipo_gestion=data.tipo_gestion,
        resultado=data.resultado,
        comentario=data.comentario
    )
    db.add(gestion)
    db.commit()
    db.refresh(gestion)

    return {
        "mensaje": f"Gestión de {data.tipo_gestion} registrada correctamente",
        "id": gestion.id,
        "fecha": gestion.fecha_gestion
    }


@router.get("/gestiones/{credito_id}")
def get_gestiones(
    credito_id: str,
    db: Session = Depends(get_db),
    current: Trabajador = Depends(get_current_trabajador)
):
    """R2: Historial de gestiones de cobranza para un crédito."""
    gestiones = (
        db.query(GestionMora)
        .filter(GestionMora.credito_id == credito_id)
        .order_by(GestionMora.fecha_gestion.desc())
        .all()
    )
    return [
        {
            "id": g.id,
            "tipo_gestion": g.tipo_gestion,
            "resultado": g.resultado,
            "comentario": g.comentario,
            "fecha_gestion": g.fecha_gestion,
            "trabajador_nombre": g.trabajador.nombre if g.trabajador else "N/A",
            "trabajador_rol": g.trabajador.rol if g.trabajador else "N/A",
        }
        for g in gestiones
    ]


# ─────────────────────────────────────────────────────────────
# R3 — Transición a Judicial o Castigo
# ─────────────────────────────────────────────────────────────
@router.put("/{credito_id}/transicion")
def transicion_mora(
    credito_id: str,
    data: TransicionMoraSchema,
    db: Session = Depends(get_db),
    current: Trabajador = Depends(get_current_trabajador)
):
    """
    R3: Derivar crédito a judicial (≥121 días, rol: riesgos) o castigo (>180 días, rol: gerencia).
    Valida días de mora y jerarquía de rol. Devuelve 403 si no cumple.
    """
    credito = db.query(Credito).filter(Credito.id == credito_id).first()
    if not credito:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")

    banda_destino = data.banda_destino
    if banda_destino not in ["judicial", "castigo"]:
        raise HTTPException(
            status_code=400,
            detail="Banda destino inválida. Solo se permite: 'judicial' o 'castigo'"
        )

    # ── Validar umbral de días ──
    dias = credito.dias_mora or 0
    if banda_destino == "judicial" and dias < 121:
        raise HTTPException(
            status_code=400,
            detail=f"Para derivar a judicial se requieren ≥121 días de mora. Días actuales: {dias}"
        )
    if banda_destino == "castigo" and dias <= 180:
        raise HTTPException(
            status_code=400,
            detail=f"Para castigar se requieren >180 días de mora. Días actuales: {dias}"
        )

    # ── Validar rol del trabajador ──
    rol_requerido = ROL_MINIMO_TRANSICION[banda_destino]
    jerarquia_actual    = ROL_JERARQUIA.index(current.rol) if current.rol in ROL_JERARQUIA else -1
    jerarquia_requerida = ROL_JERARQUIA.index(rol_requerido)

    if jerarquia_actual < jerarquia_requerida:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Acción DENEGADA. Para derivar a '{banda_destino}' se requiere rol "
                f"'{rol_requerido}' o superior. Su rol actual: '{current.rol}'"
            )
        )

    # ── Ejecutar transición ──
    credito.banda_mora = banda_destino
    if banda_destino == "castigo":
        credito.estado = "castigado"

    historial = HistorialCredito(
        credito_id=credito.id,
        trabajador_id=current.id,
        accion=f"MORA_{banda_destino.upper()}",
        comentario=data.comentario or f"Transición a {banda_destino} por {current.nombre} ({current.rol})"
    )
    db.add(historial)
    db.commit()

    return {
        "mensaje": f"Crédito derivado exitosamente a '{banda_destino}'",
        "credito_id": credito_id,
        "banda_mora": banda_destino,
        "ejecutado_por": current.nombre,
        "rol": current.rol
    }


# ─────────────────────────────────────────────────────────────
# R4 — Motor de Cierre Diario (Mora, Seguros y Membresías)
# ─────────────────────────────────────────────────────────────
from datetime import date
from app.models.models import CronogramaPago

@router.post("/cierre-diario")
def ejecutar_cierre_diario(db: Session = Depends(get_db)):
    """
    Simula el proceso batch nocturno (Cierre de Día).
    1. Aumenta dias_mora para créditos con cuotas vencidas.
    2. Aplica interés moratorio (según tasa_moratoria del producto).
    3. Cobra seguro de desgravamen mensual si aplica.
    """
    hoy = date.today()

    cuotas_vencidas = db.query(CronogramaPago).filter(
        CronogramaPago.estado == "pendiente",
        CronogramaPago.fecha_vencimiento < hoy
    ).all()

    creditos_actualizados = set()

    for cuota in cuotas_vencidas:
        credito = cuota.credito
        if not credito or not credito.producto_activo: continue
        
        # 1. Aumentar días de mora
        dias_retraso = (hoy - cuota.fecha_vencimiento).days
        if dias_retraso > (credito.dias_mora or 0):
            credito.dias_mora = dias_retraso
            credito.banda_mora = calcular_banda_mora(dias_retraso)

        # 2. Aplicar interés moratorio
        tasa_mora_diaria = credito.producto_activo.tasa_moratoria / 100 / 360
        mora_del_dia = cuota.monto_cuota * tasa_mora_diaria
        cuota.mora_acumulada = round((cuota.mora_acumulada or 0) + mora_del_dia, 2)
        
        # 3. Seguro de desgravamen
        if credito.cobra_seguro_desgravamen and (cuota.seguro_desgravamen == 0):
            tope = credito.producto_activo.tope_seguro_desgravamen
            seguro_calc = credito.monto_aprobado * (credito.producto_activo.tasa_seguro_desgravamen / 100)
            cuota.seguro_desgravamen = round(min(seguro_calc, tope), 2)
            
        creditos_actualizados.add(credito.id)
        
    db.commit()

    return {
        "mensaje": "Cierre diario ejecutado con éxito",
        "creditos_procesados": len(creditos_actualizados)
    }

