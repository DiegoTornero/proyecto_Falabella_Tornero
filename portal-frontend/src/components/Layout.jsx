import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

const menuItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="9" rx="1"></rect>
        <rect x="14" y="3" width="7" height="5" rx="1"></rect>
        <rect x="14" y="12" width="7" height="9" rx="1"></rect>
        <rect x="3" y="16" width="7" height="5" rx="1"></rect>
      </svg>
    ),
  },
  {
    path: "/ahorros",
    label: "Mis Ahorros",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"></path>
        <line x1="3" y1="11" x2="21" y2="11"></line>
        <path d="M17 15h.01"></path>
      </svg>
    ),
  },
  {
    path: "/creditos",
    label: "Préstamos",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="18" x2="12" y2="12"></line>
        <line x1="9" y1="15" x2="15" y2="15"></line>
      </svg>
    ),
  },
  {
    path: "/servicios",
    label: "Pagos y Servicios",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
        <rect x="9" y="9" width="6" height="6"></rect>
        <line x1="9" y1="1" x2="9" y2="4"></line>
        <line x1="15" y1="1" x2="15" y2="4"></line>
        <line x1="9" y1="20" x2="9" y2="23"></line>
        <line x1="15" y1="20" x2="15" y2="23"></line>
        <line x1="20" y1="9" x2="23" y2="9"></line>
        <line x1="20" y1="14" x2="23" y2="14"></line>
        <line x1="1" y1="9" x2="4" y2="9"></line>
        <line x1="1" y1="14" x2="4" y2="14"></line>
      </svg>
    ),
  },
  {
    path: "/transferencias",
    label: "Transferencias",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <polyline points="16 3 21 3 21 8"></polyline>
        <line x1="4" y1="20" x2="21" y2="3"></line>
        <polyline points="21 16 21 21 16 21"></polyline>
        <line x1="15" y1="15" x2="21" y2="21"></line>
        <line x1="4" y1="4" x2="9" y2="9"></line>
      </svg>
    ),
  },
  {
    path: "/perfil",
    label: "Mi Perfil",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
  },
];

export default function Layout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const [usuario, setUsuario] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      api.get(`/usuarios/${user.id}`)
        .then(res => setUsuario(res.data))
        .catch(err => console.error(err));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const iniciales = usuario ? `${usuario.nombre?.charAt(0) || ""}${usuario.apellido?.charAt(0) || ""}`.toUpperCase() : "U";

  return (
    <div className="flex h-screen bg-[#f5f7fa] font-['Inter',_sans-serif]">
      {/* ── SIDEBAR ── */}
      <aside className="w-[280px] bg-[#0a1f14] flex flex-col transition-all duration-300 relative shadow-2xl z-20 hidden md:flex">
        {/* Decorative subtle background gradient in sidebar */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#113322] to-transparent opacity-50 pointer-events-none"></div>
        
        {/* Header / Logo */}
        <div className="p-8 flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-[#c8e000] to-[#9cb000] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(200,224,0,0.3)]">
            <span className="text-[#0a1f14] font-bold text-lg tracking-tighter">BF</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Banco Falabella</h1>
            <p className="text-[#c8e000] text-xs font-semibold tracking-wider uppercase opacity-80">Premium</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 mt-6 relative z-10">
          <ul className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group
                      ${active 
                        ? "bg-[rgba(200,224,0,0.1)] text-[#c8e000] shadow-inner" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                  >
                    <div className={`${active ? "text-[#c8e000]" : "text-gray-400 group-hover:text-white"} transition-colors`}>
                      {item.icon}
                    </div>
                    <span className={`font-medium ${active ? "font-semibold" : ""}`}>
                      {item.label}
                    </span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#c8e000] shadow-[0_0_8px_#c8e000]"></div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-6 relative z-10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors w-full px-4 py-3 rounded-xl hover:bg-white/5 group"
          >
            <svg className="group-hover:-translate-x-1 transition-transform" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-[#c8e000]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Topbar */}
        <header className="h-[90px] px-10 flex items-center justify-between z-10 sticky top-0 backdrop-blur-md bg-white/40 border-b border-white/20 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-[#0a1f14] tracking-tight">{title}</h2>
            {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-[#0a1f14] transition-colors bg-white rounded-full shadow-sm border border-gray-100 hover:shadow-md">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-gray-200"></div>

            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#0a1f14] leading-tight group-hover:text-[#00a651] transition-colors">{usuario?.nombre || "Usuario"}</p>
                <p className="text-xs text-gray-500 font-medium">Cliente Premium</p>
              </div>
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#0a1f14] to-[#1b4b32] flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                {iniciales}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-6 py-8 md:px-10 z-10 relative">
          <div className="max-w-[1200px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
