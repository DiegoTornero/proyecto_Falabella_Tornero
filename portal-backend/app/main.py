import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.routers import auth, creditos, transferencias, usuarios, ahorros, empresas, tarjetas, inversiones, beneficios, contactos, notificaciones
from app.database import engine, Base
from app.security import add_security_headers

# Importar modelos para que SQLAlchemy los registre y cree las tablas
import app.models.models  # noqa: F401

# Crear todas las tablas en PostgreSQL si no existen
Base.metadata.create_all(bind=engine)

# Sincronizar secuencias PostgreSQL (evita duplicate key errors)
try:
    from sqlalchemy import text
    with engine.connect() as _conn:
        for _seq_sql in [
            "SELECT setval('cuentas_ahorro_id_seq', COALESCE((SELECT MAX(id)+1 FROM cuentas_ahorro), 1), false)",
            "SELECT setval('movimientos_ahorro_id_seq', COALESCE((SELECT MAX(id)+1 FROM movimientos_ahorro), 1), false)",
            "SELECT setval('productos_pasivos_id_seq', COALESCE((SELECT MAX(id)+1 FROM productos_pasivos), 1), false)",
            "SELECT setval('productos_activos_id_seq', COALESCE((SELECT MAX(id)+1 FROM productos_activos), 1), false)",
        ]:
            _conn.execute(text(_seq_sql))
        _conn.commit()
except Exception as _e:
    print(f'[startup] sequence sync skipped: {_e}')

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
    allow_origin_regex=r"https://proyecto-falabella-tornero-ja2i.*\.vercel\.app",
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
app.include_router(tarjetas.router, prefix="/api/tarjetas", tags=["Tarjetas CMR"])
app.include_router(inversiones.router, prefix="/api/inversiones", tags=["Depósitos a Plazo Fijo"])
app.include_router(beneficios.router, prefix="/api/beneficios", tags=["Puntos CMR y Beneficios"])
app.include_router(contactos.router, prefix="/api/contactos", tags=["Contactos Frecuentes"])
app.include_router(notificaciones.router, prefix="/api/notificaciones", tags=["Notificaciones"])


@app.get("/")
def root():
    return {"mensaje": "Homebanking API v2.0 ✅", "version": "2.0.0", "db": "PostgreSQL — falabella_db"}