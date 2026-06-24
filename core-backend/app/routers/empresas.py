from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Empresa
from app.dependencies import get_current_trabajador

router = APIRouter()

@router.get("/")
def listar_empresas(db: Session = Depends(get_db), current_trabajador=Depends(get_current_trabajador)):
    """Lista todas las empresas activas registradas."""
    empresas = db.query(Empresa).filter(Empresa.activo == True).order_by(Empresa.razon_social).all()
    return [
        {
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
        }
        for e in empresas
    ]
