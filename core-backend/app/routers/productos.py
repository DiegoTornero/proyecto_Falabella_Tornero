from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import ProductoActivo, ProductoPasivo
from app.dependencies import get_current_trabajador

router = APIRouter()

@router.get("/")
def listar_productos(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    """Lista todos los productos activos y pasivos"""
    activos = db.query(ProductoActivo).filter(ProductoActivo.activo == True).all()
    pasivos = db.query(ProductoPasivo).filter(ProductoPasivo.activo == True).all()
    
    return {
        "activos": [
            {
                "id": p.id,
                "codigo": p.codigo,
                "nombre": p.nombre,
                "tipo": p.tipo,
                "tasa_minima": p.tasa_minima,
                "tasa_maxima": p.tasa_maxima,
                "tasa_moratoria": p.tasa_moratoria,
                "costo_membresia": p.costo_membresia,
                "seguro_desgravamen": p.tasa_seguro_desgravamen
            } for p in activos
        ],
        "pasivos": [
            {
                "id": p.id,
                "codigo": p.codigo,
                "nombre": p.nombre,
                "trea_minima": p.trea_minima,
                "trea_maxima": p.trea_maxima,
                "costo_mantenimiento": p.costo_mantenimiento,
                "saldo_minimo_equilibrio": p.saldo_minimo_equilibrio
            } for p in pasivos
        ]
    }
