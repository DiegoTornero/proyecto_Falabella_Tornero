from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Empresa
from app.dependencies import get_current_trabajador
from datetime import date

router = APIRouter()

def auto_seed_empresas(db: Session):
    seed_data = [
        {
            "ruc": "20512345678",
            "razon_social": "Textiles y Confecciones Gamarra S.A.C.",
            "tipo_empresa": "micro",
            "sector": "Textil y Confecciones",
            "facturacion_anual": 185000.0,
            "num_trabajadores": 8,
            "fecha_constitucion": date(2019, 5, 12),
            "representante_legal": "Carlos Huamán Mendoza",
            "email": "contacto@textilesgamarra.pe",
            "telefono": "01-4567890",
            "direccion": "Av. Gamarra 1234, La Victoria, Lima"
        },
        {
            "ruc": "20698765432",
            "razon_social": "Minimarket El Buen Vecino E.I.R.L.",
            "tipo_empresa": "micro",
            "sector": "Comercio Minorista",
            "facturacion_anual": 130000.0,
            "num_trabajadores": 4,
            "fecha_constitucion": date(2021, 8, 20),
            "representante_legal": "María Quispe Rojas",
            "email": "gerencia@elbuenvecino.pe",
            "telefono": "987654321",
            "direccion": "Jr. Los Olivos 456, SMP, Lima"
        },
        {
            "ruc": "20456789012",
            "razon_social": "Logística y Transportes del Norte S.A.C.",
            "tipo_empresa": "pequena",
            "sector": "Transporte y Logística",
            "facturacion_anual": 890000.0,
            "num_trabajadores": 24,
            "fecha_constitucion": date(2017, 3, 15),
            "representante_legal": "Jorge Torres Castro",
            "email": "operaciones@transportesnorte.com",
            "telefono": "044-234567",
            "direccion": "Panamericana Norte Km 560, Trujillo"
        },
        {
            "ruc": "20345678901",
            "razon_social": "Soluciones Agrícolas Valle Verde S.R.L.",
            "tipo_empresa": "pequena",
            "sector": "Agroindustria",
            "facturacion_anual": 640000.0,
            "num_trabajadores": 16,
            "fecha_constitucion": date(2018, 11, 4),
            "representante_legal": "Rosa Paredes Aliaga",
            "email": "ventas@valleverde.pe",
            "telefono": "056-345678",
            "direccion": "Fundo San José Lote 12, Ica"
        },
        {
            "ruc": "20711223344",
            "razon_social": "Consultora Tecnológica e Innovación S.A.C.",
            "tipo_empresa": "micro",
            "sector": "Servicios y Tecnología",
            "facturacion_anual": 260000.0,
            "num_trabajadores": 6,
            "fecha_constitucion": date(2022, 1, 10),
            "representante_legal": "Diego Tornero Bermúdez",
            "email": "dtornero@innovaciontec.pe",
            "telefono": "999888777",
            "direccion": "Av. Javier Prado Este 4560, Surco, Lima"
        },
        {
            "ruc": "20123456789",
            "razon_social": "Distribuidora de Alimentos del Sur S.A.",
            "tipo_empresa": "mediana",
            "sector": "Distribución Mayorista",
            "facturacion_anual": 3800000.0,
            "num_trabajadores": 48,
            "fecha_constitucion": date(2014, 6, 25),
            "representante_legal": "Fernando Salazar Silva",
            "email": "fsalazar@alimentosdelsur.com.pe",
            "telefono": "054-456789",
            "direccion": "Parque Industrial Manzana C Lote 4, Arequipa"
        }
    ]
    for d in seed_data:
        emp = Empresa(**d)
        db.add(emp)
    db.commit()

@router.get("")
@router.get("/")
def listar_empresas(db: Session = Depends(get_db), current_trabajador=Depends(get_current_trabajador)):
    """Lista todas las empresas activas registradas. Si la tabla está vacía, realiza auto-seeding."""
    if db.query(Empresa).count() == 0:
        auto_seed_empresas(db)
        
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
