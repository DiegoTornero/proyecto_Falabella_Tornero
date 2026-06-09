from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, creditos, transferencias, usuarios, ahorros
from app.database import engine, Base

# Importar modelos para que SQLAlchemy los registre y cree las tablas
import app.models.models  # noqa: F401

# Crear todas las tablas en PostgreSQL si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Homebanking API — Banco Falabella",
    description="Portal de clientes del sistema bancario Banco Falabella",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["Usuarios"])

app.include_router(creditos.router, prefix="/api/creditos", tags=["Créditos"])
app.include_router(transferencias.router, prefix="/api/transferencias", tags=["Transferencias"])
app.include_router(ahorros.router, prefix="/api/ahorros", tags=["Cuentas de Ahorro y CTS"])


@app.get("/")
def root():
    return {"mensaje": "Homebanking API v2.0 ✅", "version": "2.0.0", "db": "PostgreSQL — falabella_db"}