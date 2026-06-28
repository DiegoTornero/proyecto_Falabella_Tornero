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
    Llena las tablas SQL oficiales de Power BI en PostgreSQL con miles de registros históricos y detallados.
    Queda registrado como prueba de auditoría e informe universitario en la base de datos.
    """
    import random
    from app.models.models import PowerBIResumenCartera, PowerBIDetalleMora
    
    # Limpiar tablas previas para repoblar en limpio
    db.query(PowerBIResumenCartera).delete()
    db.query(PowerBIDetalleMora).delete()
    db.commit()

    oficinas_data = [
        ("OF. PRINCIPAL", "Zona Lima", 22100000, 6.2, 28.5),
        ("AG. LIMA 1", "Zona Lima", 18200000, 3.8, 32.4),
        ("AG. LIMA 2", "Zona Lima", 16100000, 4.5, 31.0),
        ("AG. SUR 1", "Zona Sur", 13300000, 7.1, 21.2),
        ("AG. SUR 2", "Zona Sur", 11400000, 8.5, 22.0),
        ("AG. SUR 3", "Zona Sur", 9200000, 10.2, 23.5),
        ("AG. NORTE 6", "Zona Norte", 6400000, 8.7, 28.1),
        ("AG. ORIENTE 2", "Zona Oriente", 7800000, 11.8, 24.6)
    ]
    productos = [
        ("Crédito Efectivo Personal", 0.40, 26.5),
        ("Crédito PYME Comercial", 0.30, 22.0),
        ("Tarjeta de Crédito CMR", 0.20, 35.0),
        ("Crédito Vehicular", 0.10, 16.5)
    ]
    bandas_mora = [
        ("Preventiva (1-30 días)", 0.45, "Alerta SMS/Push"),
        ("Temprana (31-60 días)", 0.25, "Llamada Call Center"),
        ("Tardía (61-120 días)", 0.15, "Cobranza Extrajudicial"),
        ("Judicial (121-180 días)", 0.10, "Proceso Legal"),
        ("Castigo (>180 días)", 0.05, "Pérdida Infocorp")
    ]

    lote_resumen = []
    start_year = 2023  # Últimos 3 años para optimizar velocidad de inserción en SQL
    for year in range(start_year, 2027):
        for month in range(1, 13):
            if year == 2026 and month > 6: break
            fecha_str = f"{year}-{month:02d}-01"
            factor = 1 + ((year - start_year) * 0.12) + (month * 0.01)
            
            for ofi, zona, base_cart, base_mora, base_tasa in oficinas_data:
                cart_ofi = base_cart * factor * random.uniform(0.95, 1.05)
                for prod_nom, prod_peso, prod_tasa in productos:
                    c_prod = round(cart_ofi * prod_peso * random.uniform(0.9, 1.1), 2)
                    r_mora = round(base_mora * random.uniform(0.85, 1.15), 2)
                    c_venc = round(c_prod * (r_mora / 100), 2)
                    c_vig = round(c_prod - c_venc, 2)
                    tasa = round(prod_tasa + random.uniform(-2.0, 2.0), 2)
                    cli = int(c_prod / random.uniform(8000, 15000))
                    
                    lote_resumen.append(PowerBIResumenCartera(
                        fecha=fecha_str, anio=year, mes=f"{month:02d}",
                        oficina=ofi, zona=zona, tipo_producto=prod_nom,
                        cartera_total=c_prod, cartera_vigente=c_vig, cartera_vencida=c_venc,
                        ratio_mora=r_mora, tasa_promedio=tasa, numero_clientes=cli,
                        ticket_promedio=round(c_prod/cli, 2) if cli > 0 else 0
                    ))

    lote_mora = []
    for year in range(2024, 2027):
        for month in range(1, 13):
            if year == 2026 and month > 6: break
            fecha_str = f"{year}-{month:02d}-01"
            for ofi, zona, base_cart, base_mora, _ in oficinas_data:
                cart_ofi = base_cart * (1 + (year-2024)*0.1) * random.uniform(0.97, 1.03)
                for prod_nom, prod_peso, _ in productos:
                    c_prod = cart_ofi * prod_peso
                    r_mora = round(base_mora * random.uniform(0.9, 1.1), 2)
                    mora_tot = c_prod * (r_mora / 100)
                    for b_nom, b_peso, accion in bandas_mora:
                        venc = round(mora_tot * b_peso * random.uniform(0.9, 1.1), 2)
                        est = "Alto" if r_mora > 10.0 else ("Medio" if r_mora >= 5.0 else "OK")
                        alerta = "Alerta mora alta (>10%)" if r_mora > 10.0 else ("Supervisión regular (5%-10%)" if r_mora >= 5.0 else "Mora controlada (<5%)")
                        lote_mora.append(PowerBIDetalleMora(
                            fecha=fecha_str, anio=year, mes=f"{month:02d}",
                            oficina=ofi, zona=zona, tipo_producto=prod_nom,
                            banda_morosidad=b_nom, cartera_total=round(c_prod, 2),
                            vencida=venc, ratio_mora=r_mora, estado=est,
                            alerta_prioritaria=alerta, accion_recuperacion=accion,
                            clientes_morosos=max(1, int(venc / random.uniform(3000, 7000)))
                        ))

    db.bulk_save_objects(lote_resumen)
    db.bulk_save_objects(lote_mora)
    db.commit()
    
    return {
        "status": "success",
        "mensaje": f"¡Tablas SQL en PostgreSQL pobladas exitosamente! Se guardaron {len(lote_resumen)} registros en powerbi_resumen_cartera y {len(lote_mora)} registros en powerbi_detalle_mora como prueba de auditoría e informe."
    }
