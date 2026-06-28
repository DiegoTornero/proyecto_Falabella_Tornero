import csv
import random
from datetime import datetime

# Generador Exhaustivo y Completo de Datasets Oficiales para Power BI — Banco Falabella Perú
# Genera miles de registros transaccionales y mensuales por oficina, zona, producto y banda de mora.
print("Generando datasets completos y altamente granulares para Power BI...")

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

# 1. DATASET COMPLETO DE RESUMEN EJECUTIVO Y CARTERA FINANCIERA (HOJA 1)
cartera_file = "powerbi_resumen_cartera.csv"
filas_cartera = 0
with open(cartera_file, mode="w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Fecha", "Año", "Mes", "Oficina", "Zona", "Tipo_Producto", "Cartera_Total", "Cartera_Vigente", "Cartera_Vencida", "Ratio_Mora", "Tasa_Promedio", "Numero_Clientes", "Ticket_Promedio"])
    
    start_year = 2018
    for year in range(start_year, 2027):
        for month in range(1, 13):
            if year == 2026 and month > 6:
                break
            fecha_str = f"{year}-{month:02d}-01"
            factor_crecimiento = 1 + ((year - start_year) * 0.12) + (month * 0.01)
            
            for ofi, zona, base_cart, base_mora, base_tasa in oficinas_data:
                variacion_ofi = random.uniform(0.95, 1.05)
                cart_ofi_total = base_cart * factor_crecimiento * variacion_ofi
                
                # Desglosar por producto para permitir filtros (Slicers) en Power BI
                for prod_nombre, prod_peso, prod_tasa in productos:
                    cart_prod = round(cart_ofi_total * prod_peso * random.uniform(0.9, 1.1), 2)
                    ratio_m = round(base_mora * random.uniform(0.85, 1.15) * (1.2 if "CMR" in prod_nombre else 0.9), 2)
                    cart_vencida = round(cart_prod * (ratio_m / 100), 2)
                    cart_vigente = round(cart_prod - cart_vencida, 2)
                    tasa = round(prod_tasa + random.uniform(-2.0, 2.0), 2)
                    num_clientes = int(cart_prod / random.uniform(8000, 15000))
                    ticket = round(cart_prod / num_clientes, 2) if num_clientes > 0 else 0
                    
                    writer.writerow([fecha_str, year, f"{month:02d}", ofi, zona, prod_nombre, cart_prod, cart_vigente, cart_vencida, ratio_m, tasa, num_clientes, ticket])
                    filas_cartera += 1

# 2. DATASET COMPLETO Y DETALLADO DE ANÁLISIS DE MORA (HOJA 2)
mora_file = "powerbi_detalle_mora.csv"
filas_mora = 0
with open(mora_file, mode="w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Fecha", "Año", "Mes", "Oficina", "Zona", "Tipo_Producto", "Banda_Morosidad", "Cartera_Total", "Vencida", "Ratio_Mora", "Estado", "Alerta_Prioritaria", "Accion_Recuperacion", "Clientes_Morosos"])
    
    for year in range(2020, 2027):
        for month in range(1, 13):
            if year == 2026 and month > 6:
                break
            fecha_str = f"{year}-{month:02d}-01"
            
            for ofi, zona, base_cart, base_mora, _ in oficinas_data:
                factor = 1 + ((year - 2020) * 0.1)
                cart_total_ofi = base_cart * factor * random.uniform(0.97, 1.03)
                
                for prod_nombre, prod_peso, _ in productos:
                    cart_prod = cart_total_ofi * prod_peso
                    ratio_m_real = round(base_mora * random.uniform(0.9, 1.1), 2)
                    mora_total_prod = cart_prod * (ratio_m_real / 100)
                    
                    # Distribuir la mora en las 5 bandas de envejecimiento (Aging)
                    for banda_nombre, banda_peso, accion in bandas_mora:
                        vencida_banda = round(mora_total_prod * banda_peso * random.uniform(0.9, 1.1), 2)
                        ratio_banda = round((vencida_banda / cart_prod) * 100, 2) if cart_prod > 0 else 0
                        
                        if ratio_m_real > 10.0:
                            estado = "Alto"
                            alerta = "Alerta mora alta (>10%)"
                        elif ratio_m_real >= 5.0:
                            estado = "Medio"
                            alerta = "Supervisión regular (5%-10%)"
                        else:
                            estado = "OK"
                            alerta = "Mora controlada (<5%)"
                            
                        clientes_m = max(1, int(vencida_banda / random.uniform(3000, 7000)))
                        
                        writer.writerow([fecha_str, year, f"{month:02d}", ofi, zona, prod_nombre, banda_nombre, round(cart_prod, 2), vencida_banda, ratio_m_real, estado, alerta, accion, clientes_m])
                        filas_mora += 1

print(f"¡Datasets generados con total éxito y máxima granularidad!")
print(f"   -> powerbi_resumen_cartera.csv ({filas_cartera} registros históricos por fecha y producto)")
print(f"   -> powerbi_detalle_mora.csv ({filas_mora} registros detallados por banda de mora y oficina)")
