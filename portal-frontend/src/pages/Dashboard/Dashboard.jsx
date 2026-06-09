import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useNavigate } from "react-router-dom"
import api from "../../lib/api"
import Layout from "../../components/Layout"

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [usuario, setUsuario] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [creditos, setCreditos] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const resUsuario = await api.get(`/usuarios/${user.id}`)
      setUsuario(resUsuario.data)

      const resCuentas = await api.get(`/ahorros/${user.id}`)
      const ctas = resCuentas.data || []
      setCuentas(ctas)

      const resCreditos = await api.get(`/creditos/${user.id}`)
      setCreditos(resCreditos.data || [])

      if (ctas.length > 0) {
        const promesas = ctas.map(c => api.get(`/ahorros/movimientos/${c.id}`).then(res => {
          return (res.data || []).map(m => ({ ...m, numero_cuenta: c.numero_cuenta }))
        }))
        const resultados = await Promise.all(promesas)
        const todos = resultados.flat()
        todos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setMovimientos(todos.slice(0, 5))
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)
    }
  }

  const saldoTotal = cuentas.reduce((acc, c) => acc + parseFloat(c.saldo || 0), 0)
  const deudaTotal = creditos
    .filter(c => c.estado !== "rechazado" && c.estado !== "pagado")
    .reduce((acc, c) => acc + parseFloat(c.monto_aprobado || c.monto_solicitado || 0), 0)

  return (
    <Layout title="Inicio" subtitle="Resumen global de tus productos">
      {/* 1. Saludo Personalizado */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-[#0a1f14]">Hola {usuario?.nombre || "Usuario"}, hoy te ofrecemos:</h2>
        <p className="text-gray-500 text-sm mt-1">Esta es la posición global de tus productos en Banco Falabella.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda (Cuentas y Préstamos) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tarjetas de Posición Global */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ahorros */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden border-l-4 border-l-[#da291c]">
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                <span className="text-xs font-bold uppercase tracking-wider">Total en Ahorros</span>
              </div>
              <p className="text-3xl font-black text-[#0a1f14]">S/ {saldoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">{cuentas.length} cuenta(s)</p>
            </div>

            {/* Créditos */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden border-l-4 border-l-[#00a651]">
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                <span className="text-xs font-bold uppercase tracking-wider">Deuda Total de Créditos</span>
              </div>
              <p className="text-3xl font-black text-[#0a1f14]">S/ {deudaTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">{creditos.filter(c => c.estado !== "rechazado" && c.estado !== "pagado").length} crédito(s)</p>
            </div>
          </div>

          {/* Cuentas de Ahorro List */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#0a1f14] flex items-center gap-2">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                Cuentas de Ahorro
              </h3>
              <button onClick={() => navigate("/ahorros")} className="text-sm font-semibold text-[#00a651] hover:text-[#008f45]">Ver todas {'>'}</button>
            </div>
            
            <div className="space-y-0">
              {cuentas.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No tienes cuentas aún.</p>
              ) : (
                cuentas.map((c, i) => (
                  <div key={c.id} className={`flex justify-between items-center py-4 ${i !== cuentas.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div>
                      <p className="font-bold text-[#0a1f14]">{c.numero_cuenta}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 capitalize">Ahorro {c.tipo}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#00a651] bg-[#00a651]/10 px-2 py-0.5 rounded-md">{c.estado}</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className="font-bold text-[#0a1f14]">S/ {parseFloat(c.saldo).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                      <span className="text-gray-300">{'>'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Saldo disponible total</span>
              <span className="font-black text-lg text-[#da291c]">S/ {saldoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Préstamos List */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#0a1f14] flex items-center gap-2">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                Préstamos
              </h3>
              <button onClick={() => navigate("/creditos")} className="text-sm font-semibold text-[#00a651] hover:text-[#008f45]">Ver todos {'>'}</button>
            </div>
            
            <div className="space-y-0">
              {creditos.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No tienes créditos activos.</p>
              ) : (
                creditos.filter(c => c.estado !== 'rechazado').map((c, i) => (
                  <div key={c.id} className={`flex justify-between items-center py-4 ${i !== creditos.filter(x => x.estado !== 'rechazado').length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div>
                      <p className="font-bold text-[#0a1f14]">CRED{c.id.substring(0,8).toUpperCase()}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 capitalize">{c.tipo_producto || 'Consumo'}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${c.dias_mora > 0 ? 'text-[#da291c] bg-[#da291c]/10' : 'text-[#00a651] bg-[#00a651]/10'}`}>
                          {c.dias_mora > 0 ? 'En Mora' : 'Normal'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className="font-bold text-[#0a1f14]">S/ {parseFloat(c.monto_aprobado || c.monto_solicitado).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                      <span className="text-gray-300">{'>'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Saldo pendiente total</span>
              <span className="font-black text-lg text-[#da291c]">S/ {deudaTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

        </div>

        {/* Columna Derecha (Operaciones Frecuentes) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden sticky top-24">
            <div className="bg-[#00a651] p-4">
              <h3 className="text-white font-black text-sm tracking-widest uppercase">Operaciones Frecuentes</h3>
            </div>
            <div className="p-2">
              <button onClick={() => navigate("/transferencias")} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-3 text-[#0a1f14]">
                  <div className="w-8 h-8 rounded-full bg-[#00a651]/10 flex items-center justify-center text-[#00a651]">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line></svg>
                  </div>
                  <span className="font-semibold text-sm">Transferencias propias</span>
                </div>
                <span className="text-gray-400 group-hover:text-[#00a651] transition-colors">{'>'}</span>
              </button>

              <button onClick={() => navigate("/creditos")} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-3 text-[#0a1f14]">
                  <div className="w-8 h-8 rounded-full bg-[#00a651]/10 flex items-center justify-center text-[#00a651]">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  </div>
                  <span className="font-semibold text-sm">Pago de crédito</span>
                </div>
                <span className="text-gray-400 group-hover:text-[#00a651] transition-colors">{'>'}</span>
              </button>

              <button onClick={() => navigate("/servicios")} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-3 text-[#0a1f14]">
                  <div className="w-8 h-8 rounded-full bg-[#00a651]/10 flex items-center justify-center text-[#00a651]">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                  </div>
                  <span className="font-semibold text-sm">Pago de servicios</span>
                </div>
                <span className="text-gray-400 group-hover:text-[#00a651] transition-colors">{'>'}</span>
              </button>

              <button onClick={() => navigate("/creditos")} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-3 text-[#0a1f14]">
                  <div className="w-8 h-8 rounded-full bg-[#00a651]/10 flex items-center justify-center text-[#00a651]">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                  </div>
                  <span className="font-semibold text-sm">Solicitar préstamo</span>
                </div>
                <span className="text-gray-400 group-hover:text-[#00a651] transition-colors">{'>'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  )
}