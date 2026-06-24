from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import CuentaAhorro, MovimientoAhorro, Credito, ProductoPasivo
from app.dependencies import get_current_trabajador

router = APIRouter()

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
