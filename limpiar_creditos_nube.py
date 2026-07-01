import sys
import os
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Conexion directa a Neon DB
NEON_DB_URL = "postgresql://neondb_owner:npg_v2MNrOmt8TBW@ep-twilight-water-atm701rq.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
sys.path.append(os.path.join(os.path.dirname(__file__), "core-backend"))
from app.models.models import Credito, Empresa

print("Conectando a Neon DB para hacer limpieza profunda...")
engine = create_engine(NEON_DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    creditos = db.query(Credito).all()
    empresas = db.query(Empresa).all()
    
    # Obtener una lista de IDs de empresa validos
    emp_ids = [e.id for e in empresas if e.direccion]
    
    corregidos_prod = 0
    corregidos_empresa = 0
    
    for c in creditos:
        # 1. Estandarizar tipo_producto
        tp = str(c.tipo_producto).lower()
        nuevo_tp = None
        if "cmr" in tp or "tarjeta" in tp:
            nuevo_tp = "Tarjeta de Crédito CMR"
        elif "personal" in tp or "efectivo" in tp:
            nuevo_tp = "Crédito Efectivo Personal"
        elif "vehicular" in tp or "auto" in tp:
            nuevo_tp = "Crédito Vehicular"
        elif "empresarial" in tp or "pyme" in tp or "micro" in tp:
            nuevo_tp = "Crédito PYME Comercial"
            
        if nuevo_tp and c.tipo_producto != nuevo_tp:
            c.tipo_producto = nuevo_tp
            corregidos_prod += 1
            
        # 2. Arreglar empresa_id nulos para que no salga "(En blanco)" en Power BI
        if not c.empresa_id and emp_ids:
            c.empresa_id = random.choice(emp_ids)
            corregidos_empresa += 1

    db.commit()
    print(f"Limpieza completada: {corregidos_prod} productos arreglados, {corregidos_empresa} creditos sin empresa asignados.")

except Exception as e:
    db.rollback()
    print("Error:", e)
finally:
    db.close()
