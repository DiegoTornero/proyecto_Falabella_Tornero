import sys
import os
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

NEON_DB_URL = "postgresql://neondb_owner:npg_v2MNrOmt8TBW@ep-twilight-water-atm701rq.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
sys.path.append(os.path.join(os.path.dirname(__file__), "core-backend"))
from app.models.models import Empresa

print("Corrigiendo tabla empresas para que sean Clientes B2B (y no Agencias)...")
engine = create_engine(NEON_DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

nombres_base = ["Constructora", "Distribuidora", "Transportes", "Inversiones", "Servicios", "Comercializadora", "Corporacion", "Logistica"]
apellidos_empresa = ["S.A.C.", "E.I.R.L.", "S.R.L.", "S.A."]

mapeo_direcciones = {
    "OF. PRINCIPAL": {"dir": "San Isidro, Lima", "zona": "Zona Lima"},
    "AG. LIMA 1": {"dir": "Miraflores, Lima", "zona": "Zona Lima"},
    "AG. LIMA 2": {"dir": "Los Olivos, Lima", "zona": "Zona Lima"},
    "AG. SUR 1": {"dir": "Arequipa, Arequipa", "zona": "Zona Sur"},
    "AG. SUR 2": {"dir": "Tacna, Tacna", "zona": "Zona Sur"},
    "AG. SUR 3": {"dir": "Cusco, Cusco", "zona": "Zona Sur"},
    "AG. NORTE 6": {"dir": "Trujillo, La Libertad", "zona": "Zona Norte"},
    "AG. ORIENTE 2": {"dir": "Iquitos, Loreto", "zona": "Zona Oriente"}
}

try:
    empresas = db.query(Empresa).all()
    
    for emp in empresas:
        dir_vieja = emp.direccion
        # Si tiene un nombre de agencia antigua, lo mapeamos a una ciudad real
        if dir_vieja in mapeo_direcciones:
            emp.direccion = mapeo_direcciones[dir_vieja]["dir"]
            emp.sector = mapeo_direcciones[dir_vieja]["zona"]
            
            # Generar un nombre de empresa cliente realista
            n1 = random.choice(nombres_base)
            n2 = emp.direccion.split(",")[0] # ej. "Constructora Arequipa"
            n3 = random.choice(apellidos_empresa)
            emp.razon_social = f"{n1} {n2} {n3}"
            
    db.commit()
    print("¡Éxito! Las empresas ahora tienen nombres y direcciones de clientes reales.")
except Exception as e:
    db.rollback()
    print("Error:", e)
finally:
    db.close()
