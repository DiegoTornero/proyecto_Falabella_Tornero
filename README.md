# 🏦 Ecosistema Bancario & Motor de Scoring Inteligente — Banco Falabella

[![Deploy Status](https://img.shields.io/badge/Deploy-Cloud%20Ready-2ea44f?style=for-the-badge)](DOCUMENTACION_TECNICA.md)
[![Stack Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react)](DOCUMENTACION_TECNICA.md)
[![Stack Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203-009688?style=for-the-badge&logo=fastapi)](DOCUMENTACION_TECNICA.md)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20Cloud-336791?style=for-the-badge&logo=postgresql)](DOCUMENTACION_TECNICA.md)

Plataforma bancaria distribuida en microservicios diseñada para simular la operación digital y administrativa integral del **Banco Falabella**. Cuenta con canales de atención al usuario final (**Homebanking**) y un poderoso sistema de **Core Financiero** con motor inteligente de evaluación crediticia y control de morosidad.

---

## 📑 Documentación Oficial
> 💡 **Para revisar todos los detalles de arquitectura, diagramas de microservicios, explicación de las 12+ tablas y guías de paso a paso, consulta nuestro documento maestro:**
> 
> 👉 **[🏛️ LEER LA DOCUMENTACIÓN TÉCNICA COMPLETA (DOCUMENTACION_TECNICA.md)](file:///c:/Users/TorneroBermudez/Documents/proyecto_Falabella_Tornero-main/DOCUMENTACION_TECNICA.md)**

---

## 🌟 Componentes del Ecosistema

### 1. 🌐 Portal Homebanking (`portal-frontend` & `portal-backend`)
Orientado a la experiencia digital de los clientes del banco.
* **Apertura Digital 100% Online** de cuentas con asignación inmediata de número bancario.
* **Depósitos a Plazo Fijo:** Simulación y contratación con cálculo de TREA y ganancias.
* **Préstamos en Línea:** Cotización y solicitud de créditos de consumo, vehiculares y microempresa.
* **Transferencias Interbancarias:** Envío rápido con agenda y **Contactos Frecuentes**.
* **Pago de Servicios:** Cancelación de recibos de luz, agua, telefonía y universidades.
* **Fidelización:** Consulta del programa **Puntos CMR** por niveles (*Verde*, *Silver*, *Black*).

### 2. 🏛️ Core Financiero Institucinoal (`core-frontend` & `core-backend`)
Orientado al equipo de analistas, jefaturas de riesgo y gerencia bancaria.
* **Motor Inteligente de Scoring:** Evaluación automática en milisegundos que calcula el **Score Crediticio (300-1000)** y el **Ratio Deuda-Ingreso (RDS)** con semáforo de riesgo (🟢 Verde, 🟡 Amarillo, 🔴 Rojo).
* **Top Navbar Executive Design:** Interfaz limpia con barra de navegación superior que maximiza el espacio de lectura.
* **Expediente 360° del Cliente:** Vista unificada de cuentas, préstamos y cronogramas de pago.
* **Recuperaciones y Morosidad:** Gestión por tramos preventivos y bandas intensivas (R1, R2, R3), con flujo de autorización por roles para pases a **Cobranza Judicial** o **Castigo de Cartera**.
* **Módulo Operaciones & Captaciones:** Supervisión corporativa de depósitos a plazo fijo totales captados, ranking CMR y bitácora de alertas.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** React 18, Vite, CSS Vanilla Moderno (Glassmorphism & Gradients), Recharts, Lucide Icons.
* **Backend:** Python 3.10+, FastAPI, SQLAlchemy ORM, Pydantic v2, Requests.
* **Seguridad:** JSON Web Tokens (JWT), RBAC (Role-Based Access Control), Security Headers.
* **Base de Datos:** PostgreSQL en la nube.

---

## 🚀 Inicio Rápido Local

Si deseas correr todo el proyecto en tu computadora:

1. Lee la guía paso a paso en la **[Documentación Técnica](file:///c:/Users/TorneroBermudez/Documents/proyecto_Falabella_Tornero-main/DOCUMENTACION_TECNICA.md#8-guía-de-instalación-y-ejecución-local)**.
2. Levanta los dos servidores backend en puertos independientes (`8000` y `8001`).
3. Levanta las dos interfaces web en puertos independientes (`5173` y `5174`).

---
*Desarrollado para el Proyecto Académico de Ingeniería y Arquitectura de Software — 2026.*
