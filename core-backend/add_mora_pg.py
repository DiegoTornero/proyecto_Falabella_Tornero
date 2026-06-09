import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:12345678@localhost:5432/falabella_db")
engine = create_engine(DATABASE_URL)

with engine.begin() as conn:
    # Obtener algunos IDs de créditos para modificar
    result = conn.execute(text("SELECT id FROM creditos LIMIT 8")).fetchall()
    ids = [row[0] for row in result]
    
    if len(ids) >= 2:
        conn.execute(text(f"UPDATE creditos SET dias_mora = 15, banda_mora = 'preventiva', estado = 'desembolsado' WHERE id IN ('{ids[0]}', '{ids[1]}')"))
    if len(ids) >= 4:
        conn.execute(text(f"UPDATE creditos SET dias_mora = 45, banda_mora = 'temprana', estado = 'desembolsado' WHERE id IN ('{ids[2]}', '{ids[3]}')"))
    if len(ids) >= 6:
        conn.execute(text(f"UPDATE creditos SET dias_mora = 95, banda_mora = 'tardia', estado = 'desembolsado' WHERE id IN ('{ids[4]}', '{ids[5]}')"))
    if len(ids) >= 8:
        conn.execute(text(f"UPDATE creditos SET dias_mora = 130, banda_mora = 'judicial', estado = 'desembolsado' WHERE id IN ('{ids[6]}', '{ids[7]}')"))

print("Updated mora correctly via SQLAlchemy")
