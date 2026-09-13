import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { EXTRACTION_HISTORY_SEED, SAMPLE_DOCUMENTS } from '../../data/sampleDocuments';
import { useToast } from '../../components/Toast';

export const HistoryPage = ({ setCurrentView }) => {
  const { addToast } = useToast();
  const [historyList, setHistoryList] = useState(EXTRACTION_HISTORY_SEED);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLangFilter, setSelectedLangFilter] = useState('ALL');
  const [previewItem, setPreviewItem] = useState(null);

  const filteredHistory = historyList.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.docType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLang = selectedLangFilter === 'ALL' || item.language.includes(selectedLangFilter);
    return matchesSearch && matchesLang;
  });

  const handleDelete = (id) => {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
          <div className="input-wrapper" style={{ width: '100%' }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Search by file name or document type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input input-with-icon"
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem 0.5rem 2.4rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Language Filter:</span>
          <select
            value={selectedLangFilter}
            onChange={(e) => setSelectedLangFilter(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.8rem', minWidth: '140px' }}
          >
            <option value="ALL">All Languages</option>
            <option value="German">German</option>
            <option value="Hindi">Hindi</option>
            <option value="Arabic">Arabic</option>
            <option value="Japanese">Japanese</option>
            <option value="Spanish">Spanish</option>
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
        <div style={{ overflowX: 'auto' }}>
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
                      <span style={{ fontWeight: 700, color: '#10b981' }}>{item.confidence}%</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      {item.timestamp}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
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
                <strong style={{ color: '#10b981' }}>{previewItem.confidence}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Entities & Key-Values:</span>
                <strong style={{ color: '#0f172a' }}>{previewItem.entitiesCount} Extracted</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Processed:</span>
                <span>{previewItem.timestamp}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPreviewItem(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
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
