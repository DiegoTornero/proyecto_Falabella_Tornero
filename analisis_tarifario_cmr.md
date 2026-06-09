# Análisis del Tarifario: Tarjetas de Crédito CMR Falabella

A partir de las imágenes proporcionadas, he extraído y estructurado las condiciones comerciales, tasas y comisiones de las Tarjetas de Crédito CMR. Esta información será vital para modelar correctamente los catálogos (`DPRODUCTO`) y las tablas de hechos en nuestra adaptación de la base de datos.

## 1. Tasas de Interés Efectiva Anual (TEA)
Aplica principalmente a la **CMR VISA Básica** y define los límites legales y de riesgo del banco:

| Concepto | Tasa Mínima | Tasa Máxima |
| :--- | :--- | :--- |
| **Compras en revolvente** | 49.90% | 109.83% |
| **Compras en cuotas** | 29.90% | 109.83% |
| **Rapicash / Disposición de efectivo** | 29.90% | 109.83% |
| **Reordena tu deuda total CMR** | 29.90% | 109.83% |
| **Cambio a cuotas de revolvente** | 29.90% | 109.83% |
| **Pago Diferido** | - | 109.83% |
| **Refinanciación** | 12.55% | 109.83% |

> [!WARNING]
> **Interés Moratorio Nominal Anual:** Se establece en **15.25%**, aplicable a partir del día 1 de atraso.

*Nota:* Productos como *Supercash* y *Compra Deuda* se listan, pero figuran como "NO VIGENTES" en este tarifario.

## 2. Tipos de Tarjeta CMR y Membresías
El banco maneja 4 categorías principales de su tarjeta de crédito, cada una con un costo de membresía anual y una regla de exoneración basada en el consumo mínimo mensual durante un año:

| Tipo CMR | Consumo mínimo mensual para exonerar | Costo de membresía anual |
| :--- | :--- | :--- |
| **CMR Básica** | S/ 0 | S/ 0 |
| **CMR Clásica** | S/ 100 | S/ 69 |
| **CMR Platinum** | S/ 250 | S/ 190 |
| **CMR Signature**| S/ 1,000 | S/ 290 |

## 3. Comisiones
Cargos adicionales por servicios asociados a la tarjeta de crédito:

*   **Duplicado de documento / estado de cuenta:** S/ 5.50 por operación.
*   **Envío físico de estado de cuenta:** S/ 20.00 mensual.
*   **Tarjetas de crédito adicionales:** S/ 10.00 (emisión/envío).
*   **Conversión de moneda:** 3.00% (por operación distinta a dólares).
*   **Transacciones vía otras instituciones / Niubiz:** S/ 2.90 por operación.

## 4. Gastos Adicionales y Seguros
*   **Seguro de Desgravamen (Tarjeta de Crédito y Súper Cash):** 
    *   Tasa: **3.29%** del promedio diario de la deuda.
    *   Tope Máximo: **S/ 13.90** al mes.
    *   Cobertura: Fallecimiento e Invalidez Total y Permanente (hasta S/ 100,000). Beneficiario: Banco Falabella Perú S.A.
*   **Impuestos:** ITF 0.005%, IGV 18%. Año contable considerado de 360 días.

---

### ¿Cómo impacta esto en la adaptación a nuestra Base de Datos?
Para acercarnos al `BancoPrueba.sql` y al Banco Falabella original, este tarifario nos dicta que debemos implementar:
1.  **Dimensión Producto (`DPRODUCTO`):** Debemos crear las familias "Tarjeta de Crédito" con subproductos "CMR Básica", "CMR Clásica", "CMR Platinum" y "CMR Signature".
2.  **Tabla de Costos / Tarifario:** Una nueva tabla paramétrica (`DTARIFARIO`) o campos en el producto que almacenen la TEA Mín/Máx (49.90% - 109.83%), la penalidad por mora (15.25%), y el seguro de desgravamen (tope S/ 13.90).
3.  **Lógica de Facturación:** En la tabla de hechos (ej. `FAGCUENTACREDITO`), el motor deberá calcular el seguro de desgravamen tomando en cuenta el tope y sumar las comisiones por envío de estado de cuenta si el cliente lo tiene activado.
