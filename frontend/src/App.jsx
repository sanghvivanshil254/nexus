import React, { useState } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';

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

// Icons for Auth Top Bar & Mobile Trigger
import { FileSearch, Menu, UserPlus, LogIn } from 'lucide-react';

function AppContent() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nexus_ocr_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Default view is Home Overview ('landing') so anyone can translate right away without login
  const [currentView, setCurrentView] = useState('landing');

  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [showRegSuccessBanner, setShowRegSuccessBanner] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Step 1: User registers -> Transition to Login
  const handleRegisterSuccess = (registeredData) => {
    setPrefilledEmail(registeredData.email);
    setShowRegSuccessBanner(true);
    setCurrentView('login');
  };

  // Step 2: User logs in -> Transition to Home Page / Dashboard
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('nexus_ocr_user', JSON.stringify(userData));
    setShowRegSuccessBanner(false);
    
    if (userData.isAdmin) {
      setCurrentView('admin');
    } else {
      setCurrentView('landing');
    }
  };

  // User logs out
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nexus_ocr_user');
    setShowRegSuccessBanner(false);
    setCurrentView('login');
  };

  // Forgot password success -> Transition to Login
  const handlePasswordResetSuccess = (userData) => {
    if (userData?.email) setPrefilledEmail(userData.email);
    setCurrentView('login');
  };

  const isAuthView = ['register', 'login', 'forgetpassword'].includes(currentView);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      
      {/* 1. STANDING LEFT SIDEBAR (Rendered on all Main App Views for guests and logged-in users) */}
      {!isAuthView && (
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          user={user}
          onLogout={handleLogout}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />
      )}

      {/* 2. MAIN CONTENT AREA (Takes remaining width on the right) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Minimal Header for Auth Views (Register / Login / Forgot Password) */}
        {isAuthView && (
          <header style={{
            height: '70px',
            borderBottom: '1px solid #e2e8f0',
            background: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem'
          }}>
            <div 
              onClick={() => setCurrentView('register')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <div style={{
                width: '36px',
                height: '36px',
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

        {/* Mobile Header Bar (Only on small viewports when sidebar is collapsed) */}
        {!isAuthView && (
          <div style={{
            height: '60px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
            padding: '0 1.25rem',
            alignItems: 'center',
            justifyContent: 'space-between'
          }} className="mobile-header-bar">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px', color: '#0f172a' }}
            >
              <Menu size={22} />
            </button>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Nexus<span style={{ color: '#2563eb' }}>OCR</span>
            </span>
            <div style={{ width: '32px' }} />
          </div>
        )}

        {/* Main View Content */}
        <main style={{ flex: 1 }}>
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
            <AdminDashboard currentUser={user} />
          )}
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
