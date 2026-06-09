import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import api from "../../lib/api"
import Layout from "../../components/Layout"

export default function Perfil() {
  const { user } = useAuth()
  const [usuario, setUsuario] = useState(null)
  const [form, setForm] = useState({ nombre: "", apellido: "", telefono: "", direccion: "" })
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [editando, setEditando] = useState(false)

  const fetchData = async () => {
    try {
      const response = await api.get(`/usuarios/${user.id}`)
      const data = response.data
      setUsuario(data)
      if (data) setForm({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        telefono: data.telefono || "",
        direccion: data.direccion || ""
      })
    } catch (e) {
      console.error("Error al cargar perfil:", e)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put(`/usuarios/${user.id}`, form)
      setMensaje("✅ Perfil actualizado correctamente")
      setEditando(false)
      fetchData()
    } catch (e) {
      setMensaje("❌ Error al actualizar")
    }
    setLoading(false)
  }


  const iniciales = usuario ? `${usuario.nombre?.charAt(0) || ""}${usuario.apellido?.charAt(0) || ""}`.toUpperCase() : "U"

  return (
    <Layout title="Mi Perfil" subtitle="Gestiona tu información personal y configuración de seguridad">
      {mensaje && (
        <div className={`rounded-xl px-5 py-4 mb-6 text-sm font-medium border ${mensaje.includes("❌") ? "bg-red-50/50 border-red-200 text-red-700" : "bg-green-50/50 border-green-200 text-[#00a651]"} flex items-center gap-3 backdrop-blur-sm shadow-sm`}>
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* AVATAR Y SEGURIDAD */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c8e000] opacity-10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="w-28 h-28 bg-gradient-to-br from-[#0a1f14] to-[#16422b] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#0a1f14]/20 relative z-10 border-4 border-white">
              <span className="text-[#c8e000] text-4xl font-bold tracking-wider">{iniciales}</span>
            </div>
            
            <h3 className="font-bold text-[#0a1f14] text-2xl tracking-tight mb-1">{usuario?.nombre} {usuario?.apellido}</h3>
            <p className="text-gray-500 text-sm font-medium mb-1">DNI: {usuario?.dni}</p>
            <p className="text-gray-400 text-sm mb-6">{usuario?.email}</p>
            
            <div className="bg-[#f0f5e6] rounded-2xl px-4 py-3 border border-[#c8e000]/30 inline-flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#c8e000] animate-pulse"></div>
              <p className="text-[#16422b] text-xs font-bold uppercase tracking-wider">Cliente Verificado</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-8">
            <h4 className="font-bold text-[#0a1f14] mb-5 text-lg">Seguridad y Acceso</h4>
            <div className="flex flex-col gap-3">
              <button className="w-full flex items-center gap-4 text-left p-4 rounded-2xl border border-gray-100 hover:border-[#c8e000] hover:bg-gray-50 transition-all group">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#0a1f14] group-hover:bg-[#c8e000]/10 group-hover:text-[#00a651] transition-colors">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <div>
                  <p className="font-bold text-[#0a1f14] text-sm mb-0.5">Clave de Internet</p>
                  <p className="text-xs text-gray-500 font-medium">Actualiza tu contraseña de 6 dígitos</p>
                </div>
                <div className="ml-auto text-gray-400 group-hover:text-[#0a1f14]">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </button>
              
              <button className="w-full flex items-center gap-4 text-left p-4 rounded-2xl border border-gray-100 hover:border-[#c8e000] hover:bg-gray-50 transition-all group">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#0a1f14] group-hover:bg-[#c8e000]/10 group-hover:text-[#00a651] transition-colors">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                </div>
                <div>
                  <p className="font-bold text-[#0a1f14] text-sm mb-0.5">Token Digital</p>
                  <p className="text-xs text-gray-500 font-medium">Configura tu dispositivo seguro</p>
                </div>
                <div className="ml-auto text-gray-400 group-hover:text-[#0a1f14]">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* DATOS PERSONALES */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-8">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-xl text-[#0a1f14] tracking-tight">Datos Personales</h3>
              {!editando && (
                <button onClick={() => setEditando(true)}
                  className="bg-[#c8e000] hover:bg-[#b5cc00] text-[#0a1f14] text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Editar Perfil
                </button>
              )}
            </div>

            {!editando ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Nombres", value: usuario?.nombre, icon: "👤" },
                  { label: "Apellidos", value: usuario?.apellido, icon: "📝" },
                  { label: "Documento de Identidad (DNI)", value: usuario?.dni, icon: "🪪" },
                  { label: "Correo Electrónico", value: usuario?.email, icon: "📧" },
                  { label: "Teléfono Móvil", value: usuario?.telefono || "No registrado", icon: "📱" },
                  { label: "Fecha de Nacimiento", value: usuario?.fecha_nacimiento ? new Date(usuario.fecha_nacimiento).toLocaleDateString("es-PE") : "No registrado", icon: "🎂" },
                  { label: "Dirección de Residencia", value: usuario?.direccion || "No registrada", icon: "📍" },
                  { label: "Cliente desde", value: usuario?.created_at ? new Date(usuario.created_at).toLocaleDateString("es-PE") : "", icon: "🌟" },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50 flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-[#0a1f14]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombres</label>
                    <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Apellidos</label>
                    <input value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                      className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Teléfono Móvil</label>
                    <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dirección de Residencia</label>
                    <input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                      className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all" />
                  </div>
                </div>

                <div className="flex gap-4 mt-4 pt-6 border-t border-gray-100">
                  <button type="button" onClick={() => setEditando(false)}
                    className="flex-1 border-2 border-gray-100 text-gray-500 font-bold py-4 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-[#0a1f14] hover:bg-black text-[#c8e000] font-bold py-4 rounded-xl transition-all disabled:opacity-60 shadow-lg flex items-center justify-center gap-2">
                    {loading ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}