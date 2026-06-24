import { useEffect, useState, useCallback } from "react"
import { useAuth } from "../../context/AuthContext"
import api from "../../lib/api"
import Layout from "../../components/Layout"

/* ─── Paleta vintage alineada con Layout ─── */
const C = {
  ink:       "#1a140a",
  forest:    "#00361f",
  green:     "#00693c",
  lime:      "#c8e000",
  gold:      "#b8960c",
  goldLight: "#d4af37",
  cream:     "#f8f5ed",
  creamDark: "#ede9df",
  border:    "#d9d0bc",
  muted:     "#7a6e5e",
  red:       "#da291c",
  greenLight:"#00a651",
}

/* ─── Helpers ─── */
const calcularCuota = (monto, plazo, tasa = 18) => {
  const i = Math.pow(1 + tasa / 100, 1 / 12) - 1
  if (i === 0) return (monto / plazo).toFixed(2)
  return ((monto * i * Math.pow(1 + i, plazo)) / (Math.pow(1 + i, plazo) - 1)).toFixed(2)
}

const fmt = (n) => parseFloat(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ESTADO_CFG = {
  enviado:       { label: "Enviado",       color: C.gold,       bg: "rgba(184,150,12,0.1)",    border: "rgba(184,150,12,0.3)" },
  en_evaluacion: { label: "En Evaluación", color: "#0891b2",    bg: "rgba(8,145,178,0.1)",     border: "rgba(8,145,178,0.25)" },
  en_revision:   { label: "En Revisión",   color: "#0891b2",    bg: "rgba(8,145,178,0.1)",     border: "rgba(8,145,178,0.25)" },
  aprobado:      { label: "Aprobado",      color: C.greenLight, bg: "rgba(0,166,81,0.1)",      border: "rgba(0,166,81,0.25)" },
  rechazado:     { label: "Rechazado",     color: C.red,        bg: "rgba(218,41,28,0.08)",    border: "rgba(218,41,28,0.2)" },
  desembolsado:  { label: "Desembolsado",  color: "#7c3aed",    bg: "rgba(124,58,237,0.08)",   border: "rgba(124,58,237,0.2)" },
}
const estadoCfg = (e) => ESTADO_CFG[e] ?? { label: e, color: C.muted, bg: C.creamDark, border: C.border }

/* ─── Sub-components ─── */
function Badge({ estado }) {
  const cfg = estadoCfg(estado)
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
      padding: "4px 10px", borderRadius: 100,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  )
}

function ModalBase({ onClose, children, maxWidth = 480, title, subtitle }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(26,20,10,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, padding: "16px", overflowY: "auto",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: "#fff", borderRadius: 20,
        width: "100%", maxWidth, boxShadow: "0 24px 64px rgba(26,20,10,0.22)",
        border: `1px solid ${C.border}`, overflow: "hidden", margin: "auto",
      }}>
        {/* Modal header strip */}
        <div style={{ background: C.forest, padding: "22px 28px 18px" }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400, color: "#fff", margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", margin: "4px 0 0" }}>{subtitle}</p>}
        </div>
        {/* Ornament line */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.goldLight}, ${C.lime}, ${C.goldLight})` }} />
        <div style={{ padding: "24px 28px 28px" }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
      {children}
    </label>
  )
}

function FieldInput({ prefix, ...props }) {
  const [focused, setFocused] = useState(false)
  const base = {
    width: "100%", border: `1.5px solid ${focused ? C.green : C.border}`,
    borderRadius: 10, padding: prefix ? "11px 14px 11px 38px" : "11px 14px",
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.ink,
    background: focused ? "#fff" : C.cream,
    outline: "none", transition: "all 0.18s",
    boxShadow: focused ? `0 0 0 3px rgba(0,105,60,0.08)` : "none",
    boxSizing: "border-box",
  }
  return (
    <div style={{ position: "relative" }}>
      {prefix && (
        <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted, fontWeight: 700, fontSize: 13, pointerEvents: "none" }}>
          {prefix}
        </span>
      )}
      <input
        {...props}
        style={base}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

function FieldSelect({ children, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      value={value} onChange={onChange}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: "100%", border: `1.5px solid ${focused ? C.green : C.border}`,
        borderRadius: 10, padding: "11px 14px",
        fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.ink,
        background: focused ? "#fff" : C.cream,
        outline: "none", transition: "all 0.18s", appearance: "none",
        boxSizing: "border-box",
      }}
    >
      {children}
    </select>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function Creditos() {
  const { user } = useAuth()

  const [creditos, setCreditos] = useState([])
  const [creditoSel, setCreditoSel] = useState(null)
  const [cronograma, setCronograma] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [mensaje, setMensaje] = useState("")
  const [mensajeOk, setMensajeOk] = useState(true)

  const [showSolicitud, setShowSolicitud] = useState(false)
  const [showSimulador, setShowSimulador] = useState(false)
  const [showEmpresaModal, setShowEmpresaModal] = useState(false)
  const [showNuevaEmpresa, setShowNuevaEmpresa] = useState(false)

  const [form, setForm] = useState({ monto: "", plazo: "12", proposito: "" })
  const [simulacion, setSimulacion] = useState(null)

  const [empForm, setEmpForm] = useState({ empresa_id: "", monto: "", plazo: "12", proposito: "", cobra_seguro: true, dia_pago: 3 })
  const [rucBusqueda, setRucBusqueda] = useState("")

  const [nuevaEmp, setNuevaEmp] = useState({ ruc: "", razon_social: "", tipo_empresa: "micro", sector: "", facturacion_anual: "", num_trabajadores: "1", representante_legal: "", email: "", telefono: "", direccion: "" })
  const [nuevaEmpLoading, setNuevaEmpLoading] = useState(false)

  const empresaEncontrada = empresas.find(e => e.ruc === rucBusqueda)
  useEffect(() => {
    setEmpForm(f => ({ ...f, empresa_id: empresaEncontrada?.id || "" }))
  }, [rucBusqueda, empresaEncontrada])

  /* ─── Fetch ─── */
  const fetchData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [resC, resE] = await Promise.all([api.get(`/creditos/${user.id}`), api.get("/empresas/")])
      setCreditos(resC.data || [])
      setEmpresas(resE.data || [])
    } catch (e) { console.error(e) }
    setLoadingData(false)
  }, [user.id])

  useEffect(() => { fetchData() }, [fetchData])

  const fetchCronograma = async (id) => {
    try { const r = await api.get(`/creditos/${id}/cronograma`); setCronograma(r.data || []) }
    catch { setCronograma([]) }
  }

  const notify = (msg, ok = true) => { setMensaje(msg); setMensajeOk(ok) }

  /* ─── Simulador ─── */
  const handleSimular = () => {
    if (!form.monto || !form.plazo) return
    const cuota = calcularCuota(parseFloat(form.monto), parseInt(form.plazo))
    const total = (parseFloat(cuota) * parseInt(form.plazo)).toFixed(2)
    const interes = (parseFloat(total) - parseFloat(form.monto)).toFixed(2)
    setSimulacion({ cuota, total, interes })
  }

  /* ─── Preview empresarial ─── */
  const preview = empForm.monto && empForm.plazo ? (() => {
    const tea = empForm.cobra_seguro ? 40.92 : 43.92
    const cuota = calcularCuota(parseFloat(empForm.monto), parseInt(empForm.plazo), tea)
    const total = (parseFloat(cuota) * parseInt(empForm.plazo)).toFixed(2)
    const interes = (parseFloat(total) - parseFloat(empForm.monto)).toFixed(2)
    return { cuota, total, interes, tea }
  })() : null

  /* ─── Submit personal ─── */
  const handleSolicitudPersonal = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.post("/creditos/", { usuario_id: user.id, monto_solicitado: parseFloat(form.monto), plazo_meses: parseInt(form.plazo), tasa_interes: 18, proposito: form.proposito })
      notify("Solicitud enviada correctamente. En revisión.")
      setShowSolicitud(false); setForm({ monto: "", plazo: "12", proposito: "" }); setSimulacion(null); fetchData()
    } catch (err) { notify("Error: " + (err.response?.data?.detail || err.message), false) }
    setLoading(false)
  }

  /* ─── Submit empresarial ─── */
  const handleSolicitudEmpresarial = async (e) => {
    e.preventDefault()
    if (!empForm.empresa_id) { notify("Ingresa un RUC de empresa válido.", false); return }
    setLoading(true)
    try {
      const r = await api.post(`/empresas/${empForm.empresa_id}/credito`, { empresa_id: empForm.empresa_id, monto_solicitado: parseFloat(empForm.monto), plazo_meses: parseInt(empForm.plazo), proposito: empForm.proposito, cobra_seguro_desgravamen: empForm.cobra_seguro, dia_pago: parseInt(empForm.dia_pago) || 3 })
      notify(`Solicitud empresarial enviada. Cuota estimada: S/ ${r.data.cuota_mensual_estimada?.toFixed(2)} | TEA: ${r.data.tea_aplicada}%`)
      setShowEmpresaModal(false); setRucBusqueda(""); setEmpForm({ empresa_id: "", monto: "", plazo: "12", proposito: "", cobra_seguro: true, dia_pago: 3 }); fetchData()
    } catch (err) { notify("Error: " + (err.response?.data?.detail || err.message), false) }
    setLoading(false)
  }

  /* ─── Registrar empresa ─── */
  const handleRegistrarEmpresa = async (e) => {
    e.preventDefault(); setNuevaEmpLoading(true)
    try {
      const r = await api.post("/empresas/", { ...nuevaEmp, facturacion_anual: parseFloat(nuevaEmp.facturacion_anual) || 0, num_trabajadores: parseInt(nuevaEmp.num_trabajadores) || 1 })
      setShowNuevaEmpresa(false)
      setNuevaEmp({ ruc: "", razon_social: "", tipo_empresa: "micro", sector: "", facturacion_anual: "", num_trabajadores: "1", representante_legal: "", email: "", telefono: "", direccion: "" })
      await fetchData(); setRucBusqueda(r.data.ruc); setEmpForm(prev => ({ ...prev, empresa_id: r.data.id }))
      notify(`Empresa "${r.data.razon_social}" registrada. Ahora completa la solicitud.`)
    } catch (err) { notify("Error: " + (err.response?.data?.detail || err.message), false) }
    setNuevaEmpLoading(false)
  }

  /* ─── Desembolsar ─── */
  const handleDesembolsar = async () => {
    if (!creditoSel || creditoSel.estado !== "aprobado") return
    setLoading(true)
    try {
      await api.put(`/creditos/${creditoSel.id}/estado`, { estado: "desembolsado" })
      notify("¡Crédito desembolsado! El dinero pronto estará en tu cuenta.")
      fetchData(); fetchCronograma(creditoSel.id); setCreditoSel(prev => ({ ...prev, estado: "desembolsado" }))
    } catch (err) { notify("Error al desembolsar: " + (err.response?.data?.detail || err.message), false) }
    setLoading(false)
  }

  /* ────────────────────────────────────────────────────── */
  return (
    <Layout title="Mis Créditos" subtitle="Simula, solicita y gestiona tus préstamos">

      {/* ── Alert ─────────────────────────────────────────── */}
      {mensaje && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 12,
          marginBottom: 24, padding: "14px 18px",
          background: mensajeOk ? "rgba(0,105,60,0.06)" : "rgba(218,41,28,0.06)",
          border: `1px solid ${mensajeOk ? "rgba(0,105,60,0.2)" : "rgba(218,41,28,0.2)"}`,
          borderLeft: `4px solid ${mensajeOk ? C.greenLight : C.red}`,
          borderRadius: 12, fontSize: 13.5, color: mensajeOk ? C.forest : C.red, fontWeight: 500,
        }}>
          <svg style={{ flexShrink: 0, marginTop: 1 }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {mensajeOk ? <><polyline points="20 6 9 17 4 12"/></> : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
          </svg>
          <span style={{ flex: 1 }}>{mensaje}</span>
          <button onClick={() => setMensaje("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* ── Action Bar ────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, color: C.ink, margin: 0 }}>
            Centro de Créditos
          </h2>
          <p style={{ fontSize: 13, color: C.muted, margin: "4px 0 0" }}>
            {loadingData ? "Cargando..." : `${creditos.length} crédito(s) en tu historial`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* Simulator button */}
          <button
            onClick={() => setShowSimulador(true)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 18px",
              background: "#fff", border: `1.5px solid ${C.border}`,
              borderRadius: 10, cursor: "pointer",
              fontSize: 13.5, fontWeight: 600, color: C.ink,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s", boxShadow: "0 2px 8px rgba(26,20,10,0.05)",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.goldLight; e.currentTarget.style.boxShadow = "0 4px 14px rgba(26,20,10,0.09)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "0 2px 8px rgba(26,20,10,0.05)"; }}
          >
            <svg width="15" height="15" fill="none" stroke={C.gold} strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>
            Simulador
          </button>
          {/* Personal credit */}
          <button
            onClick={() => setShowSolicitud(true)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 20px",
              background: C.lime, border: "none",
              borderRadius: 10, cursor: "pointer",
              fontSize: 13.5, fontWeight: 700, color: C.forest,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s", boxShadow: `0 4px 16px rgba(200,224,0,0.35)`,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#d4ef00"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.lime; e.currentTarget.style.transform = "none"; }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Crédito Personal
          </button>
          {/* Company credit */}
          <button
            onClick={() => setShowEmpresaModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 20px",
              background: C.forest, border: "none",
              borderRadius: 10, cursor: "pointer",
              fontSize: 13.5, fontWeight: 700, color: C.lime,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s", boxShadow: "0 4px 16px rgba(0,54,31,0.2)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.ink; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.forest; e.currentTarget.style.transform = "none"; }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Crédito Empresarial
          </button>
        </div>
      </div>

      {/* ── Tariff Banner ────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.forest} 0%, ${C.green} 100%)`,
        borderRadius: 18, padding: "24px 30px",
        marginBottom: 30, display: "flex",
        justifyContent: "space-between", alignItems: "center",
        position: "relative", overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,54,31,0.2)",
      }}>
        {/* Diagonal texture */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(200,224,0,0.03) 20px, rgba(200,224,0,0.03) 21px)`, pointerEvents: "none" }} />
        {/* Gold ornament top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.goldLight}, ${C.lime}, ${C.goldLight})` }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(200,224,0,0.15)", border: "1px solid rgba(200,224,0,0.25)", borderRadius: 100, padding: "4px 12px", marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.lime, display: "block" }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.lime, letterSpacing: "0.12em", textTransform: "uppercase" }}>Tarifario Vigente</span>
          </div>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#fff", fontWeight: 400, margin: "0 0 16px" }}>
            Crédito Empresarial — Micro
          </h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "Con seguro desgravamen", value: "40.92%", sub: "TEA", highlight: true },
              { label: "Sin seguro desgravamen", value: "43.92%", sub: "TEA", highlight: false },
              { label: "Sistema de cuotas", value: "Francés", sub: "cuotas fijas", highlight: false },
            ].map((item, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12, padding: "14px 20px",
                backdropFilter: "blur(8px)",
              }}>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.highlight ? C.lime : "#fff", letterSpacing: "-0.02em" }}>
                  {item.value} <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.45)" }}>{item.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative icon */}
        <div className="hidden md:flex" style={{ width: 80, height: 80, background: "rgba(255,255,255,0.05)", borderRadius: "50%", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)", position: "relative", zIndex: 1 }}>
          <svg width="38" height="38" fill="none" stroke="rgba(200,224,0,0.7)" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
      </div>

      {/* ── Credit List / Detail ─────────────────────────── */}
      {loadingData ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />
          ))}
        </div>
      ) : creditos.length === 0 ? (
        /* ── Empty state ── */
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 20, padding: "64px 32px", textAlign: "center", boxShadow: "0 4px 20px rgba(26,20,10,0.05)" }}>
          <div style={{ width: 72, height: 72, background: C.cream, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="30" height="30" fill="none" stroke={C.muted} strokeWidth="1.5" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: C.ink, margin: "0 0 8px" }}>Sin créditos activos</h3>
          <p style={{ fontSize: 13.5, color: C.muted, margin: "0 auto 28px", maxWidth: 320 }}>
            Solicita un crédito personal o empresarial en minutos, 100% online.
          </p>
          <button onClick={() => setShowSolicitud(true)} style={{
            background: C.forest, color: C.lime, border: "none", borderRadius: 10,
            padding: "11px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700,
            cursor: "pointer", boxShadow: "0 4px 16px rgba(0,54,31,0.2)",
          }}>
            Solicitar Crédito Personal
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }} className="lg:!grid-cols-[320px_1fr]">

          {/* ── Credit card list ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4, paddingLeft: 4 }}>
              Historial ({creditos.length})
            </div>
            {creditos.map(c => {
              const sel = creditoSel?.id === c.id
              const cfg = estadoCfg(c.estado)
              return (
                <div
                  key={c.id}
                  onClick={() => { setCreditoSel(c); fetchCronograma(c.id) }}
                  style={{
                    background: sel ? C.forest : "#fff",
                    border: sel ? `2px solid ${C.goldLight}` : `1.5px solid ${C.border}`,
                    borderRadius: 16, padding: "18px 20px",
                    cursor: "pointer", transition: "all 0.22s",
                    boxShadow: sel ? "0 8px 28px rgba(0,54,31,0.22)" : "0 2px 10px rgba(26,20,10,0.05)",
                    transform: sel ? "scale(1.01)" : "none",
                    position: "relative", overflow: "hidden",
                  }}
                  onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = C.goldLight; e.currentTarget.style.boxShadow = "0 4px 18px rgba(26,20,10,0.10)"; }}}
                  onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "0 2px 10px rgba(26,20,10,0.05)"; }}}
                >
                  {/* Gold top accent when selected */}
                  {sel && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.goldLight}, ${C.lime})` }} />}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sel ? "rgba(200,224,0,0.7)" : C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {c.tipo_producto === "empresarial_micro" ? "Empresarial Micro" : "Préstamo Personal"}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                      padding: "3px 8px", borderRadius: 100,
                      color: sel ? C.lime : cfg.color,
                      background: sel ? "rgba(200,224,0,0.12)" : cfg.bg,
                      border: `1px solid ${sel ? "rgba(200,224,0,0.25)" : cfg.border}`,
                    }}>
                      {cfg.label}
                    </span>
                  </div>

                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: sel ? "#fff" : C.ink, fontWeight: 400, letterSpacing: "-0.02em", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, opacity: 0.5, fontFamily: "'DM Sans', sans-serif" }}>S/ </span>
                    {fmt(c.monto_solicitado)}
                  </div>

                  <div style={{ display: "flex", gap: 14, fontSize: 12, color: sel ? "rgba(255,255,255,0.5)" : C.muted, fontWeight: 500 }}>
                    <span>{c.plazo_meses} meses</span>
                    <span>·</span>
                    <span>{c.tasa_interes}% TEA</span>
                    {c.cobra_seguro_desgravamen && <span style={{ color: sel ? "rgba(200,224,0,0.7)" : C.greenLight, fontWeight: 700 }}>+ Desgravamen</span>}
                  </div>

                  {sel && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="12" height="12" fill="none" stroke={C.lime} strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                      <span style={{ fontSize: 11.5, color: C.lime, fontWeight: 600 }}>Ver detalle →</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Detail panel ── */}
          <div>
            {creditoSel ? (
              <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 20px rgba(26,20,10,0.07)" }}>
                {/* Detail header */}
                <div style={{ background: C.cream, borderBottom: `1px solid ${C.border}`, padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                      {creditoSel.tipo_producto === "empresarial_micro" ? "Empresarial Micro" : "Préstamo Personal"}
                    </div>
                    <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.ink, margin: 0, fontWeight: 400 }}>
                      Detalle del Crédito
                    </h3>
                    <div style={{ marginTop: 8 }}>
                      <Badge estado={creditoSel.estado} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 600, marginBottom: 4 }}>Monto Financiado</div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: C.ink, fontWeight: 400 }}>
                      S/ {fmt(creditoSel.monto_solicitado)}
                    </div>
                  </div>
                </div>

                {/* KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderBottom: `1px solid ${C.border}` }}>
                  {[
                    { label: "Cuota Mensual", value: `S/ ${calcularCuota(creditoSel.monto_solicitado, creditoSel.plazo_meses, creditoSel.tasa_interes)}` },
                    { label: "Plazo Total",   value: `${creditoSel.plazo_meses} meses` },
                    { label: "Tasa TEA",      value: `${creditoSel.tasa_interes}%` },
                    { label: "Desgravamen",   value: creditoSel.cobra_seguro_desgravamen ? "Incluido" : "No incluido" },
                  ].map((item, i) => (
                    <div key={i} style={{
                      padding: "18px 20px",
                      borderRight: i < 3 ? `1px solid ${C.border}` : "none",
                      background: i % 2 === 0 ? "#fff" : C.cream,
                    }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{item.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "24px 28px" }}>
                  {/* Disbursement CTA */}
                  {creditoSel.estado === "aprobado" && (() => {
                    const isFuture = creditoSel.tipo_producto === "empresarial_micro" && creditoSel.created_at && new Date(creditoSel.created_at) > new Date()
                    return (
                      <div style={{
                        background: "rgba(0,105,60,0.06)", border: `1px solid rgba(0,105,60,0.18)`,
                        borderLeft: `4px solid ${C.greenLight}`,
                        borderRadius: 14, padding: "20px 22px", marginBottom: 24,
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
                      }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.forest, marginBottom: 4 }}>
                            🎉 ¡Tu crédito está aprobado!
                          </div>
                          <div style={{ fontSize: 12.5, color: C.muted }}>
                            {isFuture ? `Desembolso disponible desde ${new Date(creditoSel.created_at).toLocaleDateString("es-PE")}` : "Acepta las condiciones para desembolsar el monto."}
                          </div>
                        </div>
                        <button
                          onClick={isFuture ? undefined : handleDesembolsar}
                          disabled={isFuture || loading}
                          style={{
                            padding: "10px 22px", borderRadius: 10, border: "none",
                            fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 700,
                            cursor: isFuture ? "not-allowed" : "pointer",
                            background: isFuture ? C.creamDark : C.greenLight,
                            color: isFuture ? C.muted : "#fff",
                            boxShadow: isFuture ? "none" : "0 4px 14px rgba(0,166,81,0.3)",
                            transition: "all 0.2s", flexShrink: 0,
                          }}
                        >
                          {loading ? "Procesando..." : isFuture ? "No disponible aún" : "Aceptar y Desembolsar"}
                        </button>
                      </div>
                    )
                  })()}

                  {/* Cronograma */}
                  {cronograma.length > 0 && (
                    <div>
                      <h4 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: C.ink, fontWeight: 400, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 10 }}>
                        Cronograma de Pagos
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", background: C.cream, border: `1px solid ${C.border}`, borderRadius: 100, padding: "2px 10px" }}>
                          Sistema Francés
                        </span>
                      </h4>
                      <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                        <div style={{ maxHeight: 280, overflowY: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ background: C.forest, position: "sticky", top: 0 }}>
                                {["#", "Vencimiento", "Cuota", "Estado"].map(h => (
                                  <th key={h} style={{ padding: "11px 16px", fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "left" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {cronograma.map((cuota, i) => (
                                <tr key={cuota.id} style={{ background: i % 2 === 0 ? "#fff" : C.cream, borderBottom: `1px solid ${C.border}` }}>
                                  <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 700, color: C.muted }}>#{cuota.numero_cuota}</td>
                                  <td style={{ padding: "11px 16px", fontSize: 13, color: C.ink }}>
                                    {new Date(cuota.fecha_vencimiento).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                                  </td>
                                  <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 700, color: C.ink }}>S/ {fmt(cuota.monto_cuota)}</td>
                                  <td style={{ padding: "11px 16px" }}>
                                    <span style={{
                                      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
                                      padding: "3px 9px", borderRadius: 100,
                                      color: cuota.estado === "pagado" ? C.greenLight : cuota.estado === "vencido" ? C.red : C.gold,
                                      background: cuota.estado === "pagado" ? "rgba(0,166,81,0.1)" : cuota.estado === "vencido" ? "rgba(218,41,28,0.08)" : "rgba(184,150,12,0.1)",
                                    }}>
                                      {cuota.estado}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {cronograma.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px 0", color: C.muted }}>
                      <svg width="40" height="40" fill="none" stroke={C.border} strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto 12px", display: "block" }}>
                        <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/>
                      </svg>
                      <p style={{ fontSize: 13.5 }}>El cronograma estará disponible tras el desembolso.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 20, padding: "64px 32px", textAlign: "center", boxShadow: "0 4px 20px rgba(26,20,10,0.05)", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 64, height: 64, background: C.cream, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                  <svg width="28" height="28" fill="none" stroke={C.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.ink, margin: "0 0 8px", fontWeight: 400 }}>Selecciona un crédito</h3>
                <p style={{ fontSize: 13.5, color: C.muted }}>Haz clic en un crédito de la lista para ver su detalle y cronograma.</p>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ══ MODAL: SIMULADOR ══════════════════════════════════════ */}
      {showSimulador && (
        <ModalBase onClose={() => setShowSimulador(false)} title="Simulador de Crédito" subtitle="Descubre cuánto pagarías sin compromiso">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <FieldLabel>Monto a solicitar (S/)</FieldLabel>
              <FieldInput prefix="S/" type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="Ej: 10 000" />
            </div>
            <div>
              <FieldLabel>Plazo (meses)</FieldLabel>
              <FieldSelect value={form.plazo} onChange={e => setForm({ ...form, plazo: e.target.value })}>
                {[6,12,18,24,36,48,60].map(p => <option key={p} value={p}>{p} meses</option>)}
              </FieldSelect>
            </div>
            <button onClick={handleSimular} style={{ padding: "12px", background: C.forest, color: C.lime, border: "none", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Calcular Cuota
            </button>
            {simulacion && (
              <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", borderLeft: `4px solid ${C.lime}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Cuota mensual</span>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: C.forest, fontWeight: 400 }}>S/ {simulacion.cuota}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span style={{ color: C.muted }}>Total a pagar</span><span style={{ fontWeight: 700, color: C.ink }}>S/ {simulacion.total}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: C.muted }}>Intereses totales</span><span style={{ fontWeight: 700, color: C.muted }}>S/ {simulacion.interes}</span></div>
              </div>
            )}
            <button onClick={() => setShowSimulador(false)} style={{ padding: "11px", background: "transparent", color: C.muted, border: `1.5px solid ${C.border}`, borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              Cerrar
            </button>
          </div>
        </ModalBase>
      )}

      {/* ══ MODAL: CRÉDITO PERSONAL ══════════════════════════════ */}
      {showSolicitud && (
        <ModalBase onClose={() => setShowSolicitud(false)} title="Solicitar Crédito Personal" subtitle="100% online · Sin papeleos · TEA desde 18%">
          <form onSubmit={handleSolicitudPersonal} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <FieldLabel>Monto a solicitar (S/)</FieldLabel>
              <FieldInput prefix="S/" type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="Ej: 10 000" required />
            </div>
            <div>
              <FieldLabel>Plazo de pago</FieldLabel>
              <FieldSelect value={form.plazo} onChange={e => setForm({ ...form, plazo: e.target.value })}>
                {[6,12,18,24,36,48,60].map(p => <option key={p} value={p}>{p} meses</option>)}
              </FieldSelect>
            </div>
            <div>
              <FieldLabel>Propósito del préstamo</FieldLabel>
              <textarea value={form.proposito} onChange={e => setForm({ ...form, proposito: e.target.value })}
                placeholder="Ej. Remodelación, estudios, viaje..."
                rows={3}
                style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.ink, background: C.cream, outline: "none", resize: "none", boxSizing: "border-box" }}
                onFocus={e => { e.target.style.borderColor = C.green; e.target.style.background = "#fff" }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.background = C.cream }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowSolicitud(false)}
                style={{ flex: 1, padding: "12px", background: "transparent", color: C.muted, border: `1.5px solid ${C.border}`, borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                style={{ flex: 2, padding: "12px", background: loading ? C.muted : C.lime, color: C.forest, border: "none", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : `0 4px 14px rgba(200,224,0,0.35)` }}>
                {loading ? "Procesando..." : "Enviar Solicitud →"}
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {/* ══ MODAL: CRÉDITO EMPRESARIAL ═══════════════════════════ */}
      {showEmpresaModal && (
        <ModalBase onClose={() => { setShowEmpresaModal(false); setRucBusqueda("") }} maxWidth={520} title="Crédito Empresarial — Micro" subtitle="Sistema francés · Cuotas fijas iguales">
          {/* TEA selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            {[
              { label: "Con seguro desgravamen", value: 40.92, key: true },
              { label: "Sin seguro desgravamen", value: 43.92, key: false },
            ].map(opt => {
              const sel = empForm.cobra_seguro === opt.key
              return (
                <div key={String(opt.key)} onClick={() => setEmpForm(f => ({ ...f, cobra_seguro: opt.key }))}
                  style={{
                    padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                    background: sel ? C.forest : C.cream,
                    border: `2px solid ${sel ? C.goldLight : C.border}`,
                    transition: "all 0.2s",
                  }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: sel ? "rgba(200,224,0,0.7)" : C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{opt.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: sel ? C.lime : C.ink, letterSpacing: "-0.02em" }}>
                    {opt.value}% <span style={{ fontSize: 11, fontWeight: 600, color: sel ? "rgba(255,255,255,0.4)" : C.muted }}>TEA</span>
                  </div>
                  {sel && <div style={{ fontSize: 10, color: C.lime, fontWeight: 700, marginTop: 6, letterSpacing: "0.08em" }}>✓ SELECCIONADO</div>}
                </div>
              )
            })}
          </div>

          <form onSubmit={handleSolicitudEmpresarial} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* RUC */}
            <div>
              <FieldLabel>RUC de la Empresa (11 dígitos)</FieldLabel>
              <FieldInput type="text" maxLength={11} value={rucBusqueda}
                onChange={e => setRucBusqueda(e.target.value.replace(/\D/g, ""))}
                placeholder="20501234567" required />
              {rucBusqueda.length === 11 && (
                <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 10, border: `1px solid ${empresaEncontrada ? "rgba(0,166,81,0.25)" : "rgba(218,41,28,0.2)"}`, background: empresaEncontrada ? "rgba(0,166,81,0.06)" : "rgba(218,41,28,0.04)" }}>
                  {empresaEncontrada ? (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.greenLight, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>✓ Empresa identificada</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{empresaEncontrada.razon_social}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Sector: {empresaEncontrada.sector || "—"} · {empresaEncontrada.num_trabajadores} trabajadores</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>✗ Empresa no encontrada</div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>El RUC no coincide con ninguna empresa registrada.</div>
                      <button type="button" onClick={() => { setNuevaEmp(prev => ({ ...prev, ruc: rucBusqueda })); setShowNuevaEmpresa(true) }}
                        style={{ fontSize: 12, fontWeight: 700, color: C.forest, background: C.lime, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                        + Registrar esta empresa
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <FieldLabel>Monto a solicitar (S/)</FieldLabel>
              <FieldInput prefix="S/" type="number" value={empForm.monto} onChange={e => setEmpForm(f => ({ ...f, monto: e.target.value }))} placeholder="Ej: 50 000" required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <FieldLabel>Plazo de pago</FieldLabel>
                <FieldSelect value={empForm.plazo} onChange={e => setEmpForm(f => ({ ...f, plazo: e.target.value }))}>
                  {[6,12,18,24,36].map(p => <option key={p} value={p}>{p} meses</option>)}
                </FieldSelect>
              </div>
              <div>
                <FieldLabel>Día de pago mensual</FieldLabel>
                <FieldSelect value={empForm.dia_pago} onChange={e => setEmpForm(f => ({ ...f, dia_pago: e.target.value }))}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>Día {d}</option>)}
                </FieldSelect>
              </div>
            </div>

            <div>
              <FieldLabel>Propósito</FieldLabel>
              <textarea value={empForm.proposito} onChange={e => setEmpForm(f => ({ ...f, proposito: e.target.value }))}
                placeholder="Ej. Capital de trabajo, equipamiento, expansión..." rows={2}
                style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.ink, background: C.cream, outline: "none", resize: "none", boxSizing: "border-box" }}
                onFocus={e => { e.target.style.borderColor = C.green; e.target.style.background = "#fff" }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.background = C.cream }}
              />
            </div>

            {preview && (
              <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", borderLeft: `4px solid ${C.lime}` }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Preview — Cuotas Fijas</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: `1px solid ${C.border}`, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.forest }}>Cuota mensual estimada</span>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.forest }}>S/ {preview.cuota}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}><span style={{ color: C.muted }}>TEA aplicada</span><span style={{ fontWeight: 700, color: C.ink }}>{preview.tea}%</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}><span style={{ color: C.muted }}>Total a pagar</span><span style={{ fontWeight: 700, color: C.ink }}>S/ {preview.total}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ color: C.muted }}>Costo financiero</span><span style={{ fontWeight: 700, color: C.muted }}>S/ {preview.interes}</span></div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => { setShowEmpresaModal(false); setRucBusqueda("") }}
                style={{ flex: 1, padding: "12px", background: "transparent", color: C.muted, border: `1.5px solid ${C.border}`, borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                style={{ flex: 2, padding: "12px", background: loading ? C.muted : C.forest, color: C.lime, border: "none", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Procesando..." : "Enviar Solicitud →"}
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {/* ══ MODAL: REGISTRAR EMPRESA ══════════════════════════════ */}
      {showNuevaEmpresa && (
        <ModalBase onClose={() => setShowNuevaEmpresa(false)} maxWidth={540} title="Registrar Nueva Empresa" subtitle="Completa los datos para dar de alta la empresa">
          <form onSubmit={handleRegistrarEmpresa} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { label: "RUC (11 dígitos)", field: "ruc", placeholder: "20501234567", maxLength: 11, span: 2 },
              { label: "Razón Social", field: "razon_social", placeholder: "Mi Empresa S.A.C.", required: true, span: 2 },
              { label: "Representante Legal", field: "representante_legal", placeholder: "Juan Pérez Ríos", span: 2 },
              { label: "Email", field: "email", placeholder: "contacto@empresa.pe", span: 1 },
              { label: "Teléfono", field: "telefono", placeholder: "014512345", span: 1 },
              { label: "Dirección", field: "direccion", placeholder: "Av. Principal 123, Lima", span: 2 },
            ].map(f => (
              <div key={f.field} style={{ gridColumn: `span ${f.span}` }}>
                <FieldLabel>{f.label}</FieldLabel>
                <FieldInput type="text" value={nuevaEmp[f.field]} onChange={e => setNuevaEmp(n => ({ ...n, [f.field]: e.target.value }))} placeholder={f.placeholder} maxLength={f.maxLength} required={f.required} />
              </div>
            ))}

            <div>
              <FieldLabel>Tipo de empresa</FieldLabel>
              <FieldSelect value={nuevaEmp.tipo_empresa} onChange={e => setNuevaEmp(n => ({ ...n, tipo_empresa: e.target.value }))}>
                <option value="micro">Micro (hasta S/ 1.7M)</option>
                <option value="pequena">Pequeña</option>
                <option value="mediana">Mediana</option>
              </FieldSelect>
            </div>

            <div>
              <FieldLabel>Sector</FieldLabel>
              <FieldSelect value={nuevaEmp.sector} onChange={e => setNuevaEmp(n => ({ ...n, sector: e.target.value }))}>
                <option value="">— Selecciona —</option>
                {["comercio","servicios","manufactura","agro","tecnologia","construccion","transporte","salud","educacion"].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </FieldSelect>
            </div>

            <div>
              <FieldLabel>Facturación anual (S/)</FieldLabel>
              <FieldInput type="number" value={nuevaEmp.facturacion_anual} onChange={e => setNuevaEmp(n => ({ ...n, facturacion_anual: e.target.value }))} placeholder="850000" />
            </div>
            <div>
              <FieldLabel>N° de trabajadores</FieldLabel>
              <FieldInput type="number" value={nuevaEmp.num_trabajadores} onChange={e => setNuevaEmp(n => ({ ...n, num_trabajadores: e.target.value }))} placeholder="5" />
            </div>

            <div style={{ gridColumn: "span 2", display: "flex", gap: 10, marginTop: 4 }}>
              <button type="button" onClick={() => setShowNuevaEmpresa(false)}
                style={{ flex: 1, padding: "12px", background: "transparent", color: C.muted, border: `1.5px solid ${C.border}`, borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Cancelar
              </button>
              <button type="submit" disabled={nuevaEmpLoading}
                style={{ flex: 2, padding: "12px", background: nuevaEmpLoading ? C.muted : C.lime, color: C.forest, border: "none", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, cursor: nuevaEmpLoading ? "not-allowed" : "pointer" }}>
                {nuevaEmpLoading ? "Registrando..." : "Registrar Empresa →"}
              </button>
            </div>
          </form>
        </ModalBase>
      )}

    </Layout>
  )
}