from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.models import ContactoTransferencia
from app.dependencies import get_current_user
from app.security import verify_resource_ownership, sanitize_input

router = APIRouter()

class NuevoContactoSchema(BaseModel):
    usuario_id: str
    alias: str
    banco_destino: str = "Banco Falabella"
    numero_cuenta: str
    dni_titular: str = ""
    nombre_titular: str = ""

@router.get("/{usuario_id}")
def get_contactos(usuario_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    verify_resource_ownership(current_user.id, usuario_id, "contactos")
    contactos = db.query(ContactoTransferencia).filter(ContactoTransferencia.usuario_id == usuario_id).all()
    return [
        {
            "id": c.id,
            "alias": c.alias,
            "banco_destino": c.banco_destino,
            "numero_cuenta": c.numero_cuenta,
            "dni_titular": c.dni_titular,
            "nombre_titular": c.nombre_titular
        } for c in contactos
    ]

@router.post("/")
def agregar_contacto(data: NuevoContactoSchema, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    verify_resource_ownership(current_user.id, data.usuario_id, "adición de contacto")
    
    nuevo = ContactoTransferencia(
        alias=sanitize_input(data.alias),
        banco_destino=sanitize_input(data.banco_destino),
        numero_cuenta=sanitize_input(data.numero_cuenta),
        dni_titular=sanitize_input(data.dni_titular),
        nombre_titular=sanitize_input(data.nombre_titular),
        usuario_id=data.usuario_id
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Contacto guardado exitosamente", "id": nuevo.id}

@router.delete("/{contacto_id}")
def eliminar_contacto(contacto_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    contacto = db.query(ContactoTransferencia).filter(ContactoTransferencia.id == contacto_id).first()
    if not contacto:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    verify_resource_ownership(current_user.id, contacto.usuario_id, "eliminación de contacto")
    
    db.delete(contacto)
    db.commit()
    return {"mensaje": "Contacto eliminado exitosamente"}
