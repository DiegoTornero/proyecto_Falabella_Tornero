from sqlalchemy.orm import Session, joinedload
from app.models.models import Credito, CronogramaPago


class CreditoRepository:
    def get_by_usuario(self, db: Session, usuario_id: str) -> list:
        return (
            db.query(Credito)
            .filter(Credito.usuario_id == usuario_id)
            .order_by(Credito.created_at.desc())
            .all()
        )

    def get_all(self, db: Session) -> list:
        return db.query(Credito).options(joinedload(Credito.usuario)).all()

    def get_by_id(self, db: Session, credito_id: str) -> Credito | None:
        return db.query(Credito).filter(Credito.id == credito_id).first()

    def create(self, db: Session, data: dict) -> Credito:
        credito = Credito(**data)
        db.add(credito)
        db.commit()
        db.refresh(credito)
        return credito

    def update_estado(self, db: Session, credito_id: str, data: dict) -> Credito | None:
        credito = db.query(Credito).filter(Credito.id == credito_id).first()
        if not credito:
            return None
        for key, value in data.items():
            setattr(credito, key, value)
        db.commit()
        db.refresh(credito)
        return credito

    def get_cronograma(self, db: Session, credito_id: str) -> list:
        return (
            db.query(CronogramaPago)
            .filter(CronogramaPago.credito_id == credito_id)
            .order_by(CronogramaPago.numero_cuota)
            .all()
        )

    def create_cronograma(self, db: Session, cronograma: list) -> list:
        pagos = [CronogramaPago(**item) for item in cronograma]
        db.add_all(pagos)
        db.commit()
        return pagos
