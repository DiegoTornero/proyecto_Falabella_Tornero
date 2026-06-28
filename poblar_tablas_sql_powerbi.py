import sys
import os

# Agregar core-backend al path para importar modelos y base de datos
sys.path.append(os.path.join(os.path.dirname(__file__), "core-backend"))

from app.database import engine, Base, SessionLocal
from app.models.models import PowerBIResumenCartera, PowerBIDetalleMora
import random

print("Creando tablas en la base de datos PostgreSQL (si no existen)...")
Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    print("Limpiando registros antiguos de las tablas BI...")
    db.query(PowerBIResumenCartera).delete()
    db.query(PowerBIDetalleMora).delete()
    db.commit()

    print("Generando miles de registros para insertar en las tablas SQL oficiales...")
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
    start_year = 2023
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

    print(f"Insertando {len(lote_resumen)} filas en powerbi_resumen_cartera...")
    db.bulk_save_objects(lote_resumen)
    print(f"Insertando {len(lote_mora)} filas en powerbi_detalle_mora...")
    db.bulk_save_objects(lote_mora)
    db.commit()
    print("¡Población SQL completada y verificada exitosamente en la base de datos!")
except Exception as e:
    db.rollback()
    print("Error al poblar BD:", e)
finally:
    db.close()
