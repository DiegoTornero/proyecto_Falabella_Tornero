from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Usuario, CuentaAhorro, Credito, CronogramaPago
from app.dependencies import get_current_trabajador

router = APIRouter()

@router.get("/buscar")
def buscar_cliente(q: str, db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    """Busca clientes por DNI o Nombre"""
    if not q or len(q) < 3:
        return []
        
    termino = f"%{q}%"
    clientes = db.query(Usuario).filter(
        (Usuario.dni.ilike(termino)) | 
        (Usuario.nombre.ilike(termino)) | 
        (Usuario.apellido.ilike(termino))
    ).limit(10).all()
    
    return [
        {
            "id": c.id,
            "nombre_completo": f"{c.nombre} {c.apellido}",
            "dni": c.dni,
            "email": c.email,
            "telefono": c.telefono,
            "ingreso_mensual": c.ingreso_mensual
        } for c in clientes
    ]

@router.get("/{usuario_id}/360")
def get_cliente_360(usuario_id: str, db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    """Vista 360: Retorna datos personales, cuentas y créditos del cliente."""
    cliente = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    # Cuentas de Ahorro
    cuentas = db.query(CuentaAhorro).filter(CuentaAhorro.usuario_id == usuario_id).all()
    cuentas_data = [{
        "id": c.id,
        "numero_cuenta": c.numero_cuenta,
        "saldo": c.saldo_actual,
        "estado": c.estado,
        "producto": c.producto.nombre if c.producto else "Ahorros"
    } for c in cuentas]
    
    # Créditos y su cronograma
    creditos = db.query(Credito).filter(Credito.usuario_id == usuario_id).all()
    creditos_data = []
    for cred in creditos:
        cronograma = db.query(CronogramaPago).filter(CronogramaPago.credito_id == cred.id).order_by(CronogramaPago.numero_cuota).all()
        pagadas = len([c for c in cronograma if c.estado == 'pagado'])
        total_cuotas = len(cronograma)
        
        creditos_data.append({
            "id": cred.id,
            "producto": cred.tipo_producto,
            "estado": cred.estado,
            "monto_solicitado": cred.monto_solicitado,
            "monto_aprobado": cred.monto_aprobado,
            "dias_mora": cred.dias_mora,
            "cuotas_pagadas": pagadas,
            "total_cuotas": total_cuotas,
            "fecha_solicitud": cred.created_at
        })

    return {
        "perfil": {
            "id": cliente.id,
            "nombre": f"{cliente.nombre} {cliente.apellido}",
            "dni": cliente.dni,
            "email": cliente.email,
            "telefono": cliente.telefono,
            "direccion": cliente.direccion,
            "ingreso_mensual": cliente.ingreso_mensual,
            "fecha_registro": cliente.created_at
        },
        "cuentas": cuentas_data,
        "creditos": creditos_data
    }
