import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import logoFalabella from "../../assets/1200x630-Logo_Fala.png"

// ─── Password strength ────────────────────────────────────────────
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" }
  const isNum = /^\d+$/.test(password)
  if (password.length < 3) return { score: 1, label: "Muy débil", color: "#da291c" }
  if (password.length < 6) return { score: 2, label: "Débil", color: "#f97316" }
  if (isNum && password.length === 6) return { score: 3, label: "Aceptable", color: "#eab308" }
  return { score: 4, label: "Fuerte", color: "#00a651" }
}

// ─── Input Component ────────────────────────────────────────────
function Field({ label, name, type = "text", value, onChange, placeholder, required, maxLength, onInput, hint }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        onInput={onInput}
        style={{
          width: "100%",
          border: `1.5px solid ${focused ? "var(--green-light)" : "#e0e7e0"}`,
          borderRadius: 12,
          padding: "12px 14px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14.5,
          color: "#0f1a0f",
          background: "#fff",
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(0,166,81,0.1)" : "none",
        }}
      />
      {hint && <p style={{ fontSize: 11.5, color: "#6b7280", marginTop: 5 }}>{hint}</p>}
    </div>
  )
}

// ─── Step indicator ────────────────────────────────────────────
function StepIndicator({ current, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flex: i < total - 1 ? 1 : "none" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: i + 1 <= current ? "var(--green-mid)" : "#e8ede8",
            color: i + 1 <= current ? "#fff" : "#9ca3af",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 12,
            transition: "background 0.3s",
            flexShrink: 0,
          }}>
            {i + 1 < current
              ? <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              : i + 1
            }
          </div>
          {i < total - 1 && (
            <div style={{ flex: 1, height: 2, background: i + 1 < current ? "var(--green-mid)" : "#e8ede8", borderRadius: 2, transition: "background 0.3s" }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function Register() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    nombre: "", apellido: "", dni: "", email: "",
    telefono: "", direccion: "", fecha_nacimiento: "", password: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validateStep1 = () => {
    if (!form.nombre || !form.apellido) return "Completa tu nombre y apellido."
    if (!form.dni || form.dni.length < 8) return "Ingresa un DNI válido de 8 dígitos."
    if (!form.email || !form.email.includes("@")) return "Ingresa un correo electrónico válido."
    return ""
  }

  const handleNext = () => {
    const err = validateStep1()
    if (err) { setError(err); return }
    setError("")
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length !== 6 || !/^\d{6}$/.test(form.password)) {
      setError("La clave debe tener exactamente 6 dígitos numéricos.")
      return
    }
    setLoading(true)
    setError("")

    const { data, error: regError } = await register({
      nombre: form.nombre,
      apellido: form.apellido,
      dni: form.dni,
      email: form.email,
      telefono: form.telefono || null,
      direccion: form.direccion || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      password: form.password,
    })

    if (regError) {
      setError(regError.message)
      setLoading(false)
      return
    }

    if (data?.access_token) {
      navigate("/dashboard")
    } else {
      navigate("/", { state: { mensaje: "Cuenta creada exitosamente. Inicia sesión con tu DNI." } })
    }
    setLoading(false)
  }

  const pwStrength = getPasswordStrength(form.password)

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>

      {/* ── Navbar ────────────────────────────────────────────── */}
      <header style={{
        background: "#fff",
        borderBottom: "1px solid var(--border)",
        padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        <img src={logoFalabella} alt="Banco Falabella" style={{ height: 36, objectFit: "contain" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="dot-pulse" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Registro Seguro</span>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
        <div style={{
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 8px 48px rgba(0,54,31,0.10)",
          border: "1px solid var(--border)",
          width: "100%", maxWidth: 500,
          overflow: "hidden",
        }} className="animate-fade-up">

          {/* Top strip */}
          <div style={{
            background: "linear-gradient(135deg, #00361f, #00693c)",
            padding: "24px 32px",
          }}>
            <div style={{ fontSize: 11, color: "rgba(200,224,0,0.8)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
              Nuevo Cliente
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
              Crear cuenta
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: "4px 0 0" }}>
              Paso {step} de 2 · {step === 1 ? "Datos personales" : "Contacto y clave"}
            </p>
          </div>

          <div style={{ padding: "28px 32px" }}>

            <StepIndicator current={step} total={2} />

            {/* Error */}
            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 12, padding: "12px 16px", marginBottom: 20,
                fontSize: 13.5, color: "#b91c1c", fontWeight: 500,
                display: "flex", alignItems: "center", gap: 8,
              }} className="animate-shake">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* ── Step 1: Personal Data ─────────────────────── */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. María" required />
                  <Field label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} placeholder="Ej. García" required />
                </div>
                <Field
                  label="DNI"
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  placeholder="12345678"
                  maxLength={8}
                  required
                  onInput={(e) => e.target.value = e.target.value.replace(/\D/g, "")}
                  hint="8 dígitos sin puntos ni espacios"
                />
                <Field
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  required
                />

                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    background: "linear-gradient(135deg, #00693c, #00a651)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 13,
                    padding: "14px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(0,105,60,0.25)",
                    transition: "all 0.2s",
                  }}
                  className="hover:!opacity-90 hover:!-translate-y-0.5"
                >
                  Continuar →
                </button>
              </div>
            )}

            {/* ── Step 2: Contact + Password ──────────────── */}
            {step === 2 && (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} placeholder="987654321" />
                  <Field label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} />
                </div>
                <Field label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} placeholder="Av. Principal 123, Lima" />

                {/* Password with toggle + strength */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Clave de Internet
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      name="password"
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                      placeholder="6 dígitos numéricos"
                      maxLength={6}
                      required
                      style={{
                        width: "100%",
                        border: "1.5px solid #e0e7e0",
                        borderRadius: 12,
                        padding: "12px 44px 12px 14px",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14.5,
                        color: "#0f1a0f",
                        background: "#fff",
                        outline: "none",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                        letterSpacing: form.password ? "0.2em" : "normal",
                      }}
                      onFocus={e => { e.target.style.borderColor = "#00a651"; e.target.style.boxShadow = "0 0 0 3px rgba(0,166,81,0.1)" }}
                      onBlur={e => { e.target.style.borderColor = "#e0e7e0"; e.target.style.boxShadow = "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}
                    >
                      {showPass
                        ? <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                  {/* Strength bar */}
                  {form.password.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 4, background: "#e8ede8", borderRadius: 100, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${(pwStrength.score / 4) * 100}%`,
                          background: pwStrength.color,
                          borderRadius: 100,
                          transition: "width 0.3s, background 0.3s",
                        }} />
                      </div>
                      <div style={{ fontSize: 11.5, color: pwStrength.color, fontWeight: 600, marginTop: 4 }}>
                        {pwStrength.label}
                      </div>
                    </div>
                  )}
                  <p style={{ fontSize: 11.5, color: "#6b7280", marginTop: 6 }}>
                    Exactamente 6 dígitos numéricos. Evita tu fecha de nacimiento.
                  </p>
                </div>

                {/* Security notice */}
                <div style={{
                  background: "rgba(0,166,81,0.04)", border: "1px solid rgba(0,166,81,0.15)",
                  borderRadius: 12, padding: "12px 14px",
                  display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                  <svg style={{ color: "#00a651", flexShrink: 0, marginTop: 1 }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span style={{ fontSize: 12, color: "#374151" }}>
                    Tus datos están protegidos con cifrado SSL de 256 bits. Nunca compartiremos tu información.
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      flex: 1, padding: "13px", border: "1.5px solid var(--border)",
                      borderRadius: 13, background: "#fff",
                      fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                      cursor: "pointer", color: "var(--text-muted)",
                      transition: "all 0.2s",
                    }}
                    className="hover:!border-[#00693c] hover:!text-[#00693c]"
                  >
                    ← Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 2, padding: "13px",
                      background: loading ? "#9ca3af" : "linear-gradient(135deg, #00693c, #00a651)",
                      color: "#fff", border: "none",
                      borderRadius: 13,
                      fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      boxShadow: loading ? "none" : "0 6px 20px rgba(0,105,60,0.25)",
                      transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {loading ? (
                      <>
                        <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                          </path>
                        </svg>
                        Registrando...
                      </>
                    ) : "Crear mi cuenta →"}
                  </button>
                </div>
              </form>
            )}

            {/* Login link */}
            <div style={{ marginTop: 24, textAlign: "center", fontSize: 13.5, color: "var(--text-muted)" }}>
              ¿Ya tienes cuenta?{" "}
              <Link to="/" style={{ color: "var(--green-mid)", fontWeight: 700, textDecoration: "none" }}>
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{
        background: "#00361f", color: "rgba(255,255,255,0.5)",
        textAlign: "center", padding: "14px 16px", fontSize: 11.5,
      }}>
        © 2026 Banco Falabella Perú S.A. · Supervisado por la SBS · Todos los derechos reservados
      </footer>
    </div>
  )
}