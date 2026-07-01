import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

NEON_DB_URL = "postgresql://neondb_owner:npg_v2MNrOmt8TBW@ep-twilight-water-atm701rq.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
sys.path.append(os.path.join(os.path.dirname(__file__), "core-backend"))
from app.models.models import Credito

print("Limpiando banda_mora en la base de datos...")
engine = create_engine(NEON_DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    creditos = db.query(Credito).all()
    corregidos = 0
    for c in creditos:
        bm = str(c.banda_mora).upper()
        if "DEFICIENTE" in bm or "DUDOSO" in bm or "PERDIDA" in bm:
            dias = c.dias_mora or 0
            if dias > 180: c.banda_mora = "Castigo (>180 días)"
            elif dias > 120: c.banda_mora = "Judicial (121-180 días)"
            elif dias > 60: c.banda_mora = "Tardía (61-120 días)"
            elif dias > 30: c.banda_mora = "Temprana (31-60 días)"
            elif dias > 0: c.banda_mora = "Preventiva (1-30 días)"
            else: c.banda_mora = "Al día (Sin Mora)"
            corregidos += 1
            
    db.commit()
    print(f"Éxito: {corregidos} bandas de mora corregidas.")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
