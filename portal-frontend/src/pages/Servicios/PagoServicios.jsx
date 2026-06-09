import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import api from "../../lib/api"
import Layout from "../../components/Layout"

export default function PagoServicios() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [tabActual, setTabActual] = useState("servicios") // "servicios" o "prestamos"

  const [cuentas, setCuentas] = useState([])
  const [creditos, setCreditos] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estado Servicios
  const [servicioSeleccionado, setServicioSeleccionado] = useState("")
  const [suministro, setSuministro] = useState("")
  const [montoServicio, setMontoServicio] = useState("")
  const [cuentaOrigenServicioId, setCuentaOrigenServicioId] = useState("")
  
  // Estado Préstamos
  const [creditoSeleccionadoId, setCreditoSeleccionadoId] = useState("")
  const [cuentaOrigenPrestamoId, setCuentaOrigenPrestamoId] = useState("")
  const [cuotaPendiente, setCuotaPendiente] = useState(null)
  
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const EMPRESAS = [
    { id: "sedapal", nombre: "Sedapal (Agua)", icono: "💧" },
    { id: "enel", nombre: "Enel (Luz)", icono: "⚡" },
    { id: "luz_del_sur", nombre: "Luz del Sur (Luz)", icono: "💡" },
    { id: "movistar", nombre: "Movistar (Internet/Móvil)", icono: "📱" },
    { id: "claro", nombre: "Claro (Internet/Móvil)", icono: "🔴" }
  ]

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      // 1. Cargar Cuentas
      const resCuentas = await api.get(`/ahorros/${user.id}`)
      const cuentasActivas = resCuentas.data.filter(c => c.estado === 'ACTIVA' && c.saldo > 0)
      setCuentas(cuentasActivas)
      if (cuentasActivas.length > 0) {
        setCuentaOrigenServicioId(cuentasActivas[0].id)
        setCuentaOrigenPrestamoId(cuentasActivas[0].id)
      }

      // 2. Cargar Créditos
      const resCreditos = await api.get(`/creditos/${user.id}`)
      const activos = resCreditos.data.filter(c => c.estado === 'desembolsado' || c.estado === 'castigado')
      
      // Obtener cronogramas para saber la próxima cuota
      const creditosConCuota = []
      for (const cred of activos) {
        const resCron = await api.get(`/creditos/${cred.id}/cronograma`)
        const pendiente = resCron.data.find(c => c.estado === 'pendiente')
        if (pendiente) {
          creditosConCuota.push({ ...cred, proximaCuota: pendiente })
        }
      }
      setCreditos(creditosConCuota)
      if (creditosConCuota.length > 0) {
        setCreditoSeleccionadoId(creditosConCuota[0].id)
        setCuotaPendiente(creditosConCuota[0].proximaCuota)
      }

    } catch (err) {
      setError("No se pudieron cargar todos los datos.")
    } finally {
      setLoading(false)
    }
  }

  const handleSeleccionarCredito = (credId) => {
    setCreditoSeleccionadoId(credId)
    const cred = creditos.find(c => c.id === credId)
    if (cred) setCuotaPendiente(cred.proximaCuota)
  }

  const handlePagarServicio = async (e) => {
    e.preventDefault()
    setMensaje(null)
    setError(null)

    if (!servicioSeleccionado || !suministro || !montoServicio || !cuentaOrigenServicioId) {
      setError("Por favor, completa todos los campos del servicio.")
      return
    }

    const monto = parseFloat(montoServicio)
    if (isNaN(monto) || monto <= 0) {
      setError("El monto a pagar debe ser mayor a 0.")
      return
    }

    const cuentaOrigen = cuentas.find(c => c.id == cuentaOrigenServicioId)
    if (monto > cuentaOrigen.saldo) {
      setError("Saldo insuficiente en la cuenta seleccionada.")
      return
    }

    setIsSubmitting(true)

    try {
      const empresaNombre = EMPRESAS.find(e => e.id === servicioSeleccionado)?.nombre
      await api.post("/ahorros/retirar", {
        cuenta_id: parseInt(cuentaOrigenServicioId),
        monto: monto,
        descripcion: `Pago de Servicio - ${empresaNombre} (N° ${suministro})`
      })

      setMensaje(`¡Pago a ${empresaNombre} realizado con éxito!`)
      setServicioSeleccionado("")
      setSuministro("")
      setMontoServicio("")
      await cargarDatos()
    } catch (err) {
      setError(err.response?.data?.detail || "Ocurrió un error al procesar el pago del servicio.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePagarPrestamo = async (e) => {
    e.preventDefault()
    setMensaje(null)
    setError(null)

    if (!creditoSeleccionadoId || !cuentaOrigenPrestamoId || !cuotaPendiente) {
      setError("Selecciona el préstamo a pagar.")
      return
    }

    const cuentaOrigen = cuentas.find(c => c.id == cuentaOrigenPrestamoId)
    if (cuotaPendiente.monto_cuota > cuentaOrigen.saldo) {
      setError("Saldo insuficiente para pagar esta cuota.")
      return
    }

    setIsSubmitting(true)

    try {
      await api.post(`/creditos/${creditoSeleccionadoId}/pagar-cuota`, {
        cuenta_origen_id: parseInt(cuentaOrigenPrestamoId)
      })

      setMensaje(`¡Cuota ${cuotaPendiente.numero_cuota} de tu préstamo pagada con éxito!`)
      await cargarDatos()
    } catch (err) {
      setError(err.response?.data?.detail || "Ocurrió un error al procesar el pago de tu préstamo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Centro de Pagos" subtitle="Servicios y Préstamos">
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-[#00a651] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Centro de Pagos" subtitle="Paga tus recibos o tus cuotas de préstamo">
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          
          {/* Tabs Nav */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setTabActual("servicios"); setMensaje(null); setError(null); }}
              className={`flex-1 py-5 px-6 font-bold text-sm tracking-wide transition-colors ${tabActual === "servicios" ? "text-[#00a651] border-b-2 border-[#00a651] bg-[#00a651]/5" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}
            >
              📄 Recibos de Servicio
            </button>
            <button
              onClick={() => { setTabActual("prestamos"); setMensaje(null); setError(null); }}
              className={`flex-1 py-5 px-6 font-bold text-sm tracking-wide transition-colors ${tabActual === "prestamos" ? "text-[#00a651] border-b-2 border-[#00a651] bg-[#00a651]/5" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}
            >
              💸 Mis Préstamos
            </button>
          </div>

          <div className="p-8 lg:p-10">
            {mensaje && (
              <div className="mb-6 p-4 bg-[#c8e000]/20 border border-[#c8e000]/50 rounded-xl text-[#0a1f14] font-bold flex items-center gap-3">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>
                {mensaje}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold flex items-center gap-3">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
              </div>
            )}

            {cuentas.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium mb-4">No tienes cuentas de ahorro con saldo disponible para pagar.</p>
              </div>
            ) : (
              <>
                {/* TAB SERVICIOS */}
                {tabActual === "servicios" && (
                  <form onSubmit={handlePagarServicio} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Empresa de Servicio</label>
                        <select 
                          value={servicioSeleccionado} 
                          onChange={e => setServicioSeleccionado(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-[#0a1f14] focus:ring-2 focus:ring-[#00a651] outline-none"
                        >
                          <option value="" disabled>Selecciona una empresa</option>
                          {EMPRESAS.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.icono} {emp.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Suministro / Cliente</label>
                        <input 
                          type="text" 
                          value={suministro} 
                          onChange={e => setSuministro(e.target.value)}
                          placeholder="Ej: 12345678"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#0a1f14] focus:ring-2 focus:ring-[#00a651] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Monto a Pagar (S/)</label>
                        <input 
                          type="number" step="0.01" min="0"
                          value={montoServicio} 
                          onChange={e => setMontoServicio(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg font-black text-[#da291c] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Pagar desde</label>
                        <select 
                          value={cuentaOrigenServicioId} 
                          onChange={e => setCuentaOrigenServicioId(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-[#0a1f14] outline-none"
                        >
                          {cuentas.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.numero_cuenta} (S/ {parseFloat(c.saldo).toLocaleString('es-PE', { minimumFractionDigits: 2 })})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 text-right">
                      <button type="submit" disabled={isSubmitting} className="px-8 py-3.5 bg-[#00a651] text-white font-black text-sm rounded-xl hover:bg-[#008f45] shadow-lg flex items-center gap-2 ml-auto">
                        {isSubmitting ? "Procesando..." : "Confirmar Pago"}
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB PRÉSTAMOS */}
                {tabActual === "prestamos" && (
                  <div>
                    {creditos.length === 0 ? (
                      <div className="text-center py-10 bg-[#0a1f14]/5 rounded-2xl">
                        <p className="text-[#0a1f14] font-medium">No tienes cuotas pendientes de pago en este momento.</p>
                      </div>
                    ) : (
                      <form onSubmit={handlePagarPrestamo} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Préstamo a Pagar</label>
                            <select 
                              value={creditoSeleccionadoId} 
                              onChange={e => handleSeleccionarCredito(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-[#0a1f14] outline-none"
                            >
                              {creditos.map(c => (
                                <option key={c.id} value={c.id}>
                                  Préstamo {c.tipo_producto.toUpperCase()} - Cuota {c.proximaCuota?.numero_cuota}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Monto de Cuota (Fijo)</label>
                            <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-lg font-black text-gray-500 cursor-not-allowed">
                              S/ {cuotaPendiente ? cuotaPendiente.monto_cuota.toFixed(2) : "0.00"}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Pagar desde Cuenta</label>
                          <select 
                            value={cuentaOrigenPrestamoId} 
                            onChange={e => setCuentaOrigenPrestamoId(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-[#0a1f14] outline-none"
                          >
                            {cuentas.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.numero_cuenta} (S/ {parseFloat(c.saldo).toLocaleString('es-PE', { minimumFractionDigits: 2 })})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="pt-4 text-right">
                          <button type="submit" disabled={isSubmitting || !cuotaPendiente} className="px-8 py-3.5 bg-[#0a1f14] text-[#c8e000] font-black text-sm rounded-xl hover:bg-black shadow-lg flex items-center gap-2 ml-auto">
                            {isSubmitting ? "Procesando..." : "Pagar Mi Cuota"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
