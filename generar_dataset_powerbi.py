import csv
import random
from datetime import datetime, timedelta

# Generador de Datasets Oficiales para Power BI — Banco Falabella Perú
print("Generando datasets estructurados para Power BI...")

# 1. DATASET DE CRÉDITOS Y SCORING
creditos_file = "powerbi_creditos.csv"
with open(creditos_file, mode="w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["ID_Credito", "Tipo_Producto", "Monto_Solicitado", "Monto_Aprobado", "Plazo_Meses", "TEA", "Cuota_Mensual", "Ingreso_Cliente", "Score_Crediticio", "RDS_Porcentaje", "Semaforo", "Ruta_Aprobacion", "Estado", "Fecha_Solicitud"])
    
    productos = ["Crédito Efectivo Personal", "Crédito PYME Micro", "Crédito Vehicular", "Crédito Consumo Preferencial"]
    estados_semaforo = [
        ("verde", "AUTOMATICA", "desembolsado", 14.5, 25.0),
        ("verde", "AUTOMATICA", "aprobado", 16.0, 28.0),
        ("amarillo", "COMITE", "en_revision", 19.5, 38.0),
        ("amarillo", "COMITE", "aprobado", 18.0, 42.0),
        ("rojo", "DENEGADA", "rechazado", 25.0, 52.0),
    ]
    
    base_date = datetime(2026, 1, 15)
    for i in range(1, 151):
        prod = random.choice(productos)
        monto = round(random.uniform(3000, 50000), 2)
        plazo = random.choice([12, 24, 36, 48])
        sem, ruta, est, tea_base, rds_base = random.choice(estados_semaforo)
        
        tea = round(tea_base + random.uniform(-2, 3), 2)
        tem = (1 + tea / 100) ** (1 / 12) - 1
        cuota = round((monto * tem * (1 + tem) ** plazo) / ((1 + tem) ** plazo - 1), 2)
        
        ingreso = round(cuota / (rds_base / 100), 2)
        score = random.randint(720, 850) if sem == "verde" else (random.randint(600, 710) if sem == "amarillo" else random.randint(450, 590))
        monto_aprobado = monto if est in ["desembolsado", "aprobado"] else 0.0
        
        fecha = base_date + timedelta(days=random.randint(0, 160))
        
        writer.writerow([f"CRED-{1000+i}", prod, monto, monto_aprobado, plazo, tea, cuota, ingreso, score, round(rds_base, 2), sem.upper(), ruta, est.upper(), fecha.strftime("%Y-%m-%d")])

# 2. DATASET DE CARTERA Y MOROSIDAD (AGING)
mora_file = "powerbi_morosidad.csv"
with open(mora_file, mode="w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["ID_Mora", "ID_Credito", "Dias_Retraso", "Banda_Morosidad", "Saldo_Deudor", "Tasa_Moratoria", "Estado_Cobranza", "Segmento_Cliente"])
    
    bandas = [
        (15, "Preventiva (1-30 días)", "Alerta SMS/Push"),
        (45, "Temprana (31-60 días)", "Llamada Call Center"),
        (90, "Tardía (61-120 días)", "Cobranza Extrajudicial"),
        (150, "Judicial (121-180 días)", "Proceso Legal"),
        (210, "Castigo (>180 días)", "Pérdida Infocorp")
    ]
    
    for i in range(1, 81):
        dias_base, banda, accion = random.choice(bandas)
        dias = dias_base + random.randint(-10, 15)
        saldo = round(random.uniform(1500, 28000), 2)
        tma = 5.0 if dias <= 60 else 6.5
        seg = random.choice(["Clásico", "Gold", "Platinum", "PYME"])
        
        writer.writerow([f"MORA-{500+i}", f"CRED-{random.randint(1001, 1150)}", dias, banda, saldo, tma, accion, seg])

# 3. DATASET DE EMPRESAS Y FACTURACIÓN (CLIENTES 360)
empresas_file = "powerbi_empresas.csv"
with open(empresas_file, mode="w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["ID_Empresa", "RUC", "Razon_Social", "Sector_Economico", "Tipo_Empresa", "Facturacion_Anual", "Num_Trabajadores", "Credito_Corporativo_Activo"])
    
    sectores = ["Comercio Minorista", "Textil y Confecciones", "Transporte y Logística", "Agroindustria", "Servicios Tecnológicos", "Distribución Mayorista"]
    tipos = ["micro", "pequena", "mediana"]
    
    for i in range(1, 41):
        sec = random.choice(sectores)
        tip = random.choice(tipos)
        fac = round(random.uniform(120000, 3500000), 2)
        trab = random.randint(4, 50)
        cred = round(fac * random.uniform(0.15, 0.30), 2)
        
        writer.writerow([f"EMP-{200+i}", f"20{random.randint(100000000, 999999999)}", f"Empresa Comercial {sec} {i} S.A.C.", sec, tip.upper(), fac, trab, cred])

print("¡Archivos generados exitosamente en tu carpeta de proyecto!")
print("   -> powerbi_creditos.csv (150 registros)")
print("   -> powerbi_morosidad.csv (80 registros)")
print("   -> powerbi_empresas.csv (40 registros)")
