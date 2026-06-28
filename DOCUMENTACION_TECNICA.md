# 🏛️ DOCUMENTACIÓN TÉCNICA Y DE ARQUITECTURA
## Ecosistema Bancario Digital & Motor de Inteligencia Crediticia — Banco Falabella

---

## 📑 Índice de Contenidos
1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Módulos del Sistema](#3-módulos-del-sistema)
   - [Portal de Clientes (Homebanking)](#31-portal-de-clientes-homebanking)
   - [Core Financiero y Backoffice](#32-core-financiero-y-backoffice)
4. [Motor de Scoring Crediticio y Riesgo (RDS)](#4-motor-de-scoring-crediticio-y-riesgo-rds)
5. [Modelo de Datos (Esquema Relacional)](#5-modelo-de-datos-esquema-relacional)
6. [Seguridad y Control de Acceso](#6-seguridad-y-control-de-acceso)
7. [Guía de Despliegue en la Nube (Producción)](#7-guía-de-despliegue-en-la-nube-producción)
8. [Guía de Instalación y Ejecución Local](#8-guía-de-instalación-y-ejecución-local)

---

## 1. Resumen Ejecutivo

El presente proyecto constituye una plataforma bancaria integral distribuida en microservicios, diseñada para simular las operaciones reales de una entidad financiera de primer nivel (**Banco Falabella**). La solución abarca desde la experiencia del usuario final en canales digitales (Homebanking) hasta la gestión interna operativa, análisis de riesgo crediticio automatizado y control de morosidad avanzada por parte de los analistas del banco.

El ecosistema destaca por una interfaz de usuario (**UI/UX**) moderna y ejecutiva con diseño responsivo, glassmorphism y micro-animaciones, respaldada por APIs REST robustas y seguras desarrolladas en Python.

---

## 2. Arquitectura del Sistema

La arquitectura sigue un patrón desacoplado en 4 aplicaciones independientes interconectadas mediante solicitudes HTTP/REST y autenticación por tokens **JWT**, compartiendo una única base de datos transaccional centralizada en la nube.

```
       [ CLIENTE FINAL ]                          [ ANALISTA / GERENTE ]
               │                                            │
               ▼                                            ▼
┌─────────────────────────────┐              ┌─────────────────────────────┐
│       PORTAL FRONTEND       │              │        CORE FRONTEND        │
│   React 18 + Vite + CSS     │              │   React 18 + Vite + CSS     │
│    (Desplegado en Vercel)   │              │    (Desplegado en Vercel)   │
└──────────────┬──────────────┘              └──────────────┬──────────────┘
               │ HTTPS / REST                               │ HTTPS / REST
               ▼                                            ▼
┌─────────────────────────────┐              ┌─────────────────────────────┐
│       PORTAL BACKEND        │ ──(Evaluación)──>│        CORE BACKEND         │
│     FastAPI (Python 3)      │              │     FastAPI (Python 3)      │
│    (Desplegado en Render)   │              │    (Desplegado en Render)   │
└──────────────┬──────────────┘              └──────────────┬──────────────┘
               │                                            │
               └─────────────────────┬──────────────────────┘
                                     ▼
                      ┌─────────────────────────────┐
                      │    BASE DE DATOS CLOUD      │
                      │  PostgreSQL (Supabase/Aiven)│
                      └─────────────────────────────┘
```

---

## 3. Módulos del Sistema

### 3.1 Portal de Clientes (Homebanking)
Desarrollado en **React + Vite** con estilos personalizados en **CSS Vanilla**, pensado en el usuario final.
* **Apertura Digital 100% Online:** Registro de nuevos clientes con generación automática de número de cuenta y saldo de bienvenida.
* **Cuentas de Ahorro & CTS:** Visualización en tiempo real de saldos, números de cuenta interbancarios (CCI) e historial de movimientos.
* **Depósitos a Plazo Fijo:** Simulación y contratación de plazos fijos con cálculo automático de TREA y proyección de ganancias según el monto y plazo.
* **Créditos y Préstamos:** Solicitud de préstamos personales, vehiculares y para microempresas con cotizador en tiempo real (Tasa de interés TEA, cuotas mensuales y seguro de desgravamen).
* **Tarjetas de Crédito CMR:** Consulta de saldo disponible, deuda actual, fecha de corte y pago en línea.
* **Transferencias Interbancarias:** Envío de fondos interbancarios instantáneos, con agenda y directorio de **Contactos Frecuentes** para agilizar transferencias futuras.
* **Pago de Servicios:** Cancelación de recibos de luz, agua, internet, telefonía y universidades con emisión digital del comprobante de pago.
* **Programa de Lealtad Puntos CMR:** Consulta de puntos acumulados, disponibles y canjeados, con categorización visual por nivel (*Verde*, *Silver*, *Black*).
* **Centro de Alertas Push:** Bandeja de notificaciones en tiempo real sobre aprobaciones, cargos y promociones.

### 3.2 Core Financiero y Backoffice
Herramienta institucional para analistas, jefes de riesgo y gerencia bancaria con navegación superior en barra (*Top Navbar*).
* **Bandeja de Evaluación Crediticia:** Listado en tiempo real de todas las solicitudes entrantes con auto-completado de evaluación crediticia en milisegundos.
* **Gestión 360° del Cliente:** Expediente unificado que permite a un analista ver los datos demográficos, cuentas de ahorro activas e historial de créditos de cualquier DNI.
* **Módulo Corporativo y Microempresa:** Evaluación y perfil de empresas (RUC), analizando facturación anual declarada, número de trabajadores y sector para otorgar créditos empresariales.
* **Módulo Operaciones & Captaciones:** Supervisión integral de las captaciones del banco (Plazos Fijos totales captados), ranking del programa Puntos CMR y monitoreo del directorio de contactos y bitácora de alertas del sistema.
* **Recuperaciones y Control de Mora:** Segmentación automática de créditos en mora por etapas de gravedad:
  * **Tramo Temprano (1-30 días):** Gestión preventiva de llamadas y recordatorios.
  * **Bandas R1 (31-60 d), R2 (61-90 d), R3 (91-120 d):** Cobranza telefónica intensiva y cartas notariales.
  * **Cobranza Judicial (≥121 días):** Derivación legal (Requiere aprobación de *Jefatura de Riesgos*).
  * **Castigo de Cartera (>180 días):** Baja contable de la deuda por incobrabilidad (Requiere aprobación de *Gerencia*).
* **Analítica y Auditoría Global:** Dashboard con KPIs corporativos, gráficos estadísticos y exportación de reportes a **Excel / CSV**.

---

## 4. Motor de Scoring Crediticio y Riesgo (RDS)

El corazón de la evaluación crediticia reside en el servicio inteligente del `core-backend`. Cuando un cliente solicita un crédito, el sistema calcula de forma instantánea tres parámetros clave:

1. **Score Crediticio (Escala 300 - 1000 puntos):**
   * Pondera el historial crediticio previo (cuotas pagadas a tiempo vs. morosidad registrada).
   * Evalúa la relación entre la edad del solicitante y el plazo solicitado.
   * *Clasificación:* **≥650:** Excelente | **500 - 649:** Aceptable | **<500:** Riesgo Elevado.

2. **Ratio Deuda-Ingreso (RDS - Semáforo Financiero):**
   * Calcula el porcentaje del ingreso mensual comprometido para pagar la nueva cuota proyectada sumada a otras deudas del cliente.
   * 🟢 **Verde (Riesgo Bajo):** RDS ≤ 30%. Capacidad de pago óptima.
   * 🟡 **Amarillo (Riesgo Medio):** RDS entre 31% y 45%. Requiere revisión analítica.
   * 🔴 **Rojo (Riesgo Alto):** RDS > 45%. Sobreendeudamiento.

3. **Ruta de Aprobación Automatizada:**
   * Asigna el canal por el cual se aprobará el crédito: *Aprobación Automática*, *Revisión por Analista* o *Comité de Créditos*.

---

## 5. Modelo de Datos (Esquema Relacional)

El sistema utiliza **SQLAlchemy ORM** sobre una base de datos **PostgreSQL**. Las principales entidades transaccionales son:

| Tabla | Descripción Principal |
| :--- | :--- |
| `usuarios` | Almacena datos personales, DNI, ingresos, credenciales y saldos consolidados. |
| `cuentas_ahorro` | Cuentas bancarias (Ahorro, CTS, Corriente) vinculadas a un usuario con número único. |
| `movimientos_ahorro` | Auditoría de depósitos, retiros, transferencias y pago de intereses diarios. |
| `depositos_plazo` | Contratos de captación a plazo fijo con monto, plazo en meses, TREA y ganancia. |
| `creditos` | Solicitudes de préstamo de consumo, vehicular o microempresa con su evaluación del Core. |
| `cronogramas_pago` | Cuotas mensuales proyectadas por crédito (Capital, Interés, Seguro y Estado de pago). |
| `tarjetas` | Tarjetas de crédito/débito asignadas con límite de crédito y deuda consumida. |
| `empresas` | Perfiles corporativos de microempresas con RUC, facturación y representante legal. |
| `contactos_transferencia` | Libreta de contactos frecuentes para envíos rápidos interbancarios. |
| `puntos_cmr` | Programa de fidelización con puntos disponibles, acumulados y nivel de cliente. |
| `notificaciones` | Bitácora de alertas, promociones y comprobantes enviados al Homebanking. |
| `trabajadores` | Personal interno del banco con roles asignados (*Asesor*, *Riesgos*, *Comité*, *Gerencia*). |

---

## 6. Seguridad y Control de Acceso

* **Autenticación JWT:** Tanto el portal como el core emiten Tokens de Acceso Json Web Token con expiración configurada y cifrado HS256.
* **Control de Acceso Basado en Roles (RBAC):** Las acciones sensibles en el Core Financiero (como autorizar transiciones a Cobranza Judicial o Castigo de Cartera) están restringidas por validación de rol en el servidor.
* **Protección CORS & Headers HTTP:** Configuración explícita de orígenes permitidos en producción y cabeceras de seguridad (**Security Headers**) activadas en ambos servidores.

---

## 7. Guía de Despliegue en la Nube (Producción)

El proyecto está completamente desplegado e integrado en servicios cloud gratuitos de alto rendimiento:

* 🌐 **Frontend Portal Clientes:** Desplegado en **Vercel**
* 🏢 **Frontend Core Financiero:** Desplegado en **Vercel**
* ⚙️ **API Portal Backend:** Desplegada en **Render (Python 3 Runtime)**
* 🧠 **API Core Backend:** Desplegada en **Render (Python 3 Runtime)**
* 🗄️ **Base de Datos:** **PostgreSQL Cloud** compartida entre ambos servidores.

> [!NOTE]
> Al estar en el plan gratuito de Render, si los servidores pasan 15 minutos sin peticiones entran en modo reposo (*sleep*). Al realizar la primera petición después de un tiempo, pueden tardar entre **30 a 50 segundos** en responder mientras despiertan. El sistema está configurado con timeouts extendidos para soportar este comportamiento automáticamente.

---

## 8. Guía de Instalación y Ejecución Local

Para ejecutar el proyecto completo en una computadora local para desarrollo o demostración:

### Requisitos Previos
* **Node.js** v18 o superior.
* **Python** 3.10 o superior.
* **PostgreSQL** instalado localmente o una URL de base de datos en la nube.

### Paso 1: Levantar los Backends (APIs)
Abrir dos terminales independientes:

**Terminal 1 (Portal Backend):**
```bash
cd portal-backend
python -m venv venv
venv\Scripts\activate     # En Windows
pip install -r requirements.txt
python run.py             # Corre en http://localhost:8000
```

**Terminal 2 (Core Backend):**
```bash
cd core-backend
python -m venv venv
venv\Scripts\activate     # En Windows
pip install -r requirements.txt
python run.py             # Corre en http://localhost:8001
```

### Paso 2: Levantar los Frontends (Web Apps)
Abrir otras dos terminales:

**Terminal 3 (Portal Frontend):**
```bash
cd portal-frontend
npm install
npm run dev               # Corre en http://localhost:5173
```

**Terminal 4 (Core Frontend):**
```bash
cd core-frontend
npm install
npm run dev               # Corre en http://localhost:5174
```

---
*Documentación generada para el Proyecto Académico / Profesional Ecosistema Banco Falabella — 2026.*
