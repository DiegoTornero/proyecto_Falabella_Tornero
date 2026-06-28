import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

/* ─── Brand palette (vintage banking) ─────────────────────────── */
const C = {
  ink:       "#1a140a",   // dark warm brown-black
  forest:    "#00361f",   // deep green
  green:     "#00693c",   // mid green
  lime:      "#c8e000",   // brand lime
  gold:      "#b8960c",   // vintage gold
  goldLight: "#d4af37",   // warm gold
  cream:     "#f8f5ed",   // parchment cream
  creamDark: "#ede9df",
  border:    "#d9d0bc",   // warm border
  muted:     "#7a6e5e",   // warm muted text
};

/* ─── Nav items ────────────────────────────────────────────────── */
const NAV = [
  {
    path: "/dashboard", label: "Inicio",
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
  },
  {
    path: "/ahorros", label: "Mis Ahorros",
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/><line x1="3" y1="11" x2="21" y2="11"/></svg>
  },
  {
    path: "/creditos", label: "Préstamos",
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  },
  {
    path: "/transferencias", label: "Transferencias",
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
  },
  {
    path: "/servicios", label: "Servicios",
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
  },
  {
    path: "/perfil", label: "Mi Perfil",
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  },
];

/* ─── Notification mock ─────────────────────────────────────────── */
const NOTIFS = [
  { id: 1, title: "Transferencia recibida", body: "S/ 350.00 de Juan García", time: "hace 5 min", read: false },
  { id: 2, title: "Pago procesado", body: "Pago Luz del Sur completado", time: "hace 1 h", read: false },
  { id: 3, title: "Sesión activa", body: "Sesión protegida con SSL/TLS", time: "Ahora", read: true },
];

/* ─── Inline styles object ──────────────────────────────────────── */
const S = {
  /* Main wrapper */
  root: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: C.cream,
    fontFamily: "'DM Sans', sans-serif",
  },

  /* ── TOP RIBBON (very thin marquee bar) ── */
  ribbon: {
    background: C.ink,
    color: "rgba(200,224,0,0.75)",
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "6px 36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  /* ── HEADER BAND (logo + user actions) ── */
  headerBand: {
    background: C.forest,
    padding: "0 36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 72,
    borderBottom: `1px solid ${C.gold}40`,
    position: "relative",
  },

  /* ── NAV BAR (horizontal links on cream bg) ── */
  navBar: {
    background: "#fff",
    borderBottom: `3px solid ${C.goldLight}`,
    padding: "0 36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 16px rgba(26,20,10,0.06)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },

  navInner: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    flex: 1,
  },

  /* ── PAGE CONTENT ── */
  main: {
    flex: 1,
    padding: "36px 36px 56px",
    maxWidth: 1180,
    margin: "0 auto",
    width: "100%",
  },

  footer: {
    background: C.ink,
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    textAlign: "center",
    padding: "16px 36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    letterSpacing: "0.04em",
  },
};

