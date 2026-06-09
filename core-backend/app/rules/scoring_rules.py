from datetime import date

# ─────────────────────────────────────────────
# JERARQUÍA DE ROLES (orden ascendente de poder)
# ─────────────────────────────────────────────
ROL_JERARQUIA = ["asesor", "jefe_regional", "riesgos", "comite", "gerencia"]

ROL_MINIMO_TRANSICION = {
    "judicial": "riesgos",
    "castigo":  "gerencia"
}

BANDAS_MORA = [
    {"nombre": "preventiva", "min_dias": 1,   "max_dias": 30,  "label": "Preventiva (1–30 días)"},
    {"nombre": "temprana",   "min_dias": 31,  "max_dias": 60,  "label": "Temprana (31–60 días)"},
    {"nombre": "tardia",     "min_dias": 61,  "max_dias": 120, "label": "Tardía (61–120 días)"},
    {"nombre": "judicial",   "min_dias": 121, "max_dias": 180, "label": "Judicial (121–180 días)"},
    {"nombre": "castigo",    "min_dias": 181, "max_dias": 9999,"label": "Castigo (>180 días)"},
]


# ─────────────────────────────────────────────
# ELEGIBILIDAD (sujeto de crédito)
# ─────────────────────────────────────────────
def verificar_elegibilidad(
    edad: int,
    tiene_cuenta_activa: bool,
    creditos_rechazados_recientes: int
) -> dict:
    """
    Verifica si el solicitante cumple los requisitos básicos para un crédito.
    Retorna {"elegible": bool, "motivo": str}
    """
    if edad < 22:
        return {"elegible": False, "motivo": f"Edad mínima requerida: 22 años. Edad actual: {edad}"}
    if edad > 70:
        return {"elegible": False, "motivo": f"Edad máxima permitida: 70 años. Edad actual: {edad}"}
    if not tiene_cuenta_activa:
        return {"elegible": False, "motivo": "Se requiere al menos una cuenta bancaria activa en Banco Falabella"}
    if creditos_rechazados_recientes >= 2:
        return {
            "elegible": False,
            "motivo": f"Registra {creditos_rechazados_recientes} solicitudes rechazadas en los últimos 6 meses. Máximo permitido: 1"
        }
    return {"elegible": True, "motivo": "Cumple todos los requisitos de elegibilidad"}


# ─────────────────────────────────────────────
# SCORING DETERMINÍSTICO (0–1000)
# ─────────────────────────────────────────────
def calcular_score(
    edad: int,
    monto: float,
    plazo: int,
    tiene_historial_negativo: bool = False
) -> int:
    """
    Motor de scoring determinístico. No usa aleatoriedad.
    Score de 0 a 1000.
    """
    score = 500

    # ── Factor edad ──
    if 25 <= edad <= 55:
        score += 150
    elif (22 <= edad < 25) or (55 < edad <= 70):
        score += 50
    else:
        score -= 100  # fuera del rango elegible, igual se calcula

    # ── Factor monto ──
    if monto < 5_000:
        score += 100
    elif monto < 15_000:
        score += 50
    elif monto < 30_000:
        score += 0
    elif monto < 50_000:
        score -= 50
    else:
        score -= 100

    # ── Factor plazo ──
    if plazo <= 12:
        score += 50
    elif plazo <= 24:
        score += 20
    elif plazo <= 48:
        score -= 30
    else:
        score -= 80

    # ── Factor historial ──
    if tiene_historial_negativo:
        score -= 150
    else:
        score += 80

    return max(0, min(1000, score))


# ─────────────────────────────────────────────
# RDS — Relación Deuda-Sueldo con semáforo
# ─────────────────────────────────────────────
def calcular_rds(
    monto: float,
    plazo: int,
    tasa_anual: float,
    ingreso_mensual: float
) -> dict:
    """
    Calcula la Relación Deuda-Sueldo (RDS) y asigna semáforo de riesgo.
    Verde ≤ 30% | Amarillo ≤ 45% | Rojo > 45%
    """
    tasa_mensual = tasa_anual / 100 / 12
    if tasa_mensual > 0 and plazo > 0:
        cuota = (monto * tasa_mensual * (1 + tasa_mensual) ** plazo) / ((1 + tasa_mensual) ** plazo - 1)
    else:
        cuota = monto / max(plazo, 1)

    ingreso = max(ingreso_mensual, 1.0)
    rds = cuota / ingreso

    if rds <= 0.30:
        semaforo = "verde"
        label = "Riesgo Bajo"
    elif rds <= 0.45:
        semaforo = "amarillo"
        label = "Riesgo Medio"
    else:
        semaforo = "rojo"
        label = "Riesgo Alto"

    return {
        "cuota_mensual": round(cuota, 2),
        "rds": round(rds, 4),
        "rds_porcentaje": round(rds * 100, 2),
        "semaforo": semaforo,
        "semaforo_label": label,
    }


# ─────────────────────────────────────────────
# RUTA DE APROBACIÓN POR MONTO
# ─────────────────────────────────────────────
def calcular_ruta_aprobacion(monto: float) -> str:
    if monto < 5_000:
        return "asesor"
    elif monto < 15_000:
        return "jefe_regional"
    elif monto < 50_000:
        return "riesgos"
    else:
        return "comite"


def puede_aprobar(rol_trabajador: str, monto: float) -> bool:
    """Verifica si el rol del trabajador es suficiente para el monto solicitado."""
    if rol_trabajador == "gerencia":
        return True
    ruta = calcular_ruta_aprobacion(monto)
    if rol_trabajador not in ROL_JERARQUIA or ruta not in ROL_JERARQUIA:
        return False
    return ROL_JERARQUIA.index(rol_trabajador) >= ROL_JERARQUIA.index(ruta)


# ─────────────────────────────────────────────
# EVALUACIÓN FINAL DEL CRÉDITO
# ─────────────────────────────────────────────
def evaluar_credito_por_score(score: int, monto: float, rds_semaforo: str, tasa_min: float = 14.0, tasa_max: float = 18.0) -> tuple:
    """
    Retorna: (estado, monto_aprobado, tasa_interes, motivo)
    """
    ruta = calcular_ruta_aprobacion(monto)

    if score >= 650 and rds_semaforo == "verde":
        tasa = tasa_min
        return (
            "en_revision",
            monto,
            tasa,
            f"Score excelente: {score}/1000 (verde). Pre-aprobado. Requiere firma de {ruta}."
        )
    elif score >= 500:
        factor = max(0, min(1, (650 - score) / 150))
        tasa = round(tasa_min + (tasa_max - tasa_min) * factor, 2)
        return (
            "en_revision",
            0.0,
            tasa,
            f"Score aceptable: {score}/1000. RDS: {rds_semaforo}. Requiere revisión de {ruta}."
        )
    else:
        return (
            "rechazado",
            0.0,
            0.0,
            f"Score insuficiente: {score}/1000. Mínimo requerido: 500 puntos."
        )


# ─────────────────────────────────────────────
# MORA — Banda por días
# ─────────────────────────────────────────────
def calcular_banda_mora(dias_mora: int) -> str | None:
    if dias_mora <= 0:
        return None
    for banda in BANDAS_MORA:
        if banda["min_dias"] <= dias_mora <= banda["max_dias"]:
            return banda["nombre"]
    return "castigo"
