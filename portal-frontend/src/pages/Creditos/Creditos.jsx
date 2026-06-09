import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import api from "../../lib/api"
import Layout from "../../components/Layout"

export default function Creditos() {
  const { user, logout } = useAuth()
  const [usuario, setUsuario] = useState(null)
  const [creditos, setCreditos] = useState([])
  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null)
  const [cronograma, setCronograma] = useState([])
  const [showSolicitud, setShowSolicitud] = useState(false)
  const [showSimulador, setShowSimulador] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [form, setForm] = useState({ monto: "", plazo: "12", proposito: "" })
  const [simulacion, setSimulacion] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const resUsuario = await api.get(`/usuarios/${user.id}`)
      setUsuario(resUsuario.data)

      const resCreditos = await api.get(`/creditos/${user.id}`)
      setCreditos(resCreditos.data || [])
    } catch (error) {
      console.error("Error al cargar datos:", error)
    }
  }

  const fetchCronograma = async (creditoId) => {
    try {
      const res = await api.get(`/creditos/${creditoId}/cronograma`)
      setCronograma(res.data || [])
    } catch (error) {
      console.error("Error al cargar cronograma:", error)
    }
  }

  const calcularCuota = (monto, plazo, tasa = 18) => {
    const tasaMensual = tasa / 100 / 12
    const cuota = (monto * tasaMensual * Math.pow(1 + tasaMensual, plazo)) / (Math.pow(1 + tasaMensual, plazo) - 1)
    return cuota.toFixed(2)
  }

  const handleSimular = () => {
    if (!form.monto || !form.plazo) return
    const cuota = calcularCuota(parseFloat(form.monto), parseInt(form.plazo))
    const total = (parseFloat(cuota) * parseInt(form.plazo)).toFixed(2)
    const interes = (parseFloat(total) - parseFloat(form.monto)).toFixed(2)
    setSimulacion({ cuota, total, interes })
  }

  const handleSolicitud = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/creditos/", {
        usuario_id: user.id,
        monto_solicitado: parseFloat(form.monto),
        plazo_meses: parseInt(form.plazo),
        tasa_interes: 18.00,
        proposito: form.proposito,
      })
      setMensaje("✅ Solicitud enviada correctamente. En revisión.")
      setShowSolicitud(false)
      setForm({ monto: "", plazo: "12", proposito: "" })
      setSimulacion(null)
      fetchData()
    } catch (error) {
      setMensaje("❌ Error al enviar la solicitud: " + (error.response?.data?.detail || error.message))
    }
    setLoading(false)
  }

  const handleDesembolsar = async () => {
    if (!creditoSeleccionado || creditoSeleccionado.estado !== "aprobado") return
    setLoading(true)
    try {
      await api.put(`/creditos/${creditoSeleccionado.id}/estado`, {
        estado: "desembolsado"
      })
      setMensaje("🎉 ¡Crédito desembolsado exitosamente! El dinero pronto estará en tu cuenta y tu cronograma ha sido generado.")
      fetchData()
      fetchCronograma(creditoSeleccionado.id)
      setCreditoSeleccionado(prev => ({ ...prev, estado: "desembolsado" }))
    } catch (error) {
      setMensaje("❌ Error al desembolsar: " + (error.response?.data?.detail || error.message))
    }
    setLoading(false)
  }

  const handleLogout = () => { logout(); navigate("/") }

  const estadoColor = (estado) => {
    switch (estado) {
      case "enviado": return "bg-yellow-100 text-yellow-700"
      case "en_evaluacion": return "bg-blue-100 text-blue-700"
      case "aprobado": return "bg-green-100 text-green-700"
      case "rechazado": return "bg-red-100 text-red-700"
      case "desembolsado": return "bg-purple-100 text-purple-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const estadoLabel = (estado) => {
    switch (estado) {
      case "enviado": return "📤 Enviado"
      case "en_evaluacion": return "🔍 En Evaluación"
      case "aprobado": return "✅ Aprobado"
      case "rechazado": return "❌ Rechazado"
      case "desembolsado": return "💰 Desembolsado"
      default: return estado
    }
  }

  return (
    <Layout title="Mis Créditos" subtitle="Simula, solicita y gestiona tus préstamos personales">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-[#0a1f14]">Centro de Créditos</h2>
        <div className="flex gap-3">
          <button onClick={() => setShowSimulador(true)}
            className="bg-white border border-gray-200 text-[#0a1f14] font-bold px-6 py-3 rounded-xl hover:border-[#c8e000] hover:shadow-md transition-all shadow-sm">
            Simulador
          </button>
          <button onClick={() => setShowSolicitud(true)}
            className="bg-[#c8e000] hover:bg-[#b5cc00] text-[#0a1f14] text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-[0_4px_14px_rgba(200,224,0,0.4)] flex items-center gap-2">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nuevo Crédito
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`rounded-xl px-5 py-4 mb-6 text-sm font-medium border ${mensaje.includes("❌") ? "bg-red-50/50 border-red-200 text-red-700" : "bg-green-50/50 border-green-200 text-[#00a651]"} flex items-center gap-3 backdrop-blur-sm`}>
          {mensaje}
        </div>
      )}

      {/* BANNER PROMOCIONAL */}
      <div className="bg-gradient-to-r from-[#0a1f14] to-[#16422b] rounded-3xl p-8 mb-8 flex justify-between items-center relative overflow-hidden shadow-xl shadow-[#0a1f14]/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c8e000] opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 text-white max-w-lg">
          <div className="inline-flex items-center gap-2 bg-[#c8e000]/20 text-[#c8e000] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c8e000] animate-pulse"></div>
            Campaña Exclusiva
          </div>
          <h3 className="text-3xl font-bold mb-2">Préstamo Personal Premium</h3>
          <p className="text-green-100/80 text-sm leading-relaxed mb-6">Tasa preferencial desde 12% TEA por ser cliente cuenta sueldo. Desembolso inmediato en tu cuenta de ahorros, 100% digital.</p>
          <button onClick={() => setShowSolicitud(true)}
            className="bg-[#c8e000] text-[#0a1f14] font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-[#b5cc00] transition-transform hover:-translate-y-0.5 shadow-lg shadow-[#c8e000]/20">
            Descubrir mi oferta
          </button>
        </div>
        <div className="hidden md:block relative z-10 w-48 h-48 bg-gradient-to-tr from-white/5 to-white/10 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-md">
          <span className="text-6xl filter drop-shadow-xl">💸</span>
        </div>
      </div>

      {creditos.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-16 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💳</span>
          </div>
          <h3 className="text-xl font-bold text-[#0a1f14] mb-2">No tienes créditos activos</h3>
          <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">Obtén el financiamiento que necesitas para tus proyectos. Simula tu crédito y solicítalo en minutos.</p>
          <button onClick={() => setShowSolicitud(true)}
            className="bg-[#0a1f14] text-[#c8e000] font-bold px-8 py-3.5 rounded-xl hover:bg-black transition-colors shadow-lg">
            Solicitar Crédito
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LISTA CRÉDITOS */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h3 className="font-bold text-[#0a1f14] mb-1 px-1">Historial de Créditos</h3>
            {creditos.map((c) => (
              <div key={c.id}
                onClick={() => { setCreditoSeleccionado(c); fetchCronograma(c.id) }}
                className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-300 border ${creditoSeleccionado?.id === c.id
                  ? "bg-[#0a1f14] text-white border-transparent shadow-lg scale-105 z-10"
                  : "bg-white border-gray-100 hover:border-[#c8e000] hover:shadow-md"}`}>
                <div className="flex justify-between items-start mb-4">
                  <p className={`text-xs font-bold uppercase tracking-wide ${creditoSeleccionado?.id === c.id ? "text-[#c8e000]" : "text-gray-400"}`}>
                    Préstamo Personal
                  </p>
                  <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${creditoSeleccionado?.id === c.id ? "bg-white/10 text-white" : estadoColor(c.estado)}`}>
                    {estadoLabel(c.estado)}
                  </span>
                </div>
                <p className={`text-2xl font-bold tracking-tight mb-1 ${creditoSeleccionado?.id === c.id ? "text-white" : "text-[#0a1f14]"}`}>
                  <span className="text-sm opacity-70 mr-1 font-normal">S/</span>{parseFloat(c.monto_solicitado).toFixed(2)}
                </p>
                <div className={`flex items-center gap-3 text-xs font-medium mt-3 ${creditoSeleccionado?.id === c.id ? "text-green-100/70" : "text-gray-500"}`}>
                  <span className="flex items-center gap-1"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>{c.plazo_meses} meses</span>
                  <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                  <span className="flex items-center gap-1"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>{c.tasa_interes}% TEA</span>
                </div>
              </div>
            ))}
          </div>

          {/* DETALLE CRÉDITO */}
          <div className="lg:col-span-8">
            {creditoSeleccionado ? (
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-8">
                <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-2xl text-[#0a1f14] tracking-tight mb-2">Detalle de tu Crédito</h3>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${estadoColor(creditoSeleccionado.estado)}`}>
                        {estadoLabel(creditoSeleccionado.estado)}
                      </span>
                      <span className="text-sm text-gray-500 font-medium">Ref: CR-{creditoSeleccionado.id.substring(0,8).toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 font-medium mb-1">Monto Financiado</p>
                    <p className="text-3xl font-bold text-[#0a1f14]">S/ {parseFloat(creditoSeleccionado.monto_solicitado).toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Cuota Mensual</p>
                    <p className="text-xl font-bold text-[#0a1f14]">S/ {calcularCuota(parseFloat(creditoSeleccionado.monto_solicitado), creditoSeleccionado.plazo_meses)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Plazo Total</p>
                    <p className="text-xl font-bold text-[#0a1f14]">{creditoSeleccionado.plazo_meses} <span className="text-sm font-medium text-gray-500">meses</span></p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Tasa Efectiva</p>
                    <p className="text-xl font-bold text-[#0a1f14]">{creditoSeleccionado.tasa_interes}% <span className="text-sm font-medium text-gray-500">TEA</span></p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Propósito</p>
                    <p className="text-sm font-bold text-[#0a1f14] line-clamp-2 leading-tight">{creditoSeleccionado.proposito || "Préstamo Personal"}</p>
                  </div>
                </div>

                {creditoSeleccionado.estado === "aprobado" && (
                  <div className="bg-[#c8e000]/10 border border-[#c8e000]/50 rounded-2xl p-6 mb-8 text-center">
                    <h4 className="font-bold text-[#0a1f14] text-lg mb-2">🎉 ¡Tu crédito está listo!</h4>
                    <p className="text-[#0a1f14]/80 text-sm mb-4">Acepta las condiciones para desembolsar el monto a tu cuenta de ahorros.</p>
                    <button 
                      onClick={handleDesembolsar}
                      disabled={loading}
                      className="bg-[#00a651] text-white font-black px-8 py-3 rounded-xl hover:bg-[#008f45] transition-all shadow-[0_4px_14px_rgba(0,166,81,0.4)]"
                    >
                      {loading ? "Procesando..." : "Aceptar y Desembolsar"}
                    </button>
                  </div>
                )}

                {cronograma.length > 0 && (
                  <div>
                    <h4 className="font-bold text-[#0a1f14] mb-4 text-lg">Cronograma de Pagos</h4>
                    <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 sticky top-0 z-10 backdrop-blur-md bg-gray-50/90">
                            <tr>
                              <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Cuota</th>
                              <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Vencimiento</th>
                              <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Monto</th>
                              <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-50">
                            {cronograma.map((cuota) => (
                              <tr key={cuota.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 px-6 text-sm font-bold text-[#0a1f14]">#{cuota.numero_cuota}</td>
                                <td className="py-3 px-6 text-sm text-gray-500 font-medium">{new Date(cuota.fecha_vencimiento).toLocaleDateString("es-PE")}</td>
                                <td className="py-3 px-6 text-sm font-bold text-[#0a1f14]">S/ {parseFloat(cuota.monto_cuota).toFixed(2)}</td>
                                <td className="py-3 px-6">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${cuota.estado === "pagado" ? "bg-green-50 text-[#00a651]" : cuota.estado === "vencido" ? "bg-red-50 text-red-500" : "bg-yellow-50 text-yellow-600"}`}>
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
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-12 text-center h-full flex flex-col items-center justify-center text-gray-400">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <span className="text-4xl">👈</span>
                </div>
                <h3 className="text-xl font-bold text-[#0a1f14] mb-2">Detalle de Crédito</h3>
                <p className="text-sm font-medium">Selecciona un crédito en el panel izquierdo para ver su información y cronograma detallado.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL SIMULADOR */}
      {showSimulador && (
        <div className="fixed inset-0 bg-[#0a1f14]/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-100 animate-fade-up">
            <h3 className="text-2xl font-bold text-[#0a1f14] mb-2">Simulador de Crédito</h3>
            <p className="text-gray-500 text-sm mb-6">Descubre cuánto pagarías por el préstamo que necesitas.</p>
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monto a solicitar</label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">S/</span>
                  <input type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    placeholder="Ej: 10000"
                    className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Plazo (meses)</label>
                <select value={form.plazo} onChange={(e) => setForm({ ...form, plazo: e.target.value })}
                  className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all cursor-pointer">
                  {[6, 12, 18, 24, 36, 48, 60].map(p => <option key={p} value={p}>{p} meses</option>)}
                </select>
              </div>
              <button onClick={handleSimular}
                className="bg-[#0a1f14] text-[#c8e000] font-bold py-3.5 rounded-xl hover:bg-black transition-colors shadow-lg">
                Calcular Cuota
              </button>
              
              {simulacion && (
                <div className="bg-[#f0f5e6] rounded-2xl p-6 border border-[#c8e000]/30 flex flex-col gap-3 mt-2">
                  <div className="flex justify-between items-center pb-3 border-b border-[#c8e000]/20">
                    <span className="text-sm font-bold text-[#16422b]">Cuota mensual</span>
                    <span className="text-2xl font-black text-[#00a651]">S/ {simulacion.cuota}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600 font-medium">Total a pagar</span>
                    <span className="font-bold text-[#0a1f14]">S/ {simulacion.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">Intereses totales</span>
                    <span className="font-bold text-gray-500">S/ {simulacion.interes}</span>
                  </div>
                </div>
              )}
              
              <button onClick={() => setShowSimulador(false)}
                className="border-2 border-gray-100 text-gray-500 font-bold py-3.5 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors mt-2">
                Cerrar Simulador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SOLICITUD */}
      {showSolicitud && (
        <div className="fixed inset-0 bg-[#0a1f14]/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-100 animate-fade-up">
            <h3 className="text-2xl font-bold text-[#0a1f14] mb-2">Solicitar Crédito</h3>
            <p className="text-gray-500 text-sm mb-6">Pide tu préstamo 100% online y sin papeleos.</p>
            <form onSubmit={handleSolicitud} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monto a solicitar</label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">S/</span>
                  <input type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    placeholder="Ej: 10000" required
                    className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Plazo de pago</label>
                <select value={form.plazo} onChange={(e) => setForm({ ...form, plazo: e.target.value })}
                  className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all cursor-pointer">
                  {[6, 12, 18, 24, 36, 48, 60].map(p => <option key={p} value={p}>{p} meses</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Propósito del préstamo</label>
                <textarea value={form.proposito} onChange={(e) => setForm({ ...form, proposito: e.target.value })}
                  placeholder="Ej. Remodelación de hogar, Viaje, Estudios..." rows={3}
                  className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all resize-none" />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowSolicitud(false)}
                  className="flex-1 border-2 border-gray-100 text-gray-500 font-bold py-3.5 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#c8e000] text-[#0a1f14] font-bold py-3.5 rounded-xl hover:bg-[#b5cc00] transition-colors disabled:opacity-60 shadow-lg">
                  {loading ? "Procesando..." : "Enviar Solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}