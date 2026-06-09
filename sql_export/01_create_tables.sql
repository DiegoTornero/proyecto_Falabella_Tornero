
CREATE TABLE productos_activos (
	id SERIAL NOT NULL, 
	codigo VARCHAR(20) NOT NULL, 
	nombre VARCHAR(100) NOT NULL, 
	tipo VARCHAR(50) NOT NULL, 
	tasa_minima FLOAT NOT NULL, 
	tasa_maxima FLOAT NOT NULL, 
	tasa_moratoria FLOAT NOT NULL, 
	costo_membresia FLOAT, 
	tope_seguro_desgravamen FLOAT, 
	tasa_seguro_desgravamen FLOAT, 
	activo BOOLEAN, 
	PRIMARY KEY (id), 
	UNIQUE (codigo)
)

;


CREATE TABLE productos_pasivos (
	id SERIAL NOT NULL, 
	codigo VARCHAR(20) NOT NULL, 
	nombre VARCHAR(100) NOT NULL, 
	trea_minima FLOAT NOT NULL, 
	trea_maxima FLOAT NOT NULL, 
	costo_mantenimiento FLOAT, 
	saldo_minimo_equilibrio FLOAT, 
	activo BOOLEAN, 
	PRIMARY KEY (id), 
	UNIQUE (codigo)
)

;


CREATE TABLE trabajadores (
	id VARCHAR NOT NULL, 
	codigo_empleado VARCHAR(20) NOT NULL, 
	nombre VARCHAR(100) NOT NULL, 
	email VARCHAR(150), 
	password_hash VARCHAR(255), 
	rol VARCHAR(50), 
	activo BOOLEAN, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	UNIQUE (codigo_empleado), 
	UNIQUE (email)
)

;


CREATE TABLE usuarios (
	id VARCHAR NOT NULL, 
	nombre VARCHAR(100) NOT NULL, 
	apellido VARCHAR(100) NOT NULL, 
	dni VARCHAR(20) NOT NULL, 
	email VARCHAR(150) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	telefono VARCHAR(20), 
	direccion VARCHAR(255), 
	fecha_nacimiento DATE, 
	ingreso_mensual FLOAT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	UNIQUE (dni), 
	UNIQUE (email)
)

;


CREATE TABLE creditos (
	id VARCHAR NOT NULL, 
	usuario_id VARCHAR NOT NULL, 
	monto_solicitado FLOAT NOT NULL, 
	monto_aprobado FLOAT, 
	plazo_meses INTEGER NOT NULL, 
	tasa_interes FLOAT, 
	estado VARCHAR(30), 
	proposito TEXT, 
	tipo_producto VARCHAR(30), 
	ingreso_cliente FLOAT, 
	score_crediticio INTEGER, 
	rds_valor FLOAT, 
	rds_semaforo VARCHAR(20), 
	ruta_aprobacion VARCHAR(30), 
	trabajador_asignado_id VARCHAR, 
	dias_mora INTEGER, 
	banda_mora VARCHAR(30), 
	producto_activo_id INTEGER, 
	cobra_seguro_desgravamen BOOLEAN, 
	membresia_anual_cobrada BOOLEAN, 
	dia_corte INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(usuario_id) REFERENCES usuarios (id), 
	FOREIGN KEY(trabajador_asignado_id) REFERENCES trabajadores (id), 
	FOREIGN KEY(producto_activo_id) REFERENCES productos_activos (id)
)

;


CREATE TABLE cuentas_ahorro (
	id SERIAL NOT NULL, 
	numero_cuenta VARCHAR(20) NOT NULL, 
	usuario_id VARCHAR(50) NOT NULL, 
	producto_pasivo_id INTEGER NOT NULL, 
	saldo_actual FLOAT, 
	fecha_apertura TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
	estado VARCHAR(20), 
	PRIMARY KEY (id), 
	UNIQUE (numero_cuenta), 
	FOREIGN KEY(usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE, 
	FOREIGN KEY(producto_pasivo_id) REFERENCES productos_pasivos (id)
)

;


CREATE TABLE cronograma_pagos (
	id VARCHAR NOT NULL, 
	credito_id VARCHAR NOT NULL, 
	numero_cuota INTEGER NOT NULL, 
	fecha_vencimiento DATE NOT NULL, 
	monto_cuota FLOAT NOT NULL, 
	estado VARCHAR(20), 
	seguro_desgravamen FLOAT, 
	mora_acumulada FLOAT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(credito_id) REFERENCES creditos (id)
)

;


CREATE TABLE gestiones_mora (
	id VARCHAR NOT NULL, 
	credito_id VARCHAR NOT NULL, 
	trabajador_id VARCHAR NOT NULL, 
	tipo_gestion VARCHAR(50) NOT NULL, 
	resultado VARCHAR(100), 
	comentario TEXT, 
	fecha_gestion TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(credito_id) REFERENCES creditos (id), 
	FOREIGN KEY(trabajador_id) REFERENCES trabajadores (id)
)

;


CREATE TABLE historial_creditos (
	id VARCHAR NOT NULL, 
	credito_id VARCHAR NOT NULL, 
	trabajador_id VARCHAR NOT NULL, 
	accion VARCHAR(50) NOT NULL, 
	comentario TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(credito_id) REFERENCES creditos (id), 
	FOREIGN KEY(trabajador_id) REFERENCES trabajadores (id)
)

;


CREATE TABLE movimientos_ahorro (
	id SERIAL NOT NULL, 
	cuenta_ahorro_id INTEGER NOT NULL, 
	tipo_movimiento VARCHAR(50) NOT NULL, 
	monto FLOAT NOT NULL, 
	saldo_resultante FLOAT NOT NULL, 
	descripcion VARCHAR(200), 
	fecha_movimiento TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), 
	PRIMARY KEY (id), 
	FOREIGN KEY(cuenta_ahorro_id) REFERENCES cuentas_ahorro (id) ON DELETE CASCADE
)

;

