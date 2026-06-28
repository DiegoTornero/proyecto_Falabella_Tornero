from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import ProductoActivo, ProductoPasivo
from app.dependencies import get_current_trabajador

router = APIRouter()

def auto_seed_productos(db: Session):
    if db.query(ProductoActivo).count() == 0:
        p1 = ProductoActivo(codigo="CRED-PERS", nombre="Crédito Personal Efectivo", tipo="personal", tasa_minima=14.5, tasa_maxima=28.0, tasa_moratoria=5.0, costo_membresia=0.0, tasa_seguro_desgravamen=0.075, activo=True)
        p2 = ProductoActivo(codigo="CRED-VEHI", nombre="Crédito Vehicular Rápido", tipo="vehicular", tasa_minima=10.5, tasa_maxima=18.0, tasa_moratoria=4.0, costo_membresia=0.0, tasa_seguro_desgravamen=0.060, activo=True)
        p3 = ProductoActivo(codigo="CRED-EMP", nombre="Financiamiento Microempresa", tipo="empresarial_micro", tasa_minima=18.0, tasa_maxima=35.0, tasa_moratoria=6.0, costo_membresia=0.0, tasa_seguro_desgravamen=0.080, activo=True)
        db.add_all([p1, p2, p3])
    if db.query(ProductoPasivo).count() == 0:
        pp1 = ProductoPasivo(codigo="AHOR-CERO", nombre="Cuenta Ahorro Costo Cero", trea_minima=0.5, trea_maxima=1.5, costo_mantenimiento=0.0, saldo_minimo_equilibrio=0.0, activo=True)
        pp2 = ProductoPasivo(codigo="PLAZ-FIJO", nombre="Depósito a Plazo Fijo Plus", trea_minima=5.5, trea_maxima=7.2, costo_mantenimiento=0.0, saldo_minimo_equilibrio=500.0, activo=True)
        pp3 = ProductoPasivo(codigo="CTS-FALA", nombre="Cuenta CTS Rendimiento Total", trea_minima=6.0, trea_maxima=7.5, costo_mantenimiento=0.0, saldo_minimo_equilibrio=0.0, activo=True)
        db.add_all([pp1, pp2, pp3])
    db.commit()

@router.get("")
@router.get("/")
def listar_productos(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    """Lista todos los productos activos y pasivos. Realiza auto-seeding si está vacío."""
    if db.query(ProductoActivo).count() == 0 or db.query(ProductoPasivo).count() == 0:
        auto_seed_productos(db)
        
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
