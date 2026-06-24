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


class Credito(Base):
    __tablename__ = "creditos"

    id = Column(String, primary_key=True, default=gen_uuid)
    usuario_id = Column(String, ForeignKey("usuarios.id"), nullable=True)
    empresa_id = Column(String, ForeignKey("empresas.id"), nullable=True)
    monto_solicitado = Column(Float, nullable=False)
    monto_aprobado = Column(Float, nullable=True)
    plazo_meses = Column(Integer, nullable=False)
    tasa_interes = Column(Float, default=18.0)
    estado = Column(String(30), default="enviado")
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
    cronograma = relationship("CronogramaPago", back_populates="credito")
    producto_activo = relationship("ProductoActivo")


class CronogramaPago(Base):
    __tablename__ = "cronograma_pagos"

    id = Column(String, primary_key=True, default=gen_uuid)
    credito_id = Column(String, ForeignKey("creditos.id"), nullable=False)
    numero_cuota = Column(Integer, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    monto_cuota = Column(Float, nullable=False)
    estado = Column(String(20), default="pendiente")
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
    credito_id = Column(String, ForeignKey("creditos.id"), nullable=False)
    trabajador_id = Column(String, ForeignKey("trabajadores.id"), nullable=False)
    accion = Column(String(50), nullable=False)
    comentario = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    credito = relationship("Credito")
    trabajador = relationship("Trabajador")


class GestionMora(Base):
    __tablename__ = "gestiones_mora"

    id = Column(String, primary_key=True, default=gen_uuid)
    credito_id = Column(String, ForeignKey("creditos.id"), nullable=False)
    trabajador_id = Column(String, ForeignKey("trabajadores.id"), nullable=False)
    tipo_gestion = Column(String(50), nullable=False)  # llamada, visita, carta, email, sms
    resultado = Column(String(100), nullable=True)
    comentario = Column(Text, nullable=True)
    fecha_gestion = Column(DateTime(timezone=True), server_default=func.now())

    credito = relationship("Credito")
    trabajador = relationship("Trabajador")