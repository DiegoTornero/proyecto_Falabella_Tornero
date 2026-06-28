import sys
import os
from datetime import datetime

# Agregar core-backend al path para importar modelos y base de datos
sys.path.append(os.path.join(os.path.dirname(__file__), "core-backend"))

from app.database import engine, Base, SessionLocal
from app.models.models import PowerBIResumenCartera, PowerBIDetalleMora, Credito, Empresa

print("Creando tablas en la base de datos PostgreSQL (si no existen)...")
Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    print("Limpiando registros antiguos de las tablas BI...")
    db.query(PowerBIResumenCartera).delete()
    db.query(PowerBIDetalleMora).delete()
    db.commit()

    print("Consultando créditos reales del Core Bancario para cuadre perfecto...")
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
    print(f"Total créditos en el Core: {len(creditos)}")

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

    print(f"Insertando {len(lote_resumen)} filas en powerbi_resumen_cartera...")
    db.bulk_save_objects(lote_resumen)
    print(f"Insertando {len(lote_mora)} filas en powerbi_detalle_mora...")
    db.bulk_save_objects(lote_mora)
    db.commit()
    print("¡Sincronización SQL completada con éxito!")
except Exception as e:
    db.rollback()
    print("Error en población:", e)
finally:
    db.close()
