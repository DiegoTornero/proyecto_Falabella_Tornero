import csv
import random
from datetime import datetime

# Generador de Datasets Oficiales para Power BI — Banco Falabella Perú
# Diseñado específicamente para el reporte dark-theme en 2 Hojas (Resumen Ejecutivo & Análisis de Mora)
print("Generando datasets estructurados para Power BI (Enfoques: Resumen Ejecutivo y Mora)...")

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

# 1. DATASET DE RESUMEN EJECUTIVO Y EVOLUCIÓN HISTÓRICA (HOJA 1)
cartera_file = "powerbi_resumen_cartera.csv"
with open(cartera_file, mode="w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Fecha", "Año", "Mes", "Oficina", "Zona", "Cartera_Total", "Cartera_Vigente", "Cartera_Vencida", "Ratio_Mora", "Tasa_Promedio"])
    
    start_year = 2018
    for year in range(start_year, 2027):
        for month in range(1, 13):
            if year == 2026 and month > 6:
                break
            fecha_str = f"{year}-{month:02d}-01"
            factor_crecimiento = 1 + ((year - start_year) * 0.12) + (month * 0.01)
            
            for ofi, zona, base_cart, base_mora, base_tasa in oficinas_data:
                variacion = random.uniform(0.95, 1.05)
                cart_total = round(base_cart * factor_crecimiento * variacion, 2)
                ratio_m = round(base_mora * random.uniform(0.9, 1.1), 2)
                cart_vencida = round(cart_total * (ratio_m / 100), 2)
                cart_vigente = round(cart_total - cart_vencida, 2)
                tasa = round(base_tasa + random.uniform(-1.5, 1.5), 2)
                
                writer.writerow([fecha_str, year, f"{month:02d}", ofi, zona, cart_total, cart_vigente, cart_vencida, ratio_m, tasa])

# 2. DATASET DETALLE DE MORA POR OFICINA Y ZONA (HOJA 2)
mora_file = "powerbi_detalle_mora.csv"
with open(mora_file, mode="w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Oficina", "Zona", "Cartera_Total", "Vencida", "Ratio_Mora", "Estado", "Alerta_Prioritaria"])
    
    for ofi, zona, base_cart, ratio_m, _ in oficinas_data:
        cart_total = round(base_cart * random.uniform(0.98, 1.02), 2)
        vencida = round(cart_total * (ratio_m / 100), 2)
        
        if ratio_m > 10.0:
            estado = "Alto"
            alerta = "Alerta mora alta (>10%)"
        elif ratio_m >= 5.0:
            estado = "Medio"
            alerta = "Supervisión regular (5%-10%)"
        else:
            estado = "OK"
            alerta = "Mora controlada (<5%)"
            
        writer.writerow([ofi, zona, cart_total, vencida, ratio_m, estado, alerta])

print("¡Datasets especializados generados con éxito!")
print("   -> powerbi_resumen_cartera.csv (Listo para Hoja 1: Resumen Ejecutivo)")
print("   -> powerbi_detalle_mora.csv (Listo para Hoja 2: Análisis de Mora)")
