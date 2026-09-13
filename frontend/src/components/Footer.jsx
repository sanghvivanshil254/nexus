import React from 'react';
import { FileSearch, CheckCircle2, Shield, Zap, Globe, Sparkles } from 'lucide-react';

export const Footer = ({ setCurrentView, user }) => {
  const handleProtectedNav = (view) => {
    if (user) {
      setCurrentView(view);
    } else {
      setCurrentView('login');
    }
  };
  return (
    <footer style={{
      background: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      marginTop: 'auto',
      paddingTop: '3.5rem',
      paddingBottom: '2.5rem',
      position: 'relative'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <FileSearch size={18} />
              </div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Nexus<span style={{ color: '#2563eb' }}>OCR</span>
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              High-precision Multilingual Document OCR & Key-Value Extraction Pipeline for enterprise workflows, invoices, passports, medical records, and contracts.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              fontSize: '0.75rem',
              color: '#065f46',
              fontWeight: 600
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Pipeline Cluster Active (99.98% SLA)
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pipeline Tools
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li>
                <button 
                  onClick={() => handleProtectedNav('dashboard')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', fontSize: '0.875rem', textAlign: 'left' }}
                  onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.color = '#64748b'}
                >
                  Interactive OCR Studio
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleProtectedNav('batch')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', fontSize: '0.875rem', textAlign: 'left' }}
                  onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.color = '#64748b'}
                >
                  Batch Extraction Queue
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleProtectedNav('history')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', fontSize: '0.875rem', textAlign: 'left' }}
                  onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.color = '#64748b'}
                >
                  Extraction History Logs
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleProtectedNav('apidocs')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', fontSize: '0.875rem', textAlign: 'left' }}
                  onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.color = '#64748b'}
                >
                  REST API & SDK Playground
                </button>
              </li>
            </ul>
          </div>

          {/* Supported Scripts */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Multilingual Engines
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Devanagari (हिन्दी)', 'Latin (EN/DE/ES/FR)', 'Arabic (العربية)', 'CJK (日本語/中文)', 'Cyrillic (Русский)', 'Dravidian (தமிழ்/తెలుగు)', 'Hangul (한국어)', 'Thai (ไทย)'].map((script, idx) => (
                <span 
                  key={idx} 
                  style={{
                    fontSize: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    color: '#475569'
                  }}
                >
                  {script}
                </span>
              ))}
            </div>
          </div>

          {/* Account & Security */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Access & Security
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li>
                <button 
                  onClick={() => setCurrentView('login')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' }}
                  onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.color = '#64748b'}
                >
                  User Login
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('register')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' }}
                  onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.color = '#64748b'}
                >
                  Create New Account
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('forgetpassword')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' }}
                  onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.color = '#64748b'}
                >
                  Password Recovery
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop: '1.5rem',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#94a3b8'
        }}>
          <div>
            © 2026 NexusOCR Inc. Multilingual Document AI Extraction Pipeline. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span>SOC2 Type II Certified</span>
            <span>GDPR Compliant</span>
            <span>ISO 27001</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
