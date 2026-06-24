from app.database import SessionLocal
from sqlalchemy import text
db = SessionLocal()
db.execute(text("SELECT setval('cuentas_ahorro_id_seq', COALESCE((SELECT MAX(id)+1 FROM cuentas_ahorro), 1), false)"))
db.execute(text("SELECT setval('productos_activos_id_seq', COALESCE((SELECT MAX(id)+1 FROM productos_activos), 1), false)"))
db.execute(text("SELECT setval('productos_pasivos_id_seq', COALESCE((SELECT MAX(id)+1 FROM productos_pasivos), 1), false)"))
db.execute(text("SELECT setval('movimientos_ahorro_id_seq', COALESCE((SELECT MAX(id)+1 FROM movimientos_ahorro), 1), false)"))
db.commit()
print('Sequences synced!')
