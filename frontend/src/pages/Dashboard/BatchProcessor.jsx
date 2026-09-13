import React, { useState } from 'react';
import { 
  Layers, 
  Upload, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Download, 
  Sparkles, 
  FileText,
  RefreshCw,
  FileCheck,
  Check
} from 'lucide-react';
import { useToast } from '../../components/Toast';

export const BatchProcessor = () => {
  const { addToast } = useToast();

  const [queue, setQueue] = useState([
    {
      id: 'batch-01',
      fileName: 'Munich_Industrial_Invoices_Q1.pdf',
      size: '4.2 MB',
      pages: 12,
      language: 'German (de)',
      status: 'COMPLETED',
      progress: 100,
      entitiesFound: 48,
      confidence: 99.4
    },
    {
      id: 'batch-02',
      fileName: 'Apollo_Delhi_Patient_Records_BatchB.pdf',
      size: '6.8 MB',
      pages: 18,
      language: 'Hindi (hi)',
      status: 'COMPLETED',
      progress: 100,
      entitiesFound: 72,
      confidence: 98.9
    },
    {
      id: 'batch-03',
      fileName: 'Tokyo_Regional_Tax_Filings_2026.pdf',
      size: '3.1 MB',
      pages: 8,
      language: 'Japanese (ja)',
      status: 'PROCESSING',
      progress: 65,
      entitiesFound: 32,
      confidence: 99.1
    },
    {
      id: 'batch-04',
      fileName: 'Madrid_RealEstate_Notary_Deeds.pdf',
      size: '5.5 MB',
      pages: 14,
      language: 'Spanish (es)',
      status: 'QUEUED',
      progress: 0,
      entitiesFound: 0,
      confidence: 0
    },
    {
      id: 'batch-05',
      fileName: 'Dubai_Expat_Residency_Passports.pdf',
      size: '8.4 MB',
      pages: 22,
      language: 'Arabic (ar)',
      status: 'QUEUED',
      progress: 0,
      entitiesFound: 0,
      confidence: 0
    }
  ]);

  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const handleStartBatch = () => {
    setIsProcessingAll(true);
    addToast('Starting high-throughput batch extraction pipeline...', 'info');

    // Simulate batch progress
    const interval = setInterval(() => {
      setQueue((prevQueue) => {
        let allDone = true;
        const updated = prevQueue.map((item) => {
          if (item.status === 'COMPLETED') return item;
          allDone = false;
          const nextProgress = Math.min(100, item.progress + 25);
          const isDone = nextProgress >= 100;
          return {
            ...item,
            progress: nextProgress,
            status: isDone ? 'COMPLETED' : 'PROCESSING',
            entitiesFound: isDone ? (item.pages * 4) : item.entitiesFound,
            confidence: isDone ? 99.2 : item.confidence
          };
        });

        if (allDone) {
          clearInterval(interval);
          setIsProcessingAll(false);
          addToast('All queued batch documents successfully extracted!', 'success');
        }
        return updated;
      });
    }, 600);
  };

  const handleClearCompleted = () => {
    setQueue(queue.filter(q => q.status !== 'COMPLETED'));
    addToast('Cleared completed items from queue', 'info');
  };

  const handleExportZip = () => {
    addToast('Compiling batch export archive (JSON + CSV + OCR Text)...', 'info');
    setTimeout(() => {
      addToast('Batch archive downloaded successfully!', 'success');
    }, 1000);
  };

  const completedCount = queue.filter(q => q.status === 'COMPLETED').length;
  const processingCount = queue.filter(q => q.status === 'PROCESSING').length;
  const queuedCount = queue.filter(q => q.status === 'QUEUED').length;

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
            <span className="badge badge-primary">High-Throughput Cluster</span>
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>● 8 GPU Workers Online</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
            Batch Document Ingestion Queue
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Process thousands of multi-page multilingual documents simultaneously with parallelized workers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleStartBatch}
            disabled={isProcessingAll || queuedCount === 0}
            className="btn btn-primary"
            style={{ fontWeight: 700 }}
          >
            {isProcessingAll ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Processing Queue...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Process All ({queuedCount + processingCount})</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportZip}
            className="btn btn-secondary"
            title="Download Batch ZIP"
          >
            <Download size={16} />
            <span>Export Archive</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Total Ingested</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{queue.length} Files</div>
          <span style={{ fontSize: '0.75rem', color: '#2563eb' }}>74 Total Document Pages</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Completed</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{completedCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>100% Extraction Accuracy</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>In Progress</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>{processingCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Active Worker Node #2</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Queued</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#64748b' }}>{queuedCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Pending GPU Dispatch</span>
        </div>
      </div>

      {/* Batch Table Container */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
            Pipeline Document Queue ({queue.length})
          </span>
          <button
            onClick={handleClearCompleted}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.8rem', color: '#ef4444' }}
          >
            <Trash2 size={14} />
            <span>Clear Completed</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.88rem',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>DOCUMENT NAME</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>PAGES / SIZE</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>SCRIPT / LANGUAGE</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>PROGRESS</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>ENTITIES</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
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
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.fileName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748b' }}>
                    {item.pages} pgs ({item.size})
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                      {item.language}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', minWidth: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${item.progress}%`,
                          background: item.status === 'COMPLETED' ? '#10b981' : '#2563eb',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', minWidth: '32px' }}>
                        {item.progress}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {item.status === 'COMPLETED' && (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} />
                        <span>Completed</span>
                      </span>
                    )}
                    {item.status === 'PROCESSING' && (
                      <span className="badge badge-warning">
                        <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Processing</span>
                      </span>
                    )}
                    {item.status === 'QUEUED' && (
                      <span className="badge badge-neutral">
                        <Clock size={12} />
                        <span>Queued</span>
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {item.entitiesFound > 0 ? `${item.entitiesFound} Entities` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
