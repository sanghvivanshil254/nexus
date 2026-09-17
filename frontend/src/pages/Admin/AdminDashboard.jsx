import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Server, 
  Activity, 
  Sliders, 
  Trash2, 
  Cpu, 
  HardDrive, 
  FileText,
  RefreshCw,
  Database,
  Terminal,
  Search,
  FileSearch,
  Globe2,
  CheckCircle2,
  Download,
  Eye,
  X,
  AlertTriangle,
  UserCheck,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Lock,
  Layers,
  LogIn
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { nexusApi } from '../../services/nexusApi';

export const AdminDashboard = ({ currentUser, setCurrentView }) => {
  const { addToast } = useToast();
  const { 
    isConnected: isBackendOnline, 
    device, 
    modelTier, 
    mongodbConnected, 
    loadedModels, 
    cachedModels, 
    offlineReady, 
    languageCount, 
    recheck, 
    isLoading 
  } = useBackendStatus();

  const [activeAdminTab, setActiveAdminTab] = useState('translations'); // Default to All Translations audit
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // Translations Audit State (Access to all translations, including guest)
  const [adminTranslations, setAdminTranslations] = useState([]);
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [translationSearch, setTranslationSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState('ALL'); // 'ALL' | 'GUEST' | 'USER'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'completed' | 'processing' | 'failed'
  const [inspectJob, setInspectJob] = useState(null);
  const [inspectPageNum, setInspectPageNum] = useState(1);

  // Registered Users: populated from active authenticated session only
  const [usersList, setUsersList] = useState(() => {
    const user = currentUser;
    if (user) {
      return [{
        id: 'usr-active',
        name: user.name || 'System Administrator',
        email: user.email || 'admin@nexusocr.ai',
        role: user.role || 'Super Admin',
        organization: user.organization || 'Nexus Deployment Cluster',
        status: 'Active',
        plan: 'Enterprise Unlimited',
        monthlyDocs: 0,
        joined: 'Active Session'
      }];
    }
    return [];
  });

  // Live session logs (appended by user actions in this session only)
  const [sessionLogs, setSessionLogs] = useState([]);

  // Pipeline Config
  const [pipelineConfig, setPipelineConfig] = useState({
    minConfidenceCutoff: 85,
    rateLimitPerMin: 1200
  });

  const handleToggleUserStatus = (id) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        addToast(`User ${u.name} status changed to ${nextStatus}`, 'info');
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleDeleteUser = (id, name) => {
    setUsersList(prev => prev.filter(u => u.id !== id));
    addToast(`User account ${name} removed`, 'info');
  };

  // Load all system translations (both registered and guest)
  const loadAdminTranslations = async () => {
    if (!currentUser?.isAdmin) return;
    setTranslationsLoading(true);
    try {
      const res = await nexusApi.adminGetAllJobs();
      if (res && Array.isArray(res.jobs)) {
        setAdminTranslations(res.jobs);
      }
    } catch (e) {
      console.warn('Failed to load admin translations:', e);
    } finally {
      setTranslationsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminTranslations();
  }, [currentUser]);

  const handleAdminDelete = async (jobId) => {
    if (!window.confirm(`Delete translation record and files for ${jobId}?`)) return;
    try {
      await nexusApi.adminDeleteJob(jobId);
      setAdminTranslations(prev => prev.filter(j => j.job_id !== jobId));
      addToast(`Translation ${jobId} deleted successfully`, 'success');
      if (inspectJob?.job_id === jobId) setInspectJob(null);
    } catch (e) {
      addToast(`Failed to delete: ${e.message}`, 'error');
    }
  };

  const handleAdminPurgeGuests = async () => {
    if (!window.confirm('Are you sure you want to purge all temporary guest translation files? This action cannot be undone.')) return;
    try {
      const res = await nexusApi.adminPurgeGuestJobs();
      setAdminTranslations(prev => prev.filter(j => !j.is_guest));
      addToast(res.message || 'Purged all temporary guest files', 'success');
    } catch (e) {
      addToast(`Failed to purge guests: ${e.message}`, 'error');
    }
  };

  const filteredTranslations = adminTranslations.filter(job => {
    const s = translationSearch.toLowerCase();
    const matchesSearch = !s || 
      (job.job_id && job.job_id.toLowerCase().includes(s)) ||
      (job.filename && job.filename.toLowerCase().includes(s)) ||
      (job.tgt_lang && job.tgt_lang.toLowerCase().includes(s)) ||
      (job.user_email && job.user_email.toLowerCase().includes(s));
    
    const matchesSession = sessionFilter === 'ALL' ||
      (sessionFilter === 'GUEST' && job.is_guest) ||
      (sessionFilter === 'USER' && !job.is_guest);

    const matchesStatus = statusFilter === 'ALL' || (job.status && job.status.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && matchesSession && matchesStatus;
  });

  const guestCount = adminTranslations.filter(j => j.is_guest).length;
  const userCount = adminTranslations.filter(j => !j.is_guest).length;
  const completedCount = adminTranslations.filter(j => j.status?.toLowerCase() === 'completed').length;

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          u.organization.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Strict 403 Gate: Block non-admins from viewing system administration console
  if (!currentUser?.isAdmin) {
    return (
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3.5rem 2rem', borderRadius: '24px', border: '1px solid #fee2e2', background: '#ffffff', boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.05)' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: '#fef2f2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 16px -2px rgba(239, 68, 68, 0.15)'
          }}>
            <Lock size={32} />
          </div>
          <span className="badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', marginBottom: '1rem', fontWeight: 700 }}>
            HTTP 403 · Access Denied
          </span>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            Administrator Privileges Required
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            The Admin Console and Global Translation Audit Log are restricted strictly to verified Super Administrators.
            Guest and standard user sessions cannot inspect system logs or global documents.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCurrentView ? setCurrentView('login') : null}
              className="btn btn-primary"
              style={{ fontWeight: 700, padding: '0.75rem 1.5rem', gap: '8px' }}
            >
              <LogIn size={16} />
              <span>Sign In as Super Admin</span>
            </button>
            <button
              onClick={() => setCurrentView ? setCurrentView('dashboard') : null}
              className="btn btn-secondary"
              style={{ fontWeight: 600, padding: '0.75rem 1.5rem' }}
            >
              Back to Translation Studio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      
      {/* Admin Top Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '1.75rem',
        boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
          }}>
            <ShieldCheck size={26} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                Pipeline Administration Console
              </h1>
              <span className="badge badge-primary" style={{ background: '#0f172a', color: '#38bdf8', border: '1px solid #334155' }}>
                Super Admin Access
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
              Real-time cluster telemetry, multilingual model orchestration, user roles, and security audit logs.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isBackendOnline ? '#ecfdf5' : '#fff7ed',
            border: `1px solid ${isBackendOnline ? '#a7f3d0' : '#ffedd5'}`,
            padding: '6px 12px',
            borderRadius: '10px',
            fontSize: '0.8rem',
            color: isBackendOnline ? '#065f46' : '#9a3412',
            fontWeight: 600
          }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: isBackendOnline ? '#10b981' : '#f97316', 
              display: 'inline-block',
              boxShadow: isBackendOnline ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none'
            }} />
            <span>{isBackendOnline ? `FastAPI: Online (${device?.toUpperCase() || 'CPU'}) | Tier: ${(modelTier || 'compact').toUpperCase()}` : 'Backend: Standalone Demo Mode'}</span>
          </div>

          <button
            onClick={() => {
              recheck();
              addToast('System telemetry and hardware status refreshed', 'success');
            }}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 12px' }}
          >
            <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '2rem',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'overview', label: 'Cluster Overview', icon: Activity },
          { id: 'translations', label: 'All Translations (Global Audit)', icon: FileSearch, count: adminTranslations.length },
          { id: 'users', label: 'User & Team Management', icon: Users, count: usersList.length },
          { id: 'models', label: 'Model Engines & Pipeline', icon: Cpu },
          { id: 'logs', label: 'Session Event Log', icon: FileText, count: sessionLogs.length },
          { id: 'quotas', label: 'API Quotas & Limits', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '10px 10px 0 0',
                border: 'none',
                background: isActive ? '#ffffff' : 'transparent',
                borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
                color: isActive ? '#2563eb' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={17} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isActive ? '#eff6ff' : '#f1f5f9',
                  color: isActive ? '#2563eb' : '#64748b',
                  fontWeight: 700
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: CLUSTER OVERVIEW & METRICS ================= */}
      {activeAdminTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Top KPI Cards */}
          <div className="metrics-grid">
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Supported Languages</span>
                <Globe2 size={18} color="#2563eb" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                {languageCount || 27}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                22 Indian + Global Languages
              </span>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Hardware Device</span>
                <Cpu size={18} color="#06b6d4" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                {device?.toUpperCase() || 'CPU'}
              </div>
              <span style={{ fontSize: '0.75rem', color: device === 'cuda' ? '#10b981' : '#64748b', fontWeight: 600 }}>
                {device === 'cuda' ? '⚡ GPU Acceleration Active' : 'CPU Processing Mode'}
              </span>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Active Model Tier</span>
                <Sparkles size={18} color="#f59e0b" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                {(modelTier || 'compact').toUpperCase()}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                {modelTier === 'best' ? '1B / 1.3B Parameter Best' : '200M / 600M Distilled Compact'}
              </span>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Persistence & Cache</span>
                <Database size={18} color="#4f46e5" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                {mongodbConnected ? 'MongoDB Live' : 'In-Memory Mode'}
              </div>
              <span style={{ fontSize: '0.75rem', color: mongodbConnected ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                {mongodbConnected ? 'Persistent Job & Translation Cache' : 'Ultra-fast RAM Cache Fallback'}
              </span>
            </div>
          </div>

          {/* Real-time Hardware Info from Backend */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '1.5rem'
          }}>
            {/* Backend System Info */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>
                Backend System Info
              </h3>
              {isBackendOnline ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                  {[
                    { label: 'Compute Device', value: device?.toUpperCase() || 'CPU', color: device === 'cuda' ? '#10b981' : '#64748b' },
                    { label: 'Model Tier', value: (modelTier || 'compact').toUpperCase(), color: '#f59e0b' },
                    { label: 'Supported Languages', value: `${languageCount || 0} languages`, color: '#2563eb' },
                    { label: 'Database', value: mongodbConnected ? 'MongoDB Connected' : 'In-Memory Cache', color: mongodbConnected ? '#10b981' : '#f59e0b' },
                    { label: 'Offline Models Cached', value: cachedModels.length > 0 ? `${cachedModels.length} model(s)` : 'None cached', color: cachedModels.length > 0 ? '#10b981' : '#94a3b8' },
                    { label: 'Models in VRAM', value: loadedModels.length > 0 ? `${loadedModels.length} loaded` : 'None loaded', color: loadedModels.length > 0 ? '#06b6d4' : '#94a3b8' }
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.6rem', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>{row.label}</span>
                      <strong style={{ color: row.color }}>{row.value}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                  <Server size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.88rem' }}>Backend is offline. Start the FastAPI server to see live system info.</p>
                </div>
              )}
            </div>

            {/* Active VRAM Models */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>
                Resident VRAM / RAM Models
              </h3>
              {loadedModels.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {loadedModels.map((m, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#ecfeff',
                      borderRadius: '8px',
                      border: '1px solid #a5f3fc',
                      fontSize: '0.82rem'
                    }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0891b2' }}>{m}</span>
                      <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>In Memory</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                  <Cpu size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.85rem' }}>No models currently loaded. Models load on-demand via LRU cache on first translation request.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: ALL TRANSLATIONS (GLOBAL AUDIT) ================= */}
      {activeAdminTab === 'translations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Top Audit Stats Cards */}
          <div className="metrics-grid">
            <div className="card" style={{ padding: '1.25rem 1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Translations</span>
                <FileSearch size={18} color="#2563eb" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
                {adminTranslations.length}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                Across entire system
              </span>
            </div>

            <div className="card" style={{ padding: '1.25rem 1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Guest Sessions</span>
                <Sparkles size={18} color="#8b5cf6" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6', marginBottom: '0.2rem' }}>
                {guestCount}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 600 }}>
                Anonymous ephemeral runs
              </span>
            </div>

            <div className="card" style={{ padding: '1.25rem 1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Registered Users</span>
                <UserCheck size={18} color="#059669" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginBottom: '0.2rem' }}>
                {userCount}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                Authenticated accounts
              </span>
            </div>

            <div className="card" style={{ padding: '1.25rem 1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Completed</span>
                <CheckCircle2 size={18} color="#10b981" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginBottom: '0.2rem' }}>
                {completedCount}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                {adminTranslations.length > 0 ? `${Math.round((completedCount / adminTranslations.length) * 100)}% Success Rate` : '100%'}
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px', width: '100%', minWidth: 'min(100%, 260px)' }}>
              <div className="input-wrapper" style={{ width: '100%' }}>
                <Search size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="Search by file name, Job ID, or email..."
                  value={translationSearch}
                  onChange={(e) => setTranslationSearch(e.target.value)}
                  className="form-input input-with-icon"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem 0.5rem 2.4rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Session:</span>
                <select
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                  className="form-select"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem', minWidth: '150px' }}
                >
                  <option value="ALL">All Sessions ({adminTranslations.length})</option>
                  <option value="GUEST">Guest Sessions ({guestCount})</option>
                  <option value="USER">Registered Users ({userCount})</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.8rem', minWidth: '130px' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <button
                onClick={() => {
                  loadAdminTranslations();
                  addToast('Refreshed global translations list', 'info');
                }}
                className="btn btn-secondary btn-sm"
                style={{ padding: '7px 12px', gap: '6px' }}
                title="Refresh Translations"
              >
                <RefreshCw size={14} style={{ animation: translationsLoading ? 'spin 1s linear infinite' : 'none' }} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleAdminPurgeGuests}
                className="btn btn-sm"
                style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontWeight: 600, padding: '7px 12px', gap: '6px' }}
                title="Purge all temporary guest session outputs"
              >
                <Trash2 size={14} />
                <span>Purge Guests</span>
              </button>
            </div>
          </div>

          {/* Translations Table */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden'
          }}>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>JOB ID & SESSION</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>DOCUMENT</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>LANGUAGE</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>PAGES & PROGRESS</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>STATUS</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>ADMIN ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTranslations.length > 0 ? (
                    filteredTranslations.map((job) => {
                      const isGuest = job.is_guest;
                      const isDone = job.status === 'completed';
                      return (
                        <tr
                          key={job.job_id}
                          style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Job ID & Session Type */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                                {job.job_id}
                              </span>
                              {isGuest ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.7rem',
                                  padding: '1px 7px',
                                  borderRadius: '6px',
                                  background: '#f5f3ff',
                                  color: '#7c3aed',
                                  border: '1px solid #ddd6fe',
                                  fontWeight: 600,
                                  width: 'fit-content'
                                }}>
                                  <Sparkles size={11} />
                                  <span>Guest Session</span>
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.7rem',
                                  padding: '1px 7px',
                                  borderRadius: '6px',
                                  background: '#eff6ff',
                                  color: '#2563eb',
                                  border: '1px solid #bfdbfe',
                                  fontWeight: 600,
                                  width: 'fit-content'
                                }}>
                                  <UserCheck size={11} />
                                  <span>{job.user_email || 'Authenticated User'}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Document Name & Size */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                              <div style={{ minWidth: 0, maxWidth: '240px' }}>
                                <span style={{ fontWeight: 600, color: '#0f172a', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={job.filename}>
                                  {job.filename}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                  {job.file_size ? `${(job.file_size / (1024 * 1024)).toFixed(2)} MB` : '–'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Languages */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                {job.src_lang || 'en'}
                              </span>
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>&rarr;</span>
                              <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                {job.tgt_lang || 'gu'}
                              </span>
                            </div>
                          </td>

                          {/* Pages & Progress */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ minWidth: '120px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '3px' }}>
                                <span>Pages: {job.completed_pages || job.total_pages || 1} / {job.total_pages || 1}</span>
                                <span>{Math.round(job.progress || (isDone ? 100 : 0))}%</span>
                              </div>
                              <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%',
                                  width: `${Math.round(job.progress || (isDone ? 100 : 0))}%`,
                                  background: isDone ? '#10b981' : '#2563eb',
                                  borderRadius: '4px',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '12px 16px' }}>
                            <span className={`badge ${isDone ? 'badge-success' : job.status === 'failed' ? 'badge-danger' : 'badge-primary'}`}>
                              {(job.status || 'PENDING').toUpperCase()}
                            </span>
                          </td>

                          {/* Admin Action Buttons */}
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                onClick={() => {
                                  setInspectJob(job);
                                  setInspectPageNum(1);
                                }}
                                className="btn btn-ghost btn-sm"
                                title="Inspect Rendered Pages"
                                style={{ color: '#2563eb', padding: '5px 8px', gap: '4px' }}
                              >
                                <Eye size={14} />
                                <span>Inspect</span>
                              </button>

                              {job.has_output && (
                                <button
                                  onClick={() => nexusApi.downloadTranslatedPdf(job.job_id, `admin_export_${job.filename}`)}
                                  className="btn btn-ghost btn-sm"
                                  title="Download Translated PDF"
                                  style={{ color: '#059669', padding: '5px 8px', gap: '4px' }}
                                >
                                  <Download size={14} />
                                  <span>PDF</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleAdminDelete(job.job_id)}
                                className="btn btn-ghost btn-sm"
                                title="Delete Translation Record and Files"
                                style={{ color: '#ef4444', padding: '5px 8px' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                        No translation logs matching current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Inspection Modal for Admin */}
          {inspectJob && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1.5rem'
            }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
              }}>
                {/* Modal Header */}
                <div style={{
                  padding: '1.25rem 1.75rem',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: inspectJob.is_guest ? '#f5f3ff' : '#eff6ff',
                      color: inspectJob.is_guest ? '#7c3aed' : '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileSearch size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {inspectJob.filename}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{inspectJob.job_id}</span>
                        <span>&bull;</span>
                        <span>{inspectJob.is_guest ? 'Guest Session' : inspectJob.user_email}</span>
                        <span>&bull;</span>
                        <span>{(inspectJob.src_lang || 'en').toUpperCase()} &rarr; {(inspectJob.tgt_lang || 'gu').toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setInspectJob(null)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body: Page Navigation & Preview Canvas */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Page Selector Toolbar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    background: '#f1f5f9',
                    borderRadius: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setInspectPageNum(p => Math.max(1, p - 1))}
                        disabled={inspectPageNum <= 1}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px' }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        Page {inspectPageNum} of {inspectJob.total_pages || 1}
                      </span>
                      <button
                        onClick={() => setInspectPageNum(p => Math.min(inspectJob.total_pages || 1, p + 1))}
                        disabled={inspectPageNum >= (inspectJob.total_pages || 1)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px' }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {inspectJob.has_output && (
                        <button
                          onClick={() => nexusApi.downloadTranslatedPdf(inspectJob.job_id, `translated_${inspectJob.filename}`)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '5px 12px', gap: '6px' }}
                        >
                          <Download size={14} />
                          <span>Download Output PDF</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rendered Preview Image Container */}
                  <div style={{
                    minHeight: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#e2e8f0',
                    borderRadius: '12px',
                    padding: '1rem',
                    overflow: 'auto'
                  }}>
                    <img
                      src={`http://127.0.0.1:8000/api/jobs/${inspectJob.job_id}/pages/${inspectPageNum}/rendered?t=${Date.now()}`}
                      alt={`Rendered Page ${inspectPageNum}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '520px',
                        objectFit: 'contain',
                        borderRadius: '6px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        background: '#ffffff'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallbackEl = e.target.parentElement.querySelector('.preview-error');
                        if (fallbackEl) fallbackEl.style.display = 'block';
                      }}
                    />
                    <div className="preview-error" style={{ display: 'none', textAlign: 'center', color: '#64748b' }}>
                      <AlertTriangle size={32} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.9rem', margin: 0 }}>Rendered page image preview not yet generated or file was deleted.</p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={{
                  padding: '1rem 1.75rem',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc'
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Output: {inspectJob.output_file || 'In-Memory Pipeline'}
                  </span>
                  <button
                    onClick={() => setInspectJob(null)}
                    className="btn btn-secondary btn-sm"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= TAB 2: USER & TEAM MANAGEMENT ================= */}
      {activeAdminTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* User Filter Toolbar */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div className="input-wrapper" style={{ flex: 1, minWidth: '260px' }}>
              <Search size={16} className="input-icon" />
              <input
                type="text"
                placeholder="Search user by name, email, or organization..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="form-input input-with-icon"
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Role Filter:</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.8rem' }}
              >
                <option value="ALL">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="ML Engineer">ML Engineer</option>
                <option value="Document Specialist">Document Specialist</option>
                <option value="Legal Analyst">Legal Analyst</option>
                <option value="Developer">Developer</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.88rem',
                textAlign: 'left'
              }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>USER</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>ROLE</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>ORGANIZATION</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>STATUS</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>PLAN / USAGE</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: u.role === 'Super Admin' ? 'linear-gradient(135deg, #0f172a, #334155)' : 'linear-gradient(135deg, #2563eb, #06b6d4)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                          }}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>{u.name}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span className={`badge ${u.role === 'Super Admin' ? 'badge-primary' : 'badge-neutral'}`}>
                          {u.role}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#475569' }}>
                        {u.organization}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span className={`badge ${u.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                          {u.status}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{u.plan}</div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.monthlyDocs.toLocaleString()} docs this month</span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => handleToggleUserStatus(u.id)}
                            className="btn btn-secondary btn-sm"
                            title="Toggle Active / Suspended"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            {u.status === 'Active' ? 'Suspend' : 'Activate'}
                          </button>
                          
                          {u.role !== 'Super Admin' && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="btn btn-ghost btn-sm"
                              title="Delete User"
                              style={{ color: '#ef4444', padding: '4px 6px' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: MODEL ENGINES & PIPELINE CONFIG ================= */}
      {activeAdminTab === 'models' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Real Backend Model Cache & Hardware Offloader Telemetry Card */}
          <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    Local Offline Model Cache & VRAM Offloader
                  </h3>
                  <span className={`badge ${offlineReady ? 'badge-success' : 'badge-neutral'}`}>
                    {offlineReady ? 'OFFLINE READY' : 'ONLINE INGEST'}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Locally downloaded neural weights in <code>backend/models/</code> and dynamic GPU/CPU offload status.
                </p>
              </div>

              <button
                onClick={() => {
                  recheck();
                  addToast('Refreshed model cache status from disk', 'info');
                }}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
                <span>Scan Models Dir</span>
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              {/* Cached Models on Disk */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <HardDrive size={16} color="#2563eb" />
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Offline Weights Directory</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 'auto' }}>({cachedModels.length} cached)</span>
                </div>
                {cachedModels.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {cachedModels.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.78rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0f172a' }}>{m}</span>
                        <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Cached</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                    <span>No local model folders found in <code>backend/models/</code>. Run CLI to download weights:</span>
                    <pre style={{ margin: '6px 0 0', padding: '6px 8px', background: '#0f172a', color: '#38bdf8', borderRadius: '6px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                      python backend/scripts/download_models.py --model indictrans2 --tier compact --direction en-indic
                    </pre>
                  </div>
                )}
              </div>

              {/* VRAM Loaded Models */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Cpu size={16} color="#06b6d4" />
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Resident VRAM / RAM Models</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 'auto' }}>({loadedModels.length} active)</span>
                </div>
                {loadedModels.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {loadedModels.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#ecfeff', borderRadius: '6px', fontSize: '0.78rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0891b2' }}>{m}</span>
                        <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>In Memory</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                    No models currently loaded in memory. Models are loaded on-demand via LRU cache on first translation request.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pre-Processing Pipeline Sliders */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>
              Global Pre-Processing & Confidence Thresholds
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  Minimum Confidence Cutoff ({pipelineConfig.minConfidenceCutoff}%)
                </label>
                <input
                  type="range" min="60" max="99"
                  value={pipelineConfig.minConfidenceCutoff}
                  onChange={(e) => setPipelineConfig({ ...pipelineConfig, minConfidenceCutoff: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Extractions below this threshold are flagged for human-in-the-loop review.</span>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  Global API Rate Limit ({pipelineConfig.rateLimitPerMin} req/min)
                </label>
                <input
                  type="range" min="200" max="5000" step="100"
                  value={pipelineConfig.rateLimitPerMin}
                  onChange={(e) => setPipelineConfig({ ...pipelineConfig, rateLimitPerMin: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Prevents GPU saturation during burst document ingest queues.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: SESSION EVENT LOG ================= */}
      {activeAdminTab === 'logs' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Session Event Log
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Actions performed in this admin session. Logs are cleared on page refresh.
              </p>
            </div>
            <button
              onClick={() => {
                const entry = { id: `log-${Date.now()}`, timestamp: new Date().toLocaleTimeString(), level: 'INFO', module: 'ADMIN', message: 'Backend health status manually refreshed.' };
                setSessionLogs(prev => [entry, ...prev]);
                recheck();
                addToast('Backend status refreshed', 'info');
              }}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw size={14} />
              <span>Refresh Backend</span>
            </button>
          </div>

          <div style={{
            background: '#0f172a',
            borderRadius: '12px',
            padding: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: '#e2e8f0',
            maxHeight: '400px',
            minHeight: '120px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {sessionLogs.length === 0 ? (
              <div style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={14} />
                <span>No events yet this session. Perform actions above to see log entries here.</span>
              </div>
            ) : (
              sessionLogs.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#64748b' }}>[{log.timestamp}]</span>
                  <span style={{ color: log.level === 'WARN' ? '#f59e0b' : log.level === 'ERROR' ? '#ef4444' : '#10b981', fontWeight: 700 }}>[{log.level}]</span>
                  <span style={{ color: '#38bdf8' }}>[{log.module}]</span>
                  <span style={{ color: '#f8fafc', flex: 1 }}>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 5: API QUOTAS & LIMITS ================= */}
      {activeAdminTab === 'quotas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
              Enterprise Plan
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Unlimited OCR concurrency, dedicated GPU affinity, 99.99% uptime guarantee.
            </p>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.5rem' }}>
              Unlimited Pages / Month
            </div>
            <span className="badge badge-success">Contact for pricing</span>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
              Standard Team Tier
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Up to 10,000 document pages/mo, 10 concurrent batch slots, standard support.
            </p>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              10,000 Pages / Month
            </div>
            <span className="badge badge-primary">Team plan</span>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
              Evaluation / Trial Tier
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              500 free pages for new registered users, 14-day duration, shared queue.
            </p>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem' }}>
              500 Pages (14 Days)
            </div>
            <span className="badge badge-warning">Auto-provisions upon signup</span>
          </div>
        </div>
      )}

    </div>
  );
};
