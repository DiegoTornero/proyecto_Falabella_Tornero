import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import api from "../../lib/api"
import Layout from "../../components/Layout"

export default function Transferencias() {
  const { user } = useAuth()
  const [usuario, setUsuario] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [transferencias, setTransferencias] = useState([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [form, setForm] = useState({
    cuenta_origen: "",
    cuenta_destino: "",
    monto: "",
    descripcion: ""
  })

  const fetchMovimientos = async (cuentaId, listaCuentas = cuentas) => {
    try {
      if (cuentaId === "todas") {
        const promesas = listaCuentas.map(c => api.get(`/ahorros/movimientos/${c.id}`))
        const resultados = await Promise.all(promesas)
        const todos = resultados.flatMap(res => res.data || [])
        todos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setTransferencias(todos)
      } else {
        const resMovs = await api.get(`/ahorros/movimientos/${cuentaId}`)
        setTransferencias(resMovs.data || [])
      }
    } catch (error) {
      console.error("Error al cargar movimientos:", error)
    }
  }

  const fetchData = async () => {
    try {
      const resUsuario = await api.get(`/usuarios/${user.id}`)
      setUsuario(resUsuario.data)

      const resCuentas = await api.get(`/ahorros/${user.id}`)
      const ctas = resCuentas.data || []
      setCuentas(ctas)

      if (ctas.length > 0) {
        const cuentaActual = cuentaSeleccionada
          ? (cuentaSeleccionada.id === "todas" ? cuentaSeleccionada : ctas.find(c => c.id === cuentaSeleccionada.id) || ctas[0])
          : { id: "todas", numero_cuenta: "Todas" }
        setCuentaSeleccionada(cuentaActual)
        await fetchMovimientos(cuentaActual.id, ctas)
      } else {
        setTransferencias([])
        setCuentaSeleccionada(null)
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleTransferencia = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMensaje("")

    try {
      await api.post("/transferencias/", {
        cuenta_origen_id: form.cuenta_origen,
        numero_cuenta_destino: form.cuenta_destino,
        monto: parseFloat(form.monto),
        descripcion: form.descripcion || "Transferencia"
      })
      setMensaje("✅ Transferencia realizada correctamente")
      setForm({ cuenta_origen: "", cuenta_destino: "", monto: "", descripcion: "" })
      fetchData()
    } catch (error) {
      const msg = error.response?.data?.detail || "Error al realizar la transferencia"
      setMensaje("❌ " + msg)
    }
    setLoading(false)
  }

  const handleSelectCuenta = async (cuentaId) => {
    if (cuentaId === "todas") {
      setCuentaSeleccionada({ id: "todas", numero_cuenta: "Todas" })
      await fetchMovimientos("todas")
    } else {
      const cuenta = cuentas.find(c => c.id == cuentaId)
      setCuentaSeleccionada(cuenta)
      await fetchMovimientos(cuentaId)
    }
  }

  return (
    <Layout title="Transferencias" subtitle="Envía dinero de forma rápida y segura, sin comisiones">
      {mensaje && (
        <div className={`rounded-xl px-5 py-4 mb-6 text-sm font-medium border ${mensaje.includes("❌") ? "bg-red-50/50 border-red-200 text-red-700" : "bg-green-50/50 border-green-200 text-[#00a651]"} flex items-center gap-3 backdrop-blur-sm shadow-sm`}>
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* FORMULARIO */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-8 h-full relative overflow-hidden">
            {/* Decoración sutil de fondo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#c8e000]/10 to-transparent rounded-bl-full pointer-events-none"></div>

            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className="w-12 h-12 bg-[#0a1f14] rounded-xl flex items-center justify-center text-white shadow-lg">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
              </div>
              <div>
                <h3 className="font-bold text-[#0a1f14] text-xl tracking-tight">Nueva Transferencia</h3>
                <p className="text-gray-500 text-sm font-medium">A cuentas del mismo banco o interbancarias</p>
              </div>
            </div>

            {cuentas.length === 0 ? (
              <div className="text-center py-12 text-gray-400 relative z-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 mt-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
                  <span className="text-2xl">🏦</span>
                </div>
                <p className="font-bold text-[#0a1f14] mb-2">Necesitas una cuenta para transferir</p>
                <p className="text-sm mb-6 max-w-xs mx-auto">Abre tu primera cuenta de ahorros para empezar a realizar transferencias 100% digitales.</p>
              </div>
            ) : (
              <form onSubmit={handleTransferencia} className="flex flex-col gap-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Desde la cuenta</label>
                    <div className="relative mt-2">
                      <select value={form.cuenta_origen} onChange={(e) => setForm({ ...form, cuenta_origen: e.target.value })}
                        required className="w-full appearance-none pl-12 pr-10 py-4 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all cursor-pointer">
                        <option value="" disabled>Selecciona tu cuenta origen</option>
                        {cuentas.map(c => (
                          <option key={c.id} value={c.id} disabled={c.estado !== 'ACTIVA'}>
                            {c.estado !== 'ACTIVA' ? '⚠️ [BLOQUEADA] ' : ''}{c.numero_cuenta} (S/ {parseFloat(c.saldo).toFixed(2)})
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 relative">
                    <div className="absolute left-1/2 -top-3 md:-top-4 -translate-x-1/2 z-20">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-[#c8e000] shadow-sm transform rotate-90">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hacia la cuenta (Destino)</label>
                    <div className="relative mt-2">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                      </div>
                      <input type="text" value={form.cuenta_destino}
                        onChange={(e) => setForm({ ...form, cuenta_destino: e.target.value })}
                        placeholder="Número de cuenta (Ej: BF123...)" required
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monto a transferir</label>
                    <div className="relative mt-2">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0a1f14] font-bold text-lg">S/</span>
                      <input type="number" min="1" step="0.01" value={form.monto}
                        onChange={(e) => setForm({ ...form, monto: e.target.value })}
                        placeholder="0.00" required
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl text-xl font-black text-[#00a651] focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all placeholder:text-gray-300" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Concepto (Opcional)</label>
                    <div className="relative mt-2">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                      </div>
                      <input type="text" value={form.descripcion}
                        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        placeholder="Ej. Pago alquiler, Cena..."
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all" />
                    </div>
                  </div>
                </div>

                <div className="bg-[#fff9e6] border border-[#ffdb4d]/30 rounded-xl px-5 py-4 flex gap-4 mt-2 items-start">
                  <div className="text-[#e6b800] mt-0.5">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  </div>
                  <div className="text-xs font-medium text-[#806600]">
                    <span className="font-bold block mb-0.5">Verifica los datos antes de confirmar</span>
                    Las transferencias son procesadas inmediatamente y no pueden ser reversadas ni canceladas.
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-[#0a1f14] hover:bg-black text-[#c8e000] font-bold py-4 rounded-xl transition-all disabled:opacity-60 shadow-lg flex items-center justify-center gap-2 mt-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-[#c8e000] border-t-transparent rounded-full animate-spin"></div>
                      Procesando transferencia...
                    </>
                  ) : (
                    <>
                      Transferir Ahora
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* HISTORIAL */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-xl text-[#0a1f14] tracking-tight">Últimos Envíos</h3>
              
              {cuentas.length > 1 && (
                <div className="relative">
                  <select
                    value={cuentaSeleccionada?.id || "todas"}
                    onChange={(e) => handleSelectCuenta(e.target.value)}
                    className="appearance-none text-xs font-bold text-[#0a1f14] bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8e000] cursor-pointer"
                  >
                    <option value="todas">Todas las cuentas</option>
                    {cuentas.map(c => (
                      <option key={c.id} value={c.id}>Ct. {c.numero_cuenta.substring(c.numero_cuenta.length - 4)}</option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"></path></svg>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {transferencias.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <p className="text-sm font-medium">No hay movimientos en esta cuenta</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transferencias.map((t) => (
                    <div key={t.id} className="flex justify-between items-center p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${
                          t.tipo === "deposito" ? "bg-green-50 text-green-600" :
                          t.tipo === "transferencia" ? "bg-blue-50 text-blue-600" :
                          t.tipo === "retiro" ? "bg-red-50 text-red-600" :
                          "bg-purple-50 text-purple-600"
                        }`}>
                          {t.tipo === "deposito" ? (
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                          ) : t.tipo === "transferencia" ? (
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          ) : t.tipo === "retiro" ? (
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                          ) : (
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[#0a1f14] capitalize">{t.tipo}</p>
                          <p className="text-xs text-gray-500 font-medium mb-0.5">{t.descripcion}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(t.created_at).toLocaleDateString("es-PE")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${t.tipo === "deposito" ? "text-green-600" : "text-[#0a1f14]"}`}>
                          {t.tipo === "deposito" ? "+" : "-"} S/ {parseFloat(t.monto).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}