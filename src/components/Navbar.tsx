import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context';
import {
  Bell, MessageSquare, Home, Trophy, Calendar, Users, Newspaper,
  Award, User, LayoutDashboard, Menu, X, LogOut,
  Shield, Zap, ChevronRight, KeyRound,
} from 'lucide-react';
import { getAvatarUrl, timeAgo } from '../utils/helpers';

type Page = string;
interface Props { currentPage: Page; setPage: (p: Page) => void; }

const DARK_PANEL: React.CSSProperties = {
  background: 'rgba(6,10,20,0.99)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(232,184,75,0.05)',
  borderRadius: 18,
  overflow: 'hidden',
};

const menuItemBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  padding: '10px 10px',
  borderRadius: 12,
  transition: 'all 0.15s ease',
  textAlign: 'left',
  border: '1px solid transparent',
  background: 'transparent',
  cursor: 'pointer',
};

function MenuItem({
  icon, iconBg, iconColor, label, sub, hoverBg, labelColor, onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  sub: string;
  hoverBg: string;
  labelColor?: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...menuItemBase,
        background: hovered ? hoverBg : 'transparent',
        borderColor: hovered ? 'rgba(255,255,255,0.07)' : 'transparent',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: labelColor || 'rgba(255,255,255,0.92)', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{sub}</p>
      </div>
      <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
    </button>
  );
}

