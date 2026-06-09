"""
seed.py — Datos de prueba realistas para Banco Falabella
=========================================================
Genera:
  - 5 trabajadores con distintos roles (asesor, jefe_regional, riesgos, comite, gerencia)
  - 20 usuarios clientes con cuentas de ahorros
  - 30 créditos en distintos estados (personal y vehicular)
  - ~13% de cartera en mora (Preventiva → Castigo)
  - Gestiones de cobranza de ejemplo

Ejecutar: python seed.py
Requiere: pip install psycopg2-binary bcrypt python-dotenv
"""

import os
import uuid
import bcrypt
import psycopg2
from datetime import datetime, date, timedelta
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:12345678@localhost:5432/falabella_db")

# Parsear DATABASE_URL
import re
m = re.match(r"postgresql://(.+):(.+)@(.+):(\d+)/(.+)", DATABASE_URL)
DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_NAME = m.groups()

conn = psycopg2.connect(host=DB_HOST, port=int(DB_PORT), dbname=DB_NAME, user=DB_USER, password=DB_PASS)
conn.autocommit = False
cur = conn.cursor()


def uid(): return str(uuid.uuid4())
def hash_pw(pw): return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(12)).decode()
def nc(): return "BF" + uuid.uuid4().hex[:10].upper()


print("🌱 Iniciando seed de datos para Banco Falabella...")

# ─────────────────────────────────────────────────────────────
# LIMPIAR TABLAS (orden inverso a FK)
# ─────────────────────────────────────────────────────────────
tablas = [
    "gestiones_mora", "historial_creditos", "cronograma_pagos",
    "creditos", "movimientos_ahorro", "cuentas_ahorro", "movimientos", "cuentas", "trabajadores", "usuarios"
]
for t in tablas:
    cur.execute(f"DELETE FROM {t}")
print("   ✅ Tablas limpiadas")

# ─────────────────────────────────────────────────────────────
# TRABAJADORES (5 roles distintos)
# Contraseña para todos: falabella2025
# ─────────────────────────────────────────────────────────────
pw_trabajador = hash_pw("falabella2025")
trabajadores = [
    (uid(), "ASE-0001", "Carlos Mendoza",       "carlos.mendoza@falabella.com",    pw_trabajador, "asesor"),
    (uid(), "JEF-0002", "Lucía Vargas",          "lucia.vargas@falabella.com",      pw_trabajador, "jefe_regional"),
    (uid(), "RIE-0003", "Fernando Torres",       "fernando.torres@falabella.com",   pw_trabajador, "riesgos"),
    (uid(), "COM-0004", "Sofía Palacios",        "sofia.palacios@falabella.com",    pw_trabajador, "comite"),
    (uid(), "GER-0005", "Miguel Ángel Rojas",   "miguel.rojas@falabella.com",      pw_trabajador, "gerencia"),
]

for t in trabajadores:
    cur.execute(
        """INSERT INTO trabajadores (id, codigo_empleado, nombre, email, password_hash, rol, activo, created_at)
           VALUES (%s,%s,%s,%s,%s,%s,TRUE,NOW())""",
        t
    )
print(f"   ✅ {len(trabajadores)} trabajadores insertados (contraseña: falabella2025)")

# IDs de trabajadores para uso posterior
asesor_id       = trabajadores[0][0]
jefe_id         = trabajadores[1][0]
riesgos_id      = trabajadores[2][0]
comite_id       = trabajadores[3][0]
gerencia_id     = trabajadores[4][0]

# ─────────────────────────────────────────────────────────────
# CLIENTES (20 usuarios con sus cuentas)
# Contraseña para todos: cliente123
# ─────────────────────────────────────────────────────────────
pw_cliente = hash_pw("cliente123")

clientes_data = [
    ("Ana",      "García",      "12345678", "ana.garcia@gmail.com",       "912345678", "Av. Lima 123",         date(1990, 3, 15), 4200.0),
    ("Pedro",    "Rodríguez",   "23456789", "pedro.rod@hotmail.com",      "923456789", "Jr. Junín 456",        date(1985, 7, 22), 5500.0),
    ("María",    "López",       "34567890", "maria.lopez@yahoo.com",      "934567890", "Calle Real 789",       date(1992, 11, 8),  3200.0),
    ("Juan",     "Martínez",    "45678901", "juan.mart@gmail.com",        "945678901", "Av. Brasil 321",       date(1988, 5, 30), 6800.0),
    ("Carmen",   "Flores",      "56789012", "carmen.flo@outlook.com",     "956789012", "Jr. Puno 654",         date(1995, 9, 12), 2800.0),
    ("Luis",     "Huanca",      "67890123", "luis.hua@gmail.com",         "967890123", "Calle Tacna 987",      date(1983, 1, 25), 7200.0),
    ("Rosa",     "Quispe",      "78901234", "rosa.quis@hotmail.com",      "978901234", "Av. Arequipa 147",     date(1998, 6, 3),  2500.0),
    ("Carlos",   "Sánchez",     "89012345", "carlos.san@gmail.com",       "989012345", "Jr. Moquegua 258",     date(1980, 12, 18), 9000.0),
    ("Elena",    "Torres",      "90123456", "elena.tor@yahoo.com",        "990123456", "Calle Cusco 369",      date(1993, 4, 7),  3800.0),
    ("Roberto",  "Castro",      "01234567", "roberto.cas@gmail.com",      "901234567", "Av. Colonial 741",     date(1987, 8, 14), 5200.0),
    ("Pilar",    "Medina",      "11223344", "pilar.med@outlook.com",      "911223344", "Jr. Ayacucho 852",     date(1991, 2, 28), 4500.0),
    ("Héctor",   "Paredes",     "22334455", "hector.par@gmail.com",       "922334455", "Calle Ica 963",        date(1975, 10, 5), 8500.0),
    ("Silvia",   "Ramos",       "33445566", "silvia.ram@hotmail.com",     "933445566", "Av. República 159",    date(1996, 7, 19), 3100.0),
    ("Andrés",   "Vega",        "44556677", "andres.veg@gmail.com",       "944556677", "Jr. Libertad 357",     date(1984, 3, 11), 6200.0),
    ("Luciana",  "Chávez",      "55667788", "luciana.cha@yahoo.com",      "955667788", "Calle Ucayali 468",    date(1999, 5, 23), 2200.0),
    ("Marcos",   "Núñez",       "66778899", "marcos.nun@gmail.com",       "966778899", "Av. Petit Thouars 579", date(1978, 11, 30), 10500.0),
    ("Patricia", "Díaz",        "77889900", "patricia.dia@outlook.com",   "977889900", "Jr. Piura 681",        date(1994, 9, 4),  3600.0),
    ("Gabriel",  "Morales",     "88990011", "gabriel.mor@gmail.com",      "988990011", "Calle Trujillo 792",   date(1986, 1, 16), 7800.0),
    ("Natalia",  "Acosta",      "99001122", "natalia.aco@hotmail.com",    "999001122", "Av. Salaverry 803",    date(1997, 6, 8),  2900.0),
    ("Fernando", "Gutiérrez",   "00112233", "fernando.gut@gmail.com",     "900112233", "Jr. Huancavelica 914", date(1982, 4, 27), 6500.0),
]

usuario_ids = []
cuenta_ids  = []

for nombre, apellido, dni, email, tel, dir_, fnac, ingreso in clientes_data:
    uid_ = uid()
    usuario_ids.append(uid_)
    cur.execute(
        """INSERT INTO usuarios (id,nombre,apellido,dni,email,password_hash,telefono,direccion,fecha_nacimiento,ingreso_mensual,created_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())""",
        (uid_, nombre, apellido, dni, email, pw_cliente, tel, dir_, fnac, ingreso)
    )
    # Crear cuenta de ahorros
    cur.execute(
        """INSERT INTO cuentas_ahorro (usuario_id,numero_cuenta,producto_pasivo_id,saldo_actual,estado,fecha_apertura)
           VALUES (%s,%s,1,1000.0,'ACTIVA',NOW()) RETURNING id""",
        (uid_, nc())
    )
    cid = cur.fetchone()[0]
    cuenta_ids.append(cid)
    
    # Movimiento inicial
    cur.execute(
        """INSERT INTO movimientos_ahorro (cuenta_ahorro_id,tipo_movimiento,monto,saldo_resultante,descripcion,fecha_movimiento)
           VALUES (%s,'DEPOSITO',1000.0,1000.0,'Depósito inicial de apertura',NOW())""",
        (cid,)
    )

print(f"   ✅ {len(clientes_data)} clientes + cuentas de ahorro insertados (contraseña: cliente123)")

# ─────────────────────────────────────────────────────────────
# CRÉDITOS (30 créditos — ~13% en mora)
# ─────────────────────────────────────────────────────────────
# Lógica de scoring para asignar estados correctos:
# Score >= 650 + verde => en_revision (pre-aprobado)
# Score 500-649        => en_revision
# Score < 500          => rechazado

def cuota_mensual(monto, plazo, tasa_anual=18.0):
    tm = tasa_anual / 100 / 12
    return round(monto * tm * (1+tm)**plazo / ((1+tm)**plazo - 1), 2)

creditos_data = [
    # (usuario_idx, monto, plazo, tipo, ingreso_cliente, estado, score, rds_sem, ruta, dias_mora, banda_mora, trabajador_id)
    (0,  8500,  24, "personal",   4200,  "aprobado",  720, "verde",    "jefe_regional",  0,   None,        jefe_id),
    (1,  25000, 36, "personal",   5500,  "aprobado",  680, "amarillo", "riesgos",        0,   None,        riesgos_id),
    (2,  3500,  12, "personal",   3200,  "aprobado",  760, "verde",    "asesor",         0,   None,        asesor_id),
    (3,  60000, 48, "vehicular",  6800,  "aprobado",  690, "amarillo", "comite",         0,   None,        comite_id),
    (4,  12000, 24, "personal",   2800,  "en_revision", 580, "amarillo","jefe_regional", 0,   None,        None),
    (5,  45000, 60, "vehicular",  7200,  "aprobado",  710, "verde",    "riesgos",        0,   None,        riesgos_id),
    (6,  4000,  18, "personal",   2500,  "rechazado", 420, "rojo",     "asesor",         0,   None,        asesor_id),
    (7,  80000, 60, "vehicular",  9000,  "aprobado",  730, "amarillo", "comite",         0,   None,        comite_id),
    (8,  6000,  12, "personal",   3800,  "aprobado",  690, "verde",    "jefe_regional",  0,   None,        jefe_id),
    (9,  18000, 36, "personal",   5200,  "desembolsado", 710, "verde", "riesgos",       0,   None,        riesgos_id),
    (10, 7500,  24, "personal",   4500,  "en_revision", 610, "amarillo","jefe_regional", 0,   None,        None),
    (11, 35000, 48, "vehicular",  8500,  "desembolsado", 740, "verde", "riesgos",       0,   None,        riesgos_id),
    (12, 2500,   6, "personal",   3100,  "rechazado", 390, "rojo",     "asesor",         0,   None,        asesor_id),
    (13, 15000, 24, "personal",   6200,  "desembolsado", 680, "verde", "riesgos",       0,   None,        riesgos_id),
    (14, 4500,  12, "personal",   2200,  "en_revision", 530, "rojo",   "asesor",         0,   None,        None),
    (15, 55000, 60, "vehicular", 10500,  "desembolsado", 750, "verde", "comite",        0,   None,        comite_id),
    (16, 9000,  18, "personal",   3600,  "aprobado",  650, "amarillo", "jefe_regional",  0,   None,        jefe_id),
    (17, 28000, 36, "personal",   7800,  "desembolsado", 700, "verde", "riesgos",       0,   None,        riesgos_id),
    (18, 3000,  12, "personal",   2900,  "rechazado", 460, "rojo",     "asesor",         0,   None,        asesor_id),
    (19, 42000, 48, "vehicular",  6500,  "desembolsado", 720, "verde", "riesgos",       0,   None,        riesgos_id),
    # ── CRÉDITOS EN MORA (~13% de la cartera desembolsada) ──
    (0,  8500,  24, "personal",   4200,  "desembolsado", 650, "verde",    "jefe_regional", 18,  "preventiva",  jefe_id),
    (3,  60000, 48, "vehicular",  6800,  "desembolsado", 690, "amarillo", "comite",        45,  "temprana",    comite_id),
    (5,  45000, 60, "vehicular",  7200,  "desembolsado", 710, "verde",    "riesgos",       95,  "tardia",      riesgos_id),
    (7,  80000, 60, "vehicular",  9000,  "desembolsado", 730, "amarillo", "comite",        150, "judicial",    comite_id),
    (9,  18000, 36, "personal",   5200,  "castigado",    680, "verde",    "riesgos",       210, "castigo",     riesgos_id),
]

