import sys
import os
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configuracion de conexion directa a Neon DB (Provista por el usuario)
NEON_DB_URL = "postgresql://neondb_owner:npg_v2MNrOmt8TBW@ep-twilight-water-atm701rq.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"

sys.path.append(os.path.join(os.path.dirname(__file__), "core-backend"))
from app.models.models import Credito, Empresa, Usuario

print("=======================================================================")
print(" POBLANDO BASE DE DATOS EN LA NUBE (NEON POSTGRESQL) CON DATA REALISTA")
print("=======================================================================")

engine = create_engine(NEON_DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # 1. Obtener empresas y usuarios existentes o crear algunos si no hay
    empresas = db.query(Empresa).all()
    usuarios = db.query(Usuario).all()

    if not empresas:
        print("Creando 8 Empresas/Sucursales base...")
        sucursales = [
            ("OF. PRINCIPAL", "Zona Lima"), ("AG. LIMA 1", "Zona Lima"), ("AG. LIMA 2", "Zona Lima"),
            ("AG. SUR 1", "Zona Sur"), ("AG. SUR 2", "Zona Sur"), ("AG. SUR 3", "Zona Sur"),
            ("AG. NORTE 6", "Zona Norte"), ("AG. ORIENTE 2", "Zona Oriente")
        ]
        for dir_ofi, sec_zona in sucursales:
            emp = Empresa(
                ruc=str(random.randint(10000000000, 20000000000)),
                razon_social=f"Sucursal {dir_ofi}",
                direccion=dir_ofi,
                sector=sec_zona
            )
            db.add(emp)
        db.commit()
        empresas = db.query(Empresa).all()

    if not usuarios:
        print("Creando 10 Usuarios base...")
        for i in range(10):
            usr = Usuario(
                nombre=f"Cliente {i+1}",
                apellido="Falabella",
                dni=str(random.randint(10000000, 99999999)),
                email=f"cliente{i+1}@gmail.com",
                password_hash="hash"
            )
            db.add(usr)
        db.commit()
        usuarios = db.query(Usuario).all()

    # 2. Generar 500 Creditos Realistas
    print("Generando 500 créditos con atributos financieros reales (Mora, Tasas, Tiempos)...")
    tipos_prod = ["Crédito Efectivo Personal", "Crédito PYME Comercial", "Tarjeta de Crédito CMR", "Crédito Vehicular"]
    estados_posibles = ["desembolsado", "desembolsado", "desembolsado", "moroso"]

    creditos_lote = []
    hoy = datetime.now()

    for i in range(500):
        emp_rnd = random.choice(empresas)
        usr_rnd = random.choice(usuarios)
        prod_rnd = random.choice(tipos_prod)
        est_rnd = random.choice(estados_posibles)
        
        # Fecha de creación (Distribuida en los ultimos 12 meses para gráficos de evolución)
        dias_atras = random.randint(1, 365)
        fecha_creacion = hoy - timedelta(days=dias_atras)

        # Atributos Financieros
        monto = round(random.uniform(2000.0, 150000.0), 2)
        tasa = round(random.uniform(12.0, 45.0), 2)
        plazo = random.choice([12, 24, 36, 48, 60])
        
        # Lógica de Morosidad
        dias_m = 0
        b_mora = "Al día (Sin Mora)"
        if est_rnd == "moroso":
            dias_m = random.randint(1, 200) # Algunos con 5 días, otros con 190 días
            if dias_m > 180: b_mora = "Castigo (>180 días)"
            elif dias_m > 120: b_mora = "Judicial (121-180 días)"
            elif dias_m > 60: b_mora = "Tardía (61-120 días)"
            elif dias_m > 30: b_mora = "Temprana (31-60 días)"
            else: b_mora = "Preventiva (1-30 días)"
        else:
            # 5% de créditos al día podrían tener un retraso mínimo de 1-2 días sin cambiar a estado moroso estricto
            if random.random() < 0.05:
                dias_m = random.randint(1, 5)
                b_mora = "Preventiva (1-30 días)"

        credito = Credito(
            usuario_id=usr_rnd.id,
            empresa_id=emp_rnd.id,
            tipo_producto=prod_rnd,
            monto_solicitado=monto,
            monto_aprobado=monto,
            plazo_meses=plazo,
            tasa_interes=tasa,
            estado=est_rnd,
            dias_mora=dias_m,
            banda_mora=b_mora,
            created_at=fecha_creacion
        )
        creditos_lote.append(credito)

    db.bulk_save_objects(creditos_lote)
    db.commit()
    
    total_db = db.query(Credito).count()
    print("=======================================================================")
    print(f" ¡INYECCIÓN MASIVA EXITOSA! Total de Créditos en la Nube ahora: {total_db}")
    print(" Vuelve a tu Power BI y presiona 'Actualizar'. ¡Los gráficos se verán geniales!")
    print("=======================================================================")

except Exception as e:
    db.rollback()
    print("Ocurrió un error al inyectar masivamente:", e)
finally:
    db.close()
