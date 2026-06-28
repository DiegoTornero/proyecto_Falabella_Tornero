from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import DepositoPlazo, PuntoCMR, ContactoTransferencia, Notificacion, Usuario
from app.dependencies import get_current_trabajador

router = APIRouter()

@router.get("")
@router.get("/")
def get_operaciones_summary(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    return {
        "plazos_fijos": db.query(DepositoPlazo).count(),
        "puntos_cmr": db.query(PuntoCMR).count(),
        "contactos": db.query(ContactoTransferencia).count(),
        "notificaciones": db.query(Notificacion).count()
    }

@router.get("/plazos-fijos")
def get_all_plazos_fijos(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    """Retorna todos los depósitos a plazo fijo y captaciones registradas en el banco."""
    plazos = db.query(DepositoPlazo).order_by(DepositoPlazo.fecha_apertura.desc()).all()
    res = []
    for p in plazos:
        cliente_nombre = f"{p.usuario.nombre} {p.usuario.apellido}" if p.usuario else "Desconocido"
        dni = p.usuario.dni if p.usuario else "—"
        res.append({
            "id": p.id,
            "monto_invertido": p.monto_invertido,
            "plazo_meses": p.plazo_meses,
            "trea": p.trea,
            "ganancia_estimada": p.ganancia_estimada,
            "fecha_apertura": p.fecha_apertura,
            "fecha_vencimiento": p.fecha_vencimiento,
            "estado": p.estado,
            "cliente_nombre": cliente_nombre,
            "cliente_dni": dni
        })
    return res

@router.get("/puntos-cmr")
def get_all_puntos_cmr(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    """Retorna el estado del programa de fidelización Puntos CMR de todos los clientes."""
    puntos = db.query(PuntoCMR).all()
    res = []
    for pt in puntos:
        cliente_nombre = f"{pt.usuario.nombre} {pt.usuario.apellido}" if pt.usuario else "Desconocido"
        dni = pt.usuario.dni if pt.usuario else "—"
        res.append({
            "id": pt.id,
            "puntos_disponibles": pt.puntos_disponibles,
            "puntos_acumulados_totales": pt.puntos_acumulados_totales,
            "puntos_canjeados": pt.puntos_canjeados,
            "nivel": pt.nivel,
            "cliente_nombre": cliente_nombre,
            "cliente_dni": dni
        })
    return res

@router.get("/contactos")
def get_all_contactos(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    """Retorna los contactos interbancarios frecuentes registrados en la plataforma."""
    contactos = db.query(ContactoTransferencia).order_by(ContactoTransferencia.created_at.desc()).limit(100).all()
    res = []
    for c in contactos:
        dueno = f"{c.usuario.nombre} {c.usuario.apellido}" if c.usuario else "Desconocido"
        res.append({
            "id": c.id,
            "alias": c.alias,
            "banco_destino": c.banco_destino,
            "numero_cuenta": c.numero_cuenta,
            "dni_titular": c.dni_titular or "—",
            "nombre_titular": c.nombre_titular or c.alias,
            "dueno_cuenta": dueno,
            "created_at": c.created_at
        })
    return res

@router.get("/notificaciones")
def get_all_notificaciones(db: Session = Depends(get_db), trabajador=Depends(get_current_trabajador)):
    """Historial de notificaciones y alertas enviadas a los clientes."""
    notifs = db.query(Notificacion).order_by(Notificacion.fecha.desc()).limit(100).all()
    res = []
    for n in notifs:
        destinatario = f"{n.usuario.nombre} {n.usuario.apellido}" if n.usuario else "Desconocido"
        res.append({
            "id": n.id,
            "titulo": n.titulo,
            "mensaje": n.mensaje,
            "tipo": n.tipo,
            "leida": n.leida,
            "fecha": n.fecha,
            "destinatario": destinatario
        })
    return res
