import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import api from "../../lib/api"
import Layout from "../../components/Layout"

// ─── Helpers ────────────────────────────────────────────────────
const fmt = (n) => parseFloat(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const calcularTotalDeuda = (monto, plazo, tasa = 18) => {
  const m = parseFloat(monto || 0)
  const p = parseInt(plazo || 12)
  const t = parseFloat(tasa)
  const i = Math.pow(1 + t / 100, 1 / 12) - 1
  if (i === 0) return m
  const cuota = (m * i * Math.pow(1 + i, p)) / (Math.pow(1 + i, p) - 1)
  return parseFloat((cuota * p).toFixed(2))
}

// ─── Skeleton loader ────────────────────────────────────────────
function Skeleton({ w = "100%", h = 18, rounded = 8, mt = 0 }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: rounded, marginTop: mt }} />
}

// ─── Quick Action Button ─────────────────────────────────────────
function QuickAction({ icon, label, onClick, color = "#00a651" }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        background: "#fff", border: "1px solid var(--border)",
        borderRadius: 16, padding: "18px 12px",
        cursor: "pointer", transition: "all 0.22s",
        boxShadow: "var(--shadow-card)", flex: 1, minWidth: 80,
      }}
      className="hover:!-translate-y-1 hover:!shadow-md group"
    >
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: `${color}12`, color,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.2s, transform 0.2s",
      }} className="group-hover:!scale-110">
        {icon}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textAlign: "center", lineHeight: 1.3 }}>
        {label}
      </span>
    </button>
  )
}

// ─── Account Card ─────────────────────────────────────────────────
function AccountCard({ cuenta, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", borderRadius: 16,
        border: "1px solid var(--border)",
        padding: "18px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        cursor: "pointer", transition: "all 0.22s",
        boxShadow: "var(--shadow-card)",
      }}
      className="hover:!-translate-y-0.5 hover:!shadow-md"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: "rgba(0,166,81,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--green-light)", flexShrink: 0,
        }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/>
            <line x1="3" y1="11" x2="21" y2="11"/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{cuenta.numero_cuenta}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{cuenta.tipo}</span>
            <span className={cuenta.estado === "ACTIVA" ? "badge-green" : "badge-red"}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }}/>
              {cuenta.estado}
            </span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>S/ {fmt(cuenta.saldo)}</div>
        {cuenta.trea > 0 && <div style={{ fontSize: 11, color: "var(--green-light)", fontWeight: 600, marginTop: 2 }}>TREA {cuenta.trea}%</div>}
      </div>
    </div>
  )
}

// ─── Movement Row ─────────────────────────────────────────────────
function MovimientoRow({ mov }) {
  const esIngreso = mov.tipo === "deposito" || mov.tipo === "interes"
  const fecha = mov.created_at ? new Date(mov.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short" }) : "-"
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 0", borderBottom: "1px solid #f3f6f3",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        background: esIngreso ? "rgba(0,166,81,0.1)" : "rgba(218,41,28,0.08)",
        color: esIngreso ? "var(--green-light)" : "var(--red)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {esIngreso
          ? <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)", textTransform: "capitalize" }}>{mov.tipo}</div>
        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {mov.descripcion || mov.numero_cuenta}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: esIngreso ? "var(--green-light)" : "var(--red)" }}>
          {esIngreso ? "+" : "-"} S/ {fmt(mov.monto)}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{fecha}</div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const [usuario, setUsuario] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [creditos, setCreditos] = useState([])
  const [tarjetas, setTarjetas] = useState([])
  const [puntos, setPuntos] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [resU, resCtas, resCred, resTarj, resPtos] = await Promise.all([
        api.get(`/usuarios/${user.id}`),
        api.get(`/ahorros/${user.id}`),
        api.get(`/creditos/${user.id}`),
        api.get(`/tarjetas/${user.id}`).catch(() => ({ data: [] })),
        api.get(`/beneficios/${user.id}`).catch(() => ({ data: { puntos_disponibles: 500, nivel: "Verde" } })),
      ])
      setUsuario(resU.data)
      const ctas = resCtas.data || []
      setCuentas(ctas)
      setCreditos(resCred.data || [])
      setTarjetas(resTarj.data || [])
      setPuntos(resPtos.data || { puntos_disponibles: 500, nivel: "Verde" })

      if (ctas.length > 0) {
        const resultados = await Promise.all(
          ctas.map(c => api.get(`/ahorros/movimientos/${c.id}`).then(r => (r.data || []).map(m => ({ ...m, numero_cuenta: c.numero_cuenta }))))
        )
        const todos = resultados.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setMovimientos(todos.slice(0, 6))
      }
    } catch (e) {
      console.error("Error al cargar datos:", e)
    } finally {
      setLoading(false)
    }
  }

  const saldoTotal = cuentas.reduce((acc, c) => acc + parseFloat(c.saldo || 0), 0)
  const creditosActivos = creditos.filter(c => c.estado !== "rechazado" && c.estado !== "pagado")
  const deudaTotal = creditosActivos.reduce((acc, c) =>
    acc + calcularTotalDeuda(c.monto_aprobado || c.monto_solicitado, c.plazo_meses, c.tasa_interes), 0)

  const hora = new Date().getHours()
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches"

  return (
    <Layout title="Inicio" subtitle="Resumen de tus productos y movimientos">

      {/* ── Welcome banner ──────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #00361f 0%, #00693c 60%, #00a651 100%)",
        borderRadius: 22, padding: "28px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 28, overflow: "hidden", position: "relative",
        boxShadow: "0 12px 36px rgba(0,54,31,0.2)",
      }} className="animate-fade-up">
        {/* Decorative circles */}
        <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.03)", top: -80, right: 60, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "rgba(200,224,0,0.06)", bottom: -40, right: -20, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 12, color: "rgba(200,224,0,0.75)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            {saludo}
          </div>
          {loading
            ? <Skeleton w={200} h={30} rounded={10} />
            : <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>
                {usuario?.nombre} {usuario?.apellido} 👋
              </h2>
          }
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13.5, margin: "6px 0 0" }}>
            Aquí está el resumen global de tus productos.
          </p>
        </div>

        {/* Saldo total badge */}
        <div style={{
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 18, padding: "16px 24px", textAlign: "center",
          backdropFilter: "blur(10px)", flexShrink: 0,
          position: "relative", zIndex: 1,
        }} className="hidden md:block">
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
            Saldo Total
          </div>
          {loading
            ? <Skeleton w={120} h={28} rounded={8} />
            : <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#c8e000", fontWeight: 400 }}>
                S/ {fmt(saldoTotal)}
              </div>
          }
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
            {cuentas.length} cuenta(s) activa(s)
          </div>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          {
            label: "Total en Ahorros", value: `S/ ${fmt(saldoTotal)}`, icon: (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/>
                <line x1="3" y1="11" x2="21" y2="11"/>
              </svg>
            ), sub: `${cuentas.length} cuenta(s)`, color: "#00a651", loading
          },
          {
            label: "Deuda en Créditos", value: `S/ ${fmt(deudaTotal)}`, icon: (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            ), sub: `${creditosActivos.length} crédito(s)`, color: "#da291c", loading
          },
          {
            label: "Movimientos recientes", value: movimientos.length, icon: (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            ), sub: "Últimos 6", color: "#7c3aed", loading
          },
          {
            label: "Puntos CMR", value: `${puntos?.puntos_disponibles || 500} pts`, icon: (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ), sub: `Nivel ${puntos?.nivel || "Verde"}`, color: "#eab308", loading
          },
        ].map((kpi, i) => (
          <div key={i} className={`card card-hover animate-fade-up anim-delay-${i + 2}`}
            style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.01em" }}>{kpi.label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${kpi.color}12`, color: kpi.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {kpi.icon}
              </div>
            </div>
            {kpi.loading
              ? <Skeleton w="70%" h={26} rounded={8} />
              : <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{kpi.value}</div>
            }
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 6 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ───────────────────────────────────────── */}
      <div className="card animate-fade-up anim-delay-3" style={{ padding: "22px 24px", marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18, letterSpacing: "-0.01em" }}>
          Operaciones Rápidas
        </h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <QuickAction
            onClick={() => navigate("/transferencias")}
            label="Transferir"
            color="#00a651"
            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>}
          />
          <QuickAction
            onClick={() => navigate("/creditos")}
            label="Pagar Cuota"
            color="#0891b2"
            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
          />
          <QuickAction
            onClick={() => navigate("/servicios")}
            label="Pagar Servicio"
            color="#7c3aed"
            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/></svg>}
          />
          <QuickAction
            onClick={() => navigate("/ahorros")}
            label="Ver Ahorros"
            color="#d97706"
            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/><line x1="3" y1="11" x2="21" y2="11"/></svg>}
          />
          <QuickAction
            onClick={() => navigate("/creditos")}
            label="Solicitar Préstamo"
            color="#da291c"
            icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          />
        </div>
      </div>

      {/* ── Two-column section ───────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="lg:!grid-cols-[1.3fr_1fr]">

        {/* Cuentas de Ahorro */}
        <div className="card animate-fade-up anim-delay-4" style={{ padding: "22px 24px", gridColumn: "span 2" }} >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Mis Cuentas de Ahorro</h3>
            <button onClick={() => navigate("/ahorros")}
              style={{ fontSize: 12.5, color: "var(--green-mid)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
              Ver todas →
            </button>
          </div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1,2].map(i => <Skeleton key={i} h={68} rounded={16} />)}
            </div>
          ) : cuentas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏦</div>
              No tienes cuentas activas aún.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cuentas.map(c => (
                <AccountCard key={c.id} cuenta={c} onClick={() => navigate("/ahorros")} />
              ))}
            </div>
          )}
          {/* Total */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Saldo disponible total</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: "var(--green-mid)" }}>S/ {fmt(saldoTotal)}</span>
          </div>
        </div>

        {/* Tarjetas CMR Visual Card */}
        <div className="card animate-fade-up anim-delay-4" style={{ padding: "22px 24px", gridColumn: "span 2", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>💳</span>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>Mis Tarjetas CMR Falabella</h3>
            </div>
            <span style={{ fontSize: 11, background: "rgba(200,224,0,0.15)", color: "#c8e000", padding: "4px 10px", borderRadius: 20, fontWeight: 700 }}>Activa Virtual</span>
          </div>
          {tarjetas.length > 0 ? (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {tarjetas.map(t => (
                <div key={t.id} style={{ background: "linear-gradient(135deg, #004d2a 0%, #002614 100%)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "20px", flex: "1 1 300px", position: "relative", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                  <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: "rgba(200,224,0,0.08)", borderRadius: "50%" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#c8e000" }}>Banco Falabella</span>
                    <span style={{ fontSize: 11, fontWeight: 800, background: "rgba(255,255,255,0.1)", padding: "3px 8px", borderRadius: 6 }}>{t.tipo?.replace("_", " ")}</span>
                  </div>
                  <div style={{ fontSize: 18, letterSpacing: 3, fontWeight: 600, margin: "16px 0", fontFamily: "monospace" }}>{t.numero_enmascarado}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 20 }}>
                    <div>
                      <div style={{ fontSize: 9, textTransform: "uppercase" }}>Titular</div>
                      <div style={{ fontWeight: 700, color: "#fff" }}>{usuario?.nombre} {usuario?.apellido}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, textTransform: "uppercase" }}>Expira</div>
                      <div style={{ fontWeight: 700, color: "#fff" }}>{t.fecha_expiracion}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, textTransform: "uppercase" }}>CVV</div>
                      <div style={{ fontWeight: 700, color: "#fff" }}>•••</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
              Generando tu Tarjeta CMR Digital...
            </div>
          )}
        </div>

        {/* Movimientos recientes */}
        <div className="card animate-fade-up anim-delay-5" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Movimientos Recientes</h3>
            <button onClick={() => navigate("/ahorros")}
              style={{ fontSize: 12.5, color: "var(--green-mid)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
              Ver todos →
            </button>
          </div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              {[1,2,3,4].map(i => <Skeleton key={i} h={50} rounded={12} />)}
            </div>
          ) : movimientos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              Sin movimientos todavía.
            </div>
          ) : (
            <div>
              {movimientos.map((m, i) => <MovimientoRow key={`${m.id}-${i}`} mov={m} />)}
            </div>
          )}
        </div>

        {/* Créditos activos */}
        <div className="card animate-fade-up anim-delay-5" style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Préstamos Activos</h3>
            <button onClick={() => navigate("/creditos")}
              style={{ fontSize: 12.5, color: "var(--green-mid)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
              Ver todos →
            </button>
          </div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              {[1,2].map(i => <Skeleton key={i} h={70} rounded={14} />)}
            </div>
          ) : creditosActivos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💳</div>
              No tienes préstamos activos.
              <div style={{ marginTop: 16 }}>
                <button onClick={() => navigate("/creditos")} className="btn-primary" style={{ fontSize: 13, padding: "9px 20px" }}>
                  Solicitar ahora
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              {creditosActivos.slice(0, 3).map(c => {
                const base = parseFloat(c.monto_aprobado || c.monto_solicitado)
                const total = calcularTotalDeuda(base, c.plazo_meses, c.tasa_interes)
                const progress = Math.min(100, (base / total) * 100)
                return (
                  <div key={c.id} style={{ background: "#f8faf8", borderRadius: 14, padding: "14px 16px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                          CRED{c.id.substring(0,8).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3 }}>
                          {c.tipo_producto || "Consumo"} · {c.plazo_meses || 12} meses
                        </div>
                      </div>
                      <span className={c.dias_mora > 0 ? "badge-red" : "badge-green"}>
                        {c.dias_mora > 0 ? "En Mora" : "Normal"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                      <span>Capital: S/ {fmt(base)}</span>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>S/ {fmt(total)}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 6, background: "#e8ede8", borderRadius: 100, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${progress}%`,
                        background: `linear-gradient(90deg, ${c.dias_mora > 0 ? "#da291c" : "#00a651"}, ${c.dias_mora > 0 ? "#ff6b6b" : "#c8e000"})`,
                        borderRadius: 100,
                        transition: "width 1s ease",
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Security reminder ──────────────────────────────────── */}
      <div style={{
        marginTop: 28,
        background: "linear-gradient(135deg, #00361f08, #00a65108)",
        border: "1px solid rgba(0,166,81,0.15)",
        borderRadius: 16,
        padding: "16px 22px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }} className="animate-fade-up">
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(0,166,81,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green-light)", flexShrink: 0 }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text-primary)" }}>Tu sesión está protegida</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Banco Falabella nunca te pedirá tu clave por teléfono, email o chat. Si recibes ese tipo de solicitudes, repórtalas inmediatamente.
          </div>
        </div>
      </div>

    </Layout>
  )
}