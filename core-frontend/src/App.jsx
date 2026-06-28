import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  CheckCircle, XCircle, Clock, Briefcase, FileText,
  BarChart3, LogOut, AlertTriangle, Phone, Mail,
  MessageSquare, TrendingDown, Shield, ChevronDown, Activity, ArrowUpRight, ArrowDownRight, Users, DollarSign, Search, Settings, CreditCard, Percent
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'

const API = import.meta.env.VITE_API_URL || "https://core-backend-g43c.onrender.com"

// ─── Helpers ────────────────────────────────────────────────
function getAxios(token) {
  return axios.create({ baseURL: API, headers: { Authorization: `Bearer ${token}` } })
}

function RdsSemaforo({ semaforo, porcentaje }) {
  if (!semaforo) return null
  const map = {
    verde:    { color: 'bg-emerald-500',  text: 'text-emerald-700',  bg: 'bg-emerald-50/80',  border: 'border-emerald-100',  label: 'Riesgo Bajo' },
    amarillo: { color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50/80', border: 'border-amber-100', label: 'Riesgo Medio' },
    rojo:     { color: 'bg-rose-500',    text: 'text-rose-700',    bg: 'bg-rose-50/80',    border: 'border-rose-100',    label: 'Riesgo Alto' },
  }
  const s = map[semaforo] || map.rojo
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border} shadow-sm backdrop-blur-sm transition-all`}>
      <span className={`w-2.5 h-2.5 rounded-full ${s.color} animate-pulse`}></span>
      RDS {porcentaje}% — {s.label}
    </span>
  )
}

function StatusBadge({ estado }) {
  const map = {
    aprobado:           'bg-emerald-50 text-emerald-700 border-emerald-100',
    rechazado:          'bg-rose-50 text-rose-700 border-rose-100',
    en_revision:        'bg-amber-50 text-amber-700 border-amber-100',
    desembolsado:       'bg-blue-50 text-blue-700 border-blue-100',
    castigado:          'bg-slate-900 text-white border-slate-900',
    enviado:            'bg-slate-50 text-slate-600 border-slate-200',
    observado:          'bg-orange-50 text-orange-700 border-orange-100',
  }
  const icons = {
    aprobado: <CheckCircle size={12} />, rechazado: <XCircle size={12} />,
    en_revision: <Clock size={12} />, castigado: <AlertTriangle size={12} />
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${map[estado] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {icons[estado]} {estado?.replace('_', ' ')}
    </span>
  )
}

function BandaMoraBadge({ banda }) {
  if (!banda) return null
  const map = {
    preventiva: 'bg-amber-50 text-amber-700 border-amber-200',
    temprana:   'bg-orange-50 text-orange-700 border-orange-200',
    tardia:     'bg-rose-50 text-rose-600 border-rose-200',
    judicial:   'bg-rose-100 text-rose-800 border-rose-300',
    castigo:    'bg-slate-950 text-white border-slate-800',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border shadow-sm ${map[banda] || 'bg-slate-100 text-slate-600'}`}>
      <AlertTriangle size={10} /> {banda}
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
      const res = await axios.post(`${API}/auth/login`, {
        codigo_empleado: form.codigo_empleado,
        password: form.password
      })
      onLogin(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen relative bg-[#00361f] flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* Background blobs for animation */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#d4af37] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#004729] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-[#00693c] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        {/* Brand Logo */}
        <div className="flex items-center gap-4 justify-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#d4af37] to-[#9cb000] rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgba(200,224,0,0.3)] border border-white/20">
            <Briefcase size={28} className="text-[#00361f]" />
          </div>
          <div>
            <h1 className="text-white font-display font-black text-3xl tracking-tight">Core<span className="text-[#d4af37]">Financiero</span></h1>
            <p className="text-[#d4af37]/80 text-xs font-bold tracking-widest uppercase mt-0.5">Banco Falabella</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#002917]/75 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(200,224,0,0.1)] hover:border-[#d4af37]/30 hover:shadow-[0_20px_50px_rgba(200,224,0,0.18)] transition-all duration-500">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse"></span>
            <span className="text-[#d4af37] text-[10px] font-black uppercase tracking-widest">Acceso Seguro Interno</span>
          </div>

          <h2 className="text-2xl font-display font-black text-white mb-2">Iniciar Sesión</h2>
          <p className="text-slate-400 text-sm mb-8 font-medium">Ingresa tus credenciales autorizadas del core bancario.</p>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl px-4 py-3 text-sm mb-6 flex items-center gap-2 backdrop-blur-md">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Input Código */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Código de Empleado</label>
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder="Ej. RIE-0003"
                  required
                  value={form.codigo_empleado}
                  onChange={e => setForm({ ...form, codigo_empleado: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all shadow-inner"
                />
                <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Contraseña de Acceso</label>
              <div className="relative mt-2">
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all shadow-inner"
                />
                <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#d4af37] hover:bg-[#b5cc00] text-[#00361f] font-display font-black tracking-wider py-4 rounded-2xl transition-all disabled:opacity-60 mt-4 shadow-[0_8px_20px_rgba(200,224,0,0.35)] hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#00361f] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Ingresar al Core
                  <ChevronDown className="transform -rotate-90 group-hover:translate-x-1 transition-transform" size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── BANDEJA DE CRÉDITOS ─────────────────────────────────────
function BandejaCreditos({ token, trabajador }) {
  const [creditos, setCreditos] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionData, setActionData] = useState({ id: null, estado: '', monto: 0 })
  const [fechaDesembolso, setFechaDesembolso] = useState('')
  const [comentario, setComentario] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [expandedId, setExpandedId] = useState(null)

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
        comentario,
        fecha_desembolso: fechaDesembolso || null
      })
      setActionData({ id: null, estado: '', monto: 0 })
      setComentario('')
      setFechaDesembolso('')
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
    <div className="space-y-6">
      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'En Revisión', value: pendientes.length, color: 'text-amber-500', textLight: 'text-amber-700', bg: 'bg-amber-50', icon: <Clock size={24} />, border: 'border-amber-100' },
          { label: 'Aprobados',   value: aprobados.length,  color: 'text-emerald-500', textLight: 'text-emerald-700', bg: 'bg-emerald-50', icon: <CheckCircle size={24} />, border: 'border-emerald-100' },
          { label: 'Rechazados',  value: rechazados.length, color: 'text-rose-500', textLight: 'text-rose-700', bg: 'bg-rose-50', icon: <XCircle size={24} />, border: 'border-rose-100' },
        ].map(s => (
          <div key={s.label} className={`bg-white p-6 rounded-[24px] border ${s.border} shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all flex items-center justify-between relative overflow-hidden group`}>
            <div className={`absolute -right-4 -top-4 w-20 h-20 ${s.bg} rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity`}></div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className={`text-4xl font-display font-black mt-1 ${s.color}`}>{s.value}</p>
            </div>
            <div className={`w-14 h-14 ${s.bg} rounded-2xl flex items-center justify-center ${s.color} shadow-inner relative z-10 group-hover:scale-105 transition-transform`}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-slate-100/80 p-1.5 rounded-2xl max-w-sm border border-slate-200/50">
        {['todos', 'pendientes', 'resueltos'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold capitalize tracking-wide transition-all ${
              filtro === f 
                ? 'bg-white text-[#00361f] shadow-sm border border-slate-200/40' 
                : 'text-slate-500 hover:text-slate-800'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Premium Table */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                {['Cliente / DNI', 'Producto', 'Monto Solicitado', 'Score', 'RDS', 'Ruta', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400 text-sm font-semibold">Cargando solicitudes...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400 text-sm font-medium">Sin solicitudes en esta vista.</td></tr>
              ) : filtrados.map(c => {
                const isSelected = actionData.id === c.id;
                const isExpanded = expandedId === c.id;
                return (
                  <optgroup key={c.id} className="contents">
                    <tr 
                      onClick={(e) => {
                        if (e.target.closest('.action-btn')) return;
                        setExpandedId(isExpanded ? null : c.id);
                      }}
                      className={`transition-colors cursor-pointer group ${isExpanded ? 'bg-[#d4af37]/5 hover:bg-[#d4af37]/10' : 'hover:bg-slate-50/50'}`}
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-[#00361f] text-sm group-hover:text-[#00693c] transition-colors flex items-center gap-2">
                            {c.usuario_nombre}
                            {isExpanded ? (
                              <span className="text-[10px] bg-slate-200/60 text-slate-600 font-bold px-2 py-0.5 rounded-md">Contraer ▲</span>
                            ) : (
                              <span className="text-[10px] bg-slate-100 text-slate-400 font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">Ver Detalle ▼</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 font-medium tracking-wide mt-0.5">DNI: {c.usuario_dni}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border shadow-sm ${
                          c.tipo_producto === 'vehicular' 
                            ? 'bg-blue-50/80 text-blue-700 border-blue-100' 
                            : c.tipo_producto === 'empresarial_micro' 
                            ? 'bg-amber-50/80 text-amber-700 border-amber-100' 
                            : 'bg-slate-50/80 text-slate-600 border-slate-100'
                        }`}>
                          {c.tipo_producto === 'empresarial_micro' ? '🏢 Empresarial' : c.tipo_producto || 'Consumo'}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-display font-black text-slate-900 text-sm">
                        S/ {parseFloat(c.monto_solicitado).toLocaleString('es-PE')}
                      </td>
                      <td className="py-4 px-6">
                        {c.score_crediticio != null ? (
                          <span className={`font-bold text-sm ${c.score_crediticio >= 650 ? 'text-emerald-600' : c.score_crediticio >= 500 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {c.score_crediticio}/1000
                          </span>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="py-4 px-6">
                        <RdsSemaforo semaforo={c.rds_semaforo} porcentaje={c.rds_valor ? (c.rds_valor * 100).toFixed(1) : '—'} />
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/40">
                          {c.ruta_aprobacion || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge estado={c.estado} />
                        {c.banda_mora && <div className="mt-1"><BandaMoraBadge banda={c.banda_mora} /></div>}
                      </td>
                      <td className="py-4 px-6">
                        {['en_revision', 'enviado'].includes(c.estado) && (
                          <div className="flex gap-2 action-btn">
                            <button onClick={() => { setActionData({ id: c.id, estado: 'aprobado', monto: c.monto_solicitado }); setExpandedId(c.id); setComentario(''); setFechaDesembolso('') }}
                              className={`p-2 rounded-xl transition-all shadow-sm flex items-center justify-center ${isSelected && actionData.estado === 'aprobado' ? 'text-white bg-emerald-600 scale-105' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:scale-105'}`} title="Aprobar">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => { setActionData({ id: c.id, estado: 'rechazado', monto: c.monto_solicitado }); setExpandedId(c.id); setComentario(''); setFechaDesembolso('') }}
                              className={`p-2 rounded-xl transition-all shadow-sm flex items-center justify-center ${isSelected && actionData.estado === 'rechazado' ? 'text-white bg-rose-600 scale-105' : 'text-rose-600 bg-rose-50 hover:bg-rose-100 hover:scale-105'}`} title="Rechazar">
                              <XCircle size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/30">
                        <td colSpan={8} className="py-6 px-8">
                          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-md flex flex-col gap-6 animate-fade-in">
                            
                            {/* Superior Grid Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Col 1: Solicitante */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-black text-[#00361f] uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2 font-display">
                                  <span>👤</span> Cliente / Solicitante
                                </h4>
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-slate-800">{c.usuario_nombre}</p>
                                  <p className="text-xs text-slate-500 font-medium">DNI: {c.usuario_dni}</p>
                                </div>
                                <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 shadow-inner">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tipo de Producto</p>
                                  <p className="text-xs font-bold text-slate-800 capitalize mt-1">
                                    {c.tipo_producto === 'empresarial_micro' ? '🏢 Crédito Empresarial Micro' : c.tipo_producto || 'Consumo'}
                                  </p>
                                </div>
                              </div>

                              {/* Col 2: Detalles */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-black text-[#00361f] uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2 font-display">
                                  <span>💵</span> Detalles de la Solicitud
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Monto Solicitado</p>
                                    <p className="text-sm font-black text-slate-800 mt-1 font-display">S/ {parseFloat(c.monto_solicitado).toLocaleString('es-PE')}</p>
                                  </div>
                                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Plazo</p>
                                    <p className="text-sm font-black text-slate-800 mt-1 font-display">{c.plazo_meses} meses</p>
                                  </div>
                                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Tasa Pactada</p>
                                    <p className="text-sm font-black text-slate-800 mt-1 font-display">{c.tasa_interes}% TEA</p>
                                  </div>
                                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Seguro Desgravamen</p>
                                    <p className="text-xs font-bold text-slate-800 mt-1.5 flex items-center gap-1">
                                      {c.cobra_seguro_desgravamen ? '✅ Sí' : '❌ No'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Col 3: Evaluacion */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-black text-[#00361f] uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2 font-display">
                                  <span>⚙️</span> Evaluación del Motor
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                                    <span className="text-xs font-bold text-slate-500">Score Crediticio:</span>
                                    <span className={`text-xs font-black ${c.score_crediticio >= 650 ? 'text-emerald-600' : c.score_crediticio >= 500 ? 'text-amber-600' : 'text-rose-600'}`}>
                                      {c.score_crediticio || '—'}/1000
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                                    <span className="text-xs font-bold text-slate-500">Semáforo RDS:</span>
                                    <span className="uppercase text-xs font-black">
                                      <StatusBadge estado={c.rds_semaforo || '—'} />
                                    </span>
                                  </div>
                                  {c.created_at && (
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2 block pl-1">
                                      Fecha Solicitud: {new Date(c.created_at).toLocaleString('es-PE')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Decision Drawer */}
                            {isSelected && (
                              <div className="bg-[#d4af37]/5 p-5 rounded-2xl border border-[#d4af37]/30 max-w-xl animate-fade-in space-y-4">
                                <p className="text-xs font-black text-[#00361f] uppercase tracking-wider flex items-center gap-2 font-display">
                                  <span className={`w-3.5 h-3.5 rounded-full ${actionData.estado === 'aprobado' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></span>
                                  Justificar {actionData.estado} para: {c.usuario_nombre}
                                </p>
                                
                                {actionData.estado === 'aprobado' && (
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Fecha de Desembolso (Opcional)</label>
                                    <input
                                      type="date"
                                      value={fechaDesembolso}
                                      onChange={e => setFechaDesembolso(e.target.value)}
                                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#d4af37] bg-slate-50/50 transition-all"
                                    />
                                  </div>
                                )}
                                
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Comentario Justificativo (Obligatorio)</label>
                                  <input
                                    type="text"
                                    value={comentario}
                                    onChange={e => setComentario(e.target.value)}
                                    placeholder="Escribe el motivo de la decisión..."
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#d4af37] bg-slate-50/50 transition-all"
                                  />
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                  <button onClick={(e) => { e.stopPropagation(); setActionData({ id: null, estado: '', monto: 0 }) }} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors">
                                    Cancelar
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); confirmAction() }}
                                    className={`px-5 py-2 text-[#00361f] rounded-xl text-xs font-black shadow-md transition-all hover:scale-[1.02] ${actionData.estado === 'aprobado' ? 'bg-[#d4af37] shadow-[#d4af37]/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
                                    Confirmar Decisión
                                  </button>
                                </div>
                              </div>
                            )}
                            
                          </div>
                        </td>
                      </tr>
                    )}
                  </optgroup>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
    preventiva: { tab: 'text-amber-600 border-amber-400 bg-amber-500/5', badge: 'bg-amber-100 text-amber-700' },
    temprana:   { tab: 'text-orange-600 border-orange-400 bg-orange-500/5', badge: 'bg-orange-100 text-orange-700' },
    tardia:     { tab: 'text-rose-600 border-rose-400 bg-rose-500/5',       badge: 'bg-rose-100 text-rose-700' },
    judicial:   { tab: 'text-rose-800 border-rose-700 bg-rose-900/5',       badge: 'bg-rose-100 text-rose-800' },
    castigo:    { tab: 'text-slate-800 border-slate-400 bg-slate-900/5',     badge: 'bg-slate-800 text-white' },
  }

  if (loading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[24px] border border-rose-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] md:col-span-2 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-rose-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ratio de Mora Global</p>
            <p className="text-5xl font-display font-black text-rose-600 mt-2">{resumen.ratio_mora_pct}%</p>
            <p className="text-sm font-bold text-slate-500 mt-2">S/ {resumen.cartera_morosa?.toLocaleString('es-PE')} en mora total</p>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:-translate-y-0.5 transition-all">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cartera Total Activa</p>
            <p className="text-3xl font-display font-black text-[#00361f] mt-2">S/ {resumen.total_cartera?.toLocaleString('es-PE')}</p>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:-translate-y-0.5 transition-all">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Créditos Morosos</p>
            <p className="text-3xl font-display font-black text-orange-600 mt-2">{resumen.total_creditos_mora}</p>
          </div>
        </div>
      )}

      {/* Bandas Selectors */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1 overflow-x-auto">
          {bandasOrden.map(b => (
            <button key={b} onClick={() => setBandaActiva(b)}
              className={`px-5 py-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${
                bandaActiva === b
                  ? `bg-white border-b-2 ${bandaColors[b]?.tab || 'text-slate-800 border-slate-400'} shadow-sm`
                  : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-100/50'
              }`}>
              <span>{b}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${bandaActiva === b ? 'bg-slate-900 text-white' : 'bg-slate-200/70 text-slate-600'}`}>
                {bandas[b]?.count || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="p-8">
          {bandas[bandaActiva] && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-display font-black text-[#00361f]">{bandas[bandaActiva].label}</h3>
                  <p className="text-sm font-medium text-slate-500">
                    {bandas[bandaActiva].count} créditos asignados — <strong className="text-rose-600">S/ {bandas[bandaActiva].monto_total?.toLocaleString('es-PE')}</strong> de cartera en mora
                  </p>
                </div>
              </div>

              {bandas[bandaActiva].creditos?.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">Sin créditos en esta banda de mora.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        {['Cliente', 'Producto', 'Monto Adeudado', 'Días en Mora', 'Acciones'].map(h => (
                          <th key={h} className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {bandas[bandaActiva].creditos.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/40 transition-colors group">
                          <td className="py-4 px-5">
                            <p className="font-bold text-[#00361f] text-sm group-hover:text-[#00693c] transition-colors">{c.usuario_nombre}</p>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">DNI: {c.usuario_dni}</p>
                          </td>
                          <td className="py-4 px-5">
                            <span className="text-xs text-slate-500 capitalize font-medium">{c.tipo_producto}</span>
                          </td>
                          <td className="py-4 px-5 font-display font-black text-sm text-[#00361f]">
                            S/ {c.monto?.toLocaleString('es-PE')}
                          </td>
                          <td className="py-4 px-5">
                            <span className="font-bold text-rose-600 text-sm flex items-center gap-1">
                              <AlertTriangle size={13} /> {c.dias_mora} días
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setModalGestion({ open: true, creditoId: c.id })}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors shadow-sm"
                              >
                                <Phone size={12} /> Registrar Gestión
                              </button>
                              {(c.dias_mora >= 121) && ['riesgos', 'comite', 'gerencia'].includes(trabajador.rol) && (
                                <button
                                  onClick={() => setModalTransicion({ open: true, creditoId: c.id, dias: c.dias_mora })}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors shadow-sm"
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
            </div>
          )}
        </div>
      </div>

      {/* Modal Gestión */}
      {modalGestion.open && (
        <div className="fixed inset-0 bg-[#00361f]/50 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-white p-8 rounded-[32px] w-full max-w-md shadow-2xl border border-slate-100 animate-fade-up relative overflow-hidden">
            <h3 className="font-display font-black text-xl mb-6 text-[#00361f]">Registrar Gestión de Cobranza</h3>
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Tipo de Gestión</label>
                <select value={gestionForm.tipo_gestion} onChange={e => setGestionForm({...gestionForm, tipo_gestion: e.target.value})}
                  className="w-full mt-2 bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#d4af37] focus:outline-none transition-all">
                  {['llamada', 'visita', 'carta', 'email', 'sms'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Resultado de la Acción</label>
                <input value={gestionForm.resultado} onChange={e => setGestionForm({...gestionForm, resultado: e.target.value})}
                  placeholder="Ej. Promesa de pago, No contactado..." 
                  className="w-full mt-2 bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#d4af37] focus:outline-none transition-all"/>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Detalle del Comentario</label>
                <textarea value={gestionForm.comentario} onChange={e => setGestionForm({...gestionForm, comentario: e.target.value})}
                  rows={3} placeholder="Detalle la conversación o resultado..."
                  className="w-full mt-2 bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#d4af37] focus:outline-none resize-none transition-all"/>
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button onClick={() => setModalGestion({open:false,creditoId:null})} className="px-5 py-2.5 text-slate-500 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                <button onClick={registrarGestion} className="px-6 py-2.5 bg-[#00361f] text-[#d4af37] font-display font-black tracking-wide text-sm rounded-xl hover:bg-black transition-all shadow-md">Registrar Acción</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Transición */}
      {modalTransicion.open && (
        <div className="fixed inset-0 bg-[#00361f]/50 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-white p-8 rounded-[32px] w-full max-w-md shadow-2xl border border-slate-100 animate-fade-up relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2.5 bg-rose-600"></div>
            <h3 className="font-display font-black text-xl mb-1 text-[#00361f]">Transición Extraordinaria de Banda</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Días registrados en mora: <strong className="text-rose-600 font-display text-lg">{modalTransicion.dias}</strong></p>
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Seleccionar Banda Destino</label>
                <select value={transicionForm.banda_destino} onChange={e => setTransicionForm({...transicionForm, banda_destino: e.target.value})}
                  className="w-full mt-2 bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#d4af37] focus:outline-none transition-all">
                  <option value="judicial">Judicial (≥121 días) — Aprobación: Riesgos</option>
                  <option value="castigo">Castigo (&gt;180 días) — Aprobación: Gerencia</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Comentario Justificativo</label>
                <textarea value={transicionForm.comentario} onChange={e => setTransicionForm({...transicionForm, comentario: e.target.value})}
                  rows={3} placeholder="Ingrese la justificación para esta derivación..."
                  className="w-full mt-2 bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#d4af37] focus:outline-none resize-none transition-all"/>
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button onClick={() => setModalTransicion({open:false,creditoId:null,dias:0})} className="px-5 py-2.5 text-slate-500 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                <button onClick={ejecutarTransicion} className="px-6 py-2.5 bg-rose-600 text-white font-display font-black tracking-wide text-sm rounded-xl hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20">Ejecutar Transición</button>
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
  const exportarCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => {
        let strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(",")
    );
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const [kpis, setKpis] = useState(null)
  const [historial, setHistorial] = useState([])
  const [chartData, setChartData] = useState([])
  const [creditsData, setCreditsData] = useState([])
  const [moraData, setMoraData] = useState([])
  const [loading, setLoading] = useState(true)

  const COLORS = ['#00693c', '#d4af37', '#facc15', '#fb923c', '#ef4444']

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

  if (loading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="space-y-8">
      {/* KPIs Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Saldo Total Captado', value: kpis?.saldo_total, prefix: 'S/ ', color: 'text-emerald-600', icon: <DollarSign size={22} />, bg: 'bg-emerald-50' },
          { label: 'Desembolsos Totales', value: kpis?.total_desembolsado, prefix: 'S/ ', color: 'text-[#00361f]', icon: <Activity size={22} />, bg: 'bg-[#d4af37]/10' },
          { label: 'Créditos Emitidos', value: kpis?.num_creditos, prefix: '', color: 'text-blue-600', icon: <FileText size={22} />, bg: 'bg-blue-50' }
        ].map(item => (
          <div key={item.label} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className={`absolute -right-4 -top-4 w-20 h-20 ${item.bg} rounded-full blur-2xl opacity-50`}></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                <p className={`text-3xl font-display font-black mt-2 ${item.color}`}>
                  {item.prefix}{item.value?.toLocaleString('es-PE') || 0}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color} ${item.bg} shadow-inner`}>
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CSV Downloader Card */}
      <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <h3 className="text-lg font-display font-black text-[#00361f] mb-2 flex items-center gap-2">
          <FileText className="text-[#00693c]" />
          Descarga de Reportes y Auditoría (CSV)
        </h3>
        <p className="text-sm text-slate-500 mb-6 font-medium">Genera y descarga en formato CSV los datos clave del portafolio del banco para auditorías y reportería regulatoria.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={async () => {
              try {
                const res = await getAxios(token).get('/analytics/cartera-activa');
                exportarCSV(res.data, "cartera_activa_banco_falabella.csv");
              } catch (err) {
                alert("Error al descargar cartera activa");
              }
            }}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-[#00361f] hover:bg-black text-[#d4af37] hover:text-white font-display font-black rounded-2xl transition-all shadow-md"
          >
            📊 Exportar Cartera Activa
          </button>
          <button
            onClick={async () => {
              try {
                const res = await getAxios(token).get('/analytics/creditos-mora');
                exportarCSV(res.data, "creditos_mora_banco_falabella.csv");
              } catch (err) {
                alert("Error al descargar créditos en mora");
              }
            }}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white font-display font-black rounded-2xl transition-all shadow-md shadow-orange-600/10"
          >
            ⚠️ Exportar Créditos en Mora
          </button>
          <button
            onClick={async () => {
              try {
                const res = await getAxios(token).get('/analytics/desembolsos-dia');
                exportarCSV(res.data, "desembolsos_del_dia.csv");
              } catch (err) {
                alert("Error al descargar desembolsos del día");
              }
            }}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-[#00693c] hover:bg-[#008f45] text-white font-display font-black rounded-2xl transition-all shadow-md shadow-[#00693c]/10"
          >
            💸 Exportar Desembolsos del Día
          </button>
        </div>
      </div>

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart Capital */}
        <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <h3 className="text-lg font-display font-black text-[#00361f] mb-6">Flujo de Capital (Últimos 7 días)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00693c" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00693c" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSalidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `S/${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', fontWeight: 'bold' }}
                  formatter={(value) => [`S/ ${value.toLocaleString()}`, ""]}
                />
                <Area type="monotone" dataKey="ingresos" name="Ingresos (+)" stroke="#00693c" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                <Area type="monotone" dataKey="salidas" name="Salidas (-)" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorSalidas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart Mora */}
        <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <h3 className="text-lg font-display font-black text-[#00361f] mb-6">Monto Adeudado por Banda de Mora</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moraData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `S/${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', fontWeight: 'bold' }}
                  formatter={(value) => [`S/ ${value.toLocaleString()}`, "Monto"]}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="monto" radius={[8, 8, 0, 0]}>
                  {moraData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#facc15', '#fb923c', '#f87171', '#ef4444', '#b91c1c'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Distribución Pie */}
        <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-center items-center">
          <h3 className="text-lg font-display font-black text-[#00361f] mb-2 self-start">Distribución de Créditos</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={creditsData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                  {creditsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', fontWeight: 'bold' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historial General */}
        <div className="bg-white rounded-[30px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden lg:col-span-2 flex flex-col">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-display font-black text-[#00361f]">Auditoría de Transacciones</h3>
            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full border border-slate-200/30">Últimos 30 movimientos</span>
          </div>
          <div className="overflow-auto max-h-[300px] flex-1 dark-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                <tr className="bg-slate-50/80">
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Cuenta</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {historial.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-slate-400 font-medium">Sin movimientos recientes</td></tr>
                ) : historial.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-500 font-medium">{new Date(m.fecha).toLocaleString('es-PE')}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {['DEPOSITO', 'PAGO_INTERES'].includes(m.tipo) ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                            <ArrowDownRight size={14} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
                            <ArrowUpRight size={14} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-[#00361f] capitalize">{m.tipo.toLowerCase().replace('_', ' ')}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{m.descripcion}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-slate-500 font-mono">{m.cuenta}</td>
                    <td className={`py-4 px-6 text-sm font-black text-right font-display ${['DEPOSITO', 'PAGO_INTERES'].includes(m.tipo) ? 'text-emerald-600' : 'text-rose-600'}`}>
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
    <div className="space-y-6">
      {/* Buscador */}
      <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <h3 className="text-lg font-display font-black text-[#00361f] mb-4 flex items-center gap-2">
          <Search className="text-[#00693c]" />
          Buscador de Clientes (360°)
        </h3>
        <form onSubmit={buscarCliente} className="relative">
          <input 
            type="text" 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            placeholder="Escribe el DNI o Nombre completo del cliente..."
            className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl py-4 pl-12 pr-4 font-bold text-[#00361f] focus:ring-4 focus:ring-[#d4af37]/20 focus:border-[#d4af37] focus:outline-none transition-all placeholder:font-medium placeholder:text-slate-400 shadow-inner"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          {loading && !cliente360 && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[#00693c] border-t-transparent rounded-full animate-spin"></div>}
        </form>

        {/* Resultados */}
        {resultados.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {resultados.map(r => (
              <div 
                key={r.id} 
                onClick={() => verCliente(r.id)} 
                className="group flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-200/70 hover:border-[#00693c] hover:shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#00693c]/5 to-transparent rounded-bl-full pointer-events-none"></div>
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00361f] to-[#143d28] flex items-center justify-center text-white font-display font-black shadow-md border-2 border-white">
                    {r.nombre_completo.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-[#00361f] text-sm leading-tight group-hover:text-[#00693c] transition-colors">{r.nombre_completo}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1 tracking-wide">DNI: {r.dni}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Mail size={13}/> <span className="truncate max-w-[120px]">{r.email}</span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full shadow-sm font-display">
                    S/ {r.ingreso_mensual?.toLocaleString('es-PE')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vista 360 */}
      {loading && !cliente360 && <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div></div>}
      
      {cliente360 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
          {/* Perfil */}
          <div className="col-span-1">
            <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#00361f] to-[#143d28]"></div>
              <div className="w-20 h-20 bg-white rounded-full mx-auto mt-10 flex items-center justify-center text-3xl font-display font-black text-[#00361f] shadow-lg border-4 border-white relative z-10">
                {cliente360.perfil.nombre.charAt(0)}
              </div>
              <h4 className="font-display font-black text-xl text-[#00361f] mt-4">{cliente360.perfil.nombre}</h4>
              <p className="text-sm text-slate-400 font-bold tracking-wide">DNI: {cliente360.perfil.dni}</p>
              
              <div className="mt-6 flex flex-col gap-3 text-left">
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 shadow-inner">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ingreso Mensual Registrado</p>
                  <p className="font-display font-black text-[#00361f] text-lg mt-0.5">S/ {parseFloat(cliente360.perfil.ingreso_mensual).toLocaleString('es-PE')}</p>
                </div>
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Teléfono de Contacto</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{cliente360.perfil.telefono || '—'}</p>
                </div>
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dirección Domiciliaria</p>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5 leading-relaxed">{cliente360.perfil.direccion || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cuentas y Créditos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pasivos */}
            <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <h3 className="text-lg font-display font-black text-[#00361f] mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-[#00693c]"/> Cuentas Pasivas (Ahorros)
              </h3>
              <div className="flex flex-col gap-4">
                {cliente360.cuentas.length === 0 ? (
                  <p className="text-sm text-slate-400 font-medium py-4 text-center">El cliente no posee cuentas activas o pasivas.</p>
                ) : cliente360.cuentas.map(c => (
                  <div key={c.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:border-slate-200 transition-all gap-4">
                    <div>
                      <p className="font-bold text-[#00361f] text-sm">{c.producto}</p>
                      <p className="text-xs text-slate-400 font-bold font-mono tracking-widest mt-1">{c.numero_cuenta}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-5">
                      <div className="text-right">
                        <p className="font-display font-black text-lg text-emerald-600">S/ {c.saldo?.toLocaleString('es-PE')}</p>
                        <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md mt-0.5 border ${
                          c.estado === 'ACTIVA' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {c.estado}
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          const nuevoEstado = c.estado === 'ACTIVA' ? 'BLOQUEADA' : 'ACTIVA';
                          if (confirm(`¿Está seguro de cambiar el estado de la cuenta a ${nuevoEstado}?`)) {
                            try {
                              await getAxios(token).put(`/api/ahorros/${c.id}/estado`, { estado: nuevoEstado });
                              verCliente(cliente360.perfil.id);
                            } catch (err) {
                              alert("Error al cambiar estado de la cuenta");
                              console.error(err);
                            }
                          }
                        }}
                        className={`text-xs font-black px-4 py-2 rounded-xl border transition-all shadow-sm ${
                          c.estado === 'ACTIVA'
                            ? 'border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100'
                            : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {c.estado === 'ACTIVA' ? 'Bloquear Cuenta' : 'Activar Cuenta'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activos */}
            <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <h3 className="text-lg font-display font-black text-[#00361f] mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-rose-500"/> Créditos y Financiamientos Activos
              </h3>
              <div className="flex flex-col gap-4">
                {cliente360.creditos.length === 0 ? (
                  <p className="text-sm text-slate-400 font-medium py-4 text-center">El cliente no registra créditos en el sistema.</p>
                ) : cliente360.creditos.map(c => (
                  <div key={c.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:border-slate-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-[#00361f] text-sm capitalize">Crédito {c.producto}</p>
                        <p className="text-xs text-slate-400 font-medium tracking-wide mt-1">F. Registro: {new Date(c.fecha_solicitud).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize shadow-sm ${
                        c.estado === 'desembolsado' 
                          ? 'bg-blue-50 text-blue-700 border-blue-100' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {c.estado}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm bg-white p-4 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monto Solicitado</p>
                        <p className="font-display font-black text-slate-800 mt-1">S/ {(c.monto_aprobado || c.monto_solicitado)?.toLocaleString('es-PE')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cuotas Pagadas</p>
                        <p className="font-bold text-blue-600 mt-1">{c.cuotas_pagadas} de {c.total_cuotas}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Días en Mora</p>
                        <p className={`font-display font-black mt-1 ${c.dias_mora > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{c.dias_mora || 0} d</p>
                      </div>
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

  if (loading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div></div>

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="text-[#00693c]" />
        <h2 className="text-2xl font-display font-black text-[#00361f]">Gestión de Productos y Tarifario</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pasivos */}
        <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <h3 className="text-lg font-display font-black text-[#00361f] mb-6 flex items-center gap-2">
            <Briefcase className="text-blue-500"/>
            Productos Pasivos (Ahorro e Inversión)
          </h3>
          <div className="flex flex-col gap-4">
            {productos.pasivos.map(p => (
              <div key={p.id} className="p-5 border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all bg-slate-50/30">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-[#00361f] text-sm">{p.nombre}</p>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/20 font-mono">{p.codigo}</span>
                </div>
                <div className="flex gap-4 mt-4 bg-white p-3 rounded-xl border border-slate-100">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TREA Mínima</p>
                    <p className="font-display font-black text-blue-700 text-lg mt-0.5">{p.trea_minima}%</p>
                  </div>
                  <div className="border-r border-slate-100"></div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TREA Máxima</p>
                    <p className="font-display font-black text-blue-700 text-lg mt-0.5">{p.trea_maxima}%</p>
                  </div>
                  <div className="border-r border-slate-100"></div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mantenimiento</p>
                    <p className="font-display font-black text-slate-700 text-lg mt-0.5">S/ {p.costo_mantenimiento}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activos */}
        <div className="bg-white p-8 rounded-[30px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <h3 className="text-lg font-display font-black text-[#00361f] mb-6 flex items-center gap-2">
            <Percent className="text-rose-500"/>
            Productos Activos (Créditos y Préstamos)
          </h3>
          <div className="flex flex-col gap-4">
            {productos.activos.map(p => (
              <div key={p.id} className="p-5 border border-slate-100 rounded-2xl hover:border-rose-200 hover:shadow-sm transition-all bg-slate-50/30">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-[#00361f] text-sm capitalize">{p.nombre}</p>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/20 font-mono">{p.codigo}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-4 bg-white p-3 rounded-xl border border-slate-100 text-center">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">TEA Min</p>
                    <p className="font-display font-black text-rose-600 mt-0.5">{p.tasa_minima}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">TEA Max</p>
                    <p className="font-display font-black text-rose-600 mt-0.5">{p.tasa_maxima}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">T. Mora</p>
                    <p className="font-display font-black text-orange-600 mt-0.5">{p.tasa_moratoria}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Seg. Desgr.</p>
                    <p className="font-display font-black text-slate-700 mt-0.5">{p.seguro_desgravamen}%</p>
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

// ─── MÓDULO EMPRESAS ─────────────────────────────────────────
function ModuloEmpresas({ token }) {
  const [empresas, setEmpresas] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creditos, setCreditos] = useState([])

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const res = await getAxios(token).get('/api/empresas/')
        setEmpresas(res.data || [])
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    fetchEmpresas()
  }, [token])

  const verEmpresa = async (empresa) => {
    setSelected(empresa)
    try {
      const res = await getAxios(token).get('/scoring/bandeja')
      const creds = (res.data || []).filter(c => c.empresa_id === empresa.id || c.tipo_producto === 'empresarial_micro')
      setCreditos(creds)
    } catch (err) { setCreditos([]) }
  }

  const tipoColor = { 
    micro: 'bg-emerald-50 text-emerald-700 border-emerald-100', 
    pequena: 'bg-blue-50 text-blue-700 border-blue-100', 
    mediana: 'bg-indigo-50 text-indigo-700 border-indigo-100', 
    grande: 'bg-orange-50 text-orange-700 border-orange-100' 
  }

  if (loading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="space-y-8">
      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Clientes Corporativos</p>
          <p className="text-4xl font-display font-black text-[#00361f] mt-2">{empresas.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Segmento Microempresa</p>
          <p className="text-4xl font-display font-black text-emerald-600 mt-2">{empresas.filter(e => e.tipo_empresa === 'micro').length}</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Facturación Anual Consolidada</p>
          <p className="text-3xl font-display font-black text-[#00361f] mt-2">S/ {empresas.reduce((s, e) => s + (e.facturacion_anual || 0), 0).toLocaleString('es-PE')}</p>
        </div>
      </div>

      {/* Tarifario Banner */}
      <div className="bg-[#00361f] rounded-[24px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden border border-white/5 shadow-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
          <p className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-1.5">Tarifario de Crédito Pyme Micro</p>
          <p className="text-white text-sm">Con seguro de desgravamen: <strong className="text-[#d4af37] text-2xl font-display">40.92% TEA</strong></p>
          <p className="text-slate-300 text-xs mt-1">Sin seguro de desgravamen: <strong className="text-white text-base">43.92% TEA</strong></p>
        </div>
        <div className="text-left md:text-right text-slate-400 text-xs relative z-10 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 space-y-0.5">
          <p className="font-bold text-slate-300">Sistema de Amortización</p>
          <p>Método Francés (Cuotas Fijas)</p>
          <p className="pt-1.5 font-bold text-slate-300">Código de Producto Interno</p>
          <p className="font-mono bg-white/10 px-2 py-0.5 rounded text-[#d4af37] inline-block mt-0.5">EMP-MICRO</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lista */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="font-display font-black text-[#00361f] text-lg">Empresas Registradas</h3>
          <div className="flex flex-col gap-3">
            {empresas.length === 0 ? (
              <div className="bg-white rounded-[24px] p-8 text-center text-slate-400 border border-dashed border-slate-200">
                <p className="text-3xl mb-2">🏢</p>
                <p className="font-bold">Sin empresas registradas</p>
              </div>
            ) : empresas.map(e => (
              <div key={e.id}
                onClick={() => verEmpresa(e)}
                className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all duration-200 ${
                  selected?.id === e.id ? 'border-[#d4af37] shadow-md bg-[#00361f] text-white' : 'border-slate-100 hover:border-[#d4af37] hover:shadow-md hover:-translate-y-0.5'
                }`}>
                <div className="flex justify-between items-start mb-2">
                  <p className={`font-bold text-sm ${selected?.id === e.id ? 'text-[#d4af37]' : 'text-[#00361f]'}`}>{e.razon_social}</p>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${tipoColor[e.tipo_empresa] || 'bg-slate-100 text-slate-600'}`}>{e.tipo_empresa}</span>
                </div>
                <p className={`text-xs font-mono ${selected?.id === e.id ? 'text-slate-300' : 'text-slate-400'}`}>RUC: {e.ruc}</p>
                <div className={`flex flex-wrap gap-2 text-[11px] mt-3 pt-3 border-t ${selected?.id === e.id ? 'border-white/10 text-slate-300' : 'border-slate-50 text-slate-500'}`}>
                  <span className="bg-slate-100/10 px-2 py-0.5 rounded">{e.sector || 'Sin sector'}</span>
                  <span>·</span>
                  <span>{e.num_trabajadores} trabajadores</span>
                  <span>·</span>
                  <span>S/ {(e.facturacion_anual || 0).toLocaleString('es-PE')} / año</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detalle */}
        <div className="lg:col-span-7">
          {selected ? (
            <div className="bg-white rounded-[30px] border border-slate-100 shadow-sm p-8 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl border border-slate-200/50 shadow-inner">🏢</div>
                <div>
                  <h3 className="text-xl font-display font-black text-[#00361f]">{selected.razon_social}</h3>
                  <p className="text-xs font-bold text-slate-400 font-mono tracking-wider mt-0.5">RUC: {selected.ruc} · {selected.sector}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Representante Legal', value: selected.representante_legal || '—' },
                  { label: 'Número de Trabajadores', value: selected.num_trabajadores },
                  { label: 'Facturación Anual Declarada', value: `S/ ${(selected.facturacion_anual || 0).toLocaleString('es-PE')}` },
                  { label: 'Tipo de Empresa', value: selected.tipo_empresa?.toUpperCase() },
                  { label: 'Email Corporativo', value: selected.email || '—' },
                  { label: 'Teléfono de Contacto', value: selected.telefono || '—' },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="font-bold text-slate-800 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Créditos */}
              <div className="pt-4">
                <h4 className="font-display font-black text-[#00361f] mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-slate-500" />
                  Historial de Créditos Otorgados
                </h4>
                {creditos.length === 0 ? (
                  <div className="bg-slate-50/50 rounded-2xl p-6 text-center text-slate-400 border border-dashed border-slate-200">
                    <p className="text-xs font-bold">Sin créditos vigentes en cartera</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {creditos.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50/70 border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
                        <div>
                          <p className="font-display font-black text-[#00361f] text-sm">S/ {parseFloat(c.monto_solicitado).toLocaleString('es-PE')}</p>
                          <p className="text-[11px] text-slate-400 font-bold mt-0.5">{c.plazo_meses} meses · {c.tasa_interes}% TEA</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border shadow-sm ${
                          c.estado === 'aprobado' || c.estado === 'desembolsado' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          c.estado === 'rechazado' 
                            ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>{c.estado}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[30px] border border-slate-100 shadow-sm p-12 text-center text-slate-400 h-full flex flex-col items-center justify-center min-h-[300px]">
              <span className="text-4xl mb-3">👈</span>
              <p className="font-bold text-[#00361f]">Selecciona una empresa</p>
              <p className="text-xs mt-1 text-slate-400">Podrás visualizar su perfil corporativo, facturación y créditos</p>
            </div>
          )}
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
    { id: 'bandeja',   label: 'Bandeja Créditos',      icon: <FileText size={16} /> },
    { id: 'clientes',  label: 'Gestión 360°',           icon: <Users size={16} /> },
    { id: 'empresas',  label: 'Empresas Micro',         icon: <Briefcase size={16} /> },
    { id: 'mora',      label: 'Recuperaciones / Mora',  icon: <TrendingDown size={16} /> },
    { id: 'analitica', label: 'Analítica y Auditoría',  icon: <Activity size={16} /> },
    { id: 'productos', label: 'Tarifario y Productos',  icon: <Settings size={16} /> },
  ]

  const rolColors = {
    asesor:        'border-blue-200 text-blue-400 bg-blue-500/10',
    jefe_regional: 'border-purple-200 text-purple-400 bg-purple-500/10',
    riesgos:       'border-orange-200 text-orange-400 bg-orange-500/10',
    comite:        'border-rose-200 text-rose-400 bg-rose-500/10',
    gerencia:      'border-emerald-200 text-emerald-400 bg-emerald-500/10',
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-[#00361f] text-white sticky top-0 z-30 shadow-2xl border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#9cb000] rounded-xl flex items-center justify-center shadow-lg border border-white/10">
              <Briefcase size={20} className="text-[#00361f]" />
            </div>
            <div>
              <h1 className="text-lg font-display font-black tracking-tight leading-none">Core<span className="text-[#d4af37]">Financiero</span></h1>
              <span className="text-[9px] text-[#d4af37]/80 font-bold uppercase tracking-widest block mt-0.5">Banco Falabella</span>
            </div>
          </div>

          {/* Nav Items (Pills) */}
          <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2">
            {navItems.map(item => {
              const isActive = modulo === item.id;
              return (
                <button key={item.id} onClick={() => setModulo(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#d4af37] text-[#00361f] shadow-lg shadow-[#d4af37]/20 scale-105'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}>
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* User & Logout */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full pl-3 pr-4 py-1.5 backdrop-blur-md">
              <div className="w-7 h-7 rounded-full bg-[#d4af37] text-[#00361f] font-black text-xs flex items-center justify-center shadow-sm">
                {session.nombre?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold leading-tight truncate max-w-[120px]">{session.nombre}</p>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#d4af37]">{session.rol}</span>
              </div>
            </div>

            <button onClick={handleLogout} title="Cerrar Sesión"
              className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl transition-all shadow-sm">
              <LogOut size={16} />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d4af37]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="max-w-[1500px] mx-auto animate-fade-up relative z-10">
          {modulo === 'bandeja'   && <BandejaCreditos token={session.access_token} trabajador={session} />}
          {modulo === 'clientes'  && <ModuloClientes token={session.access_token} />}
          {modulo === 'empresas'  && <ModuloEmpresas token={session.access_token} />}
          {modulo === 'mora'      && <ModuloMora token={session.access_token} trabajador={session} />}
          {modulo === 'analitica' && <ModuloAnalitica token={session.access_token} />}
          {modulo === 'productos' && <ModuloProductos token={session.access_token} />}
        </div>
      </main>
    </div>
  )
}

export default App
