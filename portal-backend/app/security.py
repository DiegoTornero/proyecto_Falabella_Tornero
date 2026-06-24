"""
security.py — Módulo de Seguridad Centralizado (Portal Backend)
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
from fastapi.responses import JSONResponse


# ─────────────────────────────────────────────────────
#  DEFENSA 4: RATE LIMITER (Anti Fuerza Bruta)
# ─────────────────────────────────────────────────────

# Almacenamiento en memoria: {ip: [(timestamp, ruta), ...]}
_rate_limit_store: dict[str, list] = defaultdict(list)

# Configuración del limitador
RATE_LIMIT_WINDOW_SECONDS = 60       # ventana de tiempo
RATE_LIMIT_MAX_REQUESTS   = 10       # máximo de intentos en la ventana
RATE_LIMIT_BLOCK_SECONDS  = 300      # bloqueo de 5 minutos tras exceder límite
_blocked_ips: dict[str, float] = {}  # {ip: timestamp_hasta_cuando_bloqueada}


def check_rate_limit(ip: str, path: str) -> None:
    """
    Verifica si la IP ha excedido el límite de intentos en endpoints sensibles.
    Aplica bloqueo temporal de 5 minutos tras superar el límite.
    """
    now = time.time()

    # ¿Está bloqueada?
    if ip in _blocked_ips:
        if now < _blocked_ips[ip]:
            secs_left = int(_blocked_ips[ip] - now)
            raise HTTPException(
                status_code=429,
                detail=f"Demasiados intentos fallidos. Intenta nuevamente en {secs_left} segundos."
            )
        else:
            del _blocked_ips[ip]  # desbloquear

    # Limpiar registros viejos fuera de la ventana
    _rate_limit_store[ip] = [
        (ts, p) for (ts, p) in _rate_limit_store[ip]
        if now - ts < RATE_LIMIT_WINDOW_SECONDS
    ]

    # Registrar intento
    _rate_limit_store[ip].append((now, path))

    # ¿Excedió el límite?
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

# Patrones de inyección XSS comunes
_XSS_PATTERNS = re.compile(
    r"(<\s*script|</\s*script|javascript:|onerror\s*=|onload\s*=|onclick\s*=|<\s*iframe|<\s*img[^>]+src\s*=\s*['\"]?\s*javascript)",
    re.IGNORECASE
)

def sanitize_input(value: str) -> str:
    """
    Limpia un string de caracteres o patrones potencialmente peligrosos (XSS).
    - Escapa entidades HTML (<, >, &, ", ')
    - Elimina patrones de scripts maliciosos
    """
    if not isinstance(value, str):
        return value
    
    # Detectar y rechazar inyección activa
    if _XSS_PATTERNS.search(value):
        raise HTTPException(
            status_code=400,
            detail="Entrada inválida: se detectó contenido potencialmente peligroso."
        )
    
    # Escape de entidades HTML para evitar interpretación en el browser
    return html.escape(value.strip())


def sanitize_dict(data: dict) -> dict:
    """Aplica sanitización XSS a todos los campos de texto en un diccionario."""
    sanitized = {}
    for key, value in data.items():
        if isinstance(value, str):
            sanitized[key] = sanitize_input(value)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value)
        else:
            sanitized[key] = value
    return sanitized


# ─────────────────────────────────────────────────────
#  DEFENSA 3: IDOR — VERIFICACIÓN DE PROPIEDAD
# ─────────────────────────────────────────────────────

def verify_resource_ownership(current_user_id: str, resource_owner_id: str, resource_name: str = "recurso") -> None:
    """
    Verifica que el usuario autenticado sea el dueño del recurso solicitado.
    Lanza 403 Forbidden si hay intento de acceso IDOR.
    """
    if str(current_user_id) != str(resource_owner_id):
        raise HTTPException(
            status_code=403,
            detail=f"Acceso denegado: no tienes permisos para acceder a este {resource_name}."
        )


def verify_account_ownership(current_user, account) -> None:
    """
    Verifica que la cuenta bancaria pertenece al usuario autenticado.
    """
    if account is None:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada.")
    if str(account.usuario_id) != str(current_user.id):
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: esta cuenta no pertenece a tu usuario."
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
