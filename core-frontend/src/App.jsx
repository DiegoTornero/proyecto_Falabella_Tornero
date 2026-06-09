import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  CheckCircle, XCircle, Clock, Briefcase, FileText,
  BarChart3, LogOut, AlertTriangle, Phone, Mail,
  MessageSquare, TrendingDown, Shield, ChevronDown, Activity, ArrowUpRight, ArrowDownRight, Users, DollarSign, Search, Settings, CreditCard, Percent
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'

const API = "http://localhost:8001"

// ─── Helpers ────────────────────────────────────────────────
function getAxios(token) {
  return axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } })
}

function RdsSemaforo({ semaforo, porcentaje }) {
  if (!semaforo) return null
  const map = {
    verde:    { color: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  label: 'Riesgo Bajo' },
    amarillo: { color: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Riesgo Medio' },
    rojo:     { color: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    label: 'Riesgo Alto' },
  }
  const s = map[semaforo] || map.rojo
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-2 h-2 rounded-full ${s.color}`}></span>
      RDS {porcentaje}% — {s.label}
    </span>
  )
}

function StatusBadge({ estado }) {
  const map = {
    aprobado:           'bg-green-100 text-green-700',
    rechazado:          'bg-red-100 text-red-700',
    en_revision:        'bg-yellow-100 text-yellow-800',
    desembolsado:       'bg-blue-100 text-blue-700',
    castigado:          'bg-gray-800 text-white',
    enviado:            'bg-gray-100 text-gray-600',
    observado:          'bg-orange-100 text-orange-700',
  }
  const icons = {
    aprobado: <CheckCircle size={13} />, rechazado: <XCircle size={13} />,
    en_revision: <Clock size={13} />, castigado: <AlertTriangle size={13} />
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${map[estado] || 'bg-gray-100 text-gray-600'}`}>
      {icons[estado]} {estado?.replace('_', ' ')}
    </span>
  )
}

