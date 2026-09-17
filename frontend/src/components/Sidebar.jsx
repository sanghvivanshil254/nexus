import React from 'react';
import { 
  FileSearch, 
  Layers, 
  History, 
  Code2, 
  ShieldCheck, 
  Rocket, 
  LogOut, 
  LogIn,
  Sparkles, 
  Globe2, 
  ChevronRight, 
  CheckCircle2,
  X,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useBackendStatus } from '../hooks/useBackendStatus';
import { AnimatedHamburger } from './AnimatedHamburger';

export const Sidebar = ({ 
  currentView, 
  setCurrentView, 
  user, 
  onLogout, 
  isMobileOpen, 
  setIsMobileOpen,
  isCollapsed = false,
  setIsCollapsed
}) => {
  const { isConnected, device, modelTier, languageCount, recheck, isLoading } = useBackendStatus();

  const navItems = [
    { id: 'launch', label: 'Launch Page', icon: Rocket },
    { id: 'dashboard', label: 'OCR Studio', icon: FileSearch },
    { id: 'batch', label: 'Batch Queue', icon: Layers },
    { id: 'history', label: 'Extraction History', icon: History },
    { id: 'apidocs', label: 'API & Dev Docs', icon: Code2 },
    // Show Admin Console whenever the user is an Admin
    ...(user?.isAdmin ? [
      { id: 'admin', label: 'Admin Console', icon: ShieldCheck, adminOnly: true }
    ] : [])
  ];

  const handleNavClick = (id) => {
    setCurrentView(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 1998,
            display: 'block'
          }}
        />
      )}

      {/* Standing Left Sidebar */}
      <aside
        className={`standing-sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          width: isCollapsed ? '76px' : '260px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 1999,
          flexShrink: 0,
          boxShadow: '1px 0 10px rgba(0,0,0,0.02)'
        }}
      >
        {/* Top: Brand Header */}
        <div style={{ padding: isCollapsed ? '1.25rem 0.5rem 1rem' : '1.25rem 1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
          {isCollapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <AnimatedHamburger
                isOpen={false}
                onClick={() => setIsCollapsed && setIsCollapsed(false)}
                title="Expand sidebar"
              />
              <div 
                onClick={() => handleNavClick('dashboard')}
                title="NexusOCR Home"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <FileSearch size={19} strokeWidth={2.4} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div 
                onClick={() => handleNavClick('dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  color: '#ffffff',
                  flexShrink: 0
                }}>
                  <FileSearch size={19} strokeWidth={2.4} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                      fontFamily: 'var(--font-sans)', 
                      fontSize: '1.15rem', 
                      fontWeight: 800, 
                      color: '#0f172a',
                      letterSpacing: '-0.03em'
                    }}>
                      Nexus<span style={{ color: '#2563eb' }}>OCR</span>
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: '0.68rem', 
                    color: '#64748b', 
                    fontWeight: 500,
                    display: 'block',
                    marginTop: '-2px'
                  }}>
                    Multilingual AI Pipeline
                  </span>
                </div>
              </div>

              {/* Animated Hamburger Toggle Button */}
              <AnimatedHamburger
                isOpen={isMobileOpen || !isCollapsed}
                onClick={() => {
                  if (window.innerWidth <= 900) {
                    if (setIsMobileOpen) setIsMobileOpen(false);
                  } else {
                    if (setIsCollapsed) setIsCollapsed(!isCollapsed);
                  }
                }}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              />
            </div>
          )}
        </div>

        {/* Middle: Standing Vertical Navigation Items */}
        <div style={{ flex: 1, padding: isCollapsed ? '1rem 0.4rem' : '1rem 0.75rem', overflowY: 'auto' }}>
          
          <div className="sidebar-hide-collapsed" style={{ padding: '0 0.5rem 0.5rem', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pipeline Modules
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isAdmin = item.id === 'admin';

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="sidebar-item-btn"
                  title={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    padding: isCollapsed ? '9px 0' : '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive 
                      ? (isAdmin ? '#0f172a' : '#eff6ff') 
                      : 'transparent',
                    color: isActive 
                      ? (isAdmin ? '#38bdf8' : '#2563eb') 
                      : '#475569',
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: isCollapsed ? 'center' : 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive && !isAdmin ? '0 1px 3px rgba(37, 99, 235, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      background: isActive 
                        ? (isAdmin ? 'rgba(56, 189, 248, 0.15)' : '#2563eb')
                        : '#f1f5f9',
                      color: isActive 
                        ? (isAdmin ? '#38bdf8' : '#ffffff')
                        : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={15} />
                    </div>
                    <span className="sidebar-hide-collapsed">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="sidebar-hide-collapsed" style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: isAdmin 
                        ? (isActive ? '#38bdf8' : '#0f172a')
                        : (isActive ? '#2563eb' : '#e2e8f0'),
                      color: isAdmin 
                        ? (isActive ? '#0f172a' : '#ffffff')
                        : (isActive ? '#ffffff' : '#475569')
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: User Profile & Status */}
        <div style={{ padding: isCollapsed ? '0.65rem 0.35rem' : '0.85rem', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
          
          {/* Live Backend Connection Status Pill */}
          <div 
            onClick={recheck}
            title={isConnected ? `Nexus Backend Online (${device?.toUpperCase() || 'CPU'}) - ${languageCount} languages - Tier: ${modelTier}. Click to refresh.` : 'Nexus Backend is not detected. Running in client-side demo mode. Click to recheck.'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              padding: isCollapsed ? '6px' : '6px 10px',
              borderRadius: '8px',
              background: isConnected ? '#ecfdf5' : '#f8fafc',
              border: `1px solid ${isConnected ? '#a7f3d0' : '#e2e8f0'}`,
              fontSize: '0.72rem',
              color: isConnected ? '#065f46' : '#64748b',
              fontWeight: 600,
              marginBottom: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: isConnected ? '#10b981' : '#94a3b8', 
                display: 'inline-block',
                boxShadow: isConnected ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none'
              }} />
              <span className="sidebar-hide-collapsed">{isConnected ? `Backend: ${device?.toUpperCase() || 'CPU'} (${languageCount} Langs)` : 'Backend: Standalone Demo'}</span>
            </div>
            {!isCollapsed && (
              <RefreshCw size={11} style={{ opacity: 0.6, animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            )}
          </div>

          {/* User Profile Card / Guest Mode Card */}
          {user ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              padding: isCollapsed ? '6px 0' : '6px 8px',
              borderRadius: '10px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div 
                onClick={() => {
                  if (user?.isAdmin) handleNavClick('admin');
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isCollapsed ? '0' : '8px', 
                  cursor: user?.isAdmin ? 'pointer' : 'default', 
                  flex: isCollapsed ? 0 : 1, 
                  minWidth: 0 
                }}
                title={user?.isAdmin ? "Click to view Admin Console" : user?.name}
              >
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: user.isAdmin ? 'linear-gradient(135deg, #0f172a, #334155)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="sidebar-hide-collapsed" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'block', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: user.isAdmin ? '#2563eb' : '#10b981', fontWeight: 600, display: 'block' }}>
                    {user.role || 'Enterprise User'}
                  </span>
                </div>
              </div>

              {!isCollapsed && (
                <button
                  onClick={onLogout}
                  className="btn btn-ghost btn-sm"
                  title="Sign Out"
                  style={{ color: '#ef4444', padding: '4px', flexShrink: 0 }}
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          ) : (
            <div style={{
              padding: isCollapsed ? '6px 0' : '6px 10px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              fontSize: '0.78rem'
            }}>
              {isCollapsed ? (
                <button
                  onClick={() => handleNavClick('login')}
                  title="Sign In"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <LogIn size={16} />
                </button>
              ) : (
                <>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Guest Session</span>
                  <button
                    onClick={() => handleNavClick('login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    Sign In &rarr;
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </aside>

      <style>{`
        @media (max-width: 900px) {
          .standing-sidebar {
            position: fixed !important;
            top: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .standing-sidebar.mobile-open {
            transform: translateX(0) !important;
          }
          .mobile-close-btn {
            display: flex !important;
          }
        }
        @media (min-width: 901px) {
          .mobile-close-btn {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};
