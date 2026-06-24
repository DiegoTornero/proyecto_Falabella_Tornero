from app.services.usuario_service import UsuarioService
from app.schemas.schemas import ActualizarUsuarioSchema

usuario_service = UsuarioService()

class UsuarioController:
    def get_usuario(self, usuario_id: str):
        return usuario_service.get_usuario(usuario_id)

    def update_usuario(self, usuario_id: str, data: ActualizarUsuarioSchema):
        return usuario_service.update_usuario(usuario_id, data.model_dump())
        