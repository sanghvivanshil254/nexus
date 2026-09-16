import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Nexus Component Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '3rem 1.5rem',
          maxWidth: '600px',
          margin: '3rem auto',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #fecaca',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.1)',
          textAlign: 'center',
          color: '#1e293b'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <AlertTriangle size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>
            OCR Studio Encountered an Issue
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {this.state.error?.message || 'A runtime error occurred while rendering the studio layout.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="btn btn-primary"
            style={{ fontWeight: 700 }}
          >
            <RefreshCw size={16} />
            <span>Reload OCR Studio</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
