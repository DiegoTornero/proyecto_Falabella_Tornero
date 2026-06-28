import uuid
from sqlalchemy import Column, String, Float, Integer, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Empresa(Base):
    __tablename__ = "empresas"

    id                  = Column(String, primary_key=True, default=gen_uuid)
    ruc                 = Column(String(11), unique=True, nullable=False)
    razon_social        = Column(String(200), nullable=False)
    tipo_empresa        = Column(String(20), default="micro")
    sector              = Column(String(100), nullable=True)
    facturacion_anual   = Column(Float, default=0.0)
    num_trabajadores    = Column(Integer, default=1)
    fecha_constitucion  = Column(Date, nullable=True)
    representante_legal = Column(String(200), nullable=True)
    email               = Column(String(150), nullable=True)
    telefono            = Column(String(20), nullable=True)
    direccion           = Column(Text, nullable=True)
    activo              = Column(Boolean, default=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    creditos = relationship("Credito", back_populates="empresa")


class ProductoActivo(Base):
    __tablename__ = "productos_activos"
    id = Column(Integer, primary_key=True)
    codigo = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(100), nullable=False)
    tipo = Column(String(50), nullable=False)
    tasa_minima = Column(Float, nullable=False)
    tasa_maxima = Column(Float, nullable=False)
    tasa_moratoria = Column(Float, nullable=False)
    costo_membresia = Column(Float, default=0.0)
    tope_seguro_desgravamen = Column(Float, default=0.0)
    tasa_seguro_desgravamen = Column(Float, default=0.0)
    activo = Column(Boolean, default=True)

class ProductoPasivo(Base):
    __tablename__ = "productos_pasivos"
    id = Column(Integer, primary_key=True)
    codigo = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(100), nullable=False)
    trea_minima = Column(Float, nullable=False)
    trea_maxima = Column(Float, nullable=False)
    costo_mantenimiento = Column(Float, default=0.0)
    saldo_minimo_equilibrio = Column(Float, default=0.0)
    activo = Column(Boolean, default=True)