function BandaMoraBadge({ banda }) {
  if (!banda) return null
  const map = {
    preventiva: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    temprana:   'bg-orange-50 text-orange-700 border-orange-200',
    tardia:     'bg-red-50 text-red-600 border-red-200',
    judicial:   'bg-red-100 text-red-800 border-red-300',
    castigo:    'bg-gray-800 text-white border-gray-700',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${map[banda] || 'bg-gray-100 text-gray-600'}`}>
      ⚠ {banda}
    </span>
  )
}

// ─── LOGIN ───────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({ codigo_empleado: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API}/auth/login`, form)
      onLogin(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen relative bg-[#0a1f14] flex items-center justify-center p-4 overflow-hidden">
      {/* Background blobs for animation */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#c8e000] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#1b4b32] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-[#00a651] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#c8e000] to-[#9cb000] rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(200,224,0,0.4)]">
            <Briefcase size={28} className="text-[#0a1f14]" />
          </div>
          <div>
            <h1 className="text-white font-black text-3xl tracking-tight">Core<span className="text-[#c8e000]">Financiero</span></h1>
            <p className="text-[#c8e000]/80 text-xs font-semibold tracking-widest uppercase mt-0.5">Banco Falabella</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Bienvenido de nuevo</h2>
          <p className="text-gray-400 text-sm mb-8">Ingresa tus credenciales para acceder al panel de operaciones.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2 backdrop-blur-md">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Código de Empleado</label>
              <input
                type="text" placeholder="Ej. RIE-0003" required
                value={form.codigo_empleado} onChange={e => setForm({ ...form, codigo_empleado: e.target.value })}
                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#c8e000] transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Contraseña</label>
              <input
                type="password" placeholder="••••••••" required
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#c8e000] transition-all"
              />
            </div>
            <button type="submit" disabled={loading}
              className="bg-[#c8e000] text-[#0a1f14] font-black tracking-wide py-4 rounded-xl hover:bg-[#b5cc00] transition-all disabled:opacity-60 mt-4 shadow-[0_4px_14px_rgba(200,224,0,0.4)] flex justify-center items-center gap-2 group">
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#0a1f14] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Ingresar al Core
                  <ChevronDown className="transform -rotate-90 group-hover:translate-x-1 transition-transform" size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-black/20 rounded-xl text-xs text-gray-400 space-y-1.5 border border-white/5 backdrop-blur-sm">
            <p className="font-bold text-[#c8e000] mb-2 uppercase tracking-wider text-[10px]">Entornos de Prueba</p>
            <p>Usuarios: ASE-0001, JEF-0002, RIE-0003, COM-0004, GER-0005</p>
            <p>Clave: <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">falabella2025</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BANDEJA DE CRÉDITOS ─────────────────────────────────────
function BandejaCreditos({ token, trabajador }) {
  const [creditos, setCreditos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionData, setActionData] = useState({ id: null, estado: '', monto: 0 })
  const [comentario, setComentario] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const fetchCreditos = async () => {
    try {
      const res = await getAxios(token).get('/scoring/bandeja')
      setCreditos(res.data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchCreditos() }, [])

  const confirmAction = async () => {
    if (!comentario.trim()) { alert('Debes ingresar un comentario de justificación.'); return }
    try {
      await getAxios(token).put(`/scoring/bandeja/${actionData.id}`, {
        estado: actionData.estado,
        trabajador_codigo: trabajador.codigo_empleado,
        comentario
      })
      setModalOpen(false)
      setComentario('')
      fetchCreditos()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al actualizar estado')
    }
  }

  const filtrados = creditos.filter(c => {
    if (filtro === 'todos') return true
    if (filtro === 'pendientes') return ['en_revision', 'enviado'].includes(c.estado)
    if (filtro === 'resueltos') return ['aprobado', 'rechazado', 'desembolsado'].includes(c.estado)
    return true
  })

  const pendientes = creditos.filter(c => ['en_revision', 'enviado'].includes(c.estado))
  const aprobados  = creditos.filter(c => c.estado === 'aprobado')
  const rechazados = creditos.filter(c => c.estado === 'rechazado')

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'En Revisión', value: pendientes.length, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: <Clock size={22} /> },
          { label: 'Aprobados',   value: aprobados.length,  color: 'text-green-600',  bg: 'bg-green-50',  icon: <CheckCircle size={22} /> },
          { label: 'Rechazados',  value: rechazados.length, color: 'text-red-600',    bg: 'bg-red-50',    icon: <XCircle size={22} /> },
        ].map(s => (
          <div key={s.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all flex items-center justify-between relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-20 h-20 ${s.bg} rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity`}></div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
              <p className={`text-4xl font-black mt-2 ${s.color} drop-shadow-sm`}>{s.value}</p>
            </div>
            <div className={`w-14 h-14 ${s.bg} rounded-2xl flex items-center justify-center ${s.color} shadow-sm relative z-10 group-hover:scale-110 transition-transform`}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {['todos', 'pendientes', 'resueltos'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${filtro === f ? 'bg-[#0a1f14] text-[#c8e000]' : 'bg-white text-gray-500 border border-gray-200 hover:border-[#c8e000]'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {['Cliente / DNI', 'Producto', 'Monto Sol.', 'Score', 'RDS', 'Ruta', 'Estado', 'Acción'].map(h => (
                <th key={h} className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-10 text-center text-gray-400 text-sm">Cargando bandeja...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={8} className="py-10 text-center text-gray-400 text-sm">Sin solicitudes en esta vista.</td></tr>
            ) : filtrados.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors group">
                <td className="py-4 px-5">
                  <p className="font-bold text-[#0a1f14] text-sm group-hover:text-[#c8e000] transition-colors">{c.usuario_nombre}</p>
                  <p className="text-xs text-gray-400 font-medium">DNI: {c.usuario_dni}</p>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.tipo_producto === 'vehicular' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {c.tipo_producto || 'personal'}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-gray-900 text-sm">S/ {parseFloat(c.monto_solicitado).toLocaleString('es-PE')}</td>
                <td className="py-3 px-4">
                  {c.score_crediticio != null ? (
                    <span className={`font-bold text-sm ${c.score_crediticio >= 650 ? 'text-green-600' : c.score_crediticio >= 500 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {c.score_crediticio}/1000
                    </span>
                  ) : <span className="text-gray-400 text-xs">—</span>}
                </td>
                <td className="py-3 px-4">
                  <RdsSemaforo semaforo={c.rds_semaforo} porcentaje={c.rds_valor ? (c.rds_valor * 100).toFixed(1) : '—'} />
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {c.ruta_aprobacion || '—'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <StatusBadge estado={c.estado} />
                  {c.banda_mora && <div className="mt-1"><BandaMoraBadge banda={c.banda_mora} /></div>}
                </td>
                <td className="py-3 px-4">
                  {['en_revision', 'enviado'].includes(c.estado) && (
                    <div className="flex gap-1.5">
                      <button onClick={() => { setActionData({ id: c.id, estado: 'aprobado', monto: c.monto_solicitado }); setModalOpen(true) }}
                        className="p-1.5 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors" title="Aprobar">
                        <CheckCircle size={16} />
                      </button>
                      <button onClick={() => { setActionData({ id: c.id, estado: 'rechazado', monto: c.monto_solicitado }); setModalOpen(true) }}
                        className="p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors" title="Rechazar">
                        <XCircle size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#0a1f14]/40 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-fade-up relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${actionData.estado === 'aprobado' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h3 className="text-xl font-black mb-1 capitalize text-[#0a1f14]">Confirmar: {actionData.estado}</h3>
            <p className="text-sm text-gray-500 mb-1">Monto: <strong className="text-lg text-[#0a1f14]">S/ {actionData.monto?.toLocaleString('es-PE')}</strong></p>
            <p className="text-xs text-gray-400 mb-6 font-medium">Esta acción queda registrada en el historial de auditoría bajo tu usuario.</p>
            <textarea
              value={comentario} onChange={e => setComentario(e.target.value)}
              placeholder="Comentario de justificación (obligatorio)..."
              className="w-full border border-gray-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#c8e000] min-h-[100px] resize-none bg-gray-50"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="px-5 py-3 text-gray-500 hover:bg-gray-50 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
              <button onClick={confirmAction}
                className={`px-6 py-3 text-white rounded-xl text-sm font-black shadow-lg transition-transform hover:-translate-y-0.5 ${actionData.estado === 'aprobado' ? 'bg-[#00a651] shadow-[#00a651]/20' : 'bg-red-500 shadow-red-500/20'}`}>
                Confirmar Acción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MÓDULO DE MORA ──────────────────────────────────────────
function ModuloMora({ token, trabajador }) {
  const [resumen, setResumen] = useState(null)
  const [bandas, setBandas] = useState({})
  const [loading, setLoading] = useState(true)
  const [bandaActiva, setBandaActiva] = useState('preventiva')
  const [modalGestion, setModalGestion] = useState({ open: false, creditoId: null })
  const [modalTransicion, setModalTransicion] = useState({ open: false, creditoId: null, dias: 0 })
  const [gestionForm, setGestionForm] = useState({ tipo_gestion: 'llamada', resultado: '', comentario: '' })
  const [transicionForm, setTransicionForm] = useState({ banda_destino: 'judicial', comentario: '' })

  const fetchMora = async () => {
    try {
      const res = await getAxios(token).get('/api/mora/bandeja')
      setResumen(res.data.resumen)
      setBandas(res.data.bandas)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchMora() }, [])

  const registrarGestion = async () => {
    try {
      await getAxios(token).post('/api/mora/gestiones', { credito_id: modalGestion.creditoId, ...gestionForm })
      setModalGestion({ open: false, creditoId: null })
      alert('✅ Gestión registrada correctamente')
    } catch (err) { alert(err.response?.data?.detail || 'Error') }
  }

  const ejecutarTransicion = async () => {
    try {
      await getAxios(token).put(`/api/mora/${modalTransicion.creditoId}/transicion`, transicionForm)
      setModalTransicion({ open: false, creditoId: null, dias: 0 })
      fetchMora()
      alert('✅ Transición ejecutada correctamente')
    } catch (err) { alert(err.response?.data?.detail || 'Error al ejecutar transición') }
  }

  const bandasOrden = ['preventiva', 'temprana', 'tardia', 'judicial', 'castigo']
  const bandaColors = {
    preventiva: { tab: 'text-yellow-600 border-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
    temprana:   { tab: 'text-orange-600 border-orange-400', badge: 'bg-orange-100 text-orange-700' },
    tardia:     { tab: 'text-red-500 border-red-400',       badge: 'bg-red-50 text-red-600' },
    judicial:   { tab: 'text-red-800 border-red-700',       badge: 'bg-red-100 text-red-800' },
    castigo:    { tab: 'text-gray-100 border-gray-400',     badge: 'bg-gray-800 text-white' },
  }

  if (loading) return <p className="text-center text-gray-400 py-10">Cargando módulo de mora...</p>

  return (
    <div>
      {/* KPIs de mora */}
      {resumen && (
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] col-span-2 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-red-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ratio de Mora</p>
            <p className="text-5xl font-black text-red-600 mt-2">{resumen.ratio_mora_pct}%</p>
            <p className="text-sm font-medium text-gray-500 mt-2">S/ {resumen.cartera_morosa?.toLocaleString('es-PE')} en mora total</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cartera Total</p>
            <p className="text-3xl font-black text-[#0a1f14] mt-2">S/ {resumen.total_cartera?.toLocaleString('es-PE')}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-transform">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Créditos en Mora</p>
            <p className="text-3xl font-black text-orange-600 mt-2">{resumen.total_creditos_mora}</p>
          </div>
        </div>
      )}

      {/* Bandas */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-2 pt-2 gap-1 overflow-x-auto">
          {bandasOrden.map(b => (
            <button key={b} onClick={() => setBandaActiva(b)}
              className={`px-5 py-3 rounded-t-xl text-xs font-bold uppercase transition-all border-b-2 ${
                bandaActiva === b
                  ? `bg-white ${bandaColors[b]?.tab || 'text-gray-700 border-gray-400'} shadow-sm`
                  : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-100/50'
              }`}>
              {b} ({bandas[b]?.count || 0})
            </button>
          ))}
        </div>

        <div className="p-8">
          {bandas[bandaActiva] && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-[#0a1f14]">{bandas[bandaActiva].label}</h3>
                  <p className="text-sm font-medium text-gray-500">
                    {bandas[bandaActiva].count} crédito(s) — <strong className="text-[#0a1f14]">S/ {bandas[bandaActiva].monto_total?.toLocaleString('es-PE')}</strong> en mora
                  </p>
                </div>
              </div>

              {bandas[bandaActiva].creditos?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 font-medium">Sin créditos en esta banda de mora.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        {['Cliente', 'Producto', 'Monto', 'Días Mora', 'Acciones'].map(h => (
                          <th key={h} className="py-4 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bandas[bandaActiva].creditos.map(c => (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors group">
                          <td className="py-4 px-5">
                            <p className="font-bold text-[#0a1f14] text-sm group-hover:text-[#c8e000] transition-colors">{c.usuario_nombre}</p>
                            <p className="text-xs text-gray-400 font-medium">DNI: {c.usuario_dni}</p>
                          </td>
                        <td className="py-3">
                          <span className="text-xs text-gray-500 capitalize">{c.tipo_producto}</span>
                        </td>
                        <td className="py-3 font-bold text-sm text-[#0a1f14]">
                          S/ {c.monto?.toLocaleString('es-PE')}
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-red-600 text-sm">{c.dias_mora} días</span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setModalGestion({ open: true, creditoId: c.id })}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                            >
                              <Phone size={12} /> Registrar gestión
                            </button>
                            {(c.dias_mora >= 121) && ['riesgos', 'comite', 'gerencia'].includes(trabajador.rol) && (
                              <button
                                onClick={() => setModalTransicion({ open: true, creditoId: c.id, dias: c.dias_mora })}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                              >
                                <Shield size={12} /> Transición
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Gestión */}
      {modalGestion.open && (
        <div className="fixed inset-0 bg-[#0a1f14]/40 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-fade-up relative overflow-hidden">
            <h3 className="font-black text-xl mb-6 text-[#0a1f14]">Registrar Gestión de Cobranza</h3>
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Tipo de Gestión</label>
                <select value={gestionForm.tipo_gestion} onChange={e => setGestionForm({...gestionForm, tipo_gestion: e.target.value})}
                  className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#c8e000] focus:outline-none transition-all">
                  {['llamada', 'visita', 'carta', 'email', 'sms'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Resultado</label>
                <input value={gestionForm.resultado} onChange={e => setGestionForm({...gestionForm, resultado: e.target.value})}
                  placeholder="Ej. Sin respuesta, Promesa de pago..." 
                  className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#c8e000] focus:outline-none transition-all"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Comentario</label>
                <textarea value={gestionForm.comentario} onChange={e => setGestionForm({...gestionForm, comentario: e.target.value})}
                  rows={3} placeholder="Detalle de la gestión..."
                  className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#c8e000] focus:outline-none resize-none transition-all"/>
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button onClick={() => setModalGestion({open:false,creditoId:null})} className="px-5 py-3 text-gray-500 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors">Cancelar</button>
                <button onClick={registrarGestion} className="px-6 py-3 bg-[#0a1f14] text-[#c8e000] font-black tracking-wide text-sm rounded-xl hover:bg-black transition-all shadow-lg hover:-translate-y-0.5">Registrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Transición */}
      {modalTransicion.open && (
        <div className="fixed inset-0 bg-[#0a1f14]/40 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-fade-up relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
            <h3 className="font-black text-xl mb-1 text-[#0a1f14]">Transición de Banda</h3>
            <p className="text-sm font-medium text-gray-500 mb-6">Días en mora: <strong className="text-red-600 text-lg">{modalTransicion.dias}</strong></p>
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Banda Destino</label>
                <select value={transicionForm.banda_destino} onChange={e => setTransicionForm({...transicionForm, banda_destino: e.target.value})}
                  className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#c8e000] focus:outline-none transition-all">
                  <option value="judicial">Judicial (≥121 días) — requiere: riesgos</option>
                  <option value="castigo">Castigo (&gt;180 días) — requiere: gerencia</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Comentario</label>
                <textarea value={transicionForm.comentario} onChange={e => setTransicionForm({...transicionForm, comentario: e.target.value})}
                  rows={3} className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#c8e000] focus:outline-none resize-none transition-all"/>
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button onClick={() => setModalTransicion({open:false,creditoId:null,dias:0})} className="px-5 py-3 text-gray-500 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors">Cancelar</button>
                <button onClick={ejecutarTransicion} className="px-6 py-3 bg-red-600 text-white font-black tracking-wide text-sm rounded-xl hover:bg-red-700 transition-all shadow-lg hover:-translate-y-0.5 shadow-red-600/20">Ejecutar Transición</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ANALÍTICA Y AUDITORÍA GLOBAL ────────────────────────────
function ModuloAnalitica({ token }) {
  const [kpis, setKpis] = useState(null)
  const [historial, setHistorial] = useState([])
  const [chartData, setChartData] = useState([])
  const [creditsData, setCreditsData] = useState([])
  const [moraData, setMoraData] = useState([])
  const [loading, setLoading] = useState(true)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resKpis, resHistorial, resChart, resCredits, resMora] = await Promise.all([
          getAxios(token).get('/analytics/kpis'),
          getAxios(token).get('/analytics/history?limit=30'),
          getAxios(token).get('/analytics/chart-data'),
          getAxios(token).get('/analytics/credits-by-state'),
          getAxios(token).get('/analytics/mora-bands')
        ])
        setKpis(resKpis.data)
        setHistorial(resHistorial.data)
        setChartData(resChart.data)
        setCreditsData(resCredits.data)
        setMoraData(resMora.data)
      } catch (err) {
        console.error("Error cargando analítica:", err)
      }
      setLoading(false)
    }
    fetchData()
  }, [token])

  if (loading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-[#c8e000] border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="space-y-8 animate-fade-up">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#c8e000] rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Saldo Total Banco</p>
              <p className="text-4xl font-black text-[#0a1f14] mt-2">S/ {kpis?.saldo_total?.toLocaleString('es-PE') || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#c8e000]/10 flex items-center justify-center text-[#9cb000]"><DollarSign size={24} /></div>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cuentas Activas</p>
              <p className="text-4xl font-black text-[#0a1f14] mt-2">{kpis?.total_cuentas || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500"><Users size={24} /></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#0a1f14] rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Volumen Créditos</p>
              <p className="text-4xl font-black text-[#0a1f14] mt-2">S/ {kpis?.creditos_desembolsados?.toLocaleString('es-PE') || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600"><Briefcase size={24} /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Chart Capital */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-xl font-black text-[#0a1f14] mb-6">Flujo de Capital (Últimos 7 días)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8e000" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#c8e000" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSalidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dx={-10} tickFormatter={(val) => `S/${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                  formatter={(value) => [`S/ ${value.toLocaleString()}`, ""]}
                />
                <Area type="monotone" dataKey="ingresos" name="Ingresos (+)" stroke="#9cb000" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                <Area type="monotone" dataKey="salidas" name="Salidas (-)" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorSalidas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart Mora */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-xl font-black text-[#0a1f14] mb-6">Monto Adeudado por Banda de Mora</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moraData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dx={-10} tickFormatter={(val) => `S/${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                  formatter={(value) => [`S/ ${value.toLocaleString()}`, "Deuda"]}
                  cursor={{fill: '#f9fafb'}}
                />
                <Bar dataKey="monto" radius={[4, 4, 0, 0]}>
                  {moraData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#facc15', '#fb923c', '#f87171', '#ef4444', '#b91c1c'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart Credits */}
      <div className="grid grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] col-span-1 flex flex-col justify-center items-center">
          <h3 className="text-xl font-black text-[#0a1f14] mb-2 self-start">Distribución de Créditos</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={creditsData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {creditsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historial General */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden col-span-2">
          <div className="p-8 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xl font-black text-[#0a1f14]">Auditoría de Transacciones</h3>
            <span className="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">Últimos 30 movimientos</span>
          </div>
          <div className="overflow-auto max-h-[350px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white">
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Cuenta</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {historial.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-gray-500 font-medium">Sin movimientos recientes</td></tr>
                ) : historial.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-6 text-sm text-gray-500">{new Date(m.fecha).toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {['DEPOSITO', 'PAGO_INTERES'].includes(m.tipo) ? <ArrowDownRight size={16} className="text-green-500" /> : <ArrowUpRight size={16} className="text-red-500" />}
                        <div>
                          <p className="text-sm font-bold text-[#0a1f14] capitalize">{m.tipo.toLowerCase().replace('_', ' ')}</p>
                          <p className="text-xs text-gray-400">{m.descripcion}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-gray-600">{m.cuenta}</td>
                    <td className={`py-4 px-6 text-sm font-black text-right ${['DEPOSITO', 'PAGO_INTERES'].includes(m.tipo) ? 'text-green-600' : 'text-red-600'}`}>
                      {['DEPOSITO', 'PAGO_INTERES'].includes(m.tipo) ? '+' : '-'} S/ {m.monto.toLocaleString('es-PE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MÓDULO 360 DEL CLIENTE ──────────────────────────────────
function ModuloClientes({ token }) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState([])
  const [cliente360, setCliente360] = useState(null)
  const [loading, setLoading] = useState(false)

  // Auto-búsqueda con debounce (500ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 3) {
        setResultados([])
        return
      }
      setLoading(true)
      try {
        const res = await getAxios(token).get(`/api/clientes/buscar?q=${query}`)
        setResultados(res.data)
        setCliente360(null)
      } catch (err) { console.error(err) }
      setLoading(false)
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [query, token])

  const buscarCliente = (e) => {
    e.preventDefault()
  }

  const verCliente = async (id) => {
    setLoading(true)
    try {
      const res = await getAxios(token).get(`/api/clientes/${id}/360`)
      setCliente360(res.data)
      setResultados([])
      setQuery('')
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Buscador */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h3 className="text-xl font-black text-[#0a1f14] mb-4 flex items-center gap-2">
          <Search className="text-[#c8e000]" />
          Buscador de Clientes (360°)
        </h3>
        <form onSubmit={buscarCliente} className="relative">
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            placeholder="Empieza a escribir el DNI o Nombre del cliente..."
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-[#0a1f14] focus:ring-4 focus:ring-[#c8e000]/20 focus:border-[#c8e000] focus:outline-none transition-all placeholder:font-medium placeholder:text-gray-400 shadow-inner"
          />
          <Search className="absolute left-4 top-4 text-gray-400" size={24} />
          {loading && !cliente360 && <div className="absolute right-4 top-4 w-6 h-6 border-2 border-[#c8e000] border-t-transparent rounded-full animate-spin"></div>}
        </form>

        {/* Resultados */}
        {resultados.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resultados.map(r => (
              <div 
                key={r.id} 
                onClick={() => verCliente(r.id)} 
                className="group flex flex-col justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-[#c8e000] hover:shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#c8e000]/10 to-transparent rounded-bl-full pointer-events-none"></div>
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0a1f14] to-[#143d28] flex items-center justify-center text-white font-black shadow-md">
                    {r.nombre_completo.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-[#0a1f14] text-lg leading-tight group-hover:text-[#00a651] transition-colors">{r.nombre_completo}</p>
                    <p className="text-xs font-bold text-gray-400 tracking-wider">DNI: {r.dni}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <Mail size={14}/> <span className="truncate max-w-[120px]">{r.email}</span>
                  </div>
                  <span className="text-xs font-black text-[#00a651] bg-[#00a651]/10 px-2.5 py-1 rounded-full">
                    S/ {r.ingreso_mensual?.toLocaleString('es-PE')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vista 360 */}
      {loading && !cliente360 && <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-[#c8e000] border-t-transparent rounded-full animate-spin"></div></div>}
      
      {cliente360 && (
        <div className="grid grid-cols-3 gap-6 animate-fade-up">
          {/* Perfil */}
          <div className="col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#0a1f14] to-[#143d28]"></div>
              <div className="w-20 h-20 bg-white rounded-full mx-auto mt-10 flex items-center justify-center text-3xl font-black text-[#0a1f14] shadow-lg border-4 border-white relative z-10">
                {cliente360.perfil.nombre.charAt(0)}
              </div>
              <h4 className="font-black text-xl text-[#0a1f14] mt-4">{cliente360.perfil.nombre}</h4>
              <p className="text-sm text-gray-500 font-medium">DNI: {cliente360.perfil.dni}</p>
              <div className="mt-6 flex flex-col gap-3 text-left">
                <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400 font-bold uppercase">Ingreso Mensual</p><p className="font-bold text-[#0a1f14]">S/ {cliente360.perfil.ingreso_mensual}</p></div>
                <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400 font-bold uppercase">Teléfono</p><p className="font-bold text-[#0a1f14]">{cliente360.perfil.telefono}</p></div>
                <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400 font-bold uppercase">Dirección</p><p className="font-bold text-[#0a1f14] text-xs">{cliente360.perfil.direccion}</p></div>
              </div>
            </div>
          </div>

          {/* Cuentas y Créditos */}
          <div className="col-span-2 space-y-6">
            {/* Pasivos */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-lg font-black text-[#0a1f14] mb-4 flex items-center gap-2"><Briefcase size={20} className="text-[#c8e000]"/> Cuentas Pasivas</h3>
              <div className="flex flex-col gap-4">
                {cliente360.cuentas.length === 0 ? <p className="text-sm text-gray-400">No tiene cuentas.</p> : cliente360.cuentas.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                    <div>
                      <p className="font-bold text-[#0a1f14]">{c.producto}</p>
                      <p className="text-xs text-gray-500 font-medium tracking-widest">{c.numero_cuenta}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-green-600">S/ {c.saldo?.toLocaleString('es-PE')}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase">{c.estado}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activos */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-lg font-black text-[#0a1f14] mb-4 flex items-center gap-2"><CreditCard size={20} className="text-red-500"/> Créditos Activos</h3>
              <div className="flex flex-col gap-4">
                {cliente360.creditos.length === 0 ? <p className="text-sm text-gray-400">No tiene créditos.</p> : cliente360.creditos.map(c => (
                  <div key={c.id} className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-[#0a1f14] capitalize">Crédito {c.producto}</p>
                        <p className="text-xs text-gray-500 font-medium">{new Date(c.fecha_solicitud).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${c.estado === 'desembolsado' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                        {c.estado}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><p className="text-xs text-gray-400 font-bold uppercase">Monto</p><p className="font-black text-[#0a1f14]">S/ {c.monto_aprobado || c.monto_solicitado}</p></div>
                      <div><p className="text-xs text-gray-400 font-bold uppercase">Cuotas Pagadas</p><p className="font-bold text-blue-600">{c.cuotas_pagadas} de {c.total_cuotas}</p></div>
                      <div><p className="text-xs text-gray-400 font-bold uppercase">Días Mora</p><p className={`font-black ${c.dias_mora > 0 ? 'text-red-600' : 'text-green-600'}`}>{c.dias_mora || 0}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MÓDULO PRODUCTOS / TARIFARIO ────────────────────────────
function ModuloProductos({ token }) {
  const [productos, setProductos] = useState({ activos: [], pasivos: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAxios(token).get('/api/productos').then(res => {
      setProductos(res.data)
      setLoading(false)
    })
  }, [token])

  if (loading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-[#c8e000] border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="space-y-8 animate-fade-up">
      <h2 className="text-2xl font-black text-[#0a1f14] flex items-center gap-2"><Settings className="text-[#c8e000]" /> Gestión de Productos y Tarifario</h2>
      
      <div className="grid grid-cols-2 gap-8">
        {/* Pasivos */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-xl font-black text-[#0a1f14] mb-6 flex items-center gap-2"><Briefcase className="text-blue-500"/> Productos Pasivos (Cuentas)</h3>
          <div className="flex flex-col gap-4">
            {productos.pasivos.map(p => (
              <div key={p.id} className="p-5 border border-gray-100 rounded-2xl hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-[#0a1f14]">{p.nombre}</p>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{p.codigo}</span>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="bg-blue-50 p-3 rounded-xl flex-1 text-center">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">TREA Min</p>
                    <p className="font-black text-blue-700 text-lg">{p.trea_minima}%</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl flex-1 text-center">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">TREA Max</p>
                    <p className="font-black text-blue-700 text-lg">{p.trea_maxima}%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl flex-1 text-center">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Mantenimiento</p>
                    <p className="font-black text-gray-700 text-lg">S/ {p.costo_mantenimiento}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activos */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-xl font-black text-[#0a1f14] mb-6 flex items-center gap-2"><Percent className="text-red-500"/> Productos Activos (Créditos)</h3>
          <div className="flex flex-col gap-4">
            {productos.activos.map(p => (
              <div key={p.id} className="p-5 border border-gray-100 rounded-2xl hover:border-red-200 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-[#0a1f14] capitalize">{p.nombre}</p>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{p.codigo}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="bg-red-50 p-2 rounded-lg text-center">
                    <p className="text-[10px] font-bold text-red-600 uppercase">TEA Min</p>
                    <p className="font-black text-red-700">{p.tasa_minima}%</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded-lg text-center">
                    <p className="text-[10px] font-bold text-red-600 uppercase">TEA Max</p>
                    <p className="font-black text-red-700">{p.tasa_maxima}%</p>
                  </div>
                  <div className="bg-orange-50 p-2 rounded-lg text-center">
                    <p className="text-[10px] font-bold text-orange-600 uppercase">Mora</p>
                    <p className="font-black text-orange-700">{p.tasa_moratoria}%</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Desgravamen</p>
                    <p className="font-black text-gray-700">{p.seguro_desgravamen}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── APP PRINCIPAL ───────────────────────────────────────────
function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('core_session')
    return saved ? JSON.parse(saved) : null
  })
  const [modulo, setModulo] = useState('bandeja')

  const handleLogin = (data) => {
    localStorage.setItem('core_session', JSON.stringify(data))
    setSession(data)
  }

  const handleLogout = () => {
    localStorage.removeItem('core_session')
    setSession(null)
  }

  if (!session) return <LoginScreen onLogin={handleLogin} />

  const navItems = [
    { id: 'bandeja', label: 'Bandeja Créditos', icon: <FileText size={18} /> },
    { id: 'clientes', label: 'Gestión 360°', icon: <Users size={18} /> },
    { id: 'mora',    label: 'Recuperaciones / Mora', icon: <TrendingDown size={18} /> },
    { id: 'analitica', label: 'Analítica y Auditoría', icon: <Activity size={18} /> },
    { id: 'productos', label: 'Tarifario y Productos', icon: <Settings size={18} /> },
  ]

  const rolColors = {
    asesor:        'bg-blue-100 text-blue-700',
    jefe_regional: 'bg-purple-100 text-purple-700',
    riesgos:       'bg-orange-100 text-orange-700',
    comite:        'bg-red-100 text-red-700',
    gerencia:      'bg-green-100 text-green-700',
  }

  return (
    <div className="min-h-screen flex bg-[#f5f7fa] font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0a1f14] text-white flex flex-col shadow-2xl relative overflow-hidden z-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1b4b32]/40 to-transparent pointer-events-none"></div>

        <div className="p-8 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#c8e000] to-[#9cb000] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(200,224,0,0.3)]">
              <Briefcase size={20} className="text-[#0a1f14]" />
            </div>
            <h1 className="text-xl font-black tracking-tight">Core<span className="text-[#c8e000]">Financiero</span></h1>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1b4b32] to-[#0a1f14] border border-white/10 flex items-center justify-center text-[#c8e000] font-bold shadow-inner">
              {session.nombre?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-sm font-bold text-white line-clamp-1 leading-tight">{session.nombre}</p>
              <p className="text-xs text-gray-400 mb-1">{session.codigo_empleado}</p>
              <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${rolColors[session.rol]?.replace('bg-', 'border-').replace('text-', 'text-') || 'border-gray-700 text-gray-400'}`}>
                {session.rol}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-5 space-y-2 relative z-10">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setModulo(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all text-left relative overflow-hidden group ${
                modulo === item.id
                  ? 'bg-[#c8e000]/10 text-[#c8e000] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-[#c8e000]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}>
              {modulo === item.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c8e000] shadow-[0_0_10px_#c8e000]"></div>}
              <div className={`${modulo === item.id ? 'text-[#c8e000]' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`}>{item.icon}</div> 
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-5 border-t border-white/5 relative z-10">
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-400 hover:text-[#c8e000] hover:bg-[#c8e000]/10 border border-transparent hover:border-[#c8e000]/20 rounded-xl text-sm font-bold transition-all group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c8e000]/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <header className="h-20 px-10 flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-gray-100 shadow-sm sticky top-0 z-10">
          <h2 className="text-2xl font-black text-[#0a1f14] tracking-tight">
            {navItems.find(n => n.id === modulo)?.label}
          </h2>
          <div className="flex items-center gap-3 bg-white border border-gray-100 px-4 py-2 rounded-full shadow-sm">
            <BarChart3 size={16} className="text-[#00a651]" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Core Financiero v2.0</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 relative z-10 animate-fade-up">
          <div className="max-w-7xl mx-auto">
            {modulo === 'bandeja' && <BandejaCreditos token={session.access_token} trabajador={session} />}
            {modulo === 'clientes' && <ModuloClientes token={session.access_token} />}
            {modulo === 'mora'    && <ModuloMora token={session.access_token} trabajador={session} />}
            {modulo === 'analitica' && <ModuloAnalitica token={session.access_token} />}
            {modulo === 'productos' && <ModuloProductos token={session.access_token} />}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
