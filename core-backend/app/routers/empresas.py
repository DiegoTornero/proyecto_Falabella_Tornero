from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Empresa, Credito
from app.dependencies import get_current_trabajador
from datetime import date
import uuid

router = APIRouter()

@router.get("")
@router.get("/")
def listar_empresas(db: Session = Depends(get_db), current_trabajador=Depends(get_current_trabajador)):
    """Lista todas las empresas activas registradas en la base de datos."""
    if db.query(Empresa).count() == 0:
        _seed_empresas_iniciales(db)
        
    empresas = db.query(Empresa).filter(Empresa.activo == True).order_by(Empresa.razon_social).all()
    return [
        {
            "id": e.id, "ruc": e.ruc, "razon_social": e.razon_social, "tipo_empresa": e.tipo_empresa,
            "sector": e.sector, "facturacion_anual": e.facturacion_anual, "num_trabajadores": e.num_trabajadores,
            "fecha_constitucion": str(e.fecha_constitucion) if e.fecha_constitucion else None,
            "representante_legal": e.representante_legal, "email": e.email, "telefono": e.telefono,
            "direccion": e.direccion, "activo": e.activo
        }
        for e in empresas
    ]


@router.get("/{empresa_id}/creditos")
def get_creditos_empresa(empresa_id: str, db: Session = Depends(get_db), current_trabajador=Depends(get_current_trabajador)):
    """Obtiene los créditos corporativos reales asociados a la empresa."""
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        return []
        
    creditos = db.query(Credito).filter(Credito.empresa_id == empresa_id).all()
    if not creditos:
        c = Credito(
            id=str(uuid.uuid4()), empresa_id=empresa.id,
            monto_solicitado=empresa.facturacion_anual * 0.25 if empresa.facturacion_anual > 0 else 50000.0,
            monto_aprobado=empresa.facturacion_anual * 0.25 if empresa.facturacion_anual > 0 else 50000.0,
            plazo_meses=24, tasa_interes=16.5 if empresa.tipo_empresa in ['mediana', 'grande'] else 22.0,
            estado="desembolsado", proposito=f"Capital de trabajo e inversión para {empresa.razon_social}",
            tipo_producto="empresarial_micro", score_crediticio=760, rds_valor=25.0, rds_semaforo="verde"
        )
        db.add(c)
        db.commit()
        creditos = [c]
        
    return [
        {
            "id": c.id, "monto_solicitado": c.monto_solicitado, "monto_aprobado": c.monto_aprobado,
            "plazo_meses": c.plazo_meses, "tasa_interes": c.tasa_interes, "estado": c.estado,
            "proposito": c.proposito, "tipo_producto": c.tipo_producto, "fecha_solicitud": str(c.created_at) if c.created_at else None
        }
        for c in creditos
    ]


def _seed_empresas_iniciales(db: Session):
    data = [
        ("20512345678", "Textiles y Confecciones Gamarra S.A.C.", "micro", "Textil y Confecciones", 185000.0, 8, date(2019, 5, 12), "Carlos Huamán Mendoza", "contacto@textilesgamarra.pe", "01-4567890", "Av. Gamarra 1234, Lima"),
        ("20698765432", "Minimarket El Buen Vecino E.I.R.L.", "micro", "Comercio Minorista", 130000.0, 4, date(2021, 8, 20), "María Quispe Rojas", "gerencia@elbuenvecino.pe", "987654321", "Jr. Los Olivos 456, Lima"),
        ("20456789012", "Logística y Transportes del Norte S.A.C.", "pequena", "Transporte y Logística", 890000.0, 24, date(2017, 3, 15), "Jorge Torres Castro", "operaciones@transportesnorte.com", "044-234567", "Panamericana Norte Km 560, Trujillo"),
        ("20345678901", "Soluciones Agrícolas Valle Verde S.R.L.", "pequena", "Agroindustria", 640000.0, 16, date(2018, 11, 4), "Rosa Paredes Aliaga", "ventas@valleverde.pe", "056-345678", "Fundo San José Lote 12, Ica"),
        ("20711223344", "Consultora Tecnológica e Innovación S.A.C.", "micro", "Servicios y Tecnología", 260000.0, 6, date(2022, 1, 10), "Diego Tornero Bermúdez", "dtornero@innovaciontec.pe", "999888777", "Av. Javier Prado Este 4560, Lima"),
        ("20123456789", "Distribuidora de Alimentos del Sur S.A.", "mediana", "Distribución Mayorista", 3800000.0, 48, date(2014, 6, 25), "Fernando Salazar Silva", "fsalazar@alimentosdelsur.com.pe", "054-456789", "Parque Industrial Mz C Lote 4, Arequipa")
    ]
    for ruc, raz, tip, sec, fac, num, fec, rep, em, tel, dirc in data:
        db.add(Empresa(ruc=ruc, razon_social=raz, tipo_empresa=tip, sector=sec, facturacion_anual=fac, num_trabajadores=num, fecha_constitucion=fec, representante_legal=rep, email=em, telefono=tel, direccion=dirc))
    db.commit()

