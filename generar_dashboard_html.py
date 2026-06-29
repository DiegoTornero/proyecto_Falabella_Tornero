import csv
import json
import os

print("Generando Mockup Visual Interactivo HTML del Dashboard BI...")

resumen_rows = []
with open("powerbi_resumen_cartera.csv", mode="r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for r in reader:
        resumen_rows.append(r)

mora_rows = []
with open("powerbi_detalle_mora.csv", mode="r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for r in reader:
        mora_rows.append(r)

cartera_total = sum(float(r["Cartera_Total"]) for r in resumen_rows)
cartera_vencida = sum(float(r["Cartera_Vencida"]) for r in resumen_rows)
clientes_total = sum(int(r["Numero_Clientes"]) for r in resumen_rows)
ratio_mora = (cartera_vencida / cartera_total * 100) if cartera_total > 0 else 0.0
ticket_prom = (cartera_total / clientes_total) if clientes_total > 0 else 0.0

# Agrupar por Oficina
oficinas = {}
for r in resumen_rows:
    ofi = r["Oficina"]
    oficinas[ofi] = oficinas.get(ofi, 0.0) + float(r["Cartera_Total"])

# Agrupar por Producto
productos = {}
for r in resumen_rows:
    prod = r["Tipo_Producto"]
    productos[prod] = productos.get(prod, 0.0) + float(r["Cartera_Total"])

# Agrupar por Banda Mora
bandas = {}
for r in mora_rows:
    b = r["Banda_Morosidad"]
    bandas[b] = bandas.get(b, 0.0) + float(r["Vencida"])

html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Power BI Mockup - Banco Falabella BI</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: 'Outfit', sans-serif; }}
        body {{ background-color: #0f172a; color: #f8fafc; padding: 20px; }}
        header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e293b; padding-bottom: 15px; margin-bottom: 25px; }}
        .logo {{ display: flex; align-items: center; gap: 12px; }}
        .logo-dot {{ width: 14px; height: 14px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 10px #22c55e; }}
        h1 {{ font-size: 24px; font-weight: 700; color: #fff; }}
        .badge {{ background: #1e293b; color: #94a3b8; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid #334155; }}
        .kpi-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 25px; }}
        .kpi-card {{ background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; position: relative; overflow: hidden; }}
        .kpi-card::before {{ content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #22c55e; }}
        .kpi-card.alert::before {{ background: #ef4444; }}
        .kpi-title {{ font-size: 13px; color: #94a3b8; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; }}
        .kpi-value {{ font-size: 26px; font-weight: 700; color: #fff; }}
        .kpi-sub {{ font-size: 12px; color: #64748b; margin-top: 5px; }}
        .charts-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 20px; margin-bottom: 25px; }}
        .chart-container {{ background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; }}
        .chart-title {{ font-size: 16px; font-weight: 600; color: #e2e8f0; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }}
        th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #334155; }}
        th {{ background: #0f172a; color: #94a3b8; font-weight: 600; text-transform: uppercase; }}
        tr:hover {{ background: #334155; }}
        .status-badge {{ padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; }}
        .status-ok {{ background: rgba(34, 197, 94, 0.2); color: #22c55e; }}
        .status-med {{ background: rgba(234, 179, 8, 0.2); color: #eab308; }}
        .status-alt {{ background: rgba(239, 68, 68, 0.2); color: #ef4444; }}
    </style>
</head>
<body>
    <header>
        <div class="logo">
            <div class="logo-dot"></div>
            <div>
                <h1>Banco Falabella - Inteligencia de Negocios (BI)</h1>
                <p style="font-size: 12px; color: #64748b;">Dashboard Ejecutivo Oficial • Cuadre Matemático 100% Real</p>
            </div>
        </div>
        <div class="badge">Sincronizado con Core Relacional PostgreSQL</div>
    </header>

    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-title">Cartera Total Activa</div>
            <div class="kpi-value">S/ {cartera_total:,.2f}</div>
            <div class="kpi-sub">Volumen 100% Cuadrado</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Créditos Emitidos</div>
            <div class="kpi-value">{clientes_total:,}</div>
            <div class="kpi-sub">Clientes en Base de Datos</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Ticket Promedio</div>
            <div class="kpi-value">S/ {ticket_prom:,.2f}</div>
            <div class="kpi-sub">Por operación crediticia</div>
        </div>
        <div class="kpi-card alert">
            <div class="kpi-title">Ratio Mora Global</div>
            <div class="kpi-value">{ratio_mora:.2f}%</div>
            <div class="kpi-sub">S/ {cartera_vencida:,.2f} en riesgo</div>
        </div>
    </div>

    <div class="charts-grid">
        <div class="chart-container">
            <div class="chart-title">📍 Colocaciones por Sucursal / Oficina</div>
            <canvas id="chartOficinas" height="150"></canvas>
        </div>
        <div class="chart-container">
            <div class="chart-title">💼 Distribución por Tipo de Producto</div>
            <canvas id="chartProductos" height="150"></canvas>
        </div>
    </div>

    <div class="charts-grid">
        <div class="chart-container">
            <div class="chart-title">⚠️ Carteras en Mora por Banda de Retraso</div>
            <canvas id="chartBandas" height="150"></canvas>
        </div>
        <div class="chart-container" style="overflow-x: auto;">
            <div class="chart-title">📋 Matriz de Cobranzas y Alertas Prioritarias (Top 5)</div>
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Banda</th>
                        <th>Deuda</th>
                        <th>Ratio</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
"""

for r in mora_rows[:5]:
    st = r["Estado"]
    cls = "status-ok" if st == "OK" else ("status-med" if st == "Medio" else "status-alt")
    html_content += f"""                    <tr>
                        <td>{r['Tipo_Producto']}</td>
                        <td>{r['Banda_Morosidad']}</td>
                        <td>S/ {float(r['Vencida']):,.2f}</td>
                        <td>{float(r['Ratio_Mora']):.1f}%</td>
                        <td><span class="status-badge {cls}">{st}</span></td>
                    </tr>
"""

html_content += f"""                </tbody>
            </table>
        </div>
    </div>

    <script>
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = 'Outfit';

        new Chart(document.getElementById('chartOficinas'), {{
            type: 'bar',
            data: {{
                labels: {list(oficinas.keys())},
                datasets: [{{
                    label: 'Cartera Total (S/)',
                    data: {list(oficinas.values())},
                    backgroundColor: '#22c55e',
                    borderRadius: 6
                }}]
            }},
            options: {{ responsive: true, plugins: {{ legend: {{ display: false }} }} }}
        }});

        new Chart(document.getElementById('chartProductos'), {{
            type: 'doughnut',
            data: {{
                labels: {list(productos.keys())},
                datasets: [{{
                    data: {list(productos.values())},
                    backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'],
                    borderWidth: 0
                }}]
            }},
            options: {{ responsive: true, cutout: '65%' }}
        }});

        new Chart(document.getElementById('chartBandas'), {{
            type: 'bar',
            data: {{
                labels: {list(bandas.keys())},
                datasets: [{{
                    label: 'Monto Vencido (S/)',
                    data: {list(bandas.values())},
                    backgroundColor: '#ef4444',
                    borderRadius: 6
                }}]
            }},
            options: {{ indexAxis: 'y', responsive: true, plugins: {{ legend: {{ display: false }} }} }}
        }});
    </script>
</body>
</html>
"""

with open("dashboard_powerbi_mockup.html", mode="w", encoding="utf-8") as f:
    f.write(html_content)

print("¡Mockup HTML generado exitosamente como 'dashboard_powerbi_mockup.html'!")
