from app.services.transferencia_service import TransferenciaService
from app.schemas.schemas import TransferenciaSchema

transferencia_service = TransferenciaService()

class TransferenciaController:
    def realizar(self, data: TransferenciaSchema):
        return transferencia_service.realizar(
            data.cuenta_origen_id,
            data.numero_cuenta_destino,
            data.monto,
            data.descripcion
        )

    def get_transferencias(self, cuenta_id: str):
        return transferencia_service.get_transferencias(cuenta_id)