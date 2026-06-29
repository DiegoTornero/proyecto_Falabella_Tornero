# 📊 GUÍA OFICIAL DE CONSTRUCCIÓN EN POWER BI DESKTOP
**Proyecto Core Bancario Falabella - Inteligencia de Negocios**

Esta guía contiene los pasos exactos, fórmulas DAX y estructura visual para armar tu reporte de Power BI en 10 minutos con un cuadre matemático perfecto de **S/ 76,230,821.04**.

---

## 🚀 Paso 1: Cargar los Datos en Power BI Desktop

1. Abre la aplicación **Power BI Desktop** en tu computadora.
2. En la barra superior, haz clic en **Obtener datos** > **Texto/CSV**.
3. Selecciona el archivo `powerbi_resumen_cartera.csv` (ubicado en la carpeta del proyecto) y haz clic en **Cargar**.
4. Repite el paso para cargar el segundo archivo `powerbi_detalle_mora.csv`.

*(Verás que ambas tablas aparecen en el panel de **Datos** a la derecha).*

---

## 🧮 Paso 2: Crear Medidas DAX Oficiales

Para que los números en las tarjetas superiores cuadren con exactitud al centavo, haz clic derecho sobre la tabla `powerbi_resumen_cartera` > **Nueva medida** y pega una por una estas fórmulas:

### 1. Cartera Total Desembolsada
```dax
Cartera Total = SUM(powerbi_resumen_cartera[Cartera_Total])
```

### 2. Número Total de Clientes / Créditos
```dax
Total Clientes = SUM(powerbi_resumen_cartera[Numero_Clientes])
```

### 3. Ratio de Mora Global (%)
```dax
Ratio Mora Global = DIVIDE(SUM(powerbi_resumen_cartera[Cartera_Vencida]), [Cartera Total], 0)
```
*(Nota: Selecciona esta medida y cámbiale el formato a **Porcentaje `%`** en la barra superior).*

---

## 🏢 Paso 3: Diseño de la HOJA 1 (Comercial y Desembolsos)

Renombra la primera pestaña como **"Hoja 1 - Resumen Comercial"**.

### A. Tarjetas KPI de Cabecera (Parte Superior)
* **Tarjeta 1:** Arrastra la medida `[Cartera Total]` (Formato Moneda S/).
* **Tarjeta 2:** Arrastra la medida `[Total Clientes]`.
* **Tarjeta 3:** Arrastra el campo `Ticket_Promedio` (Configúralo como *Promedio*).

### B. Gráficos Visuales
1. **Gráfico de Barras Agrupadas (Por Oficina/Sucursal):**
   * **Eje Y:** `Oficina`
   * **Eje X:** `Cartera_Total`
   * *Muestra qué agencia coloca mayor volumen de dinero.*

2. **Gráfico Circular o Anillo (Por Tipo de Producto):**
   * **Leyenda:** `Tipo_Producto` (Crédito Personal, PYME, Tarjeta CMR, Vehicular).
   * **Valores:** `Cartera_Total`

3. **Gráfico de Líneas (Evolución Mensual):**
   * **Eje X:** `Fecha` o `Mes`
   * **Eje Y:** `Cartera_Total`

---

## ⚠️ Paso 4: Diseño de la HOJA 2 (Riesgos y Morosidad)

Crea una nueva pestaña abajo y renómbrala **"Hoja 2 - Detalle de Mora"**.

### A. Tarjetas KPI de Riesgo
* **Tarjeta 1:** Arrastra la medida `[Ratio Mora Global]` (Debe mostrar el % de mora).
* **Tarjeta 2:** Arrastra el campo `Vencida` de la tabla `powerbi_detalle_mora` (Suma de dinero en riesgo).

### B. Gráficos Visuales de Cobranza
1. **Gráfico de Columnas (Mora por Banda de Retraso):**
   * **Eje X:** `Banda_Morosidad` (Preventiva 1-30, Temprana 31-60, Tardía 61-120, Judicial, Castigo).
   * **Eje Y:** `Vencida`

2. **Matriz o Tabla de Gestión Operativa:**
   * **Filas:** `Zona` > `Oficina` > `Tipo_Producto`
   * **Columnas:** `Cartera_Total`, `Vencida`, `Ratio_Mora`, `Estado`, `Accion_Recuperacion`.

---

## 🎨 Paso 5: Estética Corporativa (Banco Falabella)
* Utiliza una paleta corporativa: **Verde Falabella (#008A00)** para las colocaciones vigentes, **Gris Oscuro (#333333)** para fondos y **Rojo Carmín (#D32F2F)** para resaltar la cartera morosa.
* Aplica **Formato Condicional** a la columna `Estado` de tu matriz (Verde si es "OK", Amarillo si es "Medio", Rojo si es "Alto").
