from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.models.models import Empresa, Credito, ProductoActivo
from app.schemas.schemas import RegistroEmpresaSchema, SolicitudCreditoEmpresarialSchema
from app.dependencies import get_current_user
import uuid
import requests
import os

router = APIRouter()


# ─── LISTAR / BUSCAR EMPRESAS ────────────────────────────────────────────────

@router.get("/")
def listar_empresas(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Lista todas las empresas activas registradas."""
    empresas = db.query(Empresa).filter(Empresa.activo == True).order_by(Empresa.razon_social).all()
    return [_empresa_dict(e) for e in empresas]


@router.get("/buscar")
def buscar_empresa(ruc: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Busca una empresa por RUC exacto."""
    empresa = db.query(Empresa).filter(Empresa.ruc == ruc).first()
    if not empresa:
        raise HTTPException(status_code=404, detail=f"No se encontró empresa con RUC {ruc}")
    return _empresa_dict(empresa)


@router.get("/{empresa_id}")
def get_empresa(empresa_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Obtiene una empresa por ID con sus créditos activos."""
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    creditos = db.query(Credito).filter(Credito.empresa_id == empresa_id).order_by(Credito.created_at.desc()).all()
    creditos_data = [
        {
            "id": c.id,
            "monto_solicitado": c.monto_solicitado,
            "monto_aprobado": c.monto_aprobado,
            "plazo_meses": c.plazo_meses,
            "tasa_interes": c.tasa_interes,
            "estado": c.estado,
            "cobra_seguro_desgravamen": c.cobra_seguro_desgravamen,
            "created_at": c.created_at,
        }
        for c in creditos
    ]

    return {**_empresa_dict(empresa), "creditos": creditos_data}


# ─── REGISTRAR EMPRESA ───────────────────────────────────────────────────────

@router.post("/")
def registrar_empresa(data: RegistroEmpresaSchema, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Registra una nueva empresa en el sistema."""
    existente = db.query(Empresa).filter(Empresa.ruc == data.ruc).first()
    if existente:
        raise HTTPException(status_code=400, detail=f"Ya existe una empresa registrada con RUC {data.ruc}")

    fecha_const = None
    if data.fecha_constitucion:
        try:
            fecha_const = date.fromisoformat(data.fecha_constitucion)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    nueva = Empresa(
        id=str(uuid.uuid4()),
        ruc=data.ruc,
        razon_social=data.razon_social,
        tipo_empresa=data.tipo_empresa or "micro",
        sector=data.sector,
        facturacion_anual=data.facturacion_anual or 0.0,
        num_trabajadores=data.num_trabajadores or 1,
        fecha_constitucion=fecha_const,
        representante_legal=data.representante_legal,
        email=data.email,
        telefono=data.telefono,
        direccion=data.direccion,
        activo=True,
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"mensaje": "Empresa registrada exitosamente", **_empresa_dict(nueva)}


# ─── SOLICITAR CRÉDITO EMPRESARIAL ──────────────────────────────────────────

@router.post("/{empresa_id}/credito")
def solicitar_credito_empresarial(
    empresa_id: str,
    data: SolicitudCreditoEmpresarialSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Solicita un Crédito Empresarial – Micro Micro para una empresa.
    TEA 40.92% con seguro de desgravamen / 43.92% sin seguro.
    Todas las cuotas son fijas (sistema francés).
    """
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    if not empresa.activo:
        raise HTTPException(status_code=400, detail="La empresa está inactiva")

    # Buscar producto EMP-MICRO
    producto = db.query(ProductoActivo).filter(ProductoActivo.codigo == "EMP-MICRO").first()
    if not producto:
        raise HTTPException(status_code=500, detail="Producto EMP-MICRO no configurado en el sistema")

    # TEA según seguro
    tea = producto.tasa_minima if data.cobra_seguro_desgravamen else producto.tasa_maxima

    # Crear crédito (empresa_id en lugar de usuario_id)
    credito_id = str(uuid.uuid4())
    credito = Credito(
        id=credito_id,
        empresa_id=empresa_id,
        monto_solicitado=data.monto_solicitado,
        plazo_meses=data.plazo_meses,
        tasa_interes=tea,
        usuario_id=current_user.id,
        proposito=data.proposito,
        tipo_producto="empresarial_micro",
        ingreso_cliente=empresa.facturacion_anual / 12 if empresa.facturacion_anual else 0.0,
        dia_corte=data.dia_pago if data.dia_pago else 3,
        cobra_seguro_desgravamen=data.cobra_seguro_desgravamen,
        producto_activo_id=producto.id,
        estado="enviado",
    )
    db.add(credito)
    db.commit()
    db.refresh(credito)

    # Calcular cuota fija (sistema francés) para devolver al cliente
    cuota_mensual = _calcular_cuota_fija(data.monto_solicitado, tea, data.plazo_meses)

    # Llamar al Core para scoring empresarial
    try:
        core_payload = {
            "empresa_id": empresa_id,
            "credito_id": credito_id,
            "monto_solicitado": data.monto_solicitado,
            "plazo_meses": data.plazo_meses,
            "cobra_seguro_desgravamen": data.cobra_seguro_desgravamen,
        }
        CORE_API_URL = os.getenv("CORE_API_URL", "http://127.0.0.1:8001")
        res = requests.post(f"{CORE_API_URL}/scoring/evaluar-empresarial", json=core_payload, timeout=5)
        if res.status_code == 200:
            core_data = res.json()
            credito.estado = core_data.get("estado", "enviado")
            credito.score_crediticio = core_data.get("score")
            credito.rds_valor = core_data.get("rds_porcentaje", 0) / 100
            credito.rds_semaforo = core_data.get("rds_semaforo")
            credito.ruta_aprobacion = core_data.get("ruta_aprobacion")
            if core_data.get("monto_aprobado"):
                credito.monto_aprobado = core_data["monto_aprobado"]
                credito.tasa_interes = core_data.get("tasa_interes", tea)
                cuota_mensual = _calcular_cuota_fija(
                    credito.monto_aprobado, credito.tasa_interes, data.plazo_meses
                )
            db.commit()
            db.refresh(credito)
    except Exception as e:
        print(f"⚠️  Core Financiero no disponible para scoring empresarial: {e}")

    return {
        "mensaje": "Solicitud de crédito empresarial enviada",
        "credito_id": credito.id,
        "empresa": empresa.razon_social,
        "ruc": empresa.ruc,
        "tipo_producto": "Crédito Empresarial – Micro Micro",
        "monto_solicitado": data.monto_solicitado,
        "plazo_meses": data.plazo_meses,
        "tea_aplicada": tea,
        "seguro_desgravamen": data.cobra_seguro_desgravamen,
        "cuota_mensual_estimada": round(cuota_mensual, 2),
        "estado": credito.estado,
    }


# ─── HELPERS ────────────────────────────────────────────────────────────────

def _empresa_dict(e: Empresa) -> dict:
    return {
        "id": e.id,
        "ruc": e.ruc,
        "razon_social": e.razon_social,
        "tipo_empresa": e.tipo_empresa,
        "sector": e.sector,
        "facturacion_anual": e.facturacion_anual,
        "num_trabajadores": e.num_trabajadores,
        "fecha_constitucion": str(e.fecha_constitucion) if e.fecha_constitucion else None,
        "representante_legal": e.representante_legal,
        "email": e.email,
        "telefono": e.telefono,
        "direccion": e.direccion,
        "activo": e.activo,
        "created_at": e.created_at,
    }


def _calcular_cuota_fija(monto: float, tea: float, plazo: int) -> float:
    """Sistema francés: todas las cuotas son iguales."""
    i = (1 + tea / 100) ** (1 / 12) - 1  # tasa mensual TEM
    if i == 0:
        return monto / plazo
    return (monto * i * (1 + i) ** plazo) / ((1 + i) ** plazo - 1)
