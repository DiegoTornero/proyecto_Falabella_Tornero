from sqlalchemy.orm import Session
from app.models.models import Movimiento


class MovimientoRepository:
    def get_by_cuenta(self, db: Session, cuenta_id: str) -> list:
        return (
            db.query(Movimiento)
            .filter(Movimiento.cuenta_id == cuenta_id)
            .order_by(Movimiento.created_at.desc())
            .all()
        )

    def get_transferencias(self, db: Session, cuenta_id: str) -> list:
        return (
            db.query(Movimiento)
            .filter(Movimiento.cuenta_id == cuenta_id, Movimiento.tipo == "transferencia")
            .order_by(Movimiento.created_at.desc())
            .all()
        )

    def create(self, db: Session, data: dict) -> Movimiento:
        movimiento = Movimiento(**data)
        db.add(movimiento)
        db.commit()
        db.refresh(movimiento)
        return movimiento