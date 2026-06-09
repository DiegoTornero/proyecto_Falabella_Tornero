from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import scoring, auth_core, mora, ahorros
from app.database import engine, Base

import app.models.models  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Core Financiero — Banco Falabella",
    description="Motor de Evaluación, Scoring y Recuperaciones. Uso interno de analistas.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_core.router,  prefix="/auth",    tags=["Autenticación Core"])
app.include_router(scoring.router,    prefix="/scoring", tags=["Scoring y Bandeja"])
app.include_router(mora.router, prefix="/api/mora", tags=["Gestión de Mora"])
app.include_router(ahorros.router, prefix="/api/ahorros", tags=["Cuentas de Ahorro y CTS"])
from app.routers import analytics, clientes, productos
app.include_router(analytics.router, prefix="/analytics", tags=["Analitica Global"])
app.include_router(clientes.router, prefix="/api/clientes", tags=["Módulo 360 del Cliente"])
app.include_router(productos.router, prefix="/api/productos", tags=["Gestión de Productos"])


@app.get("/")
def root():
    return {
        "mensaje": "Core Financiero API v2.0 ✅",
        "puerto": 8001,
        "modulos": ["Autenticación JWT", "Scoring Crediticio", "Recuperaciones/Mora R1-R2-R3"]
    }
