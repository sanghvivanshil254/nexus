import React, { useState, useRef, useEffect } from 'react';
import { 
  FileSearch, 
  Upload, 
  Sparkles, 
  Languages, 
  Download, 
  Copy, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Layers, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Columns, 
  ArrowRight,
  ArrowLeft,
  Clock,
  Trash2,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/sampleDocuments';
import { runClientSideOCR } from '../../utils/ocrEngine';
import { useToast } from '../../components/Toast';
import { nexusApi } from '../../services/nexusApi';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import confetti from 'canvas-confetti';

export const OcrPipelineDashboard = ({ user }) => {
  const { addToast } = useToast();
  const { isConnected: isBackendOnline, device: backendDevice } = useBackendStatus();

  // Backend languages list
  const [backendLanguages, setBackendLanguages] = useState([]);
  
  // Document and Job State
  const [activePdfJob, setActivePdfJob] = useState(null);
  const [uploadedPdf, setUploadedPdf] = useState(null);
  const [customDoc, setCustomDoc] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [stagedFile, setStagedFile] = useState(null);
  const [stagedFileMeta, setStagedFileMeta] = useState(null);

  // Translation configuration
  const [pdfSrcLang, setPdfSrcLang] = useState('auto');
  const [pdfTgtLang, setPdfTgtLang] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const pollIntervalRef = useRef(null);

  // Canvas visualizer & navigation
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [viewMode, setViewMode] = useState('rendered'); // 'rendered', 'split', 'original'
  const [activePageData, setActivePageData] = useState(null);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [hoveredBoxId, setHoveredBoxId] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Inspector & Mobile Tabs
  const [activeTab, setActiveTab] = useState('translation'); // 'translation' | 'text'
  const [mobileActivePane, setMobileActivePane] = useState('document'); // 'document' | 'translation'
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const canvasContainerRef = useRef(null);

  // Fetch languages dynamically on load
  useEffect(() => {
    nexusApi.getLanguages()
      .then((langs) => {
        if (langs && langs.length > 0) {
          setBackendLanguages(langs);
        }
      })
      .catch(() => {});

    // Sync recent jobs
    refreshRecentJobs();
  }, [user]);

  const refreshRecentJobs = () => {
    if (!user) {
      setRecentJobs([]);
      return;
    }
    const jobs = nexusApi.getLocalJobs();
    setRecentJobs(jobs || []);
  };

  // Cleanup polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Fetch rendered page data
  const loadPage = async (jobId, pageNum) => {
    if (!jobId || !pageNum || pageNum < 1) return;
    setImageLoading(true);
    try {
      const data = await nexusApi.getPageData(jobId, pageNum);
      if (data) {
        setActivePageData(data);
        setCurrentPageNum(pageNum);
      }
    } catch (e) {
      console.warn('Failed to load page data:', e);
    } finally {
      setImageLoading(false);
    }
  };

  // Start polling a translation job
  const startPollingJob = (jobId, fileObj) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusRes = await nexusApi.getJobStatus(jobId);
        setActivePdfJob(statusRes);
        nexusApi.saveJobToHistory(statusRes);
        refreshRecentJobs();

        // Update page view as pages are completed
        const pNum = statusRes.latest_page_num || statusRes.completed_pages || 1;
        if (autoAdvance && pNum > 0) {
          loadPage(jobId, pNum);
        }

        if (statusRes.status === 'completed') {
          clearInterval(pollIntervalRef.current);
          setIsTranslating(false);
          try {
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          } catch {}
          addToast(`Translation completed for ${fileObj?.name || statusRes.filename || 'PDF'}!`, 'success');
        } else if (statusRes.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          setIsTranslating(false);
          addToast(`Translation failed: ${statusRes.error || 'Check server logs'}`, 'error');
        }
      } catch (pollErr) {
        console.warn('Job polling error:', pollErr);
      }
    }, 1500);
  };

  // Helper to estimate PDF page count from binary markers
  const estimatePdfPages = async (file) => {
    try {
      const sliceSize = Math.min(file.size, 500000);
      const headBuffer = await file.slice(0, sliceSize).arrayBuffer();
      const headText = new TextDecoder('latin1').decode(headBuffer);

      // Check /Count N in page dictionary
      const countMatch = headText.match(/\/Count\s+(\d+)/);
      if (countMatch && countMatch[1]) {
        return parseInt(countMatch[1], 10);
      }

      // Check file tail for Page Tree Catalog
      if (file.size > sliceSize) {
        const tailStart = Math.max(0, file.size - 200000);
        const tailBuffer = await file.slice(tailStart).arrayBuffer();
        const tailText = new TextDecoder('latin1').decode(tailBuffer);
        const tailMatch = tailText.match(/\/Count\s+(\d+)/);
        if (tailMatch && tailMatch[1]) {
          return parseInt(tailMatch[1], 10);
        }
      }

      // Fallback: match /Type /Page occurrences
      const pageMatches = headText.match(/\/Type\s*\/Page\b/g);
      if (pageMatches && pageMatches.length > 0) {
        return pageMatches.length;
      }

      return 1;
    } catch (err) {
      console.warn('PDF page count parsing error:', err);
      return 1;
    }
  };

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // AI Model resolution helper
  const getModelInfo = (tgtCode) => {
    if (!tgtCode) {
      return {
        name: 'Dynamic AI Router (Pending Target Selection)',
        shortName: 'AI Router',
        badge: 'Auto',
        shaper: 'HarfBuzz OpenType Complex-Script Engine',
        description: 'Select a target translation language above to resolve neural model route.'
      };
    }

    const backendMatch = backendLanguages.find(l => l.code === tgtCode);
    if (backendMatch?.primary_model) {
      const isIndic = backendMatch.primary_model.includes('IndicTrans2') || backendMatch.region === 'India';
      return {
        name: isIndic ? 'IndicTrans2 1B (CUDA fp16)' : 'NLLB-200 1.3B (Universal Router)',
        shortName: isIndic ? 'IndicTrans2 1B' : 'NLLB-200',
        badge: isIndic ? 'IndicTrans2' : 'NLLB-200',
        shaper: 'HarfBuzz OpenType Complex-Script Shaper',
        description: isIndic
          ? 'Specialized 1B parameter Indic foundation model with conjunct ligature shaping'
          : 'Universal 200-language dense translation transformer'
      };
    }

    const indicCodes = ['gu', 'hi', 'mr', 'bn', 'ta', 'te', 'kn', 'ml', 'pa', 'or', 'as', 'ur', 'sa'];
    const isIndic = indicCodes.includes(tgtCode);
    return {
      name: isIndic ? 'IndicTrans2 1B (CUDA fp16)' : 'NLLB-200 1.3B (Universal Router)',
      shortName: isIndic ? 'IndicTrans2 1B' : 'NLLB-200',
      badge: isIndic ? 'IndicTrans2' : 'NLLB-200',
      shaper: 'HarfBuzz OpenType Complex-Script Shaper',
      description: isIndic
        ? 'Specialized 1B parameter Indic foundation model with conjunct ligature shaping'
        : 'Universal 200-language dense translation transformer'
    };
  };

  // Display name helper
  const getLanguageDisplayName = (code) => {
    if (!code || code === 'auto') return '🌐 Auto-Detect Script & Language';
    const backendMatch = backendLanguages.find(l => l.code === code);
    if (backendMatch) {
      return `${backendMatch.region === 'India' ? '🇮🇳' : '🌐'} ${backendMatch.name}`;
    }
    const supportedMatch = SUPPORTED_LANGUAGES.find(l => l.code === code);
    if (supportedMatch) {
      return `${supportedMatch.flag} ${supportedMatch.name}`;
    }
    return code.toUpperCase();
  };

  // Submit PDF for real neural translation
  const handleStartPdfTranslation = async (file) => {
    const targetFile = file || uploadedPdf;
    if (!targetFile) {
      addToast('Please select a PDF document first.', 'warning');
      return;
    }
    if (!pdfTgtLang) {
      addToast('Please select a Target Translation Language from the dropdown above.', 'warning');
      return;
    }

    setIsTranslating(true);
    addToast(`Submitting ${targetFile.name} to Neural Pipeline...`, 'info');

    try {
      const queueRes = await nexusApi.submitTranslation(targetFile, pdfSrcLang, pdfTgtLang);
      const jobId = queueRes.job_id;

      const initialJob = {
        job_id: jobId,
        filename: targetFile.name,
        src_lang: pdfSrcLang,
        tgt_lang: pdfTgtLang,
        status: 'processing',
        progress: 5.0,
        total_pages: 0,
        completed_pages: 0,
        created_at: Date.now()
      };

      setActivePdfJob(initialJob);
      setUploadedPdf(targetFile);
      setCustomDoc(null);
      setCurrentPageNum(1);
      nexusApi.saveJobToHistory(initialJob);
      refreshRecentJobs();

      addToast(`Job ${jobId} started! Translating into ${pdfTgtLang.toUpperCase()}...`, 'success');
      startPollingJob(jobId, targetFile);
    } catch (err) {
      setIsTranslating(false);
      addToast(`Failed to start translation: ${err.message}`, 'error');
    }
  };

  // Upload handler for PDFs & Images
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    processSelectedFile(file);
  };

  // Stage selected document & generate metadata/preview
  const processSelectedFile = async (file) => {
    if (!file) return;

    // Reject all image formats
    const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|tiff|svg)$/i.test(file.name);
    if (isImage) {
      addToast('Image files (PNG, JPG, etc.) are not supported. Nexus supports document formats (.pdf, .docx, .txt, .doc, .rtf) only.', 'error');
      return;
    }

    // Enforce supported document extensions
    const isDoc = /\.(pdf|docx|doc|txt|rtf|odt)$/i.test(file.name);
    if (!isDoc) {
      addToast('Unsupported file format. Nexus supports document files (.pdf, .docx, .txt, .doc, .rtf) only.', 'warning');
      return;
    }

    if (stagedFileMeta?.previewUrl) {
      try {
        URL.revokeObjectURL(stagedFileMeta.previewUrl);
      } catch {}
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isPdf = ext === 'pdf';
    let docTypeLabel = 'PDF Document';
    if (ext === 'docx' || ext === 'doc') docTypeLabel = 'Word Document (DOCX)';
    else if (ext === 'txt') docTypeLabel = 'Text Document (TXT)';
    else if (ext === 'rtf') docTypeLabel = 'Rich Text Document (RTF)';
    else if (ext === 'odt') docTypeLabel = 'OpenDocument Text (ODT)';

    let pageCount = 1;
    let previewUrl = null;

    if (isPdf) {
      try {
        previewUrl = URL.createObjectURL(file);
      } catch (err) {
        console.warn('Preview URL generation error:', err);
      }
      pageCount = await estimatePdfPages(file);
    }

    setStagedFile(file);
    setStagedFileMeta({
      name: file.name,
      size: file.size,
      pageCount,
      isPdf,
      ext,
      docTypeLabel,
      previewUrl,
      type: file.type || `application/${ext}`
    });

    addToast(`Document "${file.name}" staged. Review details and click Submit to translate.`, 'info');
  };

  // Clear staged document
  const handleClearStagedFile = () => {
    if (stagedFileMeta?.previewUrl) {
      try {
        URL.revokeObjectURL(stagedFileMeta.previewUrl);
      } catch {}
    }
    setStagedFile(null);
    setStagedFileMeta(null);
  };

  // Submit staged document
  const handleSubmitStagedFile = async () => {
    if (!stagedFile) {
      addToast('Please select or upload a document first.', 'warning');
      return;
    }

    if (!pdfTgtLang) {
      addToast('Please select a Target Translation Language from the dropdown menu above.', 'warning');
      return;
    }

    // Submit document directly to the neural translation pipeline
    handleStartPdfTranslation(stagedFile);

    // Clear staging state
    setStagedFile(null);
    setStagedFileMeta(null);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Reset to Hub State
  const handleResetDocument = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (stagedFileMeta?.previewUrl) {
      try {
        URL.revokeObjectURL(stagedFileMeta.previewUrl);
      } catch {}
    }
    setActivePdfJob(null);
    setUploadedPdf(null);
    setCustomDoc(null);
    setActivePageData(null);
    setIsTranslating(false);
    setStagedFile(null);
    setStagedFileMeta(null);
    refreshRecentJobs();
  };

  // Resume an existing job from history
  const handleResumeJob = (job) => {
    setActivePdfJob(job);
    setUploadedPdf({ name: job.filename, size: job.file_size || 0 });
    setCustomDoc(null);
    setPdfSrcLang(job.src_lang || 'en');
    setPdfTgtLang(job.tgt_lang || 'gu');
    const pNum = job.latest_page_num || job.completed_pages || 1;
    loadPage(job.job_id, pNum);

    if (job.status === 'processing' || job.status === 'queued') {
      setIsTranslating(true);
      startPollingJob(job.job_id, { name: job.filename });
    }
  };

  // Copy helper
  const handleCopy = (text, label = 'Content') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    addToast(`${label} copied to clipboard!`, 'success');
  };

  // Fullscreen toggle
  const toggleFullScreen = () => {
    if (!canvasContainerRef.current) return;
    if (!isFullScreen) {
      if (canvasContainerRef.current.requestFullscreen) {
        canvasContainerRef.current.requestFullscreen();
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullScreen(false);
    }
  };

  const hasActiveDocument = Boolean(activePdfJob || uploadedPdf || customDoc);
  const activeFileName = activePdfJob?.filename || uploadedPdf?.name || customDoc?.title || 'Document';
  const isJobCompleted = activePdfJob?.status === 'completed';

  return (
    <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* =========================================================
          STATE 1: INGEST & TRANSLATION HUB (When no document is active)
          ========================================================= */}
      {!hasActiveDocument && (
        <div className="ocr-hub-container">
          
          {/* Hero Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '1rem'
            }}>
              <Sparkles size={15} />
              <span>Offline Neural Translation Engine</span>
            </div>

            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>
              Multilingual Document OCR & Translation
            </h1>
            <p style={{ maxWidth: '640px', margin: '0 auto', fontSize: '1rem', color: '#64748b' }}>
              Reconstruct complex scripts with HarfBuzz OpenType font shaping, layout preservation, and neural token translation.
            </p>
          </div>

          {/* Setup & Dropzone Card */}
          <div className="ocr-hub-card" style={{ marginBottom: '2rem' }}>
            
            {/* Language Selector Controls (2-Column Balanced Layout) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              alignItems: 'center',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1.75rem'
            }}>
              {/* Source Language */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  SOURCE SCRIPT / LANGUAGE
                </label>
                <select
                  value={pdfSrcLang}
                  onChange={(e) => setPdfSrcLang(e.target.value)}
                  className="form-select"
                  style={{ width: '100%', fontSize: '0.88rem', fontWeight: 600, padding: '0.6rem 0.85rem' }}
                >
                  <option value="auto">🌐 Auto-Detect Script & Language</option>
                  <option value="en">🇬🇧 English (eng_Latn)</option>
                  <option value="gu">🇮🇳 Gujarati (guj_Gujr)</option>
                  <option value="hi">🇮🇳 Hindi (hin_Deva)</option>
                  <option value="mr">🇮🇳 Marathi (mar_Deva)</option>
                  <option value="ta">🇮🇳 Tamil (tam_Taml)</option>
                  <option value="bn">🇮🇳 Bengali (ben_Beng)</option>
                  <option value="de">🇩🇪 German (deu_Latn)</option>
                  <option value="es">🇪🇸 Spanish (spa_Latn)</option>
                  <option value="fr">🇫🇷 French (fra_Latn)</option>
                  <option value="ru">🇷🇺 Russian (rus_Cyrl)</option>
                </select>
              </div>

              {/* Target Language */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  TARGET TRANSLATION LANGUAGE
                </label>
                <select
                  value={pdfTgtLang}
                  onChange={(e) => setPdfTgtLang(e.target.value)}
                  className="form-select"
                  style={{ 
                    width: '100%', 
                    fontSize: '0.88rem', 
                    fontWeight: 600, 
                    padding: '0.6rem 0.85rem',
                    borderColor: !pdfTgtLang && stagedFile ? '#f59e0b' : undefined,
                    backgroundColor: !pdfTgtLang && stagedFile ? '#fffbeb' : undefined
                  }}
                >
                  <option value="">-- Select Target Language --</option>
                  {backendLanguages.length > 0 ? (
                    backendLanguages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.region === 'India' ? '🇮🇳' : '🌐'} {l.name} ({l.primary_model?.includes('IndicTrans2') ? 'IndicTrans2' : 'NLLB'})
                      </option>
                    ))
                  ) : (
                    SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto').map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Hidden File Input */}
            {/* Hidden File Input (Documents Only) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.docx,.doc,.txt,.rtf,.odt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,application/rtf,application/vnd.oasis.opendocument.text"
              style={{ display: 'none' }}
            />

            {/* If no file is staged: Show Drag & Drop Ingest Zone */}
            {!stagedFile && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`ocr-dropzone ${isDragOver ? 'drag-active' : ''}`}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: isDragOver ? 'var(--primary-light)' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDragOver ? 'var(--primary)' : '#64748b',
                  transition: 'all 0.2s ease'
                }}>
                  <Upload size={28} />
                </div>

                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    Drop your document here, or <span style={{ color: 'var(--primary)' }}>browse files</span>
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                    Supports PDF, DOCX, DOC, TXT, RTF, and ODT documents with layout preservation (images/PNGs not supported)
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '0.5rem', padding: '0.55rem 1.25rem', pointerEvents: 'none' }}
                >
                  <FileSearch size={16} />
                  <span>Select Document to Translate</span>
                </button>
              </div>
            )}

            {/* If file IS staged: Render Document Preview Card & Bottom Submit Button */}
            {stagedFile && stagedFileMeta && (
              <div className="staged-preview-card">
                {/* Staging Header Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Document Preview & Specifications
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                        Verify document details and AI model configuration below before running translation
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={14} />
                      <span>Change Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearStagedFile}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.8rem', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Staged Layout: Cover Thumbnail + Specs Grid */}
                <div className="staged-preview-layout">
                  {/* Left Column: Visual Cover Page */}
                  <div className="staged-cover-wrapper">
                    {stagedFileMeta.isPdf ? (
                      <object
                        data={`${stagedFileMeta.previewUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                        type="application/pdf"
                        style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                      >
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
                          <FileText size={48} color="#ef4444" />
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', marginTop: '8px' }}>PDF Cover</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Page 1 of {stagedFileMeta.pageCount}</span>
                        </div>
                      </object>
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center', background: '#f8fafc' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                          <FileText size={32} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{stagedFileMeta.docTypeLabel}</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>{formatFileSize(stagedFileMeta.size)}</span>
                      </div>
                    )}

                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      right: '8px',
                      background: 'rgba(15, 23, 42, 0.88)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      textAlign: 'center',
                      pointerEvents: 'none',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}>
                      {stagedFileMeta.isPdf ? `Cover Page (1 / ${stagedFileMeta.pageCount})` : stagedFileMeta.docTypeLabel}
                    </div>
                  </div>

                  {/* Right Column: Specs & Pipeline Route */}
                  <div className="staged-specs-content">
                    <div>
                      {/* Document Name & Type Badge */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '1rem' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: stagedFileMeta.isPdf ? '#fef2f2' : '#eff6ff',
                          color: stagedFileMeta.isPdf ? '#ef4444' : '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <FileText size={22} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', wordBreak: 'break-all' }}>
                            {stagedFileMeta.name}
                          </h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                            <span>Format: <strong>{stagedFileMeta.isPdf ? 'Multi-Page PDF' : 'Scanned Image'}</strong></span>
                            <span>•</span>
                            <span>Size: <strong>{formatFileSize(stagedFileMeta.size)}</strong></span>
                            <span>•</span>
                            <span>Total Pages: <strong>{stagedFileMeta.pageCount} {stagedFileMeta.pageCount === 1 ? 'Page' : 'Pages'}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Metadata Grid: Route & AI Model */}
                      <div className="staged-meta-grid">
                        
                        {/* Translation Route */}
                        <div className="staged-meta-item">
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                            From Language ➔ To Language
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                            <span>
                              {pdfSrcLang === 'auto' ? '🌐 Auto-Detect Script' : getLanguageDisplayName(pdfSrcLang)}
                            </span>
                            <ArrowRight size={14} color="#2563eb" />
                            {pdfTgtLang ? (
                              <span style={{ color: 'var(--primary)' }}>
                                {getLanguageDisplayName(pdfTgtLang)}
                              </span>
                            ) : (
                              <span style={{ color: '#ef4444', fontWeight: 700 }}>
                                -- Select Target Above --
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Model Used */}
                        <div className="staged-meta-item">
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                            Model Used & Font Engine
                          </span>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                            {getModelInfo(pdfTgtLang).name}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                            {getModelInfo(pdfTgtLang).shaper}
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* Bottom Submit Section */}
                    <div className="staged-submit-bar">
                      {!pdfTgtLang && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          color: '#b45309',
                          fontSize: '0.84rem',
                          fontWeight: 600
                        }}>
                          <AlertCircle size={17} />
                          <span>Please select a Target Translation Language from the dropdown menu above before submitting.</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSubmitStagedFile}
                        disabled={!pdfTgtLang || isTranslating}
                        className="btn-submit-pipeline"
                      >
                        <Sparkles size={20} />
                        <span>
                          {!pdfTgtLang
                            ? 'Select Target Language Above to Submit'
                            : `Submit & Translate ${stagedFileMeta.isPdf ? `${stagedFileMeta.pageCount} ${stagedFileMeta.pageCount === 1 ? 'Page' : 'Pages'}` : 'Document'}`}
                        </span>
                        <ArrowRight size={20} />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Recent Translations Section (Only for authenticated users, never for guest sessions) */}
          {user && recentJobs.length > 0 && (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color="#64748b" />
                  <span>Recent Translations ({recentJobs.length})</span>
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Click to open rendered output
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentJobs.slice(0, 5).map((job) => (
                  <div
                    key={job.job_id}
                    onClick={() => handleResumeJob(job)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary-border)';
                      e.currentTarget.style.background = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = '#f8fafc';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <FileCheck size={18} color="#2563eb" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {job.filename}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', gap: '8px' }}>
                          <span>{(job.src_lang || 'en').toUpperCase()} &rarr; {(job.tgt_lang || 'gu').toUpperCase()}</span>
                          <span>&bull;</span>
                          <span>{job.completed_pages || job.total_pages || 1} pages</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${job.status === 'completed' ? 'badge-success' : 'badge-primary'}`}>
                        {job.status?.toUpperCase() || 'COMPLETED'}
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.75rem', pointerEvents: 'none' }}
                      >
                        <span>Open &rarr;</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================
          STATE 2: INTERACTIVE WORKBENCH (Active Document or Job)
          ========================================================= */}
      {hasActiveDocument && (
        <div>
          
          {/* Top Workbench Control Header */}
          <div className="ocr-workbench-header">
            {/* Left: Document Info & Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleResetDocument}
                className="btn btn-secondary btn-sm"
                title="Return to Hub / Upload New Document"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <ArrowLeft size={14} />
                <span>New Document</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                  {activeFileName}
                </span>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe'
                }}>
                  {pdfSrcLang.toUpperCase()} &rarr; {pdfTgtLang.toUpperCase()}
                </span>

                {isTranslating ? (
                  <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <RefreshCw size={12} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Translating {activePdfJob?.completed_pages || 0}/{activePdfJob?.total_pages || '?'}</span>
                  </span>
                ) : isJobCompleted ? (
                  <span className="badge badge-success">
                    <CheckCircle2 size={12} />
                    <span>Translated</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Right: Direct Download & Export */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isJobCompleted && activePdfJob?.job_id && (
                <button
                  onClick={() => nexusApi.downloadTranslatedPdf(activePdfJob.job_id, `translated_${activeFileName}`)}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    border: 'none',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Download size={15} />
                  <span>Download Translated PDF</span>
                </button>
              )}

              <button
                onClick={() => handleCopy(activePageData?.translated_text || customDoc?.rawText || '', 'Extracted Text')}
                className="btn btn-secondary btn-sm"
                title="Copy current page text"
              >
                <Copy size={14} />
                <span>Copy</span>
              </button>
            </div>
          </div>

          {/* Mobile Segmented Switcher (Visible only on < 768px) */}
          <div className="ocr-mobile-tabs">
            <button
              onClick={() => setMobileActivePane('document')}
              className={`ocr-mobile-tab-btn ${mobileActivePane === 'document' ? 'active' : ''}`}
            >
              <Eye size={15} />
              <span>Document Canvas</span>
            </button>
            <button
              onClick={() => setMobileActivePane('translation')}
              className={`ocr-mobile-tab-btn ${mobileActivePane === 'translation' ? 'active' : ''}`}
            >
              <FileText size={15} />
              <span>Translation & Text</span>
            </button>
          </div>

          {/* Workbench Dual Pane Grid */}
          <div className="ocr-workbench-grid">
            
            {/* ================= LEFT PANE: DOCUMENT & CANVAS ================= */}
            <div 
              ref={canvasContainerRef}
              style={{
                display: mobileActivePane === 'translation' ? undefined : 'flex',
                flexDirection: 'column',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden'
              }}
              className={mobileActivePane === 'translation' ? 'hide-on-mobile' : ''}
            >
              {/* Canvas Controls Toolbar */}
              <div className="ocr-canvas-toolbar">
                {/* View Mode */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setViewMode('rendered')}
                    className={`btn btn-sm ${viewMode === 'rendered' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    title="View Reconstructed Translated Output"
                  >
                    <Sparkles size={13} />
                    <span>Rendered</span>
                  </button>

                  <button
                    onClick={() => setViewMode('split')}
                    className={`btn btn-sm ${viewMode === 'split' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    title="Side-by-Side Original vs Translated"
                  >
                    <Columns size={13} />
                    <span>Split View</span>
                  </button>

                  <button
                    onClick={() => setViewMode('original')}
                    className={`btn btn-sm ${viewMode === 'original' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    title="View Original Source Document"
                  >
                    <Eye size={13} />
                    <span>Original</span>
                  </button>
                </div>

                {/* Canvas Tools */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className={`btn btn-sm ${showBoundingBoxes ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    title="Toggle Text Bounding Boxes"
                  >
                    <Layers size={13} />
                    <span>Boxes</span>
                  </button>

                  <button
                    onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px' }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={13} />
                  </button>

                  <span style={{ fontSize: '0.75rem', color: '#64748b', minWidth: '35px', textAlign: 'center' }}>
                    {zoomLevel}%
                  </span>

                  <button
                    onClick={() => setZoomLevel(Math.min(160, zoomLevel + 15))}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px' }}
                    title="Zoom In"
                  >
                    <ZoomIn size={13} />
                  </button>

                  <button
                    onClick={toggleFullScreen}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px' }}
                    title="Toggle Fullscreen"
                  >
                    <Maximize2 size={13} />
                  </button>
                </div>
              </div>

              {/* Multi-Page Navigation Bar */}
              {activePdfJob && (
                <div className="ocr-page-nav-bar">
                  <div className="ocr-page-nav-left">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        disabled={currentPageNum <= 1}
                        onClick={() => loadPage(activePdfJob.job_id, currentPageNum - 1)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }}
                      >
                        <ChevronLeft size={14} />
                      </button>

                      <span style={{ fontWeight: 600 }}>
                        Page <strong style={{ color: '#38bdf8' }}>{currentPageNum}</strong> of {activePdfJob.total_pages || activePdfJob.completed_pages || 1}
                      </span>

                      <button
                        disabled={
                          viewMode === 'original'
                            ? (activePdfJob.total_pages ? currentPageNum >= activePdfJob.total_pages : false)
                            : (activePdfJob.completed_pages ? currentPageNum >= activePdfJob.completed_pages : false)
                        }
                        onClick={() => loadPage(activePdfJob.job_id, currentPageNum + 1)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }}
                      >
                        <ChevronRight size={14} />
                      </button>

                      <button
                        onClick={() => loadPage(activePdfJob.job_id, activePdfJob.latest_page_num || activePdfJob.completed_pages || 1)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.7rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                      >
                        Latest Page
                      </button>
                    </div>
                  </div>

                  <div className="ocr-page-nav-right">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                      <span style={{ color: '#34d399', fontWeight: 600 }}>
                        {isJobCompleted ? 'Complete' : 'Live Sync'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Canvas Viewport */}
              <div className="ocr-canvas-viewport">
                {imageLoading && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(11, 17, 32, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 40
                  }}>
                    <RefreshCw size={28} color="#38bdf8" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                )}

                <div 
                  className="ocr-document-surface"
                  style={{
                    width: viewMode === 'split' ? `${(zoomLevel / 100) * 800}px` : `${(zoomLevel / 100) * 440}px`,
                    minHeight: `${(zoomLevel / 100) * 580}px`,
                    padding: viewMode === 'split' ? '0.75rem' : '0'
                  }}
                >
                  {/* Split View */}
                  {viewMode === 'split' && activePdfJob && (
                    <div className="ocr-split-view-row">
                      {/* Left: Original Page */}
                      <div style={{ flex: 1, position: 'relative', borderRight: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, background: 'rgba(15,23,42,0.85)', color: '#ffffff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          Original ({activePdfJob.src_lang?.toUpperCase() || 'EN'})
                        </div>
                        <img
                          src={nexusApi.getOriginalPageUrl(activePdfJob.job_id, currentPageNum)}
                          alt={`Original Page ${currentPageNum}`}
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>

                      {/* Right: Translated Page */}
                      <div style={{ flex: 1, position: 'relative', background: '#f8fafc' }}>
                        <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, background: 'linear-gradient(135deg, #2563eb, #06b6d4)', color: '#ffffff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          Translated ({activePdfJob.tgt_lang?.toUpperCase() || 'GU'})
                        </div>
                        <img
                          src={nexusApi.getRenderedPageUrl(activePdfJob.job_id, currentPageNum)}
                          alt={`Translated Page ${currentPageNum}`}
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Single View (Rendered or Original) */}
                  {viewMode !== 'split' && (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      {activePdfJob ? (
                        <>
                          <img
                            src={viewMode === 'original'
                              ? nexusApi.getOriginalPageUrl(activePdfJob.job_id, currentPageNum)
                              : nexusApi.getRenderedPageUrl(activePdfJob.job_id, currentPageNum)
                            }
                            alt={`Page ${currentPageNum}`}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />

                          {/* Bounding Boxes Overlays */}
                          {showBoundingBoxes && activePageData?.blocks && (
                            activePageData.blocks.map((box) => {
                              const isHovered = hoveredBoxId === box.id;
                              const isHeader = box.type === 'header';

                              return (
                                <div
                                  key={box.id}
                                  onMouseEnter={() => setHoveredBoxId(box.id)}
                                  onMouseLeave={() => setHoveredBoxId(null)}
                                  style={{
                                    position: 'absolute',
                                    left: `${box.x}%`,
                                    top: `${box.y}%`,
                                    width: `${box.width}%`,
                                    height: `${box.height}%`,
                                    background: isHovered ? 'rgba(37, 99, 235, 0.25)' : isHeader ? 'rgba(79, 70, 229, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                    border: isHovered ? '2px solid #2563eb' : isHeader ? '1px solid #4f46e5' : '1px solid #10b981',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    zIndex: isHovered ? 30 : 10,
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {isHovered && (
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '100%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      background: '#0f172a',
                                      color: '#ffffff',
                                      padding: '6px 10px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      zIndex: 50,
                                      boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                                      pointerEvents: 'none',
                                      marginBottom: '4px',
                                      maxWidth: '260px'
                                    }}>
                                      <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '2px' }}>
                                        {box.type?.toUpperCase() || 'TEXT'}
                                      </div>
                                      <div style={{ lineHeight: 1.3 }}>
                                        {box.translated_text || box.text}
                                      </div>
                                      {box.original_text && (
                                        <div style={{ color: '#94a3b8', fontSize: '0.65rem', marginTop: '2px', fontStyle: 'italic' }}>
                                          Source: {box.original_text}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </>
                      ) : customDoc ? (
                        <div style={{ padding: '1.5rem', fontSize: '0.85rem', lineHeight: 1.6, color: '#0f172a', whiteSpace: 'pre-wrap' }}>
                          {customDoc.rawText}
                        </div>
                      ) : null}
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* ================= RIGHT PANE: FOCUSED 2-TAB INSPECTOR ================= */}
            <div 
              style={{
                display: mobileActivePane === 'document' ? undefined : 'flex',
                flexDirection: 'column',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden'
              }}
              className={mobileActivePane === 'document' ? 'hide-on-mobile' : ''}
            >
              {/* Tab Navigation */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <button
                  onClick={() => setActiveTab('translation')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '0.85rem 1rem',
                    background: activeTab === 'translation' ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'translation' ? '2px solid #2563eb' : '2px solid transparent',
                    color: activeTab === 'translation' ? '#2563eb' : '#64748b',
                    fontSize: '0.88rem',
                    fontWeight: activeTab === 'translation' ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  <Languages size={16} />
                  <span>Translation</span>
                </button>

                <button
                  onClick={() => setActiveTab('text')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '0.85rem 1rem',
                    background: activeTab === 'text' ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'text' ? '2px solid #2563eb' : '2px solid transparent',
                    color: activeTab === 'text' ? '#2563eb' : '#64748b',
                    fontSize: '0.88rem',
                    fontWeight: activeTab === 'text' ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  <FileText size={16} />
                  <span>Extracted Text</span>
                </button>
              </div>

              {/* Tab Header Sub-bar */}
              <div style={{
                padding: '0.65rem 1rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem'
              }}>
                <span style={{ color: '#64748b' }}>
                  {activeTab === 'translation' 
                    ? `Page ${currentPageNum} &bull; ${pdfTgtLang.toUpperCase()}`
                    : 'Raw Document Text'
                  }
                </span>

                <button
                  onClick={() => handleCopy(
                    activeTab === 'translation' 
                      ? (activePageData?.translated_text || customDoc?.translations?.[pdfTgtLang] || '')
                      : (activePageData?.translated_text || customDoc?.rawText || ''),
                    activeTab === 'translation' ? 'Translated Text' : 'Extracted Text'
                  )}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                >
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
              </div>

              {/* Tab Content Area */}
              <div style={{ padding: '1.25rem', minHeight: '420px', maxHeight: '580px', overflowY: 'auto' }}>
                
                {/* TAB 1: TRANSLATION */}
                {activeTab === 'translation' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Live Progress Banner if still processing */}
                    {isTranslating && (
                      <div style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '10px',
                        padding: '1rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#2563eb' }}>
                            Translating page {activePdfJob?.completed_pages || 0} of {activePdfJob?.total_pages || '...'}
                          </span>
                          <span style={{ fontWeight: 700, color: '#1e40af' }}>
                            {activePdfJob?.total_pages ? Math.round(((activePdfJob?.completed_pages || 0) / activePdfJob?.total_pages) * 100) : 5}%
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#dbeafe', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${activePdfJob?.total_pages ? Math.max(8, ((activePdfJob?.completed_pages || 0) / activePdfJob?.total_pages) * 100) : 10}%`,
                            height: '100%',
                            background: '#2563eb',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Page Selector Pills for multi-page documents */}
                    {activePdfJob && (activePdfJob.completed_pages > 1 || activePdfJob.total_pages > 1) && (
                      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {Array.from({ length: Math.min(activePdfJob.completed_pages || activePdfJob.total_pages || 1, 30) }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            onClick={() => loadPage(activePdfJob.job_id, p)}
                            style={{
                              padding: '3px 10px',
                              borderRadius: '6px',
                              border: currentPageNum === p ? '2px solid #2563eb' : '1px solid #e2e8f0',
                              background: currentPageNum === p ? '#eff6ff' : '#ffffff',
                              color: currentPageNum === p ? '#2563eb' : '#64748b',
                              fontSize: '0.72rem',
                              fontWeight: currentPageNum === p ? 700 : 500,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Page {p}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Full Page Translated Text */}
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      fontSize: '0.88rem',
                      lineHeight: 1.65,
                      color: '#0f172a',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '260px',
                      overflowY: 'auto'
                    }}>
                      {activePageData?.translated_text ||
                       customDoc?.translations?.[pdfTgtLang] ||
                       (isTranslating ? 'Generating neural translation with HarfBuzz complex-script font shaping...' : 'No translated text available for this page.')
                      }
                    </div>

                    {/* Structured Layout Blocks */}
                    {activePageData?.blocks && activePageData.blocks.length > 0 && (
                      <div>
                        <h5 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Layout Blocks ({activePageData.blocks.length})
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                          {activePageData.blocks.map((blk, idx) => (
                            <div
                              key={blk.id || idx}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '10px',
                                fontSize: '0.8rem'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  color: blk.type === 'header' ? '#4f46e5' : '#059669',
                                  background: blk.type === 'header' ? '#eef2ff' : '#ecfdf5',
                                  padding: '1px 6px',
                                  borderRadius: '4px'
                                }}>
                                  {blk.type?.toUpperCase() || 'TEXT BLOCK'}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                  Pos: ({blk.x}%, {blk.y}%)
                                </span>
                              </div>

                              {blk.original_text && (
                                <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '4px', fontStyle: 'italic' }}>
                                  &ldquo;{blk.original_text}&rdquo;
                                </div>
                              )}

                              <div style={{ color: '#0f172a', fontWeight: 600 }}>
                                {blk.translated_text || blk.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* TAB 2: EXTRACTED TEXT */}
                {activeTab === 'text' && (
                  <div>
                    <pre style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      color: '#0f172a',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'inherit'
                    }}>
                      {activePageData?.translated_text || customDoc?.rawText || 'No text extracted.'}
                    </pre>
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 767px) {
          .hide-on-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