class CuentaAhorro(Base):
    __tablename__ = "cuentas_ahorro"
    id = Column(Integer, primary_key=True)
    numero_cuenta = Column(String(20), unique=True, nullable=False)
    usuario_id = Column(String(50), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    producto_pasivo_id = Column(Integer, ForeignKey("productos_pasivos.id"), nullable=False)
    saldo_actual = Column(Float, default=0.0)
    fecha_apertura = Column(DateTime, server_default=func.now())
    estado = Column(String(20), default="ACTIVA")

    usuario = relationship("Usuario", back_populates="cuentas_ahorro")
    producto = relationship("ProductoPasivo")
    movimientos = relationship("MovimientoAhorro", back_populates="cuenta")

class MovimientoAhorro(Base):
    __tablename__ = "movimientos_ahorro"
    id = Column(Integer, primary_key=True)
    cuenta_ahorro_id = Column(Integer, ForeignKey("cuentas_ahorro.id", ondelete="CASCADE"), nullable=False)
    tipo_movimiento = Column(String(50), nullable=False)
    monto = Column(Float, nullable=False)
    saldo_resultante = Column(Float, nullable=False)
    descripcion = Column(String(200), nullable=True)
    fecha_movimiento = Column(DateTime, server_default=func.now())

    cuenta = relationship("CuentaAhorro", back_populates="movimientos")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String, primary_key=True, default=gen_uuid)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    dni = Column(String(20), unique=True, nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    telefono = Column(String(20), nullable=True)
    direccion = Column(String(255), nullable=True)
    fecha_nacimiento = Column(Date, nullable=True)
    ingreso_mensual = Column(Float, default=3500.0)
    avatar = Column(String(100), default="avatar_default")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cuentas_ahorro = relationship("CuentaAhorro", back_populates="usuario")
    creditos = relationship("Credito", back_populates="usuario")
    tarjetas = relationship("Tarjeta", back_populates="usuario")
    depositos_plazo = relationship("DepositoPlazo", back_populates="usuario")
    puntos_cmr = relationship("PuntoCMR", back_populates="usuario", uselist=False)
    contactos = relationship("ContactoTransferencia", back_populates="usuario")
    notificaciones = relationship("Notificacion", back_populates="usuario")


class Credito(Base):
    __tablename__ = "creditos"

    id = Column(String, primary_key=True, default=gen_uuid)
    usuario_id = Column(String, ForeignKey("usuarios.id", ondelete="CASCADE"), index=True, nullable=True)
    empresa_id = Column(String, ForeignKey("empresas.id", ondelete="CASCADE"), index=True, nullable=True)
    monto_solicitado = Column(Float, nullable=False)
    monto_aprobado = Column(Float, nullable=True)
    plazo_meses = Column(Integer, nullable=False)
    tasa_interes = Column(Float, default=18.0)
    estado = Column(String(30), default="enviado", index=True)
    proposito = Column(Text, nullable=True)
    tipo_producto = Column(String(30), default="personal")
    ingreso_cliente = Column(Float, default=3500.0)
    score_crediticio = Column(Integer, nullable=True)
    rds_valor = Column(Float, nullable=True)
    rds_semaforo = Column(String(20), nullable=True)
    ruta_aprobacion = Column(String(30), nullable=True)
    trabajador_asignado_id = Column(String, ForeignKey("trabajadores.id"), nullable=True)
    dias_mora = Column(Integer, default=0)
    banda_mora = Column(String(30), nullable=True)
    producto_activo_id = Column(Integer, ForeignKey("productos_activos.id"), nullable=True)
    cobra_seguro_desgravamen = Column(Boolean, default=False)
    membresia_anual_cobrada = Column(Boolean, default=False)
    dia_corte = Column(Integer, default=20)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("Usuario", back_populates="creditos", foreign_keys=[usuario_id])
    empresa = relationship("Empresa", back_populates="creditos", foreign_keys=[empresa_id])
    cronograma = relationship("CronogramaPago", back_populates="credito", cascade="all, delete-orphan")
    producto_activo = relationship("ProductoActivo")


class CronogramaPago(Base):
    __tablename__ = "cronograma_pagos"

    id = Column(String, primary_key=True, default=gen_uuid)
    credito_id = Column(String, ForeignKey("creditos.id", ondelete="CASCADE"), index=True, nullable=False)
    numero_cuota = Column(Integer, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    monto_cuota = Column(Float, nullable=False)
    estado = Column(String(20), default="pendiente", index=True)
    seguro_desgravamen = Column(Float, default=0.0)
    mora_acumulada = Column(Float, default=0.0)

    credito = relationship("Credito", back_populates="cronograma")


class Trabajador(Base):
    __tablename__ = "trabajadores"

    id = Column(String, primary_key=True, default=gen_uuid)
    codigo_empleado = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    rol = Column(String(50), default="asesor")
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class HistorialCredito(Base):
    __tablename__ = "historial_creditos"

    id = Column(String, primary_key=True, default=gen_uuid)
    credito_id = Column(String, ForeignKey("creditos.id", ondelete="CASCADE"), index=True, nullable=False)
    trabajador_id = Column(String, ForeignKey("trabajadores.id"), nullable=False)
    accion = Column(String(50), nullable=False)
    comentario = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    credito = relationship("Credito")
    trabajador = relationship("Trabajador")


class GestionMora(Base):
    __tablename__ = "gestiones_mora"

    id = Column(String, primary_key=True, default=gen_uuid)
    credito_id = Column(String, ForeignKey("creditos.id", ondelete="CASCADE"), index=True, nullable=False)
    trabajador_id = Column(String, ForeignKey("trabajadores.id"), nullable=False)
    tipo_gestion = Column(String(50), nullable=False)  # llamada, visita, carta, email, sms
    resultado = Column(String(100), nullable=True)
    comentario = Column(Text, nullable=True)
    fecha_gestion = Column(DateTime(timezone=True), server_default=func.now())

    credito = relationship("Credito")
    trabajador = relationship("Trabajador")


class Tarjeta(Base):
    __tablename__ = "tarjetas"

    id = Column(String, primary_key=True, default=gen_uuid)
    numero_enmascarado = Column(String(20), nullable=False)
    cvv = Column(String(4), default="123")
    fecha_expiracion = Column(String(7), default="12/30")
    limite_credito = Column(Float, default=2000.0)
    saldo_disponible = Column(Float, default=2000.0)
    tipo = Column(String(30), default="DEBITO_CMR")  # DEBITO_CMR | CREDITO_CMR
    estado = Column(String(20), default="ACTIVA")  # ACTIVA | BLOQUEADA
    usuario_id = Column(String, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("Usuario", back_populates="tarjetas")


class DepositoPlazo(Base):
    __tablename__ = "depositos_plazo"

    id = Column(String, primary_key=True, default=gen_uuid)
    monto_invertido = Column(Float, nullable=False)
    plazo_meses = Column(Integer, nullable=False)
    trea = Column(Float, nullable=False)
    ganancia_estimada = Column(Float, nullable=False)
    fecha_apertura = Column(DateTime(timezone=True), server_default=func.now())
    fecha_vencimiento = Column(Date, nullable=False)
    estado = Column(String(20), default="ACTIVO")  # ACTIVO | FINALIZADO
    usuario_id = Column(String, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)

    usuario = relationship("Usuario", back_populates="depositos_plazo")


class PuntoCMR(Base):
    __tablename__ = "puntos_cmr"

    id = Column(String, primary_key=True, default=gen_uuid)
    puntos_disponibles = Column(Integer, default=500)
    puntos_acumulados_totales = Column(Integer, default=500)
    puntos_canjeados = Column(Integer, default=0)
    nivel = Column(String(30), default="Verde")  # Verde | Silver | Black
    usuario_id = Column(String, ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True, nullable=False)

    usuario = relationship("Usuario", back_populates="puntos_cmr")


class ContactoTransferencia(Base):
    __tablename__ = "contactos_transferencia"

    id = Column(String, primary_key=True, default=gen_uuid)
    alias = Column(String(100), nullable=False)
    banco_destino = Column(String(100), default="Banco Falabella")
    numero_cuenta = Column(String(30), nullable=False)
    dni_titular = Column(String(20), nullable=True)
    nombre_titular = Column(String(150), nullable=True)
    usuario_id = Column(String, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("Usuario", back_populates="contactos")


class Notificacion(Base):
    __tablename__ = "notificaciones"

    id = Column(String, primary_key=True, default=gen_uuid)
    titulo = Column(String(150), nullable=False)
    mensaje = Column(Text, nullable=False)
    leida = Column(Boolean, default=False)
    usuario_id = Column(String, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)

    usuario = relationship("Usuario", back_populates="notificaciones")


class AuditoriaReporteBI(Base):
    """
    Tabla de control y auditoría bancaria para el registro de exportaciones e informes BI.
    Garantiza el cumplimiento normativo (SBS/Superintendencia) sobre consultas de cartera.
    """
    __tablename__ = "auditoria_reportes_bi"

    id = Column(Integer, primary_key=True, index=True)
    fecha_generacion = Column(DateTime(timezone=True), server_default=func.now())
    usuario_auditor = Column(String(100), default="Analista BI Core")
    tipo_reporte = Column(String(100), index=True)  # Cartera Activa | Riesgo de Mora
    registros_exportados = Column(Integer, default=0)
    monto_total_cartera = Column(Float, default=0.0)
    ratio_mora_calculado = Column(Float, default=0.0)
    hash_verificacion = Column(String(64), nullable=True)


class ResumenEjecutivoCore(Base):
    """
    Tabla histórica de consolidados ejecutivos del Core Bancario para análisis de tendencias BI.
    """
    __tablename__ = "resumen_ejecutivo_core"

    id = Column(Integer, primary_key=True, index=True)
    fecha_corte = Column(String(20), index=True)
    cartera_total_activa = Column(Float, default=0.0)
    saldo_total_captado = Column(Float, default=0.0)
    desembolsos_totales = Column(Float, default=0.0)
    creditos_emitidos = Column(Integer, default=0)
    ratio_mora_global = Column(Float, default=0.0)
    cartera_morosa = Column(Float, default=0.0)