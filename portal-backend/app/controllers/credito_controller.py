from app.services.credito_service import CreditoService
from app.schemas.schemas import SolicitudCreditoSchema, ActualizarEstadoSchema

credito_service = CreditoService()

class CreditoController:
    def get_creditos(self, usuario_id: str):
        return credito_service.get_creditos(usuario_id)

    def get_todos(self):
        return credito_service.get_todos()

    def solicitar(self, data: SolicitudCreditoSchema):
        return credito_service.solicitar(data.model_dump())

    def actualizar_estado(self, credito_id: str, data: ActualizarEstadoSchema):
        return credito_service.actualizar_estado(credito_id, data.estado, data.monto_aprobado)

    def get_cronograma(self, credito_id: str):
        return credito_service.get_cronograma(credito_id)