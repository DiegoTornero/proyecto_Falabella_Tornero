import { useState, useEffect } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import logoFalabella from "../../assets/1200x630-Logo_Fala.png"
import heroFamily from "../../assets/hero_family.png"
import api from "../../lib/api"

export default function Login() {
  const [dni, setDni] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const mensajeExito = location.state?.mensaje || ""

  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryStep, setRecoveryStep] = useState(1)
  const [recoveryDni, setRecoveryDni] = useState("")
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [recoveryOtp, setRecoveryOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [recoveryError, setRecoveryError] = useState("")
  const [recoverySuccess, setRecoverySuccess] = useState("")
  const [recoveryLoading, setRecoveryLoading] = useState(false)

  const handleRequestRecovery = async (e) => {
    e.preventDefault()
    setRecoveryLoading(true)
    setRecoveryError("")
    setRecoverySuccess("")
    try {
      const res = await api.post("/auth/password-recovery/request", {
        dni: recoveryDni,
        email: recoveryEmail
      })
      setRecoverySuccess(res.data.mensaje)
      setRecoveryStep(2)
    } catch (err) {
      setRecoveryError(err.response?.data?.detail || "Error al solicitar código")
    } finally {
      setRecoveryLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length !== 6) {
      setRecoveryError("La clave debe tener exactamente 6 dígitos numéricos.")
      return
    }
    setRecoveryLoading(true)
    setRecoveryError("")
    setRecoverySuccess("")
    try {
      const res = await api.post("/auth/password-recovery/reset", {
        dni: recoveryDni,
        otp: recoveryOtp,
        nueva_password: newPassword
      })
      setRecoverySuccess(res.data.mensaje)
      setTimeout(() => {
        setShowRecovery(false)
        setRecoveryStep(1)
        setRecoveryDni("")
        setRecoveryEmail("")
        setRecoveryOtp("")
        setNewPassword("")
        setRecoverySuccess("")
      }, 3000)
    } catch (err) {
      setRecoveryError(err.response?.data?.detail || "Código incorrecto o error al guardar clave")
    } finally {
      setRecoveryLoading(false)
    }
  }

  const [isLoaded, setIsLoaded] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    if (password.length !== 6) {
      setError("La clave debe tener exactamente 6 dígitos numéricos.")
      setLoading(false)
      return
    }
    const { error } = await login(dni, password)
    if (error) {
      setError("Datos incorrectos. Intenta nuevamente.")
    } else {
      navigate("/dashboard")
    }
    setLoading(false)
  }

  return (
    <>
      {/* ── FONT IMPORT ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Serif+Display:ital@0;1&display=swap');

        .falabella-page * { box-sizing: border-box; }

        .falabella-page {
          font-family: 'DM Sans', sans-serif;
          background: #f5f5f0;
          min-height: 100vh;
        }

        /* Input focus rings */
        .doc-select-wrap:focus-within,
        .pw-wrap:focus-within {
          border-color: #c8e000 !important;
          box-shadow: 0 0 0 3px rgba(200,224,0,0.15);
        }

        /* Nav hover */
        .nav-item {
          cursor: pointer;
          padding: 16px 0;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #888;
          border-bottom: 2px solid transparent;
          transition: color 0.2s, border-color 0.2s;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .nav-item:hover { color: #1a6b3c; border-bottom-color: #c8e000; }

        /* Topbar links */
        .topbar-link {
          cursor: pointer;
          transition: color 0.2s;
          color: #888;
        }
        .topbar-link:hover { color: #c8e000; }
        .topbar-link.active { color: #fff; font-weight: 500; }

        /* Stat cards */
        .stat-card {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 20px 22px;
          transition: background 0.2s;
          cursor: default;
        }
        .stat-card:hover { background: rgba(255,255,255,0.12); }

        /* CTA button */
        .btn-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #c8e000;
          color: #1a2e1a;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: none;
          border-radius: 100px;
          padding: 14px 28px;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          text-decoration: none;
        }
        .btn-cta:hover {
          background: #d4ef00;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(200,224,0,0.3);
        }
        .btn-cta:active { transform: translateY(0); }

        /* Search pill */
        .search-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          padding: 9px 16px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .search-pill:hover { border-color: #c8e000; }

        /* Login button */
        .btn-login {
          background: #1a6b3c;
          color: #fff;
          border: none;
          border-radius: 10px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          flex-shrink: 0;
        }
        .btn-login:hover { background: #155a32; }
        .btn-login:active { transform: scale(0.95); }
        .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Mobile form */
        .mobile-input {
          width: 100%;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 14px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          color: #1a1a1a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #fff;
        }
        .mobile-input:focus {
          border-color: #c8e000;
          box-shadow: 0 0 0 3px rgba(200,224,0,0.15);
        }
        .mobile-input::placeholder { color: #bbb; }

        .btn-mobile-login {
          width: 100%;
          background: #1a6b3c;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 15px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .btn-mobile-login:hover { background: #155a32; }
        .btn-mobile-login:active { transform: scale(0.98); }
        .btn-mobile-login:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Hero left circle deco */
        .hero-circle-deco {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        /* Chat float */
        .chat-btn {
          position: absolute;
          bottom: 20px;
          right: 20px;
          z-index: 2;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          border-radius: 100px;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          backdrop-filter: blur(8px);
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
        }
        .chat-btn:hover {
          background: rgba(255,255,255,0.18);
          transform: translateY(-1px);
        }

        /* Fade in animations */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-fade-up-1 { animation: fadeUp 0.6s ease forwards; animation-delay: 0.1s; opacity: 0; }
        .animate-fade-up-2 { animation: fadeUp 0.6s ease forwards; animation-delay: 0.25s; opacity: 0; }
        .animate-fade-up-3 { animation: fadeUp 0.6s ease forwards; animation-delay: 0.4s; opacity: 0; }
        .animate-fade-in   { animation: fadeIn 0.8s ease forwards; animation-delay: 0.3s; opacity: 0; }

        /* Error shake */
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-4px); }
          40%      { transform: translateX(4px); }
          60%      { transform: translateX(-3px); }
          80%      { transform: translateX(3px); }
        }
        .error-shake { animation: shake 0.35s ease; }
      `}</style>

      <div className="falabella-page">

        {/* ── BARRA SUPERIOR NEGRA ── */}
        <div style={{
          background: "#1a1a1a",
          color: "#999",
          fontSize: 11,
          padding: "8px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          letterSpacing: "0.02em"
        }} className="hidden md:flex">
          <div style={{ display: "flex", gap: 24 }}>
            {["Falabella", "Viajes Falabella", "Seguros Falabella", "Sodimac", "Tottus", "Maestro"].map((item, i) => (
              <span key={item} className={`topbar-link${i === 0 ? " active" : ""}`}>{item}</span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", transition: "color 0.2s" }}
            className="topbar-link">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
            </svg>
            Ayuda y Contacto
          </div>
        </div>

        {/* ── HEADER ── */}
        <header style={{
          background: "#fff",
          borderBottom: "1px solid #ebebeb",
          padding: "0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 72,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={logoFalabella}
              alt="Banco Falabella"
              style={{ height: 40, objectFit: "contain", cursor: "pointer" }}
            />
          </div>

          {/* Desktop form */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 16 }}>
            {/* Search */}
            <div className="search-pill">
              <span style={{ fontSize: 13, color: "#888" }}>Buscar</span>
              <svg width="15" height="15" fill="none" stroke="#1a6b3c" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* DNI select + input */}
              <div className="doc-select-wrap" style={{
                display: "flex",
                border: "1px solid #e0e0e0",
                borderRadius: 10,
                overflow: "hidden",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}>
                <select style={{
                  border: "none",
                  borderRight: "1px solid #e0e0e0",
                  background: "#f8f8f6",
                  padding: "10px 12px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "#555",
                  cursor: "pointer",
                  outline: "none",
                }}>
                  <option>DNI</option>
                  <option>CE</option>
                </select>
                <input
                  type="text"
                  maxLength={8}
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                  placeholder="Número de documento"
                  required
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "10px 14px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    outline: "none",
                    color: "#1a1a1a",
                    width: 160,
                  }}
                />
              </div>

              {/* Password */}
              <div className="pw-wrap" style={{
                border: "1px solid #e0e0e0",
                borderRadius: 10,
                overflow: "hidden",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Clave (6 dígitos)"
                  maxLength={6}
                  required
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "10px 14px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    outline: "none",
                    color: "#1a1a1a",
                    width: 150,
                  }}
                />
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn-login">
                {loading
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" /></path></svg>
                  : <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                }
              </button>
            </form>

            {/* Error / Link row */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              {error && (
                <span className="error-shake" style={{ fontSize: 11.5, color: "#d94f4f", fontWeight: 500 }}>{error}</span>
              )}
              <div style={{ display: "flex", gap: 6, fontSize: 11.5 }}>
                <span onClick={() => { setShowRecovery(true); setRecoveryStep(1); }} style={{ color: "#1a6b3c", cursor: "pointer", textDecoration: "none" }} onMouseEnter={e => e.target.style.textDecoration = "underline"} onMouseLeave={e => e.target.style.textDecoration = "none"}>
                  Recuperar clave
                </span>
                <span style={{ color: "#ccc" }}>·</span>
                <Link to="/registro" style={{
                  color: "#1a6b3c",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
                  onMouseEnter={e => e.target.style.textDecoration = "underline"}
                  onMouseLeave={e => e.target.style.textDecoration = "none"}
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile button */}
          <button className="md:hidden btn-login" style={{ width: "auto", padding: "0 16px", borderRadius: 100, gap: 6, display: "flex" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Ingresar</span>
          </button>
        </header>

        {/* ── NAV SECUNDARIO ── */}
        <nav className="hidden md:flex" style={{
          background: "#fff",
          borderBottom: "1px solid #ebebeb",
          padding: "0 48px",
          gap: 36,
        }}>
          {["Tarjetas de crédito", "Créditos", "Cuentas", "CMR Puntos", "Seguros", "Promociones"].map(item => (
            <span key={item} className="nav-item">{item}</span>
          ))}
        </nav>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, padding: "32px 48px 48px", maxWidth: 1280, margin: "0 auto", width: "100%" }}>

          {/* Mensaje de éxito */}
          {mensajeExito && (
            <div style={{
              marginBottom: 24,
              padding: "14px 20px",
              background: "#f0f9f4",
              border: "1px solid rgba(26,107,60,0.2)",
              borderRadius: 12,
              color: "#1a6b3c",
              fontSize: 14,
              fontWeight: 500,
              textAlign: "center",
              maxWidth: 560,
              margin: "0 auto 24px",
            }}>
              ✅ {mensajeExito}
            </div>
          )}

          {/* ── HERO ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderRadius: 20,
            overflow: "hidden",
            height: 460,
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }} className="hidden md:grid">

            {/* Panel izquierdo */}
            <div style={{
              background: "#1a2e1a",
              padding: "56px 52px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Decoraciones de fondo */}
              <div className="hero-circle-deco" style={{
                width: 340, height: 340,
                background: "rgba(200,224,0,0.05)",
                top: -100, right: -100,
              }} />
              <div className="hero-circle-deco" style={{
                width: 180, height: 180,
                background: "rgba(200,224,0,0.04)",
                bottom: -40, left: -40,
              }} />

              {/* Eyebrow */}
              <div className="animate-fade-up-1" style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#c8e000",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <span style={{ width: 20, height: 1.5, background: "#c8e000", display: "block" }} />
                Cuenta Sueldo
              </div>

              {/* Título */}
              <div className="animate-fade-up-2">
                <h2 style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 44,
                  color: "#fff",
                  lineHeight: 1.1,
                  marginBottom: 12,
                  fontWeight: 400,
                }}>
                  Traslada tu cuenta<br />
                  y recibe{" "}
                  <span style={{ color: "#c8e000", fontStyle: "italic" }}>4.6% TREA</span>
                </h2>
                <p style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.5)",
                  fontWeight: 300,
                  marginBottom: 40,
                  lineHeight: 1.65,
                }}>
                  Hazlo hoy y disfruta de beneficios exclusivos<br />para ti y tu familia.
                </p>
              </div>

              {/* CTA */}
              <div className="animate-fade-up-3">
                <Link to="/registro" className="btn-cta">
                  Abre tu cuenta aquí
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Panel derecho — Imagen de Familia con Tarjetas Flotantes */}
            <div style={{
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }} className="animate-fade-in">

              {/* Imagen de Fondo (Familia) */}
              <img
                src={heroFamily}
                alt="Familia"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  transition: "transform 2s ease",
                }}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              />

              {/* Gradiente oscuro en la parte inferior para que las tarjetas destaquen */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "60%",
                background: "linear-gradient(to top, rgba(26,46,26,0.9) 0%, transparent 100%)",
                pointerEvents: "none",
              }} />

              {/* Stats grid flotante sobre la imagen */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                padding: "0 40px 30px 40px",
                width: "100%",
                position: "relative",
                zIndex: 1,
              }}>
                {/* Featured card */}
                <div style={{
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 14,
                  padding: "16px 22px",
                  gridColumn: "1 / -1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                      Tasa anual efectiva
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: "#c8e000", lineHeight: 1, marginBottom: 4, textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
                      4.6%
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 400 }}>
                      TREA — la mejor del mercado
                    </div>
                  </div>
                  <div style={{
                    background: "#c8e000",
                    color: "#1a2e1a",
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    padding: "5px 12px",
                    borderRadius: 100,
                    textTransform: "uppercase",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(200,224,0,0.3)",
                  }}>
                    Oferta exclusiva
                  </div>
                </div>

                {/* Stat 1 */}
                <div className="stat-card" style={{ backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                    Sin comisiones
                  </div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#fff", lineHeight: 1, marginBottom: 4 }}>
                    S/0
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 400 }}>
                    Mantenimiento mensual
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="stat-card" style={{ backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                    Retiros gratis
                  </div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#fff", lineHeight: 1, marginBottom: 4 }}>
                    ∞
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 400 }}>
                    En red de cajeros
                  </div>
                </div>
              </div>

              {/* Chat float */}
              <button className="chat-btn">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                Contáctanos
              </button>
            </div>
          </div>

          {/* ── FORMULARIO MOBILE ── */}
          <div className="md:hidden" style={{ paddingTop: 8 }}>
            <div style={{
              background: "#fff",
              borderRadius: 20,
              padding: 28,
              border: "1px solid #ebebeb",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              {/* Banner móvil */}
              <div style={{
                background: "#1a2e1a",
                borderRadius: 14,
                padding: "20px 22px",
                marginBottom: 24,
              }}>
                <div style={{ fontSize: 11, color: "#c8e000", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                  Cuenta Sueldo
                </div>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#fff", fontWeight: 400, lineHeight: 1.2 }}>
                  Recibe <span style={{ color: "#c8e000", fontStyle: "italic" }}>4.6% TREA</span> hoy
                </p>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", marginBottom: 20, letterSpacing: "-0.02em" }}>
                Iniciar sesión
              </h2>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <select style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 12,
                    padding: "14px 12px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: "#555",
                    outline: "none",
                    background: "#f8f8f6",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}>
                    <option>DNI</option>
                    <option>CE</option>
                  </select>
                  <input
                    type="text"
                    maxLength={8}
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                    placeholder="Número de documento"
                    required
                    className="mobile-input"
                    style={{ flex: 1 }}
                  />
                </div>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Clave (6 dígitos)"
                  maxLength={6}
                  required
                  className="mobile-input"
                />

                {error && (
                  <p className="error-shake" style={{ fontSize: 13, color: "#d94f4f", fontWeight: 500, margin: 0 }}>
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading} className="btn-mobile-login">
                  {loading ? "Ingresando..." : "Ingresar"}
                </button>

                <div style={{ display: "flex", justifyContent: "center", gap: 12, fontSize: 13.5, paddingTop: 4 }}>
                  <span onClick={() => { setShowRecovery(true); setRecoveryStep(1); }} style={{ color: "#1a6b3c", cursor: "pointer", fontWeight: 500 }}>
                    Recuperar clave
                  </span>
                  <span style={{ color: "#ccc" }}>·</span>
                  <Link to="/registro" style={{
                    color: "#1a6b3c",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}>
                    Crear cuenta
                  </Link>
                </div>
              </form>
            </div>
          </div>

        </main>
      </div>

      {showRecovery && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10,31,20,0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: 16
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 24,
            padding: 32,
            width: "100%",
            maxWidth: 420,
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0a1f14", margin: 0 }}>Recuperar Clave</h3>
              <button onClick={() => setShowRecovery(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#888", lineHeight: 1 }}>&times;</button>
            </div>

            {recoveryError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                ⚠️ {recoveryError}
              </div>
            )}

            {recoverySuccess && (
              <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", color: "#15803d", padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                ✅ {recoverySuccess}
              </div>
            )}

            {recoveryStep === 1 ? (
              <form onSubmit={handleRequestRecovery} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.5 }}>
                  Ingresa tu DNI y tu Correo Electrónico. Te generaremos un código de seguridad OTP para validar tu identidad.
                </p>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>Número de DNI</label>
                  <input
                    type="text"
                    maxLength={8}
                    required
                    value={recoveryDni}
                    onChange={e => setRecoveryDni(e.target.value.replace(/\D/g, ""))}
                    placeholder="Escribe tu DNI"
                    style={{ width: "100%", padding: 12, border: "1px solid #e0e0e0", borderRadius: 12, fontSize: 14, outline: "none", marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={e => setRecoveryEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    style={{ width: "100%", padding: 12, border: "1px solid #e0e0e0", borderRadius: 12, fontSize: 14, outline: "none", marginTop: 4 }}
                  />
                </div>
                <button type="submit" disabled={recoveryLoading} style={{ background: "#1a6b3c", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
                  {recoveryLoading ? "Generando OTP..." : "Siguiente"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.5 }}>
                  El código OTP fue enviado y se muestra en la <strong>consola/logs del backend</strong>. Ingrésalo a continuación junto con tu nueva clave de 6 dígitos numéricos.
                </p>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>Código OTP (6 dígitos)</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={recoveryOtp}
                    onChange={e => setRecoveryOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    style={{ width: "100%", padding: 12, border: "1px solid #e0e0e0", borderRadius: 12, fontSize: 16, fontWeight: "bold", textAlign: "center", letterSpacing: 8, outline: "none", marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>Nueva Clave de Internet (6 números)</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value.replace(/\D/g, ""))}
                    placeholder="******"
                    style={{ width: "100%", padding: 12, border: "1px solid #e0e0e0", borderRadius: 12, fontSize: 16, fontWeight: "bold", textAlign: "center", letterSpacing: 8, outline: "none", marginTop: 4 }}
                  />
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button type="button" onClick={() => setRecoveryStep(1)} style={{ flex: 1, background: "#f5f5f0", color: "#555", border: "none", borderRadius: 12, padding: 14, fontWeight: 600, cursor: "pointer" }}>
                    Atrás
                  </button>
                  <button type="submit" disabled={recoveryLoading} style={{ flex: 1, background: "#1a6b3c", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontWeight: 600, cursor: "pointer" }}>
                    {recoveryLoading ? "Restableciendo..." : "Guardar Clave"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}