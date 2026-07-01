import sys
import os
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Conexion directa a Neon DB
NEON_DB_URL = "postgresql://neondb_owner:npg_v2MNrOmt8TBW@ep-twilight-water-atm701rq.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
sys.path.append(os.path.join(os.path.dirname(__file__), "core-backend"))
from app.models.models import Empresa

print("Conectando a la base de datos Neon para limpiar direcciones (Oficinas)...")
engine = create_engine(NEON_DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

sucursales_oficiales = {
    "OF. PRINCIPAL": "Zona Lima",
    "AG. LIMA 1": "Zona Lima",
    "AG. SUR 1": "Zona Sur",
    "AG. NORTE 6": "Zona Norte",
    "AG. ORIENTE 2": "Zona Oriente"
}

try:
    empresas = db.query(Empresa).all()
    corregidas = 0
    
    for emp in empresas:
        dir_actual = emp.direccion
        # Si esta vacio, en blanco, o no es una sucursal oficial (ej. "Calle Las Flores")
        if not dir_actual or str(dir_actual).strip() == "" or dir_actual not in sucursales_oficiales:
            nueva_ofi = random.choice(list(sucursales_oficiales.keys()))
            emp.direccion = nueva_ofi
            emp.sector = sucursales_oficiales[nueva_ofi]
            corregidas += 1
            
    db.commit()
    print(f"¡Éxito! Se han corregido y estandarizado {corregidas} empresas/oficinas.")
    print("Todas las oficinas en blanco o con calles raras ahora son agencias oficiales.")
except Exception as e:
    db.rollback()
    print("Error:", e)
finally:
    db.close()