/* ═══════════════════════════════════════════════════════════════ */
export default function Layout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const [usuario, setUsuario] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifsList, setNotifsList] = useState(NOTIFS);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const userRef  = useRef(null);

  useEffect(() => {
    if (user?.id) {
      api.get(`/usuarios/${user.id}`).then(r => setUsuario(r.data)).catch(() => {});
      api.get(`/notificaciones/${user.id}`).then(r => {
        if (r.data && r.data.length > 0) {
          setNotifsList(r.data.map(n => ({
            id: n.id,
            title: n.titulo,
            body: n.mensaje,
            time: new Date(n.fecha).toLocaleDateString("es-PE"),
            read: n.leida
          })));
        }
      }).catch(() => {});
    }
  }, [user]);

  const unread = notifsList.filter(n => !n.read).length;

  const marcarTodasLeidas = async () => {
    setNotifsList(prev => prev.map(n => ({ ...n, read: true })));
    notifsList.forEach(n => {
      if (!n.read) api.put(`/notificaciones/${n.id}/leer`).catch(() => {});
    });
  };

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setShowUser(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const iniciales = usuario
    ? `${usuario.nombre?.charAt(0) || ""}${usuario.apellido?.charAt(0) || ""}`.toUpperCase()
    : "U";

  const handleLogout = () => { logout(); navigate("/"); };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div style={S.root}>

      {/* ══ 1. TOP RIBBON ══════════════════════════════════════ */}
      <div style={S.ribbon}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="11" height="11" fill="none" stroke={C.lime} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Sesión Segura · SSL/TLS 256-bit
          </span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span style={{ color: "rgba(255,255,255,0.35)" }}>Lun – Vie  08:00 – 18:00</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "rgba(255,255,255,0.4)" }}>
          <span>Falabella</span>
          <span>·</span>
          <span>Sodimac</span>
          <span>·</span>
          <span>Seguros</span>
          <span>·</span>
          <span>Viajes</span>
        </div>
      </div>

      {/* ══ 2. HEADER BAND (Logo + User Zone) ══════════════════ */}
      <header style={S.headerBand}>
        {/* Decorative diagonal lines (vintage texture) */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(184,150,12,0.03) 18px, rgba(184,150,12,0.03) 19px)`,
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
          {/* Monogram seal */}
          <div style={{
            width: 46, height: 46,
            background: `linear-gradient(145deg, ${C.goldLight}, ${C.gold})`,
            borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 0 2px ${C.gold}60, 0 4px 18px rgba(184,150,12,0.3)`,
            transform: "rotate(-1deg)",
          }}>
            <span style={{ color: C.forest, fontWeight: 900, fontSize: 16, letterSpacing: "-0.04em", transform: "rotate(1deg)" }}>BF</span>
          </div>

          <div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 20, color: "#fff", fontWeight: 400,
              letterSpacing: "0.02em", lineHeight: 1,
            }}>
              Banco Falabella
            </div>
            <div style={{
              fontSize: 9.5, color: C.goldLight, fontWeight: 600,
              letterSpacing: "0.22em", textTransform: "uppercase",
              marginTop: 3,
            }}>
              Banca por Internet
            </div>
          </div>
        </div>

        {/* Right: Notif + User ─────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>

          {/* Notification */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => { setShowNotif(v => !v); setShowUser(false); }}
              style={{
                width: 40, height: 40,
                background: "rgba(255,255,255,0.06)",
                border: `1px solid rgba(184,150,12,0.25)`,
                borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.65)",
                transition: "all 0.2s", position: "relative",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
            >
              <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unread > 0 && (
                <span style={{
                  position: "absolute", top: 8, right: 8,
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#e74c3c", border: `2px solid ${C.forest}`,
                }} />
              )}
            </button>

            {showNotif && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0,
                width: 330, background: "#fff",
                borderRadius: 12, border: `1px solid ${C.border}`,
                boxShadow: "0 16px 48px rgba(26,20,10,0.14)",
                zIndex: 200, overflow: "hidden",
              }}>
                <div style={{ padding: "14px 18px", background: C.cream, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.ink, fontFamily: "'DM Serif Display', serif" }}>Notificaciones</span>
                  <span onClick={marcarTodasLeidas} style={{ fontSize: 11.5, color: C.green, fontWeight: 600, cursor: "pointer" }}>Marcar leídas</span>
                </div>
                {notifsList.map(n => (
                  <div key={n.id} style={{
                    padding: "13px 18px", display: "flex", gap: 12, alignItems: "flex-start",
                    borderBottom: `1px solid ${C.creamDark}`,
                    background: n.read ? "transparent" : `${C.cream}80`,
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: n.read ? C.creamDark : `rgba(0,105,60,0.1)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: n.read ? C.muted : C.green,
                    }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: C.ink }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{n.body}</div>
                      <div style={{ fontSize: 10.5, color: "#bbb", marginTop: 4 }}>{n.time}</div>
                    </div>
                    {!n.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, marginTop: 4, flexShrink: 0 }} />}
                  </div>
                ))}
                <div style={{ padding: "12px 18px", textAlign: "center", background: C.cream }}>
                  <span style={{ fontSize: 12, color: C.green, fontWeight: 600, cursor: "pointer" }}>Ver todas ({notifsList.length})</span>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: "rgba(184,150,12,0.2)" }} />

          {/* User dropdown */}
          <div ref={userRef} style={{ position: "relative" }}>
            <button
              onClick={() => { setShowUser(v => !v); setShowNotif(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(255,255,255,0.06)",
                border: `1px solid rgba(184,150,12,0.25)`,
                borderRadius: 8,
                padding: "8px 14px 8px 8px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 6,
                background: `linear-gradient(135deg, ${C.goldLight}, ${C.gold})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.forest, fontWeight: 800, fontSize: 12, flexShrink: 0,
              }}>
                {iniciales}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", lineHeight: 1.1 }}>
                  {usuario?.nombre || "Usuario"}
                </div>
                <div style={{ fontSize: 10, color: C.goldLight, letterSpacing: "0.06em" }}>
                  Cliente Premium
                </div>
              </div>
              <svg style={{ color: "rgba(255,255,255,0.4)", marginLeft: 2, transition: "transform 0.2s", transform: showUser ? "rotate(180deg)" : "none" }} width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {showUser && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0,
                width: 210, background: "#fff",
                borderRadius: 12, border: `1px solid ${C.border}`,
                boxShadow: "0 12px 36px rgba(26,20,10,0.12)",
                zIndex: 200, overflow: "hidden",
              }}>
                <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${C.creamDark}`, background: C.cream }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>
                    {usuario?.nombre} {usuario?.apellido}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{usuario?.email || "—"}</div>
                </div>
                {[
                  { label: "Mi Perfil", path: "/perfil", icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                  { label: "Mis Ahorros", path: "/ahorros", icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/><line x1="3" y1="11" x2="21" y2="11"/></svg> },
                ].map(item => (
                  <button key={item.path} onClick={() => { navigate(item.path); setShowUser(false); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "11px 16px", background: "none", border: "none",
                      cursor: "pointer", fontSize: 13.5, color: C.ink,
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "background 0.15s", textAlign: "left",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.cream}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <span style={{ color: C.muted }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
                <div style={{ borderTop: `1px solid ${C.creamDark}` }}>
                  <button onClick={handleLogout}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "11px 16px", background: "none", border: "none",
                      cursor: "pointer", fontSize: 13.5, color: "#c0392b",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "background 0.15s", textAlign: "left",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden"
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 6 }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ══ 3. HORIZONTAL NAV BAR ══════════════════════════════ */}
      <nav style={{
        ...S.navBar,
        boxShadow: scrolled ? "0 4px 20px rgba(26,20,10,0.10)" : "0 2px 8px rgba(26,20,10,0.04)",
      }}>
        {/* Desktop links */}
        <div style={S.navInner} className="hidden lg:flex">
          {NAV.map(item => {
            const active = location.pathname === item.path ||
                          (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "0 18px", height: 50,
                  textDecoration: "none",
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 500,
                  color: active ? C.green : C.muted,
                  letterSpacing: "0.01em",
                  borderBottom: active ? `3px solid ${C.green}` : "3px solid transparent",
                  marginBottom: -3,
                  transition: "all 0.18s",
                  whiteSpace: "nowrap",
                  position: "relative",
                }}
                onMouseEnter={e => {
                  if (!active) { e.currentTarget.style.color = C.ink; e.currentTarget.style.borderBottomColor = C.goldLight; }
                }}
                onMouseLeave={e => {
                  if (!active) { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderBottomColor = "transparent"; }
                }}
              >
                <span style={{ color: active ? C.green : "inherit", opacity: active ? 1 : 0.7, flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right: page breadcrumb / date */}
        <div className="hidden lg:flex" style={{ alignItems: "center", gap: 16, paddingLeft: 16 }}>
          {/* Decorative separator */}
          <div style={{ width: 1, height: 22, background: C.border }} />
          {/* Date */}
          <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 500, whiteSpace: "nowrap" }}>
            {new Date().toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </span>
          {/* Security tag */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: `rgba(0,105,60,0.06)`,
            border: `1px solid rgba(0,105,60,0.15)`,
            borderRadius: 20, padding: "4px 10px",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "block", animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 10.5, fontWeight: 600, color: C.green, letterSpacing: "0.06em" }}>Seguro</span>
          </div>
        </div>

        {/* Mobile: just title */}
        <div className="flex lg:hidden" style={{ alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{title}</span>
        </div>
      </nav>

      {/* ══ Mobile NAV DRAWER ═════════════════════════════════ */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,20,10,0.45)", zIndex: 90, backdropFilter: "blur(3px)" }} />
          <div style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: 260,
            background: C.forest,
            zIndex: 95, display: "flex", flexDirection: "column",
            boxShadow: "4px 0 32px rgba(0,0,0,0.3)",
          }}>
            <div style={{ padding: "24px 20px", borderBottom: `1px solid rgba(184,150,12,0.2)`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${C.goldLight}, ${C.gold})`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: C.forest, fontWeight: 900, fontSize: 13 }}>BF</span>
              </div>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#fff" }}>Banco Falabella</span>
            </div>
            <div style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
              {NAV.map(item => {
                const active = location.pathname.startsWith(item.path);
                return (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 10,
                      textDecoration: "none",
                      color: active ? C.lime : "rgba(255,255,255,0.6)",
                      background: active ? "rgba(200,224,0,0.08)" : "transparent",
                      fontWeight: active ? 700 : 400, fontSize: 14,
                      marginBottom: 2, transition: "all 0.18s",
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div style={{ padding: "12px 8px", borderTop: `1px solid rgba(255,255,255,0.06)` }}>
              <button onClick={handleLogout}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 14px", borderRadius: 10,
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.45)", fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══ 4. PAGE CONTENT ════════════════════════════════════ */}
      <main style={{ flex: 1, background: C.cream }}>
        {/* Page title band */}
        <div style={{
          background: "linear-gradient(to right, #fff, #fdfcf9)",
          borderBottom: `1px solid ${C.border}`,
          padding: "18px 36px 16px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 24, fontWeight: 400,
              color: C.ink, margin: 0, letterSpacing: "-0.01em",
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: 13, color: C.muted, margin: "4px 0 0", letterSpacing: "0.01em" }}>{subtitle}</p>
            )}
          </div>
          {/* Decorative gold rule */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, opacity: 0.5,
          }} className="hidden md:flex">
            <div style={{ width: 32, height: 1, background: C.gold }} />
            <div style={{ width: 6, height: 6, background: C.gold, transform: "rotate(45deg)" }} />
            <div style={{ width: 32, height: 1, background: C.gold }} />
          </div>
        </div>

        {/* Actual page content */}
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 36px 60px", width: "100%" }}>
          {children}
        </div>
      </main>

      {/* ══ 5. FOOTER ══════════════════════════════════════════ */}
      <footer style={S.footer}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="12" height="12" fill="none" stroke={C.goldLight} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>Sesión protegida · Cifrado SSL de 256 bits · Supervisado por la SBS</span>
        </div>
        <span>© 2026 Banco Falabella Perú S.A.</span>
      </footer>

    </div>
  );
}
