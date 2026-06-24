"""
security.py — Módulo de Seguridad Centralizado (Core Backend)
=================================================================
Implementa defensas contra los 5 ataques del cuadro de seguridad:
  1. SQL Injection  -> ORM + Pydantic valida tipos (la ORM SQLAlchemy usa queries parametrizadas)
  2. XSS           -> Sanitización de inputs en campos de texto libre
  3. IDOR          -> Verificación de propiedad de recursos antes de cualquier operación
  4. Fuerza Bruta  -> Rate limiter por IP sobre endpoints de autenticación
  5. Config Inseg. -> Variables de entorno, CORS estricto, headers de seguridad HTTP
"""

import re
import time
import html
from typing import Optional
from collections import defaultdict
from fastapi import Request, HTTPException


# ─────────────────────────────────────────────────────
#  DEFENSA 4: RATE LIMITER (Anti Fuerza Bruta)
# ─────────────────────────────────────────────────────

_rate_limit_store: dict = defaultdict(list)
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS   = 10
RATE_LIMIT_BLOCK_SECONDS  = 300
_blocked_ips: dict = {}


def check_rate_limit(ip: str, path: str) -> None:
    now = time.time()

    if ip in _blocked_ips:
        if now < _blocked_ips[ip]:
            secs_left = int(_blocked_ips[ip] - now)
            raise HTTPException(
                status_code=429,
                detail=f"Demasiados intentos fallidos. Intenta nuevamente en {secs_left} segundos."
            )
        else:
            del _blocked_ips[ip]

    _rate_limit_store[ip] = [
        (ts, p) for (ts, p) in _rate_limit_store[ip]
        if now - ts < RATE_LIMIT_WINDOW_SECONDS
    ]
    _rate_limit_store[ip].append((now, path))

    if len(_rate_limit_store[ip]) > RATE_LIMIT_MAX_REQUESTS:
        _blocked_ips[ip] = now + RATE_LIMIT_BLOCK_SECONDS
        del _rate_limit_store[ip]
        raise HTTPException(
            status_code=429,
            detail=f"Límite de intentos excedido. Tu IP ha sido bloqueada por {RATE_LIMIT_BLOCK_SECONDS // 60} minutos."
        )


# ─────────────────────────────────────────────────────
#  DEFENSA 2: XSS — SANITIZACIÓN DE INPUTS
# ─────────────────────────────────────────────────────

_XSS_PATTERNS = re.compile(
    r"(<\s*script|</\s*script|javascript:|onerror\s*=|onload\s*=|onclick\s*=|<\s*iframe|<\s*img[^>]+src\s*=\s*['\"]?\s*javascript)",
    re.IGNORECASE
)

def sanitize_input(value: str) -> str:
    if not isinstance(value, str):
        return value
    if _XSS_PATTERNS.search(value):
        raise HTTPException(
            status_code=400,
            detail="Entrada inválida: se detectó contenido potencialmente peligroso."
        )
    return html.escape(value.strip())


# ─────────────────────────────────────────────────────
#  DEFENSA 3: IDOR — VERIFICACIÓN DE ROL/PERMISOS
# ─────────────────────────────────────────────────────

ROL_JERARQUIA = ["asesor", "jefe_regional", "riesgos", "comite", "gerencia"]

def require_min_rol(trabajador, nivel_minimo: str) -> None:
    """Lanza 403 si el rol del trabajador es inferior al requerido."""
    if nivel_minimo not in ROL_JERARQUIA:
        raise HTTPException(status_code=500, detail="Nivel mínimo inválido en configuración")
    idx_actual    = ROL_JERARQUIA.index(trabajador.rol) if trabajador.rol in ROL_JERARQUIA else -1
    idx_requerido = ROL_JERARQUIA.index(nivel_minimo)
    if idx_actual < idx_requerido:
        raise HTTPException(
            status_code=403,
            detail=f"Acceso denegado: se requiere rol '{nivel_minimo}' o superior. Tu rol: '{trabajador.rol}'"
        )


# ─────────────────────────────────────────────────────
#  DEFENSA 5: HEADERS DE SEGURIDAD HTTP
# ─────────────────────────────────────────────────────

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com"
}


async def add_security_headers(request: Request, call_next):
    """Middleware: añade headers de seguridad HTTP a todas las respuestas."""
    response = await call_next(request)
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    return response
