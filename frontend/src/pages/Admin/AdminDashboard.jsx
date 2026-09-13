import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Server, 
  Activity, 
  Settings, 
  Sliders, 
  ToggleLeft, 
  ToggleRight, 
  Key, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Cpu, 
  HardDrive, 
  Globe2, 
  Lock, 
  Eye, 
  FileText,
  BarChart3,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Database,
  Terminal
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { nexusApi } from '../../services/nexusApi';

export const AdminDashboard = ({ currentUser }) => {
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

  const [activeAdminTab, setActiveAdminTab] = useState('overview'); // overview, users, models, logs, quotas
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // Registered Users Mock State
  const [usersList, setUsersList] = useState([
    {
      id: 'usr-1',
      name: 'Dr. Alex Morgan',
      email: 'alex.morgan@nexusocr.ai',
      role: 'Super Admin',
      organization: 'Nexus Core AI Team',
      status: 'Active',
      plan: 'Enterprise Unlimited',
      monthlyDocs: 14200,
      joined: '12 Jan 2026'
    },
    {
      id: 'usr-2',
      name: 'Sarah Chen',
      email: 'sarah.chen@fintechcorp.de',
      role: 'ML Engineer',
      organization: 'Fintech Global DE',
      status: 'Active',
      plan: 'Enterprise Pro',
      monthlyDocs: 8450,
      joined: '02 Feb 2026'
    },
    {
      id: 'usr-3',
      name: 'Rajesh Sharma',
      email: 'rajesh.sharma@delhihealth.in',
      role: 'Document Specialist',
      organization: 'Apollo Medical Delhi',
      status: 'Active',
      plan: 'Enterprise Pro',
      monthlyDocs: 6120,
      joined: '18 Feb 2026'
    },
    {
      id: 'usr-4',
      name: 'Elena Gómez',
      email: 'elena.gomez@notariosmadrid.es',
      role: 'Legal Analyst',
      organization: 'Colegio Notarial Madrid',
      status: 'Active',
      plan: 'Standard Tier',
      monthlyDocs: 1950,
      joined: '25 Feb 2026'
    },
    {
      id: 'usr-5',
      name: 'Tariq Al-Mansouri',
      email: 'tariq.mansouri@dubai-ai.ae',
      role: 'Developer',
      organization: 'Nexus AI Solutions LLC',
      status: 'Pending',
      plan: 'Evaluation Trial',
      monthlyDocs: 320,
      joined: '08 Mar 2026'
    }
  ]);

  // Model Engine Switches
  const [modelEngines, setModelEngines] = useState([
    { id: 'eng-latin', name: 'Latin Extended OCR (EN, DE, ES, FR)', status: true, gpu: 'Node A100 #1', latency: '42ms', accuracy: '99.6%' },
    { id: 'eng-devanagari', name: 'Devanagari OCR (Hindi, Marathi)', status: true, gpu: 'Node A100 #2', latency: '58ms', accuracy: '98.9%' },
    { id: 'eng-arabic', name: 'Arabic RTL OCR & Bi-directional Parser', status: true, gpu: 'Node A100 #3', latency: '51ms', accuracy: '99.1%' },
    { id: 'eng-cjk', name: 'CJK Ideograph OCR (Japanese, Chinese)', status: true, gpu: 'Node A100 #4', latency: '64ms', accuracy: '99.3%' },
    { id: 'eng-ner', name: 'Semantic Named Entity Recognizer (NER)', status: true, gpu: 'Node V100 #1', latency: '28ms', accuracy: '99.4%' },
    { id: 'eng-table', name: 'Deep Table Structure & Borderless Grid Parser', status: true, gpu: 'Node V100 #2', latency: '35ms', accuracy: '99.0%' }
  ]);

  // Pipeline Config
  const [pipelineConfig, setPipelineConfig] = useState({
    autoDeskew: true,
    binarizationThreshold: 128,
    minConfidenceCutoff: 85,
    autoLanguageDetect: true,
    enableColdStorageBackup: true,
    rateLimitPerMin: 1200
  });

  // System Logs
  const [systemLogs, setSystemLogs] = useState([
    { id: 'log-101', timestamp: '11:42:01', level: 'INFO', module: 'OCR_ENGINE', message: 'Batch extraction completed: 18 pages (Hindi Medical Summary) in 480ms.' },
    { id: 'log-102', timestamp: '11:41:25', level: 'INFO', module: 'AUTH', message: 'User login verified: alex.morgan@nexusocr.ai (Session Token issued).' },
    { id: 'log-103', timestamp: '11:38:10', level: 'WARN', module: 'GPU_CLUSTER', message: 'Node A100 #4 VRAM utilization reached 78% during CJK batch load.' },
    { id: 'log-104', timestamp: '11:35:44', level: 'INFO', module: 'TRANSLATE', message: 'Neural Translation executed: German to English (4,645 tokens).' },
    { id: 'log-105', timestamp: '11:30:12', level: 'INFO', module: 'CONFIG', message: 'Confidence threshold updated to 85% by Super Admin.' }
  ]);

  const toggleModelEngine = (id) => {
    setModelEngines(prev => prev.map(eng => {
      if (eng.id === id) {
        const nextState = !eng.status;
        addToast(`${eng.name} is now ${nextState ? 'ENABLED' : 'DISABLED'}`, nextState ? 'success' : 'warning');
        return { ...eng, status: nextState };
      }
      return eng;
    }));
  };

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

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          u.organization.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

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
          { id: 'overview', label: 'Cluster Overview & Metrics', icon: Activity },
          { id: 'users', label: 'User & Team Management', icon: Users, count: usersList.length },
          { id: 'models', label: 'Model Engines & Pipeline', icon: Cpu, count: modelEngines.length },
          { id: 'logs', label: 'Security & Telemetry Logs', icon: FileText, count: systemLogs.length },
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem'
          }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Supported Languages</span>
                <Globe2 size={18} color="#2563eb" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                {languageCount || 41}
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

          {/* Script Processing Distribution & Cluster Health */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Script Breakdown */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>
                Multilingual Script Traffic (Last 30 Days)
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { name: 'Latin Scripts (English, German, Spanish, French)', percent: 45, count: '66,730 docs', color: '#2563eb' },
                  { name: 'Devanagari (Hindi, Marathi Medical & Gov)', percent: 24, count: '35,580 docs', color: '#10b981' },
                  { name: 'CJK Ideographs (Japanese, Chinese Corporate)', percent: 18, count: '26,690 docs', color: '#f59e0b' },
                  { name: 'Arabic RTL (Emirates ID, Passports, Contracts)', percent: 13, count: '19,290 docs', color: '#06b6d4' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{item.name}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.percent}% ({item.count})</span>
                    </div>
                    <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.percent}%`, height: '100%', background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GPU Node Telemetry */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>
                GPU Node Cluster Telemetry
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[
                  { node: 'A100-Node-01 (Latin Engine)', vram: '42%', temp: '54°C', load: '38%', status: 'Optimal' },
                  { node: 'A100-Node-02 (Devanagari Engine)', vram: '56%', temp: '58°C', load: '52%', status: 'Optimal' },
                  { node: 'A100-Node-03 (Arabic RTL Engine)', vram: '48%', temp: '56°C', load: '44%', status: 'Optimal' },
                  { node: 'A100-Node-04 (CJK Transformer)', vram: '64%', temp: '61°C', load: '68%', status: 'Optimal' },
                  { node: 'V100-Node-05 (NER & Table Extractor)', vram: '35%', temp: '51°C', load: '30%', status: 'Optimal' }
                ].map((n, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #f1f5f9',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{n.node}</strong>
                      <span style={{ color: '#64748b' }}>VRAM: {n.vram} | Temp: {n.temp}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{n.status}</span>
                      <span style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>Load: {n.load}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
                  {filteredUsers.map((u) => (
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
                  ))}
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
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <HardDrive size={16} color="#2563eb" />
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Offline Weights Directory</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 'auto' }}>
                    ({cachedModels.length} cached)
                  </span>
                </div>
                {cachedModels.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {cachedModels.map((m, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        fontSize: '0.78rem'
                      }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0f172a' }}>{m}</span>
                        <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Cached</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                    <span>No local model folders found in <code>backend/models/</code>. Run CLI to download weights:</span>
                    <pre style={{
                      margin: '6px 0 0',
                      padding: '6px 8px',
                      background: '#0f172a',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      python backend/scripts/download_models.py --model indictrans2 --tier compact --direction en-indic
                    </pre>
                  </div>
                )}
              </div>

              {/* VRAM Loaded Models */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Cpu size={16} color="#06b6d4" />
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>Resident VRAM / RAM Models</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 'auto' }}>
                    ({loadedModels.length} active)
                  </span>
                </div>
                {loadedModels.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {loadedModels.map((m, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: '#ecfeff',
                        borderRadius: '6px',
                        fontSize: '0.78rem'
                      }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0891b2' }}>{m}</span>
                        <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>In Memory</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                    <span>No models currently loaded in memory. Models are loaded on-demand via LRU cache on first translation request.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Model Engines Switchboard */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Multilingual Recognition Engines
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Enable or route specific script models to dedicated GPU worker clusters.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {modelEngines.map((eng) => (
                <div
                  key={eng.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: eng.status ? '#ffffff' : '#f8fafc',
                    borderRadius: '12px',
                    border: `1px solid ${eng.status ? '#e2e8f0' : '#f1f5f9'}`,
                    boxShadow: eng.status ? 'var(--shadow-xs)' : 'none'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <strong style={{ color: eng.status ? '#0f172a' : '#94a3b8', fontSize: '0.95rem' }}>
                        {eng.name}
                      </strong>
                      <span className={`badge ${eng.status ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>
                        {eng.status ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Assigned GPU: <strong style={{ color: '#2563eb' }}>{eng.gpu}</strong> | Latency: {eng.latency} | Mean Accuracy: {eng.accuracy}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleModelEngine(eng.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: eng.status ? '#10b981' : '#cbd5e1',
                      display: 'flex'
                    }}
                  >
                    {eng.status ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-Processing Pipeline Sliders & Toggles */}
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
                  type="range"
                  min="60"
                  max="99"
                  value={pipelineConfig.minConfidenceCutoff}
                  onChange={(e) => setPipelineConfig({ ...pipelineConfig, minConfidenceCutoff: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Extractions below this threshold are flagged for human-in-the-loop review.
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  Global API Rate Limit ({pipelineConfig.rateLimitPerMin} req/min)
                </label>
                <input
                  type="range"
                  min="200"
                  max="5000"
                  step="100"
                  value={pipelineConfig.rateLimitPerMin}
                  onChange={(e) => setPipelineConfig({ ...pipelineConfig, rateLimitPerMin: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Prevents GPU saturation during burst document ingest queues.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: SECURITY & TELEMETRY LOGS ================= */}
      {activeAdminTab === 'logs' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Real-Time Security & Telemetry Event Stream
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Live streaming logs from pipeline workers, auth nodes, and GPU orchestrators.
              </p>
            </div>

            <button
              onClick={() => {
                const newLog = {
                  id: `log-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString(),
                  level: 'INFO',
                  module: 'AUDIT',
                  message: 'Security log stream flushed and verified.'
                };
                setSystemLogs([newLog, ...systemLogs]);
                addToast('Telemetry stream refreshed', 'info');
              }}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw size={14} />
              <span>Poll Events</span>
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
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {systemLogs.map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: '#64748b' }}>[{log.timestamp}]</span>
                <span style={{
                  color: log.level === 'WARN' ? '#f59e0b' : log.level === 'ERROR' ? '#ef4444' : '#10b981',
                  fontWeight: 700
                }}>
                  [{log.level}]
                </span>
                <span style={{ color: '#38bdf8' }}>[{log.module}]</span>
                <span style={{ color: '#f8fafc', flex: 1 }}>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: API QUOTAS & LIMITS ================= */}
      {activeAdminTab === 'quotas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
              Enterprise Plan Allocation
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Unlimited OCR concurrency, dedicated A100 GPU affinity, 99.99% uptime guarantee.
            </p>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.5rem' }}>
              Unlimited Pages / Month
            </div>
            <span className="badge badge-success">3 Enterprise Tenants Active</span>
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
            <span className="badge badge-primary">12 Team Tenants Active</span>
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
            <span className="badge badge-warning">Auto-provisions upon Signup</span>
          </div>
        </div>
      )}

    </div>
  );
};
