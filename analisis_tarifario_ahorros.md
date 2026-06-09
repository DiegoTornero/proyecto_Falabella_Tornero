# Análisis del Tarifario: Cuentas de Ahorro y CTS

He extraído las condiciones comerciales de los productos pasivos (ahorros) del Banco Falabella según las imágenes proporcionadas. Esta información es clave para modelar la tabla `DPRODUCTOAHORRO` y simular el cálculo de la Tasa de Rendimiento Efectiva Anual (TREA) a favor del cliente.

## 1. Cuenta de Ahorro Banco Falabella (Cuenta Sueldo / Básica)
Es la cuenta más transaccional, sin costos fijos pero sin rendimientos:
*   **Interés Compensatorio:** 0.00% TEA (Soles y Dólares).
*   **Saldo Mínimo:** Cualquier monto.
*   **Comisiones Clave:** 
    *   Mantenimiento: Sin costo aparente.
    *   Operaciones en ventanilla / Cajeros Falabella y Global Net: Sin Costo.
    *   Retiro en otras redes de cajeros: S/ 10.00 o US$ 2.50.
    *   Reposición de Tarjeta de Débito: S/ 10.00 (luego S/ 20.00 desde 2025).

## 2. Cuenta Ahorro Clásico
Diseñada para generar rentabilidad siempre que se mantenga un saldo mínimo:
*   **Interés Compensatorio (Soles):** 4.00% TEA (hasta Nov 2025) y luego bajará a 3.75% TEA.
*   **Interés Compensatorio (Dólares):** 1.50% TEA.
*   **Saldo Mínimo de Equilibrio:** S/ 500 o US$ 150.
*   **Comisiones Clave:**
    *   **Mantenimiento de Cuenta:** S/ 10.00 o US$ 3.00.
    *   **Operaciones en ventanilla / Cajero Falabella:** A partir del 2do uso cobran S/ 7.00 o US$ 2.00.
    *   Retiro en Cajeros Global Net o red externa: S/ 10.00 o US$ 2.50.

## 3. Cuenta de Compensación de Tiempo de Servicios (CTS)
El producto con mayor tasa pasiva, diseñado para captar fondos a largo plazo:
*   **TREA (Recibiendo Sueldo en Falabella):** 
    *   Soles: 6.00% TEA (bajando a 4.25% en 2026).
    *   Dólares: 1.75% TEA (bajando a 1.50% en 2026).
*   **TREA (Sin recibir sueldo):** 
    *   Soles: 5.00% TEA (bajando a 3.75%).
    *   Dólares: 1.50% TEA (bajando a 1.00%).
*   **TREA por Inactividad:** Cae drásticamente a 1.00% (Soles) y 0.10% (Dólares).
*   **Comisiones Clave:** No hay cobro de mantenimiento. Retiros en otros bancos: S/ 10.00.

---

### Impacto en la Base de Datos
Esta información expande drásticamente el alcance del proyecto. Ya no somos solo una financiera de créditos; ahora **captamos depósitos del público**.

En `BancoPrueba.sql` existen dimensiones específicas para esto que ahora sí tendrían sentido habilitar:
1.  **Dimensión `DPRODUCTOAHORRO` y `DTIPOCUENTAAHORRO`**: 
    *   `01` - Ahorro Transaccional (Tasa 0%)
    *   `02` - Ahorro Clásico (Tasa 4%)
    *   `03` - CTS (Tasa preferencial 6%)
2.  **Tabla de Hechos de Saldos Pasivos:** A diferencia de la mora y los intereses que *cobramos* (activos), ahora debemos tener un cronograma de intereses que el banco *paga* al cliente (pasivos) basado en los saldos mínimos diarios.
