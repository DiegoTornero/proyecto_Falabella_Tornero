# 📊 GUÍA OFICIAL DE CONSTRUCCIÓN EN POWER BI DESKTOP
**Proyecto Core Bancario Falabella - Inteligencia de Negocios**

Esta guía contiene los pasos exactos, fórmulas DAX y estructura visual para armar tu reporte de Power BI conectado en vivo a tu base de datos en la nube con un cuadre matemático perfecto de **S/ 10,748,326.58**.

---

## 🚀 Paso 1: Conectar Power BI en Vivo con la Base de Datos en la Nube

### 🐘 MÉTODO ÚNICO: Conexión Directa al Motor PostgreSQL (Neon Tech)

Dado que usarás conexión directa a tu base de datos en Neon, sigue estos pasos exactos:

1. En Power BI Desktop dale a **Obtener datos** > **MÁS...** > **Base de datos de PostgreSQL** y dale a **Conectar**.
2. Completa los datos exactamente con esta información:
   * **Servidor:** `ep-twilight-water-atm701rq.c-9.us-east-1.aws.neon.tech`
   * **Base de datos:** `neondb`
3. En la siguiente pantalla de autenticación, selecciona la pestaña **"Base de datos"** (no la de Windows) e ingresa:
   * **Nombre de usuario:** `neondb_owner`
   * **Contraseña:** `npg_v2MNrOmt8TBW`
4. *(Si sale una advertencia de encriptación, dale a "Aceptar").*
5. En el Navegador, selecciona las tablas **`creditos`** y **`empresas`**.
6. Dale a **Cargar** (o Transformar datos si deseas agrupar algo primero).

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
