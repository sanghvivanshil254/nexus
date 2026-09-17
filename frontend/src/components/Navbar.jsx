import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSearch, 
  Layers, 
  History, 
  Code2, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  LogOut, 
  User, 
  Globe2,
  ShieldCheck,
  Menu,
  X,
  Rocket,
  ChevronDown,
  Check
} from 'lucide-react';

export const Navbar = ({ currentView, setCurrentView, user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { id: 'launch', label: 'Launch Page', icon: Rocket, desc: 'Keynote & product architecture' },
    { id: 'dashboard', label: 'OCR Studio', icon: FileSearch, highlight: true, desc: 'Interactive multilingual extraction studio' },
    { id: 'batch', label: 'Batch Queue', icon: Layers, desc: 'High-throughput parallel file processing' },
    { id: 'history', label: 'Extraction History', icon: History, desc: 'Searchable audit logs & records' },
    { id: 'apidocs', label: 'API & Developer Docs', icon: Code2, desc: 'REST endpoints, SDKs & Python snippets' },
    { id: 'admin', label: 'Admin Console', icon: ShieldCheck, adminOnly: true, desc: 'GPU cluster telemetry & model controls' }
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (id) => {
    setCurrentView(id);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentItem = navItems.find(item => item.id === currentView) || navItems[0];
  const CurrentIcon = currentItem.icon;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid #e2e8f0',
      transition: 'all 0.2s ease'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px',
        gap: '1.5rem'
      }}>
        {/* Left Side: Brand Logo + Left Dropdown Module Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          
          {/* Brand Logo */}
          <div 
            onClick={() => {
              if (user) {
                handleNavClick('dashboard');
              } else {
                handleNavClick('register');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              flexShrink: 0
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              color: '#ffffff'
            }}>
              <FileSearch size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ 
                  fontFamily: 'var(--font-sans)', 
                  fontSize: '1.18rem', 
                  fontWeight: 800, 
                  color: '#0f172a',
                  letterSpacing: '-0.03em',
                  whiteSpace: 'nowrap'
                }}>
                  Nexus<span style={{ color: '#2563eb' }}>OCR</span>
                </span>
                <span className="badge badge-primary" style={{ fontSize: '0.62rem', padding: '0.12rem 0.4rem' }}>
                  v2.4
                </span>
              </div>
              <span style={{ 
                fontSize: '0.7rem', 
                color: '#64748b', 
                fontWeight: 500,
                display: 'block',
                marginTop: '-2px',
                whiteSpace: 'nowrap'
              }}>
                Multilingual AI
              </span>
            </div>
          </div>

          {/* Divider */}
          {user && (
            <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} className="desktop-divider" />
          )}

          {/* Left-Side Dropdown Menu (Visible when Logged In) */}
          {user && (
            <div ref={dropdownRef} style={{ position: 'relative' }} className="desktop-dropdown-wrapper">
              
              {/* Dropdown Trigger Button */}
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: dropdownOpen ? '#eff6ff' : '#ffffff',
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!dropdownOpen) e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  if (!dropdownOpen) e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  background: currentItem.adminOnly ? '#0f172a' : '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CurrentIcon size={12} />
                </div>
                <span>{currentItem.label}</span>
                {currentItem.adminOnly && (
                  <span style={{
                    fontSize: '0.6rem',
                    background: '#0f172a',
                    color: '#38bdf8',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontWeight: 800
                  }}>
                    ADMIN
                  </span>
                )}
                <ChevronDown size={14} color="#64748b" style={{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }} />
              </button>

              {/* Floating Dropdown Panel */}
              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: '320px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(226, 232, 240, 0.6)',
                  padding: '8px',
                  zIndex: 2000,
                  animation: 'entranceFadeUp 0.2s ease forwards'
                }}>
                  <div style={{ padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Select Pipeline Module
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      const isAdminItem = item.id === 'admin';

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
                            background: isActive ? '#eff6ff' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'all 0.12s ease'
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
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: isActive 
                                ? (isAdminItem ? '#0f172a' : '#2563eb')
                                : (isAdminItem ? '#0f172a15' : '#f1f5f9'),
                              color: isActive 
                                ? (isAdminItem ? '#38bdf8' : '#ffffff') 
                                : (isAdminItem ? '#0f172a' : '#475569'),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Icon size={16} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  fontSize: '0.85rem',
                                  fontWeight: isActive ? 700 : 600,
                                  color: isActive ? '#2563eb' : '#0f172a'
                                }}>
                                  {item.label}
                                </span>
                                {isAdminItem && (
                                  <span style={{
                                    fontSize: '0.6rem',
                                    background: '#0f172a',
                                    color: '#38bdf8',
                                    padding: '1px 4px',
                                    borderRadius: '3px',
                                    fontWeight: 800
                                  }}>
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '1px' }}>
                                {item.desc}
                              </span>
                            </div>
                          </div>

                          {isActive && <Check size={16} color="#2563eb" style={{ flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Actions & User Account Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          
          {user ? (
            /* Logged-In User Profile & Sign Out */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                onClick={() => handleNavClick('admin')}
                title="Click to view Admin Console"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 12px 4px 6px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '30px',
                  boxShadow: 'var(--shadow-xs)',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: user.isAdmin ? 'linear-gradient(135deg, #0f172a, #334155)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
                    {user.name.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: user.isAdmin ? '#2563eb' : '#10b981', fontWeight: 600 }}>
                    {user.role || 'Enterprise User'}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="btn btn-ghost btn-sm"
                title="Sign Out"
                style={{ color: '#ef4444', padding: '6px 8px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            /* Clean Unauthenticated Switcher */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentView === 'register' ? (
                <button
                  onClick={() => handleNavClick('login')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 700, padding: '0.5rem 1rem' }}
                >
                  <LogIn size={15} />
                  <span>Sign In</span>
                </button>
              ) : currentView === 'login' ? (
                <button
                  onClick={() => handleNavClick('register')}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700, padding: '0.5rem 1rem' }}
                >
                  <UserPlus size={15} />
                  <span>Register</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleNavClick('register')}
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 700 }}
                  >
                    <UserPlus size={15} />
                    <span>Register</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('login')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontWeight: 700 }}
                  >
                    <LogIn size={15} />
                    <span>Log In</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle (Only when user is logged in) */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-ghost btn-sm mobile-menu-btn"
              style={{ padding: '6px', color: '#0f172a' }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Only for logged-in user) */}
      {user && mobileMenuOpen && (
        <div style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.95rem',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-divider {
            display: none !important;
          }
          .desktop-dropdown-wrapper {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
        @media (min-width: 641px) {
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
