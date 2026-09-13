import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Shield, User, Cpu, FileSearch } from 'lucide-react';
import { useToast } from '../../components/Toast';

export const LoginPage = ({ onLoginSuccess, setCurrentView, initialEmail, registrationSuccessBanner }) => {
  const { addToast } = useToast();
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password', 'warning');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const isAdmin = email.toLowerCase().includes('admin');
      const user = {
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        email: email,
        organization: 'Enterprise AI Lab',
        role: isAdmin ? 'Super Admin' : 'ML & Data Engineer',
        isAdmin: isAdmin
      };
      addToast(`Logged in successfully! Welcome, ${user.name}.`, 'success');
      onLoginSuccess(user);
    }, 550);
  };

  // Quick 1-Click User Login
  const handleQuickUserLogin = () => {
    setEmail('alex.morgan@nexusocr.ai');
    setPassword('PipelineSecure2026!');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const user = {
        name: 'Dr. Alex Morgan',
        email: 'alex.morgan@nexusocr.ai',
        organization: 'Global Document Analytics Inc.',
        role: 'Lead ML Engineer',
        isAdmin: false
      };
      addToast('Signed in as Regular User (Lead ML Engineer)', 'success');
      onLoginSuccess(user);
    }, 400);
  };

  // Quick 1-Click Admin Login
  const handleQuickAdminLogin = () => {
    setEmail('admin.root@nexusocr.ai');
    setPassword('AdminSuperKey2026#');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const adminUser = {
        name: 'System Super Admin',
        email: 'admin.root@nexusocr.ai',
        organization: 'Nexus Cluster HQ',
        role: 'Super Admin',
        isAdmin: true
      };
      addToast('Signed in as Super Administrator (Admin Access Enabled)', 'success');
      onLoginSuccess(adminUser);
    }, 400);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-split-card">
        
        {/* ================= LEFT COLUMN: LOGIN FORM ================= */}
        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {/* Registration Success Alert Banner */}
          {registrationSuccessBanner && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '10px 14px',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: '#065f46',
              fontWeight: 600,
              animation: 'entranceFadeUp 0.3s ease'
            }}>
              <CheckCircle2 size={18} color="#10b981" />
              <span>Account registered! Please sign in below to enter your workspace.</span>
            </div>
          )}

          {/* Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '0.75rem'
            }}>
              <Sparkles size={13} />
              <span>Enterprise OCR Workspace</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem', letterSpacing: '-0.025em' }}>
              Welcome Back
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
              Sign in to manage multilingual models, batch queues, and extraction APIs.
            </p>
          </div>

          {/* 1-Click Fast Demo Logins */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={handleQuickUserLogin}
              className="btn btn-secondary btn-sm"
              style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                color: '#2563eb',
                fontWeight: 600,
                padding: '0.6rem 0.5rem',
                fontSize: '0.78rem'
              }}
            >
              <User size={14} />
              <span>Demo User Login</span>
            </button>

            <button
              type="button"
              onClick={handleQuickAdminLogin}
              className="btn btn-secondary btn-sm"
              style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                color: '#0f172a',
                fontWeight: 700,
                padding: '0.6rem 0.5rem',
                fontSize: '0.78rem'
              }}
            >
              <Shield size={14} color="#2563eb" />
              <span>Demo Admin Login</span>
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '1.25rem',
            color: '#94a3b8',
            fontSize: '0.78rem'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span>or sign in with email</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="login-email">Work Email</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="form-input input-with-icon"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => setCurrentView('forgetpassword')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="form-input input-with-icon input-with-icon-right"
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#475569' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#2563eb', width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-block btn-lg"
              style={{ fontWeight: 700 }}
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn size={17} />
                  <span>Sign In to Workspace</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#64748b'
          }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setCurrentView('register')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0
              }}
            >
              Register Here
            </button>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: CLASSY LIVE PIPELINE SHOWCASE ================= */}
        <div className="auth-side-panel" style={{
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-20%',
            right: '-20%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Top Info */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.75rem',
              color: '#38bdf8',
              fontWeight: 600,
              marginBottom: '1.25rem'
            }}>
              <Cpu size={13} />
              <span>Multi-Script Engine v2.4</span>
            </div>
            
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Sub-second Document Processing
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>
              Enterprise OCR pipeline trusted by healthcare, finance, logistics, and legal institutions worldwide.
            </p>
          </div>

          {/* Live Laser Scanning Card Demonstration */}
          <div style={{
            margin: '1.5rem 0',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Elegant Scanning Laser */}
            <div className="scan-laser" style={{
              background: 'linear-gradient(90deg, transparent, #38bdf8, #818cf8, #38bdf8, transparent)',
              boxShadow: '0 0 12px 2px rgba(56, 189, 248, 0.6)'
            }} />

            {/* Document Header preview */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '0.5rem',
              marginBottom: '0.75rem',
              fontSize: '0.75rem'
            }}>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>DEVANAGARI / HINDI STREAM</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>● 98.9% Confidence</span>
            </div>

            {/* Simulated Live OCR Entities */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                background: 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#93c5fd' }}>PATIENT (मरीज):</span>
                <strong style={{ color: '#ffffff' }}>राजेश कुमार शर्मा</strong>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#a7f3d0' }}>DIAGNOSIS (निदान):</span>
                <strong style={{ color: '#ffffff' }}>तीव्र कोरोनरी सिंड्रोम</strong>
              </div>

              <div style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#fde68a' }}>REG / UHID:</span>
                <strong style={{ color: '#ffffff' }}>AP-2026-90812</strong>
              </div>
            </div>
          </div>

          {/* Bottom Telemetry Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '1rem',
            textAlign: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>THROUGHPUT</span>
              <strong style={{ fontSize: '0.9rem', color: '#38bdf8' }}>10k/min</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>ACCURACY</span>
              <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>99.4%</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>SECURITY</span>
              <strong style={{ fontSize: '0.9rem', color: '#10b981' }}>HIPAA / SOC2</strong>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
