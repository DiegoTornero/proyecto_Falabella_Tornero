# Análisis del Tarifario: Préstamo Comercial Digital

A partir de la nueva imagen proporcionada, he extraído las condiciones del **Préstamo Comercial Digital** del Banco Falabella. Esta información servirá para configurar el segundo gran producto dentro de nuestra base de datos.

## 1. Tasas del Préstamo Comercial
A diferencia de la tarjeta CMR, el préstamo comercial maneja rangos distintos y opera exclusivamente en Soles.

| Concepto | Tasa Mínima | Tasa Máxima |
| :--- | :--- | :--- |
| **Tasa Efectiva Anual (TEA)** | 12.55% | 96.32% |
| **Interés Moratorio Nominal Anual** | **13.49%** | - |

> [!NOTE]
> La mora en el préstamo comercial (13.49%) es ligeramente más baja que la mora de la tarjeta CMR (15.25%). Esto debe reflejarse en nuestra lógica de cálculo de penalidades.

## 2. Tasas de Refinanciamiento
Si un cliente cae en mora y solicita refinanciar su deuda, el banco aplica distintas tasas dependiendo de la gravedad de su atraso (días en mora):

| Condición de Mora | Tasa Mínima TEA | Tasa Máxima TEA |
| :--- | :--- | :--- |
| **Menor o igual a 60 días de mora** (Bandas Tempranas) | 26.68% | 96.32% |
| **Mayor a 60 días de mora** (Banda Tardía en adelante) | 15.94% | 96.32% |

## 3. Comisiones y Datos Generales
*   **Moneda:** Soles (PEN).
*   **Envío físico de estado de cuenta:** Sin Costo (pero requiere solicitud expresa del cliente al correo *contactenos@bancofalabella.com.pe*).

---

### Impacto en la Base de Datos y Lógica de Negocio
Con este segundo tarifario, nuestro sistema ahora maneja dos mundos financieros distintos. Para asimilar el modelo `BancoPrueba.sql` a nuestra base de datos, haremos lo siguiente:

1.  **Catálogo de Productos (`DPRODUCTO`):** 
    *   `COD: 01` - Tarjeta de Crédito (Subtipos: Básica, Clásica, Platinum, Signature).
    *   `COD: 02` - Préstamo Comercial Digital.
2.  **Motor de Scoring (`scoring_rules.py`):** 
    *   Si el usuario solicita un **Préstamo Comercial**, la tasa asignada dependerá de su score, fluctuando entre 12.55% (clientes excelentes) y 96.32% (clientes de alto riesgo).
3.  **Cronograma y Mora (`FPLANPAGOMES` / `cronograma_pagos`):** 
    *   La penalidad diaria deberá leer dinámicamente si el producto cobra 15.25% (CMR) o 13.49% (Comercial).
4.  **Módulo de Recuperaciones:** 
    *   Añadir la opción de "Refinanciar", aplicando las tasas correspondientes (26.68% o 15.94%) según los días de mora que tenga el cliente en ese momento.
