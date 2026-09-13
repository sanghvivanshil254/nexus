import React from 'react';
import { 
  FileSearch, 
  Layers, 
  History, 
  Code2, 
  ShieldCheck, 
  Home, 
  LogOut, 
  Sparkles, 
  Globe2, 
  ChevronRight, 
  CheckCircle2,
  X,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useBackendStatus } from '../hooks/useBackendStatus';

export const Sidebar = ({ currentView, setCurrentView, user, onLogout, isMobileOpen, setIsMobileOpen }) => {
  const { isConnected, device, modelTier, languageCount, recheck, isLoading } = useBackendStatus();

  const navItems = [
    { id: 'landing', label: 'Home Overview', icon: Home, badge: null },
    { id: 'dashboard', label: 'OCR Studio', icon: FileSearch, badge: 'Active' },
    { id: 'batch', label: 'Batch Queue', icon: Layers, badge: '8 GPU' },
    { id: 'history', label: 'Extraction History', icon: History, badge: null },
    { id: 'apidocs', label: 'API & Dev Docs', icon: Code2, badge: null },
    // Only show Admin Console if the user is an Admin AND not on the Home Overview page
    ...(user?.isAdmin && currentView !== 'landing' ? [
      { id: 'admin', label: 'Admin Console', icon: ShieldCheck, badge: 'ADMIN', adminOnly: true }
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
        className={`standing-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: '260px',
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
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
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
                  <span className="badge badge-primary" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                    v2.4
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

            {/* Mobile Close Button */}
            {setIsMobileOpen && (
              <button
                onClick={() => setIsMobileOpen(false)}
                className="btn btn-ghost btn-sm mobile-close-btn"
                style={{ padding: '4px', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            )}

          </div>
        </div>

        {/* Middle: Standing Vertical Navigation Items */}
        <div style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          
          <div style={{ padding: '0 0.5rem 0.5rem', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
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
                    textAlign: 'left',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span style={{
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
        <div style={{ padding: '0.85rem', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
          
          {/* Live Backend Connection Status Pill */}
          <div 
            onClick={recheck}
            title={isConnected ? `Nexus Backend Online (${device?.toUpperCase() || 'CPU'}) - ${languageCount} languages - Tier: ${modelTier}. Click to refresh.` : 'Nexus Backend is not detected. Running in client-side demo mode. Click to recheck.'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
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
              <span>{isConnected ? `Backend: ${device?.toUpperCase() || 'CPU'} (${languageCount} Langs)` : 'Backend: Standalone Demo'}</span>
            </div>
            <RefreshCw size={11} style={{ opacity: 0.6, animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          </div>

          {/* User Profile Card */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
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
                  gap: '8px', 
                  cursor: user?.isAdmin ? 'pointer' : 'default', 
                  flex: 1, 
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
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'block', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: user.isAdmin ? '#2563eb' : '#10b981', fontWeight: 600, display: 'block' }}>
                    {user.role || 'Enterprise User'}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="btn btn-ghost btn-sm"
                title="Sign Out"
                style={{ color: '#ef4444', padding: '4px', flexShrink: 0 }}
              >
                <LogOut size={15} />
              </button>
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
