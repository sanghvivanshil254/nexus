import React, { useState, useRef, useEffect } from 'react';
import { 
  FileSearch, 
  Upload, 
  Sparkles, 
  Languages, 
  Download, 
  Copy, 
  Volume2, 
  VolumeX, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Layers, 
  Table as TableIcon, 
  FileText, 
  Code2, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Tag, 
  Share2, 
  Filter, 
  Check, 
  Globe2,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Columns,
  ArrowRight
} from 'lucide-react';
import { SAMPLE_DOCUMENTS, SUPPORTED_LANGUAGES, OCR_PIPELINE_STAGES } from '../../data/sampleDocuments';
import { runClientSideOCR } from '../../utils/ocrEngine';
import { useToast } from '../../components/Toast';
import { nexusApi } from '../../services/nexusApi';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import confetti from 'canvas-confetti';

export const OcrPipelineDashboard = ({ user }) => {
  const { addToast } = useToast();
  
  // State
  const [selectedDocId, setSelectedDocId] = useState(SAMPLE_DOCUMENTS[0].id);
  const [selectedLang, setSelectedLang] = useState('auto');
  const [activeTab, setActiveTab] = useState('entities'); // entities, text, table, translation, json
  const [targetTranslationLang, setTargetTranslationLang] = useState('gu');
  
  // Custom uploaded document state
  const [customDoc, setCustomDoc] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(100);
  const [currentStageName, setCurrentStageName] = useState('Ready');
  
  // PDF Translation & Backend Integration State
  const [backendLanguages, setBackendLanguages] = useState([]);
  const [uploadedPdf, setUploadedPdf] = useState(null);
  const [pdfSrcLang, setPdfSrcLang] = useState('en');
  const [pdfTgtLang, setPdfTgtLang] = useState('gu');
  const [pdfMaxPages, setPdfMaxPages] = useState('');
  const [activePdfJob, setActivePdfJob] = useState(null);
  const [isTranslatingPdf, setIsTranslatingPdf] = useState(false);
  const pollIntervalRef = useRef(null);

  // Real-time Page Preview & Rendering State
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [viewMode, setViewMode] = useState('rendered'); // 'rendered', 'split', 'original'
  const [activePageData, setActivePageData] = useState(null);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [jobPagesList, setJobPagesList] = useState([]);

  const { isConnected: isBackendOnline, device: backendDevice } = useBackendStatus();

  // Fetch languages dynamically from backend
  useEffect(() => {
    nexusApi.getLanguages()
      .then((langs) => {
        if (langs && langs.length > 0) {
          setBackendLanguages(langs);
        }
      })
      .catch(() => {});
  }, []);

  // Cleanup polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Fetch rendered page data and synchronise with document view
  const loadPage = async (jobId, pageNum) => {
    if (!jobId || !pageNum || pageNum < 1) return;
    setImageLoading(true);
    try {
      const data = await nexusApi.getPageData(jobId, pageNum);
      if (data) {
        setActivePageData(data);
        setCurrentPageNum(pageNum);
        // Sync customDoc with page data for seamless display
        setCustomDoc(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            rawText: data.translated_text || prev.rawText,
            boxes: data.blocks && data.blocks.length > 0 ? data.blocks : prev.boxes,
            translations: {
              ...(prev.translations || {}),
              [pdfTgtLang]: data.translated_text || prev.translations?.[pdfTgtLang]
            }
          };
        });
      }
    } catch (e) {
      console.warn('Failed to load page data:', e);
    } finally {
      setImageLoading(false);
    }
  };

  // Restore latest job from history on startup
  useEffect(() => {
    const localJobs = nexusApi.getLocalJobs();
    if (localJobs && localJobs.length > 0) {
      const recent = localJobs[0];
      if (!activePdfJob) {
        setActivePdfJob(recent);
        const pNum = recent.latest_page_num || recent.completed_pages || 1;
        loadPage(recent.job_id, pNum);
        nexusApi.getJobPages(recent.job_id).then(res => {
          if (res?.pages) setJobPagesList(res.pages);
        }).catch(() => {});
      }
    }
  }, []);

  // Sync available pages when active job changes
  useEffect(() => {
    if (activePdfJob?.job_id) {
      nexusApi.getJobPages(activePdfJob.job_id).then(res => {
        if (res?.pages) setJobPagesList(res.pages);
      }).catch(() => {});
    }
  }, [activePdfJob?.job_id, activePdfJob?.completed_pages]);

  // Visualizer settings
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [showLaser, setShowLaser] = useState(false);
  const [hoveredBoxId, setHoveredBoxId] = useState(null);
  const [confidenceFilter, setConfidenceFilter] = useState(80);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fileInputRef = useRef(null);

  // Active document object
  const currentDoc = customDoc || SAMPLE_DOCUMENTS.find(d => d.id === selectedDocId) || SAMPLE_DOCUMENTS[0];

  // Speech synthesis
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      addToast('Text-to-speech is not supported in this browser', 'warning');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToRead = activeTab === 'translation' 
        ? (currentDoc.translations[targetTranslationLang] || currentDoc.rawText)
        : currentDoc.rawText;
        
      const utterance = new SpeechSynthesisUtterance(textToRead.slice(0, 400));
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      addToast('Reading extracted text aloud...', 'info');
    }
  };

  // Run pipeline simulation / OCR
  const handleRunPipeline = async () => {
    setIsProcessing(true);
    setShowLaser(true);
    setPipelineProgress(15);
    setCurrentStageName('Pre-processing image...');

    for (let i = 0; i < OCR_PIPELINE_STAGES.length; i++) {
      setCurrentStageName(OCR_PIPELINE_STAGES[i].name);
      setPipelineProgress(Math.round(((i + 1) / OCR_PIPELINE_STAGES.length) * 100));
      await new Promise(r => setTimeout(r, 220));
    }

    setIsProcessing(false);
    setShowLaser(false);
    addToast(`Pipeline completed! Recognized ${currentDoc.language} document with ${currentDoc.confidenceScore}% confidence.`, 'success');
  };

  // Custom File Upload Handler (Handles both PDFs for backend neural translation and images for client OCR)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so re-uploading the same file still triggers onChange
    e.target.value = '';

    // Handle PDF files via the Nexus Backend Neural Pipeline
    if (file.name.toLowerCase().endsWith('.pdf')) {
      setUploadedPdf(file);
      setActivePdfJob(null);

      const pdfDoc = {
        id: `pdf-${Date.now()}`,
        title: file.name,
        language: 'PDF Document',
        langCode: pdfSrcLang,
        category: 'PDF Document',
        thumbnail: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80',
        confidenceScore: 99.4,
        processingTime: 'Awaiting Pipeline Execution',
        scriptType: 'Complex Script / Layout Preservation',
        pageCount: 'Multi-page Document',
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        summary: `Document: ${file.name} queued for offline neural translation and HarfBuzz OpenType layout reconstruction.`,
        rawText: `[PDF Document: ${file.name}]\nFile Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB\nSource Language: ${pdfSrcLang.toUpperCase()}\nTarget Language: ${pdfTgtLang.toUpperCase()}\n\nClick "Start Neural Translation" below to execute the IndicTrans2 / NLLB offline pipeline with font shaping and vector layout reconstruction.`,
        boxes: [
          { id: 'b1', text: file.name, confidence: 99.8, x: 8, y: 10, width: 65, height: 6, type: 'header' },
          { id: 'b2', text: 'PDF Layout & Typography Engine Active', confidence: 99.2, x: 8, y: 22, width: 75, height: 6, type: 'entity' }
        ],
        entities: [
          { label: 'File Name', value: file.name, confidence: 100, tag: 'FILE' },
          { label: 'File Size', value: `${(file.size / (1024 * 1024)).toFixed(2)} MB`, confidence: 100, tag: 'METRIC' },
          { label: 'Pipeline Engine', value: 'IndicTrans2 / NLLB / MuPDF HarfBuzz', confidence: 99.6, tag: 'ENGINE' }
        ],
        table: {
          headers: ['Parameter', 'Configured Value'],
          rows: [
            ['File Name', file.name],
            ['Source Language', pdfSrcLang],
            ['Target Language', pdfTgtLang],
            ['Backend Status', isBackendOnline ? `Online (${backendDevice?.toUpperCase() || 'CPU'})` : 'Standalone Demo']
          ]
        },
        translations: {
          [pdfTgtLang]: `PDF uploaded: ${file.name}. Execute translation to generate reconstructed document.`
        }
      };

      setCustomDoc(pdfDoc);
      setActiveTab('translation');
      addToast(`PDF "${file.name}" loaded! Configure languages and click "Start Neural Translation".`, 'info');
      return;
    }

    // Handle Image files via client-side Tesseract.js
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target.result;
      setIsProcessing(true);
      setShowLaser(true);
      setCurrentStageName('Ingesting uploaded file...');
      setPipelineProgress(10);

      try {
        const ocrResult = await runClientSideOCR(file, selectedLang === 'auto' ? 'en' : selectedLang, (prog) => {
          setPipelineProgress(prog.progress);
          setCurrentStageName(prog.message);
        });

        const newDoc = {
          id: `custom-${Date.now()}`,
          title: file.name,
          language: selectedLang === 'auto' ? 'Auto-Detected Script' : selectedLang.toUpperCase(),
          langCode: selectedLang,
          category: 'Uploaded File',
          thumbnail: imageUrl,
          confidenceScore: ocrResult.confidenceScore,
          processingTime: ocrResult.processingTime,
          scriptType: 'Universal Script',
          pageCount: 1,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          summary: `Extracted content from user file: ${file.name}`,
          rawText: ocrResult.rawText,
          boxes: ocrResult.boxes,
          entities: ocrResult.entities,
          table: ocrResult.table,
          translations: ocrResult.translations
        };

        setCustomDoc(newDoc);
        setUploadedPdf(null);
        addToast(`Extracted ${file.name} successfully!`, 'success');
      } catch (err) {
        addToast('Error during OCR processing. Showing fallback extraction.', 'warning');
      } finally {
        setIsProcessing(false);
        setShowLaser(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Execute Real PDF Translation on the Nexus Backend
  const handleStartPdfTranslation = async () => {
    if (!uploadedPdf) {
      addToast('Please upload a PDF file first using "Upload Document".', 'warning');
      return;
    }

    setIsTranslatingPdf(true);
    addToast('Submitting PDF to Nexus Neural Translation Pipeline...', 'info');

    try {
      const maxPagesVal = pdfMaxPages && Number(pdfMaxPages) > 0 ? parseInt(pdfMaxPages, 10) : null;
      const queueRes = await nexusApi.submitTranslation(uploadedPdf, pdfSrcLang, pdfTgtLang, maxPagesVal);
      const jobId = queueRes.job_id;

      const initialJob = {
        job_id: jobId,
        filename: uploadedPdf.name,
        src_lang: pdfSrcLang,
        tgt_lang: pdfTgtLang,
        status: 'queued',
        progress: 5.0,
        total_pages: 0,
        completed_pages: 0,
        created_at: Date.now()
      };
      setActivePdfJob(initialJob);
      nexusApi.saveJobToHistory(initialJob);

      addToast(`Job ${jobId} queued! Neural models processing pages...`, 'success');

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await nexusApi.getJobStatus(jobId);
          setActivePdfJob(statusRes);
          nexusApi.saveJobToHistory(statusRes);

          // Real-time render update: update displayed page to latest rendered page
          const pNum = statusRes.latest_page_num || statusRes.completed_pages || 1;
          if (autoAdvance && pNum > 0) {
            loadPage(jobId, pNum);
          }

          if (statusRes.status === 'completed') {
            clearInterval(pollIntervalRef.current);
            setIsTranslatingPdf(false);
            try {
              confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
            } catch {}
            addToast(`Translation completed for ${uploadedPdf.name}! Click "Download Translated PDF" to save.`, 'success');
          } else if (statusRes.status === 'failed') {
            clearInterval(pollIntervalRef.current);
            setIsTranslatingPdf(false);
            addToast(`Translation failed: ${statusRes.error || 'Check server logs'}`, 'error');
          }
        } catch (pollErr) {
          console.warn('Job polling warning:', pollErr);
        }
      }, 1500);
    } catch (err) {
      setIsTranslatingPdf(false);
      addToast(`Failed to dispatch job: ${err.message}. Ensure backend is running at http://127.0.0.1:8000.`, 'error');
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text, label = 'Content') => {
    navigator.clipboard.writeText(text);
    addToast(`${label} copied to clipboard`, 'success');
  };

  // Download CSV
  const handleDownloadCSV = () => {
    if (!currentDoc.table) return;
    const { headers, rows } = currentDoc.table;
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentDoc.id}_extracted_table.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Table exported to CSV!', 'success');
  };

  // Download JSON
  const handleDownloadJSON = () => {
    const payload = JSON.stringify(currentDoc, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentDoc.id}_ocr_payload.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('JSON response downloaded!', 'success');
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      
      {/* ================= TOP CONTROL TOOLBAR ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Left: Document Presets & Upload */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              DOCUMENT SELECTOR
            </label>
            <select
              value={customDoc ? 'custom' : selectedDocId}
              onChange={(e) => {
                if (e.target.value === 'custom') return;
                setCustomDoc(null);
                setSelectedDocId(e.target.value);
              }}
              className="form-select"
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.5rem 1rem',
                minWidth: '220px',
                cursor: 'pointer'
              }}
            >
              <optgroup label="Multilingual Presets">
                {SAMPLE_DOCUMENTS.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.language.split(' ')[0]} — {doc.category}
                  </option>
                ))}
              </optgroup>
              {customDoc && (
                <optgroup label="Uploaded Document">
                  <option value="custom">{customDoc.title}</option>
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              TARGET OCR ENGINE
            </label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="form-select"
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.5rem 1rem',
                minWidth: '180px',
                cursor: 'pointer'
              }}
            >
              <option value="auto">🌐 Auto-Detect Script & Language</option>
              {backendLanguages.length > 0 ? (
                backendLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.region === 'India' ? '🇮🇳' : '🌐'} {lang.name} ({lang.code})
                  </option>
                ))
              ) : (
                SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <Upload size={16} />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Right: Pipeline Execution & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-end' }}>
          <button
            onClick={handleRunPipeline}
            disabled={isProcessing}
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.25rem' }}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Execute OCR Pipeline</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadJSON}
            className="btn btn-secondary"
            title="Download JSON Payload"
            style={{ padding: '0.55rem 0.85rem' }}
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Progress Bar when processing */}
      {isProcessing && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #bfdbfe',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
            <span style={{ fontWeight: 600, color: '#2563eb' }}>
              Stage: {currentStageName}
            </span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              {pipelineProgress}%
            </span>
          </div>
          <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pipelineProgress}%`,
              background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
              transition: 'width 0.2s ease'
            }} />
          </div>
        </div>
      )}

      {/* ================= DUAL PANE WORKBENCH ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.2fr)',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        
        {/* ================= LEFT PANE: DOCUMENT & BOUNDING BOX CANVAS ================= */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Canvas Toolbar Header */}
          <div style={{
            padding: '0.75rem 1rem',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {/* View Mode Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setViewMode('rendered')}
                className={`btn btn-sm ${viewMode === 'rendered' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="View Reconstructed Translated Output"
              >
                <Sparkles size={13} />
                <span>Rendered Output</span>
              </button>

              <button
                onClick={() => setViewMode('split')}
                className={`btn btn-sm ${viewMode === 'split' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="Side-by-Side Original vs Translated"
              >
                <Columns size={13} />
                <span>Split View</span>
              </button>

              <button
                onClick={() => setViewMode('original')}
                className={`btn btn-sm ${viewMode === 'original' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="View Original Source Document"
              >
                <Eye size={13} />
                <span>Original</span>
              </button>
            </div>

            {/* Canvas controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                className={`btn btn-sm ${showBoundingBoxes ? 'btn-primary' : 'btn-secondary'}`}
                title="Toggle Bounding Box Overlays"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                <Layers size={14} />
                <span>Boxes</span>
              </button>

              <button
                onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                className="btn btn-secondary btn-sm"
                title="Zoom Out"
                style={{ padding: '4px 8px' }}
              >
                <ZoomOut size={14} />
              </button>
              
              <span style={{ fontSize: '0.75rem', color: '#64748b', minWidth: '35px', textAlign: 'center' }}>
                {zoomLevel}%
              </span>

              <button
                onClick={() => setZoomLevel(Math.min(160, zoomLevel + 15))}
                className="btn btn-secondary btn-sm"
                title="Zoom In"
                style={{ padding: '4px 8px' }}
              >
                <ZoomIn size={14} />
              </button>

              <button
                onClick={() => setZoomLevel(100)}
                className="btn btn-secondary btn-sm"
                title="Reset Zoom"
                style={{ padding: '4px 8px' }}
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {/* Real-time Page Navigation & Telemetry Banner */}
          {activePdfJob && (
            <div style={{
              background: '#0f172a',
              borderBottom: '1px solid #1e293b',
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              color: '#f8fafc',
              fontSize: '0.75rem'
            }}>
              {/* Page Switcher */}
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

              {/* Status and auto-advance toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#94a3b8' }}>
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e) => setAutoAdvance(e.target.checked)}
                    style={{ accentColor: '#2563eb' }}
                  />
                  <span>Live Auto-follow</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Real-time Output</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Visual Canvas Area */}
          <div style={{
            position: 'relative',
            background: '#090d16',
            minHeight: '480px',
            maxHeight: '620px',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}>
            {/* Laser scanning bar */}
            {showLaser && <div className="scan-laser" />}

            {/* Document Surface */}
            <div style={{
              position: 'relative',
              width: viewMode === 'split' ? `${(zoomLevel / 100) * 800}px` : `${(zoomLevel / 100) * 440}px`,
              minHeight: `${(zoomLevel / 100) * 580}px`,
              background: '#ffffff',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
              borderRadius: '4px',
              padding: viewMode === 'split' ? '0.75rem' : '0',
              transition: 'width 0.2s ease, min-height 0.2s ease',
              userSelect: 'none',
              overflow: 'hidden',
              display: 'flex',
              gap: '12px'
            }}>
              
              {/* CASE 1: Split View (Side-by-Side Original vs Translated Render) */}
              {viewMode === 'split' && activePdfJob && (
                <>
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

                  {/* Right: Translated Reconstructed Page */}
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
                </>
              )}

              {/* CASE 2: Single View (Rendered Translated Output or Original Page) */}
              {viewMode !== 'split' && (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  {activePdfJob ? (
                    <>
                      {/* Rendered PDF Page Image */}
                      <img
                        src={viewMode === 'original'
                          ? nexusApi.getOriginalPageUrl(activePdfJob.job_id, currentPageNum)
                          : nexusApi.getRenderedPageUrl(activePdfJob.job_id, currentPageNum)
                        }
                        alt={`Page ${currentPageNum}`}
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block',
                          borderRadius: '4px'
                        }}
                        onError={(e) => {
                          // If image endpoint not yet ready, fallback to rawText view
                          e.target.style.display = 'none';
                        }}
                      />

                      {/* Interactive Bounding Box Overlays (rendered on top of image) */}
                      {showBoundingBoxes && (activePageData?.blocks || currentDoc.boxes) && (
                        (activePageData?.blocks || currentDoc.boxes).map((box) => {
                          const isHovered = hoveredBoxId === box.id;
                          const isHeader = box.type === 'header';
                          const isTable = box.type === 'table';

                          const boxBg = isHovered 
                            ? 'rgba(37, 99, 235, 0.25)' 
                            : isTable ? 'rgba(245, 158, 11, 0.12)' : isHeader ? 'rgba(79, 70, 229, 0.12)' : 'rgba(16, 185, 129, 0.12)';
                          
                          const boxBorder = isHovered
                            ? '2px solid #2563eb'
                            : isTable ? '1px dashed #f59e0b' : isHeader ? '1px solid #4f46e5' : '1px solid #10b981';

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
                                background: boxBg,
                                border: boxBorder,
                                borderRadius: '3px',
                                cursor: 'pointer',
                                zIndex: isHovered ? 30 : 10,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {/* Hover Tooltip showing original and translated text */}
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
                                  whiteSpace: 'nowrap',
                                  zIndex: 50,
                                  boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                                  pointerEvents: 'none',
                                  marginBottom: '4px'
                                }}>
                                  <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '2px' }}>
                                    {box.type?.toUpperCase()} &bull; {box.confidence || 99}%
                                  </div>
                                  <div style={{ maxWidth: '280px', whiteSpace: 'normal', lineHeight: 1.3 }}>
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
                  ) : (
                    /* Standard fallback for non-PDF / demo documents */
                    <div style={{
                      padding: '1.5rem',
                      fontFamily: currentDoc.scriptType?.includes('Devanagari') ? "'Plus Jakarta Sans', sans-serif" : 'var(--font-mono)',
                      fontSize: `${(zoomLevel / 100) * 0.72}rem`,
                      lineHeight: 1.5,
                      color: '#334155',
                      whiteSpace: 'pre-wrap',
                      opacity: showBoundingBoxes ? 0.35 : 1.0,
                    }}>
                      {currentDoc.rawText}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Bottom helper info */}
          <div style={{
            padding: '0.75rem 1rem',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#64748b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: '#4f46e5', borderRadius: '2px' }} /> Header
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '2px' }} /> Entity
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '2px' }} /> Table
              </span>
            </div>
            <span>{currentDoc.boxes?.length || 0} Detected Regions</span>
          </div>
        </div>

        {/* ================= RIGHT PANE: EXTRACTION INSPECTOR ================= */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Tabs Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            overflowX: 'auto'
          }}>
            {[
              { id: 'entities', label: 'Entities (NER)', icon: Tag, count: currentDoc.entities?.length },
              { id: 'table', label: 'Tables', icon: TableIcon, count: currentDoc.table?.rows?.length },
              { id: 'text', label: 'Raw Text', icon: FileText },
              { id: 'translation', label: 'Translation', icon: Languages },
              { id: 'json', label: 'JSON API', icon: Code2 }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.85rem 1.1rem',
                    background: isActive ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                    color: isActive ? '#2563eb' : '#64748b',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span style={{
                      fontSize: '0.7rem',
                      background: isActive ? '#eff6ff' : '#e2e8f0',
                      color: isActive ? '#2563eb' : '#475569',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 700
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Actions Sub-bar */}
          <div style={{
            padding: '0.65rem 1rem',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleToggleSpeech}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 10px', color: isSpeaking ? '#2563eb' : '#475569' }}
              >
                {isSpeaking ? <VolumeX size={14} color="#ef4444" /> : <Volume2 size={14} />}
                <span>{isSpeaking ? 'Stop Audio' : 'Listen Text (TTS)'}</span>
              </button>

              <button
                onClick={() => handleCopy(currentDoc.rawText, 'Extracted Document Text')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                <Copy size={14} />
                <span>Copy Text</span>
              </button>
            </div>

            {activeTab === 'table' && (
              <button
                onClick={handleDownloadCSV}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                <Download size={14} />
                <span>Export Table CSV</span>
              </button>
            )}

            {activeTab === 'translation' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Target:</span>
                <select
                  value={targetTranslationLang}
                  onChange={(e) => {
                    setTargetTranslationLang(e.target.value);
                    setPdfTgtLang(e.target.value);
                  }}
                  className="form-select"
                  style={{ fontSize: '0.75rem', padding: '3px 8px', height: '28px', maxWidth: '180px' }}
                >
                  {backendLanguages.length > 0 ? (
                    backendLanguages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.region === 'India' ? '🇮🇳' : '🌐'} {l.name} ({l.code})
                      </option>
                    ))
                  ) : (
                    SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>

          {/* TAB CONTENT AREA */}
          <div style={{ padding: '1.25rem', minHeight: '420px', maxHeight: '560px', overflowY: 'auto' }}>
            
            {/* ====== TAB 1: KEY-VALUE ENTITIES (NER) ====== */}
            {activeTab === 'entities' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                  Semantic key-value pairs recognized with character-level confidence scores.
                </div>

                {currentDoc.entities?.map((ent, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#bfdbfe'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ flex: 1, marginRight: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: '#eff6ff',
                          color: '#2563eb'
                        }}>
                          {ent.tag}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                          {ent.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                        {ent.value}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                          {ent.confidence}%
                        </span>
                        <div style={{ width: '45px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${ent.confidence}%`, height: '100%', background: '#10b981' }} />
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopy(ent.value, ent.label)}
                        className="btn btn-ghost btn-sm"
                        title="Copy Value"
                        style={{ padding: '4px 6px', color: '#94a3b8' }}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ====== TAB 2: TABLE EXTRACTOR ====== */}
            {activeTab === 'table' && (
              <div>
                {currentDoc.table ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.85rem',
                      textAlign: 'left'
                    }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                          {currentDoc.table.headers.map((h, i) => (
                            <th key={i} style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentDoc.table.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            style={{
                              borderBottom: '1px solid #e2e8f0',
                              background: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'
                            }}
                          >
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} style={{ padding: '10px 12px', color: '#334155' }}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                    <TableIcon size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <p>No table structure detected in this document.</p>
                  </div>
                )}
              </div>
            )}

            {/* ====== TAB 3: RAW EXTRACTED TEXT ====== */}
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
                  fontFamily: currentDoc.scriptType?.includes('Devanagari') ? 'var(--font-sans)' : 'var(--font-mono)'
                }}>
                  {currentDoc.rawText}
                </pre>
              </div>
            )}

            {/* ====== TAB 4: NEURAL TRANSLATION & PDF RECONSTRUCTION ====== */}
            {activeTab === 'translation' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* 1. Offline Neural PDF Translation Control Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  color: '#ffffff',
                  boxShadow: '0 4px 15px -2px rgba(15, 23, 42, 0.15)',
                  border: '1px solid #334155'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}>
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                          Nexus Offline Neural PDF Translator
                        </h4>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                          IndicTrans2 & NLLB-200 with HarfBuzz OpenType vector layout reconstruction
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: isBackendOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${isBackendOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: isBackendOnline ? '#34d399' : '#f87171'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isBackendOnline ? '#10b981' : '#ef4444' }} />
                      <span>{isBackendOnline ? `FastAPI: ${backendDevice?.toUpperCase() || 'CPU'}` : 'Backend: Offline (Demo)'}</span>
                    </div>
                  </div>

                  {/* PDF Selection & Parameters */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '0.85rem',
                    marginBottom: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    {/* Source Lang */}
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        SOURCE SCRIPT / LANG
                      </label>
                      <select
                        value={pdfSrcLang}
                        onChange={(e) => setPdfSrcLang(e.target.value)}
                        style={{
                          width: '100%',
                          background: '#0f172a',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '0.82rem',
                          padding: '6px 10px'
                        }}
                      >
                        <option value="en">🇬🇧 English (eng_Latn)</option>
                        <option value="gu">🇮🇳 Gujarati (guj_Gujr)</option>
                        <option value="hi">🇮🇳 Hindi (hin_Deva)</option>
                        <option value="mr">🇮🇳 Marathi (mar_Deva)</option>
                        <option value="ta">🇮🇳 Tamil (tam_Taml)</option>
                        <option value="bn">🇮🇳 Bengali (ben_Beng)</option>
                        <option value="de">🇩🇪 German (deu_Latn)</option>
                        <option value="es">🇪🇸 Spanish (spa_Latn)</option>
                        <option value="fr">🇫🇷 French (fra_Latn)</option>
                      </select>
                    </div>

                    {/* Target Lang */}
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        TARGET INDIC / GLOBAL
                      </label>
                      <select
                        value={pdfTgtLang}
                        onChange={(e) => {
                          setPdfTgtLang(e.target.value);
                          setTargetTranslationLang(e.target.value);
                        }}
                        style={{
                          width: '100%',
                          background: '#0f172a',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '0.82rem',
                          padding: '6px 10px'
                        }}
                      >
                        {backendLanguages.length > 0 ? (
                          backendLanguages.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.region === 'India' ? '🇮🇳' : '🌐'} {l.name} ({l.primary_model?.includes('IndicTrans2') ? 'IndicTrans2' : 'NLLB'})
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="gu">🇮🇳 Gujarati (IndicTrans2 1B)</option>
                            <option value="hi">🇮🇳 Hindi (IndicTrans2 1B)</option>
                            <option value="mr">🇮🇳 Marathi (IndicTrans2 1B)</option>
                            <option value="ta">🇮🇳 Tamil (IndicTrans2 1B)</option>
                            <option value="te">🇮🇳 Telugu (IndicTrans2 1B)</option>
                            <option value="kn">🇮🇳 Kannada (IndicTrans2 1B)</option>
                            <option value="bn">🇮🇳 Bengali (IndicTrans2 1B)</option>
                            <option value="pa">🇮🇳 Punjabi (IndicTrans2 1B)</option>
                            <option value="es">🇪🇸 Spanish (NLLB-200)</option>
                            <option value="de">🇩🇪 German (NLLB-200)</option>
                            <option value="fr">🇫🇷 French (NLLB-200)</option>
                            <option value="ja">🇯🇵 Japanese (NLLB-200)</option>
                            <option value="ar">🇦🇪 Arabic (NLLB-200)</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Max Pages */}
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        PAGE RANGE (OPTIONAL)
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="All pages (or e.g. 5)"
                        value={pdfMaxPages}
                        onChange={(e) => setPdfMaxPages(e.target.value)}
                        style={{
                          width: '100%',
                          background: '#0f172a',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '0.82rem',
                          padding: '6px 10px'
                        }}
                      />
                    </div>
                  </div>

                  {/* Submission Action Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                      {uploadedPdf ? (
                        <span>Selected PDF: <strong style={{ color: '#38bdf8' }}>{uploadedPdf.name}</strong> ({(uploadedPdf.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      ) : (
                        <span>Upload any PDF above or choose a preset to translate.</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                      >
                        <Upload size={14} />
                        <span>{uploadedPdf ? 'Change PDF' : 'Select PDF'}</span>
                      </button>

                      <button
                        onClick={handleStartPdfTranslation}
                        disabled={isTranslatingPdf || !uploadedPdf}
                        className="btn btn-primary btn-sm"
                        style={{
                          fontWeight: 700,
                          background: uploadedPdf ? 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' : '#475569',
                          border: 'none',
                          cursor: uploadedPdf ? 'pointer' : 'not-allowed',
                          opacity: uploadedPdf ? 1 : 0.6
                        }}
                      >
                        {isTranslatingPdf ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Translating PDF...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Start Neural Translation</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Active Job Status & Download Telemetry Card */}
                {activePdfJob && (
                  <div style={{
                    background: activePdfJob.status === 'completed' ? '#f0fdf4' : '#f8fafc',
                    borderRadius: '12px',
                    border: `1px solid ${activePdfJob.status === 'completed' ? '#86efac' : '#e2e8f0'}`,
                    padding: '1.25rem',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                          Job ID: <strong style={{ color: '#0f172a' }}>{activePdfJob.job_id}</strong>
                        </span>
                        <span className={`badge ${
                          activePdfJob.status === 'completed' ? 'badge-success' :
                          activePdfJob.status === 'processing' ? 'badge-primary' :
                          activePdfJob.status === 'failed' ? 'badge-danger' : 'badge-neutral'
                        }`}>
                          {activePdfJob.status.toUpperCase()}
                        </span>
                      </div>

                      {(() => {
                        const isDone = activePdfJob.status === 'completed';
                        const tPages = activePdfJob.total_pages || 0;
                        const cPages = activePdfJob.completed_pages || 0;
                        const pct = isDone
                          ? 100
                          : tPages > 0
                          ? Math.min(100, Math.round((cPages / tPages) * 100))
                          : Math.round(activePdfJob.progress || 0);

                        return (
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                            {pct > 0 ? `${pct}%` : 'Processing...'}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '0.75rem'
                    }}>
                      {(() => {
                        const isDone = activePdfJob.status === 'completed';
                        const tPages = activePdfJob.total_pages || 0;
                        const cPages = activePdfJob.completed_pages || 0;
                        const pct = isDone
                          ? 100
                          : tPages > 0
                          ? Math.min(100, Math.round((cPages / tPages) * 100))
                          : Math.round(activePdfJob.progress || 5);
                        return (
                          <div style={{
                            width: `${Math.max(4, Math.min(100, pct))}%`,
                            height: '100%',
                            background: isDone ? '#10b981' : 'linear-gradient(90deg, #2563eb, #06b6d4)',
                            transition: 'width 0.4s ease'
                          }} />
                        );
                      })()}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {activePdfJob.status === 'completed' ? (
                          <strong style={{ color: '#10b981' }}>✓ Completed with HarfBuzz complex-script layout reconstruction</strong>
                        ) : activePdfJob.total_pages > 0 ? (
                          `Processed ${activePdfJob.completed_pages || 0} of ${activePdfJob.total_pages} pages (${Math.min(100, Math.round(((activePdfJob.completed_pages || 0) / activePdfJob.total_pages) * 100))}%)`
                        ) : (
                          'Extracting typography vectors, chunking tokens & running inference...'
                        )}
                      </span>

                      {activePdfJob.status === 'completed' && (
                        <button
                          onClick={() => nexusApi.downloadTranslatedPdf(activePdfJob.job_id, `translated_${activePdfJob.filename}`)}
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
                    </div>
                  </div>
                )}

                {/* 3. Textual Content & Machine Translation Preview */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: '#ecfeff',
                      border: '1px solid #a5f3fc',
                      color: '#0e7490',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      <Globe2 size={14} />
                      <span>
                        Textual Translation Preview &rarr; {targetTranslationLang.toUpperCase()} (Page {currentPageNum})
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleCopy(activePageData?.translated_text || currentDoc.translations[targetTranslationLang] || currentDoc.rawText, 'Translated Text')}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                      >
                        <Copy size={13} />
                        <span>Copy Page Text</span>
                      </button>

                      <button
                        onClick={handleToggleSpeech}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                      >
                        {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Page Selector Pills */}
                  {activePdfJob && (activePdfJob.completed_pages > 1 || activePdfJob.total_pages > 1) && (
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      overflowX: 'auto',
                      paddingBottom: '8px',
                      marginBottom: '10px'
                    }}>
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

                  {/* Page Full Text Box */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    color: '#0f172a',
                    whiteSpace: 'pre-wrap',
                    marginBottom: '1rem',
                    fontFamily: ['hi', 'mr', 'gu', 'sa'].includes(targetTranslationLang) ? 'var(--font-sans)' : 'inherit',
                    maxHeight: '260px',
                    overflowY: 'auto'
                  }}>
                    {activePageData?.translated_text || 
                     currentDoc.translations[targetTranslationLang] || 
                     currentDoc.translations['en'] || 
                     `[Neural Translation Engine]: ${currentDoc.rawText}`}
                  </div>

                  {/* Structured Block Inspector (Source ➔ Translated) */}
                  {activePageData?.blocks && activePageData.blocks.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Translated Layout Blocks ({activePageData.blocks.length})
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                        {activePageData.blocks.map((blk, idx) => (
                          <div
                            key={blk.id || idx}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '10px',
                              fontSize: '0.8rem',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: blk.type === 'header' ? '#4f46e5' : '#059669', background: blk.type === 'header' ? '#eef2ff' : '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
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

              </div>
            )}

            {/* ====== TAB 5: JSON REST API PAYLOAD ====== */}
            {activeTab === 'json' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                  <button
                    onClick={() => handleCopy(JSON.stringify(currentDoc, null, 2), 'JSON Payload')}
                    className="btn btn-secondary btn-sm"
                  >
                    <Copy size={14} />
                    <span>Copy JSON</span>
                  </button>
                </div>
                <pre style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  fontSize: '0.78rem',
                  lineHeight: 1.5,
                  overflowX: 'auto',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {JSON.stringify(currentDoc, null, 2)}
                </pre>
              </div>
            )}

          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          div[style*="grid-template-columns: minmax(320px, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
