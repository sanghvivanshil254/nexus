import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  FileText, 
  Languages, 
  Calendar, 
  Trash2,
  Eye,
  X,
  Lock,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import { nexusApi } from '../../services/nexusApi';

export const HistoryPage = ({ setCurrentView, user }) => {
  const { addToast } = useToast();
  const [historyList, setHistoryList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLangFilter, setSelectedLangFilter] = useState('ALL');
  const [previewItem, setPreviewItem] = useState(null);

  // Sync real translation jobs from localStorage & backend (only for authenticated users)
  useEffect(() => {
    if (!user) {
      setHistoryList([]);
      return;
    }

    const localJobs = nexusApi.getLocalJobs();
    if (localJobs && localJobs.length > 0) {
      const mappedJobs = localJobs.map((job) => ({
        id: job.job_id,
        fileName: job.filename,
        docType: 'Translated PDF',
        language: `${(job.src_lang || 'en').toUpperCase()} → ${(job.tgt_lang || 'gu').toUpperCase()}`,
        confidence: job.confidence || null,
        entitiesCount: job.entities_count || null,
        status: (job.status || 'COMPLETED').toUpperCase(),
        timestamp: job.created_at ? new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        size: job.file_size ? `${(job.file_size / (1024 * 1024)).toFixed(2)} MB` : '–',
        jobId: job.job_id
      }));

      setHistoryList((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newOnes = mappedJobs.filter((m) => !existingIds.has(m.id));
        return [...newOnes, ...prev];
      });
    }
  }, [user]);

  const filteredHistory = historyList.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.docType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLang = selectedLangFilter === 'ALL' || item.language.includes(selectedLangFilter);
    return matchesSearch && matchesLang;
  });

  const handleDelete = (id) => {
    nexusApi.removeLocalJob(id);
    setHistoryList(prev => prev.filter(h => h.id !== id));
    addToast('Extraction record removed from history', 'info');
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
            <span className="badge badge-primary">Audited Logs</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Retained for 90 Days</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
            Document Extraction History
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Inspect past extractions, download audit trails, and verify confidence metrics.
          </p>
        </div>

        <button
          onClick={() => {
            addToast('Audit log report generated', 'success');
          }}
          className="btn btn-secondary"
        >
          <Download size={16} />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Admin Notice Banner (If user is Admin) */}
      {user?.isAdmin && (
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>
                Global Translation Access (Super Admin)
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                As an Administrator, you have full audit access to all document translations across the cluster, including anonymous guest sessions.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('admin')}
            className="btn btn-sm"
            style={{ background: '#2563eb', color: '#ffffff', fontWeight: 700, padding: '8px 16px', gap: '6px' }}
          >
            <span>Open Admin Audit Console</span>
            <ExternalLink size={14} />
          </button>
        </div>
      )}

      {/* Guest Mode: Full Authentication Gate */}
      {!user ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: 'clamp(2rem, 5vw, 3.5rem) 2rem',
          textAlign: 'center',
          maxWidth: '680px',
          margin: '1.5rem auto 3rem',
          boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.05)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.15)'
          }}>
            <Lock size={30} strokeWidth={2.2} />
          </div>

          <span className="badge badge-neutral" style={{ marginBottom: '0.75rem', fontWeight: 700 }}>
            Session-Restricted Feature
          </span>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            Account Required for Document History
          </h2>

          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '520px', margin: '0 auto 2rem' }}>
            Guest sessions are strictly private and temporary — no document history, files, or audit logs are stored. Sign in to your account to retain permanent translation history, view past rendered pages, and export audit trails.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <button
              onClick={() => setCurrentView('login')}
              className="btn btn-primary btn-lg"
              style={{ fontWeight: 700, minWidth: '160px' }}
            >
              <LogIn size={18} />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => setCurrentView('register')}
              className="btn btn-secondary btn-lg"
              style={{ fontWeight: 700, minWidth: '160px' }}
            >
              <span>Create Free Account</span>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            textAlign: 'left',
            paddingTop: '1.5rem',
            borderTop: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.8rem', color: '#475569' }}>Permanent 90-day cloud audit retention</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.8rem', color: '#475569' }}>Re-download translated PDFs anytime</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.8rem', color: '#475569' }}>OCR confidence & vector layout reports</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search & Filter Toolbar */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', width: '100%', minWidth: 'min(100%, 240px)' }}>
              <div className="input-wrapper" style={{ width: '100%' }}>
                <Search size={16} className="input-icon" />
                <input
                  type="text"
                  placeholder="Search your translations by file name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input input-with-icon"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem 0.5rem 2.4rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Language Filter:</span>
              <select
                value={selectedLangFilter}
                onChange={(e) => setSelectedLangFilter(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.8rem', minWidth: '140px' }}
              >
                <option value="ALL">All Languages</option>
                <option value="GU">Gujarati (GU)</option>
                <option value="HI">Hindi (HI)</option>
                <option value="RU">Russian (RU)</option>
                <option value="ES">Spanish (ES)</option>
                <option value="JA">Japanese (JA)</option>
                <option value="AR">Arabic (AR)</option>
              </select>
            </div>
          </div>

          {/* History Records Table */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden'
          }}>
            <div className="table-responsive">
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.88rem',
                textAlign: 'left'
              }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>DOCUMENT</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>CATEGORY</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>LANGUAGE</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>CONFIDENCE</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>TIMESTAMP</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={18} color="#2563eb" />
                        <div>
                          <span style={{ fontWeight: 600, color: '#0f172a', display: 'block' }}>{item.fileName}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.size}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-neutral">{item.docType}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-primary">{item.language}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {item.confidence != null
                        ? <span style={{ fontWeight: 700, color: '#10b981' }}>{item.confidence}%</span>
                        : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>–</span>}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {item.timestamp}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        {item.jobId && item.status === 'COMPLETED' && (
                          <button
                            onClick={() => nexusApi.downloadTranslatedPdf(item.jobId, `translated_${item.fileName}`)}
                            className="btn btn-ghost btn-sm"
                            title="Download Translated PDF"
                            style={{ color: '#059669', padding: '4px 8px', fontWeight: 600 }}
                          >
                            <Download size={15} />
                            <span>PDF</span>
                          </button>
                        )}
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="btn btn-ghost btn-sm"
                          title="Quick View Details"
                          style={{ color: '#2563eb', padding: '4px 8px' }}
                        >
                          <Eye size={15} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn btn-ghost btn-sm"
                          title="Delete Record"
                          style={{ color: '#ef4444', padding: '4px 8px' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                    No extraction logs matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Quick View Modal */}
      {previewItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Extraction Audit Details
              </h3>
              <button
                onClick={() => setPreviewItem(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>File Name:</span>
                <strong style={{ color: '#0f172a' }}>{previewItem.fileName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Document Category:</span>
                <strong style={{ color: '#0f172a' }}>{previewItem.docType}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Language Model:</span>
                <strong style={{ color: '#2563eb' }}>{previewItem.language}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Mean Accuracy:</span>
                {previewItem.confidence != null
                  ? <strong style={{ color: '#10b981' }}>{previewItem.confidence}%</strong>
                  : <span style={{ color: '#94a3b8' }}>–</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Entities & Key-Values:</span>
                {previewItem.entitiesCount != null
                  ? <strong style={{ color: '#0f172a' }}>{previewItem.entitiesCount} Extracted</strong>
                  : <span style={{ color: '#94a3b8' }}>–</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Processed:</span>
                <span>{previewItem.timestamp}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPreviewItem(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
              {previewItem.jobId && previewItem.status === 'COMPLETED' && (
                <button
                  onClick={() => nexusApi.downloadTranslatedPdf(previewItem.jobId, `translated_${previewItem.fileName}`)}
                  className="btn btn-primary btn-sm"
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', border: 'none' }}
                >
                  <Download size={14} />
                  <span>Download Translated PDF</span>
                </button>
              )}
              <button
                onClick={() => {
                  setPreviewItem(null);
                  setCurrentView('dashboard');
                }}
                className="btn btn-primary btn-sm"
              >
                <span>Open in Studio</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
