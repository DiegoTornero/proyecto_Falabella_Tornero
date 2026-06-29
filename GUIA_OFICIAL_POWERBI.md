# 📊 GUÍA OFICIAL POWER BI (CONEXIÓN DIRECTA A NEON POSTGRESQL)
**Proyecto Core Bancario Falabella - Inteligencia de Negocios**

Dado que has cargado **todas las tablas originales de la base de datos**, ahora trabajaremos como verdaderos analistas de datos (Data Engineers). Power BI leerá la base de datos relacional pura.

---

## 🔗 Paso 1: Configurar el Modelo de Datos (Relaciones)

En Power BI, ve a la vista de **Modelo** (el ícono de los cuadritos conectados a la izquierda). Asegúrate de que las tablas estén conectadas así (Power BI suele detectarlo automáticamente, pero verifícalo):

1. **`creditos` a `empresas`:** Arrastra el campo `empresa_id` de la tabla `creditos` hacia el campo `id` de la tabla `empresas`. *(Relación 1 a Varios)*.
2. **`creditos` a `usuarios`:** Arrastra el campo `usuario_id` de la tabla `creditos` hacia el campo `id` de la tabla `usuarios`.
3. *(Opcional)* **`creditos` a `cronograma_pagos`:** Arrastra el campo `id` de `creditos` hacia `credito_id` en `cronograma_pagos`.

---

## 🧮 Paso 2: Crear Medidas DAX Oficiales (Data Cruda)

Como ahora usas la tabla `creditos` original, las fórmulas DAX son ligeramente diferentes. Ve a la vista de **Datos** o **Informe**, haz clic derecho sobre la tabla **`creditos`**, selecciona **Nueva Medida** y pega estas fórmulas una por una:

### 1. Cartera Total Desembolsada
```dax
Cartera Total = SUM('public creditos'[monto_aprobado])
```

### 2. Número Total de Créditos
```dax
Total Creditos = COUNT('public creditos'[id])
```

### 3. Cartera Vencida (Dinero en Mora)
```dax
Cartera Vencida = CALCULATE(SUM('public creditos'[monto_aprobado]), 'public creditos'[dias_mora] > 0)
```

### 4. Ratio de Mora Global (%)
```dax
Ratio Mora Global = DIVIDE([Cartera Vencida], [Cartera Total], 0)
```
*(Nota: Selecciona esta medida y cámbiale el formato a **Porcentaje `%`** en la cinta de opciones superior).*

---

## 🏢 Paso 3: Diseño de la HOJA 1 (Resumen Comercial)

Renombra la primera pestaña como **"Hoja 1 - Resumen Comercial"**.

### A. Tarjetas KPI
* **Tarjeta 1:** Medida `[Cartera Total]` (Formato Moneda S/).
* **Tarjeta 2:** Medida `[Total Creditos]`.

### B. Gráficos Visuales
1. **Gráfico de Barras Agrupadas (Por Oficina/Sucursal):**
   * **Eje Y:** Arrastra el campo `direccion` de la tabla **`empresas`**.
   * **Eje X:** Arrastra tu medida `[Cartera Total]`.

2. **Gráfico Circular o Anillo (Por Tipo de Producto):**
   * **Leyenda:** Campo `tipo_producto` de la tabla **`creditos`**.
   * **Valores:** Tu medida `[Cartera Total]`.

3. **Gráfico de Líneas (Evolución Mensual):**
   * **Eje X:** Campo `created_at` de la tabla **`creditos`**.
   * **Eje Y:** Tu medida `[Cartera Total]`.

---

## ⚠️ Paso 4: Diseño de la HOJA 2 (Riesgos y Morosidad)

Crea una nueva pestaña y renómbrala **"Hoja 2 - Detalle de Mora"**.

### A. Tarjetas KPI de Riesgo
* **Tarjeta 1:** Medida `[Ratio Mora Global]` (Debe mostrar el % de mora).
* **Tarjeta 2:** Medida `[Cartera Vencida]`.

### B. Gráficos Visuales de Cobranza
1. **Gráfico de Columnas (Mora por Banda de Retraso):**
   * **Eje X:** Campo `banda_mora` de la tabla **`creditos`**.
   * **Eje Y:** Tu medida `[Cartera Vencida]`.

2. **Matriz o Tabla de Gestión Operativa:**
   * **Filas:** Campo `sector` (Zona) de **`empresas`** > Campo `direccion` (Oficina) de **`empresas`** > Campo `tipo_producto` de **`creditos`**.
   * **Columnas:** Medida `[Cartera Total]`, Medida `[Cartera Vencida]`, Medida `[Ratio Mora Global]`.

---

## 🎨 Paso 5: Estética Corporativa (Banco Falabella)
* Utiliza la paleta corporativa: **Verde Falabella (#008A00)** para las colocaciones vigentes, **Gris Oscuro (#333333)** para fondos y **Rojo Carmín (#D32F2F)** para la morosidad.
* En tu Matriz, aplica **Formato Condicional** a la columna del `[Ratio Mora Global]`: Si es alto, que el fondo se pinte de rojo.