export function Navbar({ currentPage, setPage }: Props) {
  const { data, currentUser, setCurrentUser, update } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const myNotifs = data.notifications.filter(n => n.userId === currentUser?.id);
  const unread = myNotifs.filter(n => !n.read).length;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [currentPage]);

  function markRead() {
    const updated = {
      ...data,
      notifications: data.notifications.map(n =>
        n.userId === currentUser?.id ? { ...n, read: true } : n
      ),
    };
    update(updated);
    setNotifOpen(v => !v);
    setUserMenuOpen(false);
  }

  function logout() {
    setCurrentUser(null);
    setPage('home');
    setUserMenuOpen(false);
    setMobileOpen(false);
  }

  function nav(p: string) {
    setPage(p);
    setMobileOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }

  const navLinks = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'standings', label: 'Standings', icon: Trophy },
    { id: 'matchdays', label: 'Matchdays', icon: Calendar },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'teams', label: 'Teams', icon: Shield },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'awards', label: 'Awards', icon: Award },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      <style>{`
        @keyframes navDrop {
          from { opacity:0; transform:translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes mobileSlide {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .nav-panel { animation: navDrop 0.18s cubic-bezier(0.34,1.4,0.64,1) both; }
        .nav-link-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
          transition: all 0.15s ease;
          white-space: nowrap;
          border: none;
          cursor: pointer;
          background: transparent;
        }
        .nav-link-btn:hover { background: rgba(255,255,255,0.06) !important; }
      `}</style>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav className="fixed top-0 left-0 right-0 z-40"
        style={{ background: 'rgba(4,7,15,0.97)', backdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-5">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo */}
            <button onClick={() => nav('home')} className="flex items-center gap-2.5 group flex-shrink-0" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <div className="relative w-9 h-9 sm:w-10 sm:h-10">
                <div className="w-full h-full rounded-xl flex items-center justify-center font-black text-[10px] tracking-tight transition-all duration-300 group-hover:scale-105"
                  style={{ background: 'linear-gradient(135deg,#f0cc6b,#c99a2e)', color: '#060a12', boxShadow: '0 4px 16px rgba(232,184,75,0.4)' }}>
                  EML
                </div>
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-white font-black text-sm tracking-tight">EUROPEAN</span>
                <span className="font-bold text-[9px] tracking-[0.2em] uppercase"
                  style={{ background: 'linear-gradient(90deg,#e8b84b,#f0cc6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  MamoBall League
                </span>
              </div>
            </button>

            {/* Desktop Nav Links */}
            {currentUser && (
              <div className="hidden lg:flex items-center gap-0.5 mx-4">
                {navLinks.map(l => {
                  const Icon = l.icon;
                  const active = currentPage === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => nav(l.id)}
                      className="nav-link-btn"
                      style={{ color: active ? '#e8b84b' : 'rgba(255,255,255,0.45)', background: active ? 'rgba(232,184,75,0.09)' : 'transparent' }}
                    >
                      <Icon size={13} />
                      {l.label}
                      {active && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                          style={{ background: 'linear-gradient(90deg,#e8b84b,#f0cc6b)', boxShadow: '0 0 6px rgba(232,184,75,0.7)' }} />
                      )}
                    </button>
                  );
                })}
                {isAdmin && (
                  <button
                    onClick={() => nav('admin')}
                    className="nav-link-btn"
                    style={{ color: currentPage === 'admin' ? '#c084fc' : 'rgba(192,132,252,0.5)', background: currentPage === 'admin' ? 'rgba(168,85,247,0.1)' : 'transparent' }}
                  >
                    <LayoutDashboard size={13} />
                    Admin
                    {currentPage === 'admin' && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                        style={{ background: 'linear-gradient(90deg,#a855f7,#c084fc)', boxShadow: '0 0 6px rgba(168,85,247,0.7)' }} />
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {currentUser ? (
                <>
                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={markRead}
                      style={{
                        padding: 8, borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer',
                        color: unread > 0 ? '#e8b84b' : 'rgba(255,255,255,0.4)', position: 'relative', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <Bell size={17} />
                      {unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-black flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', color: '#060a12', boxShadow: '0 0 8px rgba(232,184,75,0.5)' }}>
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </button>

                    {notifOpen && (
                      <div className="nav-panel absolute right-0 top-[calc(100%+8px)] w-[300px] z-50" style={DARK_PANEL}>
                        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                              style={{ background: 'linear-gradient(135deg,rgba(232,184,75,0.25),rgba(232,184,75,0.1))' }}>
                              <Bell size={11} style={{ color: '#e8b84b' }} />
                            </div>
                            <span className="font-bold text-white text-sm">Notifications</span>
                            {unread > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ background: 'rgba(232,184,75,0.15)', color: '#e8b84b', border: '1px solid rgba(232,184,75,0.25)' }}>
                                {unread} new
                              </span>
                            )}
                          </div>
                          <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4, borderRadius: 8, display: 'flex' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}>
                            <X size={13} />
                          </button>
                        </div>
                        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                          {myNotifs.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                              <Bell size={28} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.1)' }} />
                              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>No notifications yet</p>
                            </div>
                          ) : myNotifs.slice(0, 20).map((n, i) => (
                            <div key={n.id} style={{ padding: '10px 16px', borderBottom: i < Math.min(myNotifs.length, 20) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.12s' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(232,184,75,0.03)'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                              <div className="flex items-start gap-2.5">
                                {!n.read && <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#e8b84b' }} />}
                                <div className={!n.read ? '' : 'pl-4'}>
                                  <p className="text-xs leading-relaxed" style={{ color: n.read ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)' }}>{n.message}</p>
                                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.18)' }}>{timeAgo(n.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="relative" ref={userRef}>
                    <button
                      onClick={() => { setUserMenuOpen(v => !v); setNotifOpen(false); }}
                      className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl transition-all duration-200"
                      style={{
                        background: userMenuOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${userMenuOpen ? 'rgba(232,184,75,0.2)' : 'rgba(255,255,255,0.09)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div className="relative">
                        <img src={getAvatarUrl(currentUser.username, currentUser.avatar)} alt={currentUser.username}
                          className="w-7 h-7 rounded-lg object-cover" style={{ border: '1.5px solid rgba(232,184,75,0.25)' }} />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center"
                          style={{ background: currentUser.role === 'admin' ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'linear-gradient(135deg,#e8b84b,#c99a2e)', border: '1.5px solid rgba(4,7,15,0.97)' }}>
                          {currentUser.role === 'admin' ? <Zap size={6} color="white" /> : <Shield size={6} color="white" />}
                        </div>
                      </div>
                      <span className="hidden sm:block text-xs font-semibold max-w-[80px] truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {currentUser.username}
                      </span>
                    </button>

                    {userMenuOpen && (
                      <div className="nav-panel absolute right-0 top-[calc(100%+10px)] w-64 z-50" style={DARK_PANEL}>
                        {/* User header */}
                        <div className="px-4 py-4" style={{ background: 'linear-gradient(135deg,rgba(232,184,75,0.06),rgba(232,184,75,0.02))', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img src={getAvatarUrl(currentUser.username, currentUser.avatar)} alt={currentUser.username}
                                className="w-12 h-12 rounded-xl object-cover" style={{ border: '2px solid rgba(232,184,75,0.3)' }} />
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ background: currentUser.role === 'admin' ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'linear-gradient(135deg,#e8b84b,#c99a2e)', border: '2px solid rgba(4,7,15,0.97)' }}>
                                {currentUser.role === 'admin' ? <Zap size={7} color="white" /> : <Shield size={7} color="white" />}
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-bold text-sm truncate">{currentUser.username}</p>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold mt-0.5"
                                style={currentUser.role === 'admin'
                                  ? { background: 'rgba(168,85,247,0.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }
                                  : { background: 'rgba(232,184,75,0.15)', color: '#e8b84b', border: '1px solid rgba(232,184,75,0.25)' }}>
                                {currentUser.role === 'admin' ? '⚡ Admin' : '🎮 Player'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div style={{ padding: '8px' }}>
                          <MenuItem
                            icon={<User size={15} />}
                            iconBg="linear-gradient(135deg,rgba(139,92,246,0.35),rgba(99,102,241,0.18))"
                            iconColor="#a78bfa"
                            label="My Profile"
                            sub="Stats, history & public view"
                            hoverBg="linear-gradient(135deg,rgba(139,92,246,0.14),rgba(99,102,241,0.06))"
                            onClick={() => nav(`profile_${currentUser.id}`)}
                          />
                          <MenuItem
                            icon={<KeyRound size={15} />}
                            iconBg="linear-gradient(135deg,rgba(14,165,233,0.35),rgba(6,182,212,0.18))"
                            iconColor="#38bdf8"
                            label="Account Settings"
                            sub="Change password & avatar"
                            hoverBg="linear-gradient(135deg,rgba(14,165,233,0.14),rgba(6,182,212,0.06))"
                            onClick={() => nav('settings')}
                          />
                          {isAdmin && (
                            <MenuItem
                              icon={<LayoutDashboard size={15} />}
                              iconBg="linear-gradient(135deg,rgba(168,85,247,0.35),rgba(139,92,246,0.18))"
                              iconColor="#c084fc"
                              label="Admin Panel"
                              sub="Manage the league"
                              hoverBg="linear-gradient(135deg,rgba(168,85,247,0.14),rgba(139,92,246,0.06))"
                              onClick={() => nav('admin')}
                            />
                          )}

                          <div style={{ margin: '6px 4px', borderTop: '1px solid rgba(255,255,255,0.07)' }} />

                          <MenuItem
                            icon={<LogOut size={15} />}
                            iconBg="linear-gradient(135deg,rgba(239,68,68,0.35),rgba(220,38,38,0.18))"
                            iconColor="#f87171"
                            label="Sign Out"
                            sub="End your session"
                            hoverBg="linear-gradient(135deg,rgba(239,68,68,0.14),rgba(220,38,38,0.06))"
                            labelColor="#fca5a5"
                            onClick={logout}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Hamburger */}
                  <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="lg:hidden p-2 rounded-xl transition-all"
                    style={{ color: mobileOpen ? 'white' : 'rgba(255,255,255,0.5)', background: mobileOpen ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => nav('login')}
                  className="px-4 sm:px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', color: '#060a12', boxShadow: '0 4px 16px rgba(232,184,75,0.35)', border: 'none', cursor: 'pointer' }}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && currentUser && (
          <div className="lg:hidden"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(4,7,15,0.99)', animation: 'mobileSlide 0.18s ease both', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="px-3 py-3 space-y-1">
              {/* User card */}
              <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="relative">
                  <img src={getAvatarUrl(currentUser.username, currentUser.avatar)} alt="" className="w-10 h-10 rounded-xl object-cover"
                    style={{ border: '2px solid rgba(232,184,75,0.3)' }} />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: currentUser.role === 'admin' ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'linear-gradient(135deg,#e8b84b,#c99a2e)', border: '2px solid rgba(4,7,15,0.99)' }}>
                    {currentUser.role === 'admin' ? <Zap size={7} color="white" /> : <Shield size={7} color="white" />}
                  </div>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{currentUser.username}</p>
                  <span className="text-[11px]" style={{ color: currentUser.role === 'admin' ? '#c084fc' : '#e8b84b' }}>
                    {currentUser.role === 'admin' ? '⚡ Admin' : '🎮 Player'}
                  </span>
                </div>
              </div>

              {/* Nav links */}
              {navLinks.map(l => {
                const Icon = l.icon;
                const active = currentPage === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => nav(l.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      color: active ? '#e8b84b' : 'rgba(255,255,255,0.6)',
                      background: active ? 'rgba(232,184,75,0.1)' : 'transparent',
                      border: active ? '1px solid rgba(232,184,75,0.15)' : '1px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={16} />
                    <span className="flex-1 text-left">{l.label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#e8b84b' }} />}
                  </button>
                );
              })}

              {isAdmin && (
                <button
                  onClick={() => nav('admin')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    color: currentPage === 'admin' ? '#c084fc' : 'rgba(192,132,252,0.6)',
                    background: currentPage === 'admin' ? 'rgba(168,85,247,0.1)' : 'transparent',
                    border: currentPage === 'admin' ? '1px solid rgba(168,85,247,0.2)' : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  <LayoutDashboard size={16} />
                  <span className="flex-1 text-left">Admin Dashboard</span>
                </button>
              )}

              <div className="pt-2 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={() => nav(`profile_${currentUser.id}`)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium"
                  style={{ color: 'rgba(255,255,255,0.6)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <User size={16} style={{ color: '#a78bfa' }} />
                  My Profile
                </button>
                <button onClick={() => nav('settings')} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium"
                  style={{ color: 'rgba(255,255,255,0.6)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <KeyRound size={16} style={{ color: '#38bdf8' }} />
                  Account Settings
                </button>
                <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium"
                  style={{ color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