# Rellenar hasta 30 con algunos más en revisión
extra_creditos = [
    (1,  10000, 18, "personal",   5500,  "en_revision", 590, "amarillo", "jefe_regional", 0, None, None),
    (2,  5000,  12, "personal",   3200,  "en_revision", 560, "amarillo", "asesor",        0, None, None),
    (4,  7000,  24, "personal",   2800,  "en_revision", 540, "rojo",     "jefe_regional", 0, None, None),
    (6,  3500,  12, "personal",   2500,  "en_revision", 510, "rojo",     "asesor",        0, None, None),
    (8,  15000, 36, "personal",   3800,  "en_revision", 600, "amarillo", "riesgos",       0, None, None),
]
creditos_data.extend(extra_creditos)

credito_ids = []
for row in creditos_data:
    uid_c, uid_u = uid(), usuario_ids[row[0]]
    monto, plazo, tipo, ingreso, estado, score, rds_sem, ruta, dias_mora, banda_mora, trab_id = (
        row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11]
    )
    tasa = 14.0 if score >= 650 and rds_sem == "verde" else 18.0
    cuota = cuota_mensual(monto, plazo, tasa)
    rds_val = round(cuota / ingreso, 4)
    monto_aprobado = monto if estado in ("aprobado", "desembolsado", "castigado", "en_revision") else None
    created = datetime.now() - timedelta(days=dias_mora + 30 if dias_mora else 30)

    # Mapeo a los productos Falabella Reales
    tipo_real = "PRESTAMO_COM" if tipo == "personal" else "CMR_CLASICA"
    producto_activo_id = 5 if tipo_real == "PRESTAMO_COM" else 2

    cur.execute(
        """INSERT INTO creditos
           (id,usuario_id,monto_solicitado,monto_aprobado,plazo_meses,tasa_interes,estado,
            tipo_producto,producto_activo_id,cobra_seguro_desgravamen,membresia_anual_cobrada,ingreso_cliente,score_crediticio,rds_valor,rds_semaforo,
            ruta_aprobacion,trabajador_asignado_id,dias_mora,banda_mora,created_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,TRUE,FALSE,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (uid_c, uid_u, monto, monto_aprobado, plazo, tasa, estado,
         tipo_real, producto_activo_id, ingreso, score, rds_val, rds_sem,
         ruta, trab_id, dias_mora, banda_mora, created)
    )
    credito_ids.append(uid_c)

    # Desembolso en cuenta si corresponde
    if estado in ("desembolsado", "castigado") and cuenta_ids[row[0]]:
        cur.execute(
            """INSERT INTO movimientos_ahorro (cuenta_ahorro_id,tipo_movimiento,monto,saldo_resultante,descripcion,fecha_movimiento)
               VALUES (%s,'DEPOSITO',%s,1000.0 + %s,'Desembolso de Crédito Aprobado',%s)""",
            (cuenta_ids[row[0]], monto, monto, created)
        )
        cur.execute(
            "UPDATE cuentas_ahorro SET saldo_actual = saldo_actual + %s WHERE id = %s",
            (monto, cuenta_ids[row[0]])
        )

    # Historial si fue procesado
    if trab_id and estado not in ("en_revision", "enviado"):
        cur.execute(
            """INSERT INTO historial_creditos (id,credito_id,trabajador_id,accion,comentario,created_at)
               VALUES (%s,%s,%s,%s,%s,%s)""",
            (uid(), uid_c, trab_id, estado.upper(),
             f"Procesado automáticamente. Score: {score}/1000. RDS: {rds_sem}.", created + timedelta(hours=2))
        )

    # Gestiones de mora para créditos en mora
    if dias_mora and dias_mora > 0 and trab_id:
        gestiones_tipo = [
            ("llamada", "Sin respuesta", "Llamada al titular sin éxito"),
            ("sms",     "Enviado",       "SMS recordatorio de pago enviado"),
            ("email",   "Abierto",       "Email de notificación de mora enviado"),
        ]
        if dias_mora >= 61:
            gestiones_tipo.append(("carta", "Recibida", "Carta notarial de aviso judicial enviada"))
        for tipo_g, resultado, comentario in gestiones_tipo:
            cur.execute(
                """INSERT INTO gestiones_mora (id,credito_id,trabajador_id,tipo_gestion,resultado,comentario,fecha_gestion)
                   VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                (uid(), uid_c, trab_id, tipo_g, resultado, comentario,
                 created + timedelta(days=dias_mora // 2))
            )

print(f"   ✅ {len(creditos_data)} créditos insertados (~13% en mora)")

# ─────────────────────────────────────────────────────────────
# CRONOGRAMA de pagos para créditos desembolsados
# ─────────────────────────────────────────────────────────────
cronogramas_generados = 0
for i, row in enumerate(creditos_data):
    estado = row[5]
    if estado in ("desembolsado", "castigado"):
        monto, plazo, tasa = row[1], row[2], (14.0 if row[6] >= 650 else 18.0)
        cuota = cuota_mensual(monto, plazo, tasa)
        dias_mora = row[9] or 0
        base_date = datetime.now() - timedelta(days=dias_mora + 30)
        for j in range(1, plazo + 1):
            fecha_venc = (base_date + timedelta(days=30*j)).date()
            est_cuota = "pagado" if fecha_venc < date.today() and j <= 3 else "pendiente"
            if dias_mora > 0 and j <= 2:
                est_cuota = "vencido"
            cur.execute(
                """INSERT INTO cronograma_pagos (id,credito_id,numero_cuota,fecha_vencimiento,monto_cuota,estado,seguro_desgravamen,mora_acumulada)
                   VALUES (%s,%s,%s,%s,%s,%s,5.50,0)""",
                (uid(), credito_ids[i], j, fecha_venc, cuota, est_cuota)
            )
        cronogramas_generados += 1

print(f"   ✅ Cronogramas generados para {cronogramas_generados} créditos desembolsados")

# ─────────────────────────────────────────────────────────────
# COMMIT
# ─────────────────────────────────────────────────────────────
conn.commit()
cur.close()
conn.close()

print()
print("=" * 55)
print("✅ SEED COMPLETADO — Banco Falabella")
print("=" * 55)
print()
print("📋 CREDENCIALES DE PRUEBA")
print()
print("  👤 CLIENTES (Homebanking: puerto 5173)")
print("     DNI: 12345678 ... 00112233")
print("     Contraseña: cliente123")
print()
print("  👔 TRABAJADORES (Core: puerto 5174)")
print("     Código  | Nombre                | Rol")
print("     --------+-----------------------+-----------")
print("     ASE-0001 | Carlos Mendoza        | asesor")
print("     JEF-0002 | Lucía Vargas          | jefe_regional")
print("     RIE-0003 | Fernando Torres       | riesgos")
print("     COM-0004 | Sofía Palacios        | comite")
print("     GER-0005 | Miguel Ángel Rojas    | gerencia")
print("     Contraseña para todos: falabella2025")
print()
print("  💡 Rutas de aprobación:")
print("     < S/5,000     → asesor")
print("     < S/15,000    → jefe_regional")
print("     < S/50,000    → riesgos")
print("     ≥ S/50,000    → comite/gerencia")
