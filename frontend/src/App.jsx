import React, { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';

// Auth Pages
import { RegisterPage } from './pages/Auth/RegisterPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { ForgotPasswordPage } from './pages/Auth/ForgotPasswordPage';

// Main App & Dashboard Pages
import { LandingPage } from './pages/LandingPage';
import { OcrPipelineDashboard } from './pages/Dashboard/OcrPipelineDashboard';
import { BatchProcessor } from './pages/Dashboard/BatchProcessor';
import { HistoryPage } from './pages/Dashboard/HistoryPage';
import { ApiDocsPage } from './pages/Dashboard/ApiDocsPage';

// Admin Console Page
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { AnimatedHamburger } from './components/AnimatedHamburger';

// Icons for Auth Top Bar & Mobile Trigger
import { FileSearch, Menu, UserPlus, LogIn } from 'lucide-react';

function AppContent() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nexus_ocr_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Root view is OCR Studio Workbench ('dashboard') by default
  const [currentView, setCurrentView] = useState('dashboard');

  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [showRegSuccessBanner, setShowRegSuccessBanner] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // If user is guest, restrict views to translation studio ('dashboard') or auth pages
  useEffect(() => {
    if (!user && !['dashboard', 'login', 'register', 'forgetpassword'].includes(currentView)) {
      setCurrentView('dashboard');
    }
  }, [user, currentView]);

  // Step 1: User registers -> Transition to Login
  const handleRegisterSuccess = (registeredData) => {
    setPrefilledEmail(registeredData.email);
    setShowRegSuccessBanner(true);
    setCurrentView('login');
  };

  // Step 2: User logs in -> Transition to Dashboard (or Admin Console if admin)
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('nexus_ocr_user', JSON.stringify(userData));
    setShowRegSuccessBanner(false);
    
    if (userData.isAdmin) {
      setCurrentView('admin');
    } else {
      setCurrentView('dashboard');
    }
  };

  // User logs out -> Return to clean guest Translation Studio
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nexus_ocr_user');
    setShowRegSuccessBanner(false);
    setCurrentView('dashboard');
  };

  // Forgot password success -> Transition to Login
  const handlePasswordResetSuccess = (userData) => {
    if (userData?.email) setPrefilledEmail(userData.email);
    setCurrentView('login');
  };

  const isAuthView = ['register', 'login', 'forgetpassword'].includes(currentView);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      
      {/* 1. STANDING LEFT SIDEBAR (Only rendered for logged-in users, never for guests) */}
      {user && !isAuthView && (
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          user={user}
          onLogout={handleLogout}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      )}

      {/* 2. MAIN CONTENT AREA (Takes remaining width on the right, or 100% for guests) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Minimal Header for Auth Views (Register / Login / Forgot Password) */}
        {isAuthView && (
          <header style={{
            height: '64px',
            borderBottom: '1px solid #e2e8f0',
            background: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem'
          }}>
            <div 
              onClick={() => setCurrentView('dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              title="Return to Translation Studio"
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
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

            <div>
              {currentView === 'register' ? (
                <button
                  onClick={() => setCurrentView('login')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  <LogIn size={15} />
                  <span>Sign In</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView('register')}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  <UserPlus size={15} />
                  <span>Create Account</span>
                </button>
              )}
            </div>
          </header>
        )}

        {/* Clean Guest Top Header (Like ChatGPT: Brand on left, Log In & Sign Up on right) */}
        {!user && !isAuthView && (
          <header style={{
            height: '64px',
            borderBottom: '1px solid #e2e8f0',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 clamp(1rem, 3vw, 2.5rem)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
          }}>
            <div 
              onClick={() => setCurrentView('dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              title="NexusOCR Translation Studio"
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
              }}>
                <FileSearch size={19} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                  Nexus<span style={{ color: '#2563eb' }}>OCR</span>
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>
                  Offline Neural Document AI
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setCurrentView('login')}
                className="btn btn-secondary btn-sm"
                style={{ 
                  fontWeight: 600, 
                  padding: '0.45rem 1rem', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  borderRadius: '9px',
                  fontSize: '0.85rem'
                }}
                title="Sign in to your account"
              >
                <LogIn size={15} />
                <span>Log in</span>
              </button>
              <button
                onClick={() => setCurrentView('register')}
                className="btn btn-primary btn-sm"
                style={{ 
                  fontWeight: 700, 
                  padding: '0.45rem 1.15rem', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  borderRadius: '9px',
                  fontSize: '0.85rem'
                }}
                title="Create a free account"
              >
                <UserPlus size={15} />
                <span>Sign up</span>
              </button>
            </div>
          </header>
        )}

        {/* Mobile Header Bar (Only rendered for LOGGED-IN users on small screens to toggle the sidebar) */}
        {user && !isAuthView && (
          <div style={{
            height: '60px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
            padding: '0 1.25rem',
            alignItems: 'center',
            justifyContent: 'space-between'
          }} className="mobile-header-bar">
            <AnimatedHamburger
              isOpen={isMobileSidebarOpen}
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              title={isMobileSidebarOpen ? "Close navigation" : "Open navigation"}
            />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Nexus<span style={{ color: '#2563eb' }}>OCR</span>
            </span>
            <div style={{ width: '36px' }} />
          </div>
        )}

        {/* Main View Content */}
        <main style={{ flex: 1 }}>
          <ErrorBoundary>
            {/* Step 1: Register */}
            {currentView === 'register' && (
              <RegisterPage
                onRegisterSuccess={handleRegisterSuccess}
                setCurrentView={setCurrentView}
              />
            )}

            {/* Step 2: Login */}
            {currentView === 'login' && (
              <LoginPage
                onLoginSuccess={handleLoginSuccess}
                setCurrentView={setCurrentView}
                initialEmail={prefilledEmail}
                registrationSuccessBanner={showRegSuccessBanner}
              />
            )}

            {/* Forgot Password */}
            {currentView === 'forgetpassword' && (
              <ForgotPasswordPage
                setCurrentView={setCurrentView}
                onPasswordResetSuccess={handlePasswordResetSuccess}
              />
            )}

            {/* Step 3: Home Landing Page */}
            {currentView === 'landing' && (
              <LandingPage setCurrentView={setCurrentView} user={user} />
            )}

            {/* OCR Studio Workbench */}
            {currentView === 'dashboard' && (
              <OcrPipelineDashboard user={user} />
            )}

            {/* Batch Queue */}
            {currentView === 'batch' && (
              <BatchProcessor />
            )}

            {/* Extraction History */}
            {currentView === 'history' && (
              <HistoryPage setCurrentView={setCurrentView} user={user} />
            )}

            {/* Developer REST API & Docs */}
            {currentView === 'apidocs' && (
              <ApiDocsPage user={user} />
            )}

            {/* Dedicated Admin Console */}
            {currentView === 'admin' && (
              <AdminDashboard currentUser={user} setCurrentView={setCurrentView} />
            )}
          </ErrorBoundary>
        </main>

        {/* Footer is only rendered on the Home Overview page, hidden on all other pages */}
        {currentView === 'landing' && (
          <Footer setCurrentView={setCurrentView} user={user} />
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .mobile-header-bar {
            display: flex !important;
          }
        }
        @media (min-width: 901px) {
          .mobile-header-bar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
