import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import logoFalabella from "../../assets/1200x630-Logo_Fala.png"

export default function Register() {
  const [form, setForm] = useState({
    nombre: "", apellido: "", dni: "", email: "",
    telefono: "", direccion: "", fecha_nacimiento: "", password: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length !== 6) {
      setError("La Clave Internet debe ser exactamente de 6 dígitos numéricos.")
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
      navigate("/", { state: { mensaje: "✅ Cuenta creada exitosamente. Inicia sesión con tu DNI." } })
    }
    setLoading(false)
  }

  const inputCls = "w-full mt-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a651] bg-white"

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>

      {/* NAVBAR */}
      <nav className="py-4 px-8 flex items-center justify-between" style={{ background: "linear-gradient(145deg, #004d2c 0%, #00693c 100%)" }}>
        <div className="flex items-center">
          <img 
            src={logoFalabella} 
            alt="Banco Falabella" 
            style={{ height: 36, objectFit: "contain" }} 
          />
        </div>
        <span className="text-white text-sm hidden md:block font-medium">Banca por Internet</span>
      </nav>

      {/* CONTENIDO */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8">

          <div className="mb-6">
            <p style={{ color: "#00693c", fontWeight: 600, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              Nuevo cliente
            </p>
            <h2 className="text-2xl font-bold text-[#0f172a]">Crear Cuenta</h2>
            <p className="text-gray-500 text-sm mt-1">Completa tus datos para registrarte</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Nombre</label>
                <input name="nombre" value={form.nombre} onChange={handleChange}
                  placeholder="Tu nombre" required className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Apellido</label>
                <input name="apellido" value={form.apellido} onChange={handleChange}
                  placeholder="Tu apellido" required className={inputCls} />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">DNI</label>
              <input name="dni" value={form.dni} onChange={handleChange}
                maxLength={8} placeholder="12345678" required className={inputCls}
                onInput={(e) => e.target.value = e.target.value.replace(/\D/g, "")} />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Correo electrónico</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="correo@ejemplo.com" required className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={handleChange}
                  placeholder="987654321" className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Fecha de nacimiento</label>
                <input name="fecha_nacimiento" type="date" value={form.fecha_nacimiento}
                  onChange={handleChange} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange}
                placeholder="Tu dirección" className={inputCls} />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Clave Internet</label>
              <input name="password" type="password" value={form.password} 
                onChange={(e) => setForm({...form, password: e.target.value.replace(/\D/g, "").slice(0, 6)})}
                placeholder="6 dígitos numéricos" maxLength={6} required className={inputCls} />
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#94a3b8" : "linear-gradient(135deg, #bedb00, #a1b800)",
                color: loading ? "white" : "#004d2c",
                boxShadow: loading ? "none" : "0 6px 20px rgba(190,219,0,0.35)"
              }}
              className="font-bold py-3 rounded-xl transition-all disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Registrando..." : "Crear cuenta →"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link to="/" style={{ color: "#00693c", fontWeight: 700 }}>
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs py-4" style={{ background: "#00361f", color: "rgba(255,255,255,0.6)" }}>
        © 2026 Banco Falabella Perú S.A. — Todos los derechos reservados
      </footer>
    </div>
  )
}