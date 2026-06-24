# Proyecto Falabella Tornero

Este repositorio contiene la implementación del proyecto "Banco Falabella" que consta de dos sistemas principales integrados:

## 1. Portal Homebanking (portal-frontend & portal-backend)
El portal orientado al cliente final, donde pueden visualizar sus productos, saldos, movimientos y realizar simulaciones.
- **Frontend**: Desarrollado en React y Vite. Incluye una interfaz premium y diseño vintage.
- **Backend**: API REST desarrollada en FastAPI (Python) que gestiona la autenticación de usuarios, consultas de saldos e integración con el Core.

## 2. Core Financiero (core-frontend & core-backend)
El sistema interno para los trabajadores del banco, encargado de gestionar créditos, mora y evaluaciones.
- **Frontend**: Dashboard administrativo desarrollado en React y Vite con diseño institucional.
- **Backend**: API REST desarrollada en FastAPI (Python) para la gestión del scoring crediticio, cronogramas de pagos, evaluación de usuarios y control de morosidad.

## Tecnologías Utilizadas
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Lucide React
- **Backend**: Python, FastAPI, SQLAlchemy, PostgreSQL, JWT Authentication
- **Base de Datos**: PostgreSQL

## Configuración Inicial
Cada componente (`portal-frontend`, `portal-backend`, `core-frontend`, `core-backend`) es un proyecto independiente. Deberás revisar los `.env.example` en cada backend para configurar tu conexión local a la base de datos PostgreSQL.
