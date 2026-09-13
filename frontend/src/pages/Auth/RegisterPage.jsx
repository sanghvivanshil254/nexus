import React, { useState } from 'react';
import { Mail, Lock, User, Building2, Briefcase, Eye, EyeOff, UserPlus, ArrowRight, ShieldCheck, Check, Sparkles, CheckCircle2, FileSearch, Zap, Cpu, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '../../components/Toast';

export const RegisterPage = ({ onRegisterSuccess, setCurrentView }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    organization: '',
    role: 'ML & Data Engineer',
    password: '',
    confirmPassword: '',
    acceptTerms: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Compute password strength score (0 to 4)
  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const strength = calculatePasswordStrength(formData.password);

  const getStrengthLabel = (s) => {
    switch (s) {
      case 0: return { text: 'None', color: '#cbd5e1', percent: 5 };
      case 1: return { text: 'Weak', color: '#ef4444', percent: 25 };
      case 2: return { text: 'Fair', color: '#f59e0b', percent: 50 };
      case 3: return { text: 'Good', color: '#3b82f6', percent: 75 };
      case 4: return { text: 'Strong (Enterprise Ready)', color: '#10b981', percent: 100 };
      default: return { text: 'Weak', color: '#cbd5e1', percent: 10 };
    }
  };

  const strengthInfo = getStrengthLabel(strength);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      addToast('Please complete all required fields', 'warning');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    if (!formData.acceptTerms) {
      addToast('Please accept the Terms of Service', 'warning');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}

      const registeredUser = {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        organization: formData.organization || 'Nexus AI Client',
        role: formData.role
      };

      addToast(`Registration successful! Please sign in with your credentials to continue.`, 'success');
      onRegisterSuccess(registeredUser);
    }, 700);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-split-card">
        
        {/* ================= LEFT COLUMN: REGISTRATION FORM ================= */}
        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
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
              <span>Free 14-Day Enterprise Trial</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem', letterSpacing: '-0.025em' }}>
              Create Your Account
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
              Start processing multilingual documents, invoices, and IDs in seconds.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="reg-name">Full Name *</label>
                <div className="input-wrapper">
                  <User size={16} className="input-icon" />
                  <input
                    id="reg-name"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="form-input input-with-icon"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="reg-email">Work Email *</label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@enterprise.com"
                    className="form-input input-with-icon"
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="reg-org">Organization</label>
                <div className="input-wrapper">
                  <Building2 size={16} className="input-icon" />
                  <input
                    id="reg-org"
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Acme Document AI"
                    className="form-input input-with-icon"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="reg-role">Role</label>
                <div className="input-wrapper">
                  <Briefcase size={16} className="input-icon" />
                  <select
                    id="reg-role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="form-select input-with-icon"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="ML & Data Engineer">ML & Data Engineer</option>
                    <option value="Super Admin">System Administrator (Admin)</option>
                    <option value="Document Specialist">Document Specialist</option>
                    <option value="Enterprise Architect">Enterprise Architect</option>
                    <option value="Developer">Software Developer</option>
                    <option value="Legal Analyst">Legal / Compliance Analyst</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="reg-pwd">Create Password *</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="reg-pwd"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 characters"
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

              {/* Password strength meter */}
              {formData.password && (
                <div style={{ marginTop: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px' }}>
                    <span style={{ color: '#64748b' }}>Strength:</span>
                    <span style={{ fontWeight: 700, color: strengthInfo.color }}>{strengthInfo.text}</span>
                  </div>
                  <div style={{ height: '3px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${strengthInfo.percent}%`,
                      background: strengthInfo.color,
                      transition: 'all 0.3s ease'
                    }} />
                  </div>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="reg-confirm-pwd">Confirm Password *</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="reg-confirm-pwd"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-type password"
                  className="form-input input-with-icon"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#475569' }}>
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                  style={{ accentColor: '#2563eb', width: '15px', height: '15px', marginTop: '2px', cursor: 'pointer' }}
                  required
                />
                <span>
                  I agree to the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a> &{' '}
                  <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-block btn-lg"
              style={{ fontWeight: 700 }}
            >
              {isLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <UserPlus size={17} />
                  <span>Register & Continue to Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Switch to login */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#64748b'
          }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setCurrentView('login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0
              }}
            >
              Sign In
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
              <span>Vision Transformer v2.4</span>
            </div>
            
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Multilingual Vision Intelligence
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>
              Universal layout analysis, table recognition, and entity parsing across 100+ international scripts.
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
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>LIVE INFERENCE STREAM</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>● 99.4% Confidence</span>
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
                <span style={{ color: '#93c5fd' }}>RECHNUNG-ID:</span>
                <strong style={{ color: '#ffffff' }}>RE-2026-88421</strong>
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
                <span style={{ color: '#a7f3d0' }}>VENDOR / FIRMA:</span>
                <strong style={{ color: '#ffffff' }}>Berlin Engineering GmbH</strong>
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
                <span style={{ color: '#fde68a' }}>TOTAL BETRAG:</span>
                <strong style={{ color: '#ffffff' }}>€ 5,527.55 EUR</strong>
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
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>LATENCY</span>
              <strong style={{ fontSize: '0.9rem', color: '#38bdf8' }}>420ms</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>SCRIPTS</span>
              <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>100+</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>COMPLIANCE</span>
              <strong style={{ fontSize: '0.9rem', color: '#10b981' }}>SOC2 / GDPR</strong>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
