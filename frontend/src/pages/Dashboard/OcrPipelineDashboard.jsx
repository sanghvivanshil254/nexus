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
  ChevronDown
} from 'lucide-react';
import { SAMPLE_DOCUMENTS, SUPPORTED_LANGUAGES, OCR_PIPELINE_STAGES } from '../../data/sampleDocuments';
import { runClientSideOCR } from '../../utils/ocrEngine';
import { useToast } from '../../components/Toast';

export const OcrPipelineDashboard = ({ user }) => {
  const { addToast } = useToast();
  
  // State
  const [selectedDocId, setSelectedDocId] = useState(SAMPLE_DOCUMENTS[0].id);
  const [selectedLang, setSelectedLang] = useState('auto');
  const [activeTab, setActiveTab] = useState('entities'); // entities, text, table, translation, json
  const [targetTranslationLang, setTargetTranslationLang] = useState('en');
  
  // Custom uploaded document state
  const [customDoc, setCustomDoc] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(100);
  const [currentStageName, setCurrentStageName] = useState('Ready');
  
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

  // Custom File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-primary">
                {currentDoc.language}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {currentDoc.confidenceScore}% Confidence
              </span>
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
                onClick={() => setZoomLevel(Math.max(70, zoomLevel - 15))}
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
                onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))}
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

          {/* Interactive Visual Canvas Area */}
          <div style={{
            position: 'relative',
            background: '#0f172a',
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
              width: `${(zoomLevel / 100) * 440}px`,
              minHeight: `${(zoomLevel / 100) * 580}px`,
              background: '#ffffff',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              borderRadius: '4px',
              padding: '1.5rem',
              transition: 'width 0.2s ease, min-height 0.2s ease',
              userSelect: 'none',
              overflow: 'hidden'
            }}>
              
              {/* Document Text Rendering Background */}
              <div style={{
                fontFamily: currentDoc.scriptType?.includes('Devanagari') ? "'Plus Jakarta Sans', sans-serif" : 'var(--font-mono)',
                fontSize: `${(zoomLevel / 100) * 0.72}rem`,
                lineHeight: 1.5,
                color: '#334155',
                whiteSpace: 'pre-wrap',
                opacity: showBoundingBoxes ? 0.35 : 1.0,
                transition: 'opacity 0.2s ease'
              }}>
                {currentDoc.rawText}
              </div>

              {/* Bounding Box Overlays */}
              {showBoundingBoxes && currentDoc.boxes && currentDoc.boxes.map((box) => {
                const isHovered = hoveredBoxId === box.id;
                const isTable = box.type === 'table';
                const isHeader = box.type === 'header';

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
                      zIndex: isHovered ? 20 : 10,
                      transition: 'all 0.15s ease'
                    }}
                    title={`${box.text} (${box.confidence}%)`}
                  >
                    {/* Confidence Pill on Box */}
                    <div style={{
                      position: 'absolute',
                      top: '-18px',
                      left: '0',
                      background: isHovered ? '#2563eb' : '#0f172a',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      opacity: isHovered ? 1 : 0.85
                    }}>
                      {box.confidence}%
                    </div>
                  </div>
                );
              })}

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
                  onChange={(e) => setTargetTranslationLang(e.target.value)}
                  className="form-select"
                  style={{ fontSize: '0.75rem', padding: '3px 8px', height: '28px' }}
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="hi">🇮🇳 Hindi</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="ja">🇯🇵 Japanese</option>
                  <option value="ar">🇦🇪 Arabic</option>
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

            {/* ====== TAB 4: NEURAL TRANSLATION ====== */}
            {activeTab === 'translation' && (
              <div>
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
                  marginBottom: '1rem'
                }}>
                  <Globe2 size={14} />
                  <span>
                    Translated from {currentDoc.language.split(' ')[0]} &rarr; {targetTranslationLang.toUpperCase()}
                  </span>
                </div>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  color: '#0f172a',
                  whiteSpace: 'pre-wrap'
                }}>
                  {currentDoc.translations[targetTranslationLang] || 
                   currentDoc.translations['en'] || 
                   `[Machine Translation Engine]: ${currentDoc.rawText}`}
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
