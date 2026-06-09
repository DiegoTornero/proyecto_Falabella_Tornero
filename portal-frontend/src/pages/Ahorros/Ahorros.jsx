import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import api from "../../lib/api"
import Layout from "../../components/Layout"

export default function Ahorros() {
  const { user, logout } = useAuth()
  const [usuario, setUsuario] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null)
  const [showDeposito, setShowDeposito] = useState(false)
  const [showNuevaCuenta, setShowNuevaCuenta] = useState(false)
  const [monto, setMonto] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [tipoCuenta, setTipoCuenta] = useState("")
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const resUsuario = await api.get(`/usuarios/${user.id}`)
      setUsuario(resUsuario.data)

      const resCuentas = await api.get(`/ahorros/${user.id}`)
      const ctas = resCuentas.data || []
      setCuentas(ctas)

      const resProductos = await api.get('/ahorros/productos')
      setProductos(resProductos.data || [])
      if (resProductos.data && resProductos.data.length > 0) {
        setTipoCuenta(resProductos.data[0].id.toString())
      }

      if (ctas.length > 0) {
        const cuentaActual = cuentaSeleccionada
          ? ctas.find(c => c.id === cuentaSeleccionada.id) || ctas[0]
          : ctas[0]
        setCuentaSeleccionada(cuentaActual)
        await fetchMovimientos(cuentaActual.id)
      } else {
        setMovimientos([])
        setCuentaSeleccionada(null)
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
    }
  }

  const fetchMovimientos = async (cuentaId) => {
    try {
      const res = await api.get(`/ahorros/movimientos/${cuentaId}`)
      setMovimientos(res.data || [])
    } catch (error) {
      console.error("Error al cargar movimientos:", error)
    }
  }

  const handleNuevaCuenta = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMensaje("")
    try {
      await api.post("/ahorros/apertura", {
        usuario_id: user.id,
        producto_pasivo_id: parseInt(tipoCuenta),
        monto_inicial: 0
      })
      setMensaje("✅ Cuenta creada correctamente")
      setShowNuevaCuenta(false)
      fetchData()
    } catch (error) {
      setMensaje("❌ Error al crear la cuenta: " + (error.response?.data?.detail || error.message))
    }
    setLoading(false)
  }

  const handleDeposito = async (e) => {
    e.preventDefault()
    if (!cuentaSeleccionada) {
      setMensaje("❌ Selecciona una cuenta primero")
      return
    }
    setLoading(true)
    setMensaje("")
    try {
      await api.post("/ahorros/depositar", {
        cuenta_id: cuentaSeleccionada.id,
        monto: parseFloat(monto),
        descripcion: descripcion || "Depósito"
      })
      setMensaje("✅ Depósito realizado correctamente")
      setMonto("")
      setDescripcion("")
      setShowDeposito(false)
      fetchData()
    } catch (error) {
      setMensaje("❌ Error al realizar el depósito: " + (error.response?.data?.detail || error.message))
    }
    setLoading(false)
  }

  const handleLogout = () => { logout(); navigate("/") }

  return (
    <Layout title="Mis Ahorros" subtitle="Gestiona tus cuentas y transferencias internas">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-[#0a1f14]">Mis Cuentas</h2>
        <button onClick={() => setShowNuevaCuenta(true)}
          className="bg-[#c8e000] hover:bg-[#b5cc00] text-[#0a1f14] text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-[0_4px_14px_rgba(200,224,0,0.4)] flex items-center gap-2">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nueva Cuenta
        </button>
        <button onClick={async () => {
          setLoading(true);
          try {
            const res = await api.post("/ahorros/cierre-diario-ahorros");
            if (res.data.cuentas_trea_cero > 0 && res.data.cuentas_con_interes === 0) {
                setMensaje("ℹ️ Cierre Diario: Las cuentas TREA 0% no generan intereses.");
            } else {
                setMensaje(`✅ Cierre Diario Simulado: Se pagaron intereses TREA a ${res.data.cuentas_con_interes} cuentas.`);
            }
            fetchData();
          } catch(e) {
            setMensaje("❌ Error al simular cierre diario.");
          }
          setLoading(false);
        }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-lg ml-4 flex items-center gap-2">
          Simular Día (Pagar TREA)
        </button>
      </div>

      {mensaje && (
        <div className={`rounded-xl px-5 py-4 mb-6 text-sm font-medium border ${mensaje.includes("❌")
          ? "bg-red-50/50 border-red-200 text-red-700"
          : "bg-green-50/50 border-green-200 text-[#00a651]"} flex items-center gap-3 backdrop-blur-sm`}>
          {mensaje}
        </div>
      )}

      {cuentas.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-16 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🏦</span>
          </div>
          <h3 className="text-xl font-bold text-[#0a1f14] mb-2">No tienes cuentas aún</h3>
          <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">Abre tu primera cuenta de ahorros o cuenta corriente 100% digital y sin comisiones.</p>
          <button onClick={() => setShowNuevaCuenta(true)}
            className="bg-[#0a1f14] text-[#c8e000] font-bold px-8 py-3.5 rounded-xl hover:bg-black transition-colors shadow-lg">
            Abrir Cuenta Ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Tarjetas de Cuenta */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {cuentas.map((c, idx) => {
              const isSelected = cuentaSeleccionada?.id === c.id;
              // Alternate styles for cards just for visual flair
              const isDark = idx % 2 === 0; 
              
              return (
                <div key={c.id}
                  onClick={() => { setCuentaSeleccionada(c); fetchMovimientos(c.id) }}
                  className={`relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300 ${isSelected
                    ? "scale-105 shadow-xl ring-2 ring-[#c8e000] ring-offset-4 ring-offset-[#f5f7fa] z-10"
                    : "hover:-translate-y-1 hover:shadow-lg opacity-90 hover:opacity-100"
                  } ${isDark 
                    ? "bg-gradient-to-br from-[#0a1f14] to-[#16422b] text-white" 
                    : "bg-gradient-to-br from-[#1a422b] to-[#255c3c] text-white"
                  }`}>
                  
                  {/* Card decorations */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">
                        Cuenta {c.tipo}
                      </p>
                      <p className="font-mono text-sm tracking-widest opacity-90">
                        {c.numero_cuenta.replace(/(.{4})/g, '$1 ')}
                      </p>
                    </div>
                    {/* Fake NFC icon */}
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50" viewBox="0 0 24 24">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  
                  <div className="relative z-10">
                    <p className="text-xs font-medium opacity-70 mb-1">Saldo Disponible</p>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-bold tracking-tight">
                        <span className="text-lg opacity-80 mr-1">S/</span>{parseFloat(c.saldo).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <button
              onClick={() => {
                if (!cuentaSeleccionada && cuentas.length > 0) setCuentaSeleccionada(cuentas[0])
                setShowDeposito(true)
              }}
              className="mt-2 bg-white border border-gray-200 text-[#0a1f14] font-bold py-3.5 rounded-2xl transition-all text-sm hover:border-[#c8e000] hover:shadow-md flex items-center justify-center gap-2">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
              Realizar Depósito
            </button>
          </div>

          {/* Columna Derecha: Movimientos */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 p-8 flex flex-col h-[600px]">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-xl text-[#0a1f14]">Últimos Movimientos</h3>
                {cuentaSeleccionada && (
                  <p className="text-sm text-gray-500 font-medium mt-1">Cuenta {cuentaSeleccionada.numero_cuenta}</p>
                )}
              </div>
              <span className="text-xs font-bold text-[#0a1f14] bg-[#c8e000]/20 px-3 py-1.5 rounded-full">
                {movimientos.length} transacciones
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {!cuentaSeleccionada ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">👈</span>
                  </div>
                  <p className="text-sm font-medium">Selecciona una cuenta a la izquierda</p>
                </div>
              ) : movimientos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <p className="text-sm font-medium">No hay movimientos recientes en esta cuenta</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {movimientos.map((m) => (
                    <div key={m.id} className="group flex justify-between items-center p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-105
                          ${m.tipo === "deposito" ? "bg-green-50 text-[#00a651]" :
                            m.tipo === "retiro" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>
                          {m.tipo === "deposito" ? (
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                          ) : m.tipo === "retiro" ? (
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                          ) : (
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[#0a1f14] capitalize">{m.tipo}</p>
                          <p className="text-xs text-gray-500 font-medium mb-0.5">{m.descripcion || "Sin descripción"}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(m.created_at).toLocaleDateString("es-PE")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${m.tipo === "deposito" ? "text-[#00a651]" : "text-[#0a1f14]"}`}>
                          {m.tipo === "deposito" ? "+" : "-"} S/ {parseFloat(m.monto).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVA CUENTA */}
      {showNuevaCuenta && (
        <div className="fixed inset-0 bg-[#0a1f14]/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-100 animate-fade-up">
            <h3 className="text-2xl font-bold text-[#0a1f14] mb-2">Abrir Nueva Cuenta</h3>
            <p className="text-gray-500 text-sm mb-6">Elige el tipo de cuenta que mejor se adapte a ti.</p>
            <form onSubmit={handleNuevaCuenta} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tipo de Cuenta</label>
                <select value={tipoCuenta} onChange={(e) => setTipoCuenta(e.target.value)}
                  className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all cursor-pointer">
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (TREA {p.trea_maxima}%)</option>
                  ))}
                </select>
              </div>
              <div className="bg-[#f0f5e6] rounded-2xl p-5 border border-[#c8e000]/30">
                <ul className="space-y-2.5 text-sm font-medium text-[#16422b]">
                  <li className="flex items-center gap-2"><svg width="16" height="16" fill="none" stroke="#c8e000" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg> Sin costo de mantenimiento</li>
                  <li className="flex items-center gap-2"><svg width="16" height="16" fill="none" stroke="#c8e000" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg> Acceso 24/7 por App y Web</li>
                  <li className="flex items-center gap-2"><svg width="16" height="16" fill="none" stroke="#c8e000" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg> Transferencias gratuitas</li>
                </ul>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowNuevaCuenta(false)}
                  className="flex-1 border-2 border-gray-100 text-gray-500 font-bold py-3.5 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#0a1f14] text-[#c8e000] font-bold py-3.5 rounded-xl hover:bg-black transition-colors disabled:opacity-60 shadow-lg">
                  {loading ? "Creando..." : "Abrir Cuenta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DEPÓSITO */}
      {showDeposito && (
        <div className="fixed inset-0 bg-[#0a1f14]/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-100 animate-fade-up">
            <h3 className="text-2xl font-bold text-[#0a1f14] mb-2">Realizar Depósito</h3>
            <p className="text-gray-500 text-sm mb-6">Ingresa dinero a tu cuenta para probar la plataforma.</p>
            <form onSubmit={handleDeposito} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cuenta Destino</label>
                <select
                  value={cuentaSeleccionada?.id || ""}
                  onChange={(e) => setCuentaSeleccionada(cuentas.find(c => c.id === e.target.value))}
                  className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all cursor-pointer">
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>{c.numero_cuenta} (S/ {parseFloat(c.saldo).toFixed(2)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monto a Depositar (S/)</label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">S/</span>
                  <input type="number" min="1" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00" required
                    className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Concepto (Opcional)</label>
                <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej. Ahorro mensual"
                  className="w-full mt-2 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#c8e000] focus:border-transparent bg-gray-50 transition-all" />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowDeposito(false)}
                  className="flex-1 border-2 border-gray-100 text-gray-500 font-bold py-3.5 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#c8e000] text-[#0a1f14] font-bold py-3.5 rounded-xl hover:bg-[#b5cc00] transition-colors disabled:opacity-60 shadow-lg">
                  {loading ? "Procesando..." : "Confirmar Depósito"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}