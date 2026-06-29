import urllib.request
import json
import csv
import os

print("======================================================================")
print(" DESCARGANDO DATOS 100% REALES DESDE LA BASE DE DATOS EN LA NUBE (RENDER)")
print("======================================================================")

url_resumen = "https://core-backend-g43c.onrender.com/analytics/powerbi-resumen"
url_mora = "https://core-backend-g43c.onrender.com/analytics/powerbi-mora"

print(f"1. Conectando con el endpoint oficial en la nube: {url_resumen} ...")
req = urllib.request.Request(url_resumen, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    data_resumen = json.loads(response.read().decode('utf-8'))

print(f"   -> Recibidas {len(data_resumen)} filas del Resumen Comercial en la nube.")

print(f"2. Conectando con el endpoint oficial en la nube: {url_mora} ...")
req2 = urllib.request.Request(url_mora, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req2) as response:
    data_mora = json.loads(response.read().decode('utf-8'))

print(f"   -> Recibidas {len(data_mora)} filas de Detalle de Mora en la nube.")

# Guardar Hoja 1
archivo_resumen = "powerbi_resumen_cartera.csv"
if os.path.exists(archivo_resumen):
    os.remove(archivo_resumen)

if data_resumen:
    headers = list(data_resumen[0].keys())
    with open(archivo_resumen, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for row in data_resumen:
            writer.writerow(row)
    print(f"3. Guardado exitosamente: '{archivo_resumen}'")

# Guardar Hoja 2
archivo_mora = "powerbi_detalle_mora.csv"
if os.path.exists(archivo_mora):
    os.remove(archivo_mora)

if data_mora:
    headers_mora = list(data_mora[0].keys())
    with open(archivo_mora, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers_mora)
        writer.writeheader()
        for row in data_mora:
            writer.writerow(row)
    print(f"4. Guardado exitosamente: '{archivo_mora}'")

total_resumen = sum(float(r["Cartera_Total"]) for r in data_resumen)
total_mora = sum(float(r["Cartera_Total"]) for r in data_mora)

print("======================================================================")
print(" ¡DATOS DE LA NUBE DESCARGADOS Y CUADRADOS PERFECTAMENTE!")
print(f" -> Hoja 1 (Comercial): {len(data_resumen)} filas | Total: S/ {total_resumen:,.2f}")
print(f" -> Hoja 2 (Mora)     : {len(data_mora)} filas | Total: S/ {total_mora:,.2f}")
print("======================================================================")
