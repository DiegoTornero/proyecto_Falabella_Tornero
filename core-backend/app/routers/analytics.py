from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import CuentaAhorro, MovimientoAhorro, Credito, ProductoPasivo
from app.dependencies import get_current_trabajador

router = APIRouter()

@router.get("")
@router.get("/")
@router.get("/kpis")
def get_global_kpis(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    # Total de cuentas de ahorro
    total_cuentas = db.query(CuentaAhorro).count()
    
    # Saldo total en el banco
    saldo_total = db.query(func.sum(CuentaAhorro.saldo_actual)).scalar() or 0.0

    # Total de créditos desembolsados
    creditos_desembolsados = db.query(func.sum(Credito.monto_solicitado)).filter(Credito.estado == "desembolsado").scalar() or 0.0

    return {
        "total_cuentas": total_cuentas,
        "saldo_total": saldo_total,
        "creditos_desembolsados": creditos_desembolsados
    }

@router.get("/history")
def get_global_history(limit: int = 50, db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    movimientos = db.query(MovimientoAhorro, CuentaAhorro).join(
        CuentaAhorro, MovimientoAhorro.cuenta_ahorro_id == CuentaAhorro.id
    ).order_by(MovimientoAhorro.fecha_movimiento.desc()).limit(limit).all()

    resultado = []
    for mov, cta in movimientos:
        resultado.append({
            "id": mov.id,
            "tipo": mov.tipo_movimiento,
            "monto": mov.monto,
            "descripcion": mov.descripcion,
            "fecha": mov.fecha_movimiento,
            "cuenta": cta.numero_cuenta,
            "usuario_id": cta.usuario_id
        })
    return resultado

@router.get("/chart-data")
def get_chart_data(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    # Obtener volumen de depósitos y retiros por día de los últimos 7 días
    import datetime
    from sqlalchemy import cast, Date

    hoy = datetime.date.today()
    hace_7_dias = hoy - datetime.timedelta(days=7)

    movimientos = db.query(
        cast(MovimientoAhorro.fecha_movimiento, Date).label("fecha"),
        MovimientoAhorro.tipo_movimiento,
        func.sum(MovimientoAhorro.monto).label("total")
    ).filter(
        cast(MovimientoAhorro.fecha_movimiento, Date) >= hace_7_dias
    ).group_by(
        cast(MovimientoAhorro.fecha_movimiento, Date),
        MovimientoAhorro.tipo_movimiento
    ).all()

    # Formatear datos para recharts
    dias = [(hace_7_dias + datetime.timedelta(days=i)) for i in range(8)]
    chart_data = {str(dia): {"name": str(dia), "ingresos": 0.0, "salidas": 0.0} for dia in dias}

    for fecha, tipo, total in movimientos:
        fecha_str = str(fecha)
        if fecha_str in chart_data:
            if tipo in ["DEPOSITO", "PAGO_INTERES"]:
                chart_data[fecha_str]["ingresos"] += total
            elif tipo in ["RETIRO", "TRANSFERENCIA"]:
                chart_data[fecha_str]["salidas"] += total

    return list(chart_data.values())

@router.get("/credits-by-state")
def get_credits_by_state(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    # Contar créditos por estado
    resultados = db.query(
        Credito.estado,
        func.count(Credito.id).label("cantidad")
    ).group_by(Credito.estado).all()
    
    return [{"name": e.estado.capitalize().replace('_', ' '), "value": e.cantidad} for e in resultados]

@router.get("/mora-bands")
def get_mora_bands(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    # Sumar montos adeudados por banda de mora
    resultados = db.query(
        Credito.banda_mora,
        func.sum(Credito.monto_aprobado).label("total")
    ).filter(Credito.dias_mora > 0).group_by(Credito.banda_mora).all()
    
    # Asegurar el orden: preventiva, temprana, tardia, judicial, castigo
    orden_bandas = ["preventiva", "temprana", "tardia", "judicial", "castigo"]
    dict_resultados = {e.banda_mora: (e.total or 0.0) for e in resultados if e.banda_mora}
    
    final_result = []
    for b in orden_bandas:
        if b in dict_resultados:
            final_result.append({
                "name": b.capitalize(),
                "monto": dict_resultados[b]
            })
            
    return final_result

@router.get("/cartera-activa")
def get_cartera_activa(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    creditos = db.query(Credito).filter(Credito.estado == "desembolsado").all()
    return [
        {
            "id": c.id,
            "tipo_producto": c.tipo_producto,
            "monto_aprobado": c.monto_aprobado,
            "plazo_meses": c.plazo_meses,
            "tasa_interes": c.tasa_interes,
            "dias_mora": c.dias_mora or 0,
            "fecha_desembolso": c.created_at.strftime("%Y-%m-%d") if c.created_at else ""
        } for c in creditos
    ]

@router.get("/creditos-mora")
def get_creditos_mora(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    creditos = db.query(Credito).filter(Credito.dias_mora > 0).all()
    return [
        {
            "id": c.id,
            "tipo_producto": c.tipo_producto,
            "monto_aprobado": c.monto_aprobado,
            "dias_mora": c.dias_mora,
            "banda_mora": c.banda_mora or "preventiva",
            "estado": c.estado
        } for c in creditos
    ]

@router.get("/desembolsos-dia")
def get_desembolsos_dia(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    import datetime
    hoy = datetime.date.today()
    creditos = db.query(Credito).filter(
        func.cast(Credito.created_at, Date) == hoy,
        Credito.estado == "desembolsado"
    ).all()
    return [
        {
            "id": c.id,
            "tipo_producto": c.tipo_producto,
            "monto_aprobado": c.monto_aprobado,
            "tasa_interes": c.tasa_interes,
            "fecha_desembolso": c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else ""
        } for c in creditos
    ]


@router.get("/powerbi-resumen")
def export_powerbi_resumen(db: Session = Depends(get_db)):
    """
    Endpoint oficial de exportación para Power BI - Hoja 1 (Resumen Ejecutivo).
    Consulta directamente la tabla SQL 'powerbi_resumen_cartera' en PostgreSQL.
    """
    from app.models.models import PowerBIResumenCartera
    registros = db.query(PowerBIResumenCartera).all()
    if not registros:
        return {"mensaje": "La tabla SQL está vacía. Ejecuta POST /analytics/poblar-tablas-powerbi para llenarla con miles de registros."}
    return [
        {
            "Fecha": r.fecha, "Año": r.anio, "Mes": r.mes,
            "Oficina": r.oficina, "Zona": r.zona, "Tipo_Producto": r.tipo_producto,
            "Cartera_Total": r.cartera_total, "Cartera_Vigente": r.cartera_vigente,
            "Cartera_Vencida": r.cartera_vencida, "Ratio_Mora": r.ratio_mora,
            "Tasa_Promedio": r.tasa_promedio, "Numero_Clientes": r.numero_clientes,
            "Ticket_Promedio": r.ticket_promedio
        } for r in registros
    ]


@router.get("/powerbi-mora")
def export_powerbi_mora(db: Session = Depends(get_db)):
    """
    Endpoint oficial de exportación para Power BI - Hoja 2 (Análisis de Mora).
    Consulta directamente la tabla SQL 'powerbi_detalle_mora' en PostgreSQL.
    """
    from app.models.models import PowerBIDetalleMora
    registros = db.query(PowerBIDetalleMora).all()
    if not registros:
        return {"mensaje": "La tabla SQL está vacía. Ejecuta POST /analytics/poblar-tablas-powerbi para llenarla con miles de registros."}
    return [
        {
            "Fecha": r.fecha, "Año": r.anio, "Mes": r.mes,
            "Oficina": r.oficina, "Zona": r.zona, "Tipo_Producto": r.tipo_producto,
            "Banda_Morosidad": r.banda_morosidad, "Cartera_Total": r.cartera_total,
            "Vencida": r.vencida, "Ratio_Mora": r.ratio_mora, "Estado": r.estado,
            "Alerta_Prioritaria": r.alerta_prioritaria, "Accion_Recuperacion": r.accion_recuperacion,
            "Clientes_Morosos": r.clientes_morosos
        } for r in registros
    ]


@router.post("/poblar-tablas-powerbi")
def poblar_tablas_sql_powerbi(db: Session = Depends(get_db)):
    """
    Llena las tablas SQL oficiales de Power BI en PostgreSQL estrictamente con los registros reales del Core Bancario.
    Garantiza cuadre matemático perfecto al centavo entre la Hoja 1 y Hoja 2.
    """
    from app.models.models import PowerBIResumenCartera, PowerBIDetalleMora, Credito, Empresa
    from datetime import datetime
    
    # Limpiar tablas previas para repoblar en limpio
    db.query(PowerBIResumenCartera).delete()
    db.query(PowerBIDetalleMora).delete()
    db.commit()

    oficinas_map = {
        "OF. PRINCIPAL": "Zona Lima",
        "AG. LIMA 1": "Zona Lima",
        "AG. LIMA 2": "Zona Lima",
        "AG. SUR 1": "Zona Sur",
        "AG. SUR 2": "Zona Sur",
        "AG. SUR 3": "Zona Sur",
        "AG. NORTE 6": "Zona Norte",
        "AG. ORIENTE 2": "Zona Oriente"
    }

    creditos = db.query(Credito).all()

    def norm_prod(p):
        if not p: return "Crédito PYME Comercial"
        n = p.lower()
        if "personal" in n or "efectivo" in n: return "Crédito Efectivo Personal"
        if "cmr" in n or "tarjeta" in n: return "Tarjeta de Crédito CMR"
        if "vehicular" in n or "auto" in n: return "Crédito Vehicular"
        return "Crédito PYME Comercial"

    def norm_banda(dias, est):
        if not dias or dias == 0:
            if est != "moroso": return "Al día (Sin Mora)"
            dias = 35
        if dias > 180: return "Castigo (>180 días)"
        if dias > 120: return "Judicial (121-180 días)"
        if dias > 60: return "Tardía (61-120 días)"
        if dias > 30: return "Temprana (31-60 días)"
        return "Preventiva (1-30 días)"

    agrupados_h1 = {}
    agrupados_h2 = {}

    for c in creditos:
        emp = c.empresa
        ofi = emp.direccion if emp and emp.direccion in oficinas_map else "OF. PRINCIPAL"
        zona = oficinas_map[ofi]
        f_dt = c.created_at if c.created_at else datetime(2025, 1, 1)
        f_str = f"{f_dt.year}-{f_dt.month:02d}-01"
        prod = norm_prod(c.tipo_producto)
        banda = norm_banda(c.dias_mora, c.estado)
        monto = round(c.monto_aprobado or c.monto_solicitado or 0.0, 2)

        k1 = (f_str, f_dt.year, f"{f_dt.month:02d}", ofi, zona, prod)
        if k1 not in agrupados_h1:
            agrupados_h1[k1] = {"total": 0.0, "vencida": 0.0, "tasas": [], "clientes": 0}
        agrupados_h1[k1]["total"] += monto
        agrupados_h1[k1]["tasas"].append(c.tasa_interes or 25.0)
        agrupados_h1[k1]["clientes"] += 1
        if banda != "Al día (Sin Mora)":
            agrupados_h1[k1]["vencida"] += monto

        k2 = (f_str, f_dt.year, f"{f_dt.month:02d}", ofi, zona, prod, banda)
        if k2 not in agrupados_h2:
            agrupados_h2[k2] = {"total": 0.0, "vencida": 0.0, "morosos": 0}
        agrupados_h2[k2]["total"] += monto
        if banda != "Al día (Sin Mora)":
            agrupados_h2[k2]["vencida"] += monto
            agrupados_h2[k2]["morosos"] += 1

    lote_resumen = []
    for k1 in sorted(agrupados_h1.keys()):
        val = agrupados_h1[k1]
        f_str, anio, mes, ofi, zona, prod = k1
        c_tot = round(val["total"], 2)
        c_venc = round(val["vencida"], 2)
        c_vig = round(c_tot - c_venc, 2)
        ratio_m = round((c_venc / c_tot) * 100, 2) if c_tot > 0 else 0.0
        tasa_p = round(sum(val["tasas"]) / len(val["tasas"]), 2)
        cli = val["clientes"]
        tick = round(c_tot / cli, 2) if cli > 0 else 0.0

        lote_resumen.append(PowerBIResumenCartera(
            fecha=f_str, anio=anio, mes=mes, oficina=ofi, zona=zona,
            tipo_producto=prod, cartera_total=c_tot, cartera_vigente=c_vig,
            cartera_vencida=c_venc, ratio_mora=ratio_m, tasa_promedio=tasa_p,
            numero_clientes=cli, ticket_promedio=tick
        ))

    lote_mora = []
    for k2 in sorted(agrupados_h2.keys()):
        val = agrupados_h2[k2]
        f_str, anio, mes, ofi, zona, prod, banda = k2
        c_tot = round(val["total"], 2)
        c_venc = round(val["vencida"], 2)
        ratio_m = round((c_venc / c_tot) * 100, 2) if c_tot > 0 else 0.0
        est = "Alto" if ratio_m > 10.0 else ("Medio" if ratio_m >= 5.0 else "OK")
        alerta = "Alerta mora alta (>10%)" if ratio_m > 10.0 else ("Supervisión regular (5%-10%)" if ratio_m >= 5.0 else "Mora controlada (<5%)")
        accion = "Proceso Legal/Cobranza" if ratio_m > 10.0 else ("Llamada Call Center" if ratio_m >= 5.0 else "Monitoreo Regular")

        lote_mora.append(PowerBIDetalleMora(
            fecha=f_str, anio=anio, mes=mes, oficina=ofi, zona=zona,
            tipo_producto=prod, banda_morosidad=banda, cartera_total=c_tot,
            vencida=c_venc, ratio_mora=ratio_m, estado=est,
            alerta_prioritaria=alerta, accion_recuperacion=accion,
            clientes_morosos=val["morosos"]
        ))

    db.bulk_save_objects(lote_resumen)
    db.bulk_save_objects(lote_mora)
    db.commit()
    
    return {
        "status": "success",
        "mensaje": f"¡Tablas SQL en PostgreSQL pobladas exitosamente desde el Core! Se guardaron {len(lote_resumen)} registros en powerbi_resumen_cartera y {len(lote_mora)} registros en powerbi_detalle_mora con cuadre perfecto."
    }
