import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.routers import auth, creditos, transferencias, usuarios, ahorros, empresas
from app.database import engine, Base
from app.security import add_security_headers

# Importar modelos para que SQLAlchemy los registre y cree las tablas
import app.models.models  # noqa: F401

# Crear todas las tablas en PostgreSQL si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Homebanking API — Banco Falabella",
    description="Portal de clientes del sistema bancario Banco Falabella",
    version="2.0.0"
)

# ─── Defensa 5: CORS estricto (solo orígenes conocidos) ───
FRONTEND_URLS = os.getenv("FRONTEND_URLS", "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174")
ORIGINES_PERMITIDOS = [url.strip() for url in FRONTEND_URLS.split(",")]

# URLs de producción hardcodeadas como fallback de seguridad
ORIGINES_PRODUCCION = [
    "https://proyecto-falabella-tornero-ja2i.vercel.app",
]
for url in ORIGINES_PRODUCCION:
    if url not in ORIGINES_PERMITIDOS:
        ORIGINES_PERMITIDOS.append(url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINES_PERMITIDOS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ─── Defensa 5: Headers de seguridad HTTP en todas las respuestas ───
app.add_middleware(BaseHTTPMiddleware, dispatch=add_security_headers)

app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["Usuarios"])

app.include_router(creditos.router, prefix="/api/creditos", tags=["Créditos"])
app.include_router(transferencias.router, prefix="/api/transferencias", tags=["Transferencias"])
app.include_router(ahorros.router, prefix="/api/ahorros", tags=["Cuentas de Ahorro y CTS"])
app.include_router(empresas.router, prefix="/api/empresas", tags=["Empresas – Crédito Micro"])


@app.get("/")
def root():
    return {"mensaje": "Homebanking API v2.0 ✅", "version": "2.0.0", "db": "PostgreSQL — falabella_db"}