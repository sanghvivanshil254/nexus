import React, { useState } from 'react';
import { 
  FileSearch, 
  Sparkles, 
  ArrowRight, 
  Globe2, 
  Layers, 
  Table as TableIcon, 
  Languages, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Code2, 
  ScanText, 
  Eye, 
  ChevronRight,
  Database,
  Lock,
  Download
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/sampleDocuments';

export const LandingPage = ({ setCurrentView, user }) => {
  const [selectedLangIndex, setSelectedLangIndex] = useState(0);

  const FEATURED_ENGINES = [
    {
      code: 'gu',
      name: 'Gujarati (ગુજરાતી)',
      flag: '🇮🇳',
      engine: 'IndicTrans2 1B (CUDA fp16)',
      script: 'Gujarati Complex Script',
      shaper: 'HarfBuzz OpenType Ligatures',
      vram: '~1.5 GB VRAM',
      latency: '240ms / page',
      accuracy: '99.4%',
      features: ['Full Conjunct Vowel Ligatures', 'Vector Bounding Box Alignment', 'Preserved Line Heights']
    },
    {
      code: 'hi',
      name: 'Hindi (हिन्दी)',
      flag: '🇮🇳',
      engine: 'IndicTrans2 1B (CUDA fp16)',
      script: 'Devanagari Complex Script',
      shaper: 'HarfBuzz OpenType Ligatures',
      vram: '~1.5 GB VRAM',
      latency: '220ms / page',
      accuracy: '99.6%',
      features: ['Halant & Matra Reconstruction', 'Multi-column Table Detection', 'Zero-leakage Streaming']
    },
    {
      code: 'ru',
      name: 'Russian (Русский)',
      flag: '🇷🇺',
      engine: 'Universal Neural Router',
      script: 'Cyrillic Script',
      shaper: 'MuPDF Font Embedding',
      vram: '0 MB VRAM (Lightweight)',
      latency: '150ms / page',
      accuracy: '99.2%',
      features: ['Case-sensitive Morphology', 'Exact Paragraph Reflow', 'Instant Page Rendering']
    },
    {
      code: 'es',
      name: 'Spanish (Español)',
      flag: '🇪🇸',
      engine: 'Universal Neural Router',
      script: 'Latin Extended',
      shaper: 'Vector Typography Shaper',
      vram: '0 MB VRAM (Lightweight)',
      latency: '140ms / page',
      accuracy: '99.5%',
      features: ['Inverted Punctuation ¿¡', 'Dynamic Kerning', 'Vector PDF Reconstruction']
    },
    {
      code: 'ja',
      name: 'Japanese (日本語)',
      flag: '🇯🇵',
      engine: 'Universal Neural Router',
      script: 'CJK (Kanji / Kana)',
      shaper: 'Noto Sans CJK Shaper',
      vram: '0 MB VRAM (Lightweight)',
      latency: '180ms / page',
      accuracy: '99.1%',
      features: ['Vertical & Horizontal Flow', 'Ruby Text Support', 'Layout Preservation']
    },
    {
      code: 'ar',
      name: 'Arabic (العربية)',
      flag: '🇦🇪',
      engine: 'Universal Neural Router',
      script: 'Arabic (RTL)',
      shaper: 'FriBidi RTL Shaper',
      vram: '0 MB VRAM (Lightweight)',
      latency: '160ms / page',
      accuracy: '99.3%',
      features: ['Right-to-Left Directionality', 'Cursive Letter Shaping', 'Complex Contextual Glyphs']
    }
  ];

  const activeEngine = FEATURED_ENGINES[selectedLangIndex] || FEATURED_ENGINES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem', paddingBottom: '4rem' }}>
      
      {/* ================= HERO SECTION ================= */}
      <section style={{
        position: 'relative',
        paddingTop: '4rem',
        paddingBottom: '2rem',
        overflow: 'hidden'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 'clamp(2rem, 4vw, 3.5rem)',
            alignItems: 'center'
          }}>
            
            {/* Left Hero Text */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '30px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#2563eb',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)'
              }}>
                <Sparkles size={16} />
                <span>Multilingual Transformer Pipeline v2.4</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2.3rem, 4.5vw, 3.4rem)',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                marginBottom: '1.25rem'
              }}>
                Multilingual Document <br />
                <span style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  OCR & Entity Extraction
                </span>
              </h1>

              <p style={{
                fontSize: '1.1rem',
                color: '#475569',
                lineHeight: 1.65,
                marginBottom: '2rem',
                maxWidth: '560px'
              }}>
                Transform messy invoices, passports, medical summaries, and contracts across 
                <strong> 100+ languages and complex scripts</strong> into structured JSON, 
                key-value entities, and verified data tables in milliseconds.
              </p>

              {/* Action CTA Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem' }}>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="btn btn-primary btn-lg"
                  style={{ fontWeight: 700 }}
                >
                  <FileSearch size={19} />
                  <span>Launch OCR Studio</span>
                  <ArrowRight size={17} />
                </button>

                {!user && (
                  <button
                    onClick={() => setCurrentView('register')}
                    className="btn btn-secondary btn-lg"
                    style={{ fontWeight: 600 }}
                  >
                    <span>Start Free Trial</span>
                  </button>
                )}

                <button
                  onClick={() => setCurrentView('batch')}
                  className="btn btn-outline btn-lg"
                  style={{ fontWeight: 600 }}
                >
                  <Layers size={18} />
                  <span>Batch Queue</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '1.5rem',
                fontSize: '0.85rem',
                color: '#64748b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>99.4% Multi-Script Accuracy</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Sub-second Latency</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>SOC2 & HIPAA Compliant</span>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Mini-Studio Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              padding: '1.5rem',
              position: 'relative'
            }}>
              {/* Header inside card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                borderBottom: '1px solid #f1f5f9',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px #10b981'
                  }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    Neural Engine Architecture
                  </span>
                </div>
                <span className="badge badge-primary">
                  {activeEngine.flag} {activeEngine.name.split(' ')[0]}
                </span>
              </div>

              {/* Language Engine switcher pills */}
              <div style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                marginBottom: '1rem'
              }}>
                {FEATURED_ENGINES.map((eng, idx) => (
                  <button
                    key={eng.code}
                    onClick={() => setSelectedLangIndex(idx)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: selectedLangIndex === idx ? '#2563eb' : '#e2e8f0',
                      background: selectedLangIndex === idx ? '#eff6ff' : '#ffffff',
                      color: selectedLangIndex === idx ? '#2563eb' : '#64748b',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {eng.flag} {eng.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Neural Model Engine Architecture Card */}
              <div style={{
                position: 'relative',
                background: '#0f172a',
                borderRadius: '12px',
                border: '1px solid #1e293b',
                padding: '1.25rem',
                minHeight: '240px',
                overflow: 'hidden',
                marginBottom: '1rem',
                color: '#f8fafc'
              }}>
                {/* Visualizer header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Target Pipeline Engine
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                    {activeEngine.vram}
                  </span>
                </div>

                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
                  {activeEngine.engine}
                </div>
                
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '12px' }}>
                  Font Shaper: <strong style={{ color: '#e2e8f0' }}>{activeEngine.shaper}</strong>
                </div>

                {/* Features checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  {activeEngine.features.map((feat, fIdx) => (
                    <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                      <CheckCircle2 size={13} color="#34d399" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '0.72rem',
                  color: '#94a3b8'
                }}>
                  Live Routing: Translates into <strong>{activeEngine.name}</strong> preserving complex ligatures, font weights, and bounding boxes.
                </div>
              </div>

              {/* Extraction Stats Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                textAlign: 'center',
                background: '#f8fafc',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #f1f5f9',
                marginBottom: '1rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Accuracy</span>
                  <strong style={{ fontSize: '0.95rem', color: '#10b981' }}>{activeEngine.accuracy}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Script</span>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{activeEngine.script.split(' ')[0]}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Latency</span>
                  <strong style={{ fontSize: '0.95rem', color: '#2563eb' }}>{activeEngine.latency}</strong>
                </div>
              </div>

              {/* Inspect in Full Studio button */}
              <button
                onClick={() => setCurrentView('dashboard')}
                className="btn btn-primary btn-block btn-sm"
              >
                <span>Open in Full OCR Studio</span>
                <ChevronRight size={15} />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ================= PIPELINE ARCHITECTURE FLOW ================= */}
      <section className="container">
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
          <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>
            Multi-Stage Architecture
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            How the Multilingual Pipeline Works
          </h2>
          <p style={{ color: '#64748b' }}>
            From raw, skewed multi-language scans to structured downstream JSON records in 5 neural pipeline stages.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: '1.25rem',
          position: 'relative'
        }}>
          {[
            {
              step: '01',
              title: 'Pre-Processing',
              desc: 'Adaptive binarization, skew correction, noise suppression & contrast equalizing.',
              icon: ScanText,
              color: '#3b82f6'
            },
            {
              step: '02',
              title: 'Layout Analysis',
              desc: 'Neural segmentation of blocks, columns, headers, barcodes, and table coordinates.',
              icon: Layers,
              color: '#4f46e5'
            },
            {
              step: '03',
              title: 'Multi-Script OCR',
              desc: 'Deep Vision Transformers recognizing Devanagari, Arabic, CJK, Cyrillic, & Latin.',
              icon: Globe2,
              color: '#06b6d4'
            },
            {
              step: '04',
              title: 'Entity & Table Parser',
              desc: 'Extracting key-value records (amounts, dates, tax IDs) and generating CSV tables.',
              icon: TableIcon,
              color: '#10b981'
            },
            {
              step: '05',
              title: 'Neural Translation',
              desc: 'Side-by-side automatic translation into 30+ target languages and REST JSON export.',
              icon: Languages,
              color: '#f59e0b'
            }
          ].map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={idx}
                className="card card-hover"
                style={{
                  padding: '1.75rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  position: 'relative'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: `${stage.color}15`,
                    color: stage.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={22} />
                  </div>
                  <span style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: '#e2e8f0',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {stage.step}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  {stage.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                  {stage.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= CORE CAPABILITIES & FEATURES ================= */}
      <section style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '4.5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3.5rem' }}>
            <span className="badge badge-success" style={{ marginBottom: '0.75rem' }}>
              Enterprise Grade Engine
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
              Engineered for Complex Document Types
            </h2>
            <p style={{ color: '#64748b' }}>
              Handle diverse document topologies with high accuracy and low latency.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 'clamp(1rem, 3vw, 2rem)'
          }}>
            <div className="card card-hover" style={{ padding: '2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Globe2 size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Universal Multi-Script Support
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Native recognition of Right-to-Left (Arabic, Hebrew), CJK ideographs (Japanese, Chinese), Devanagari (Hindi, Marathi), Cyrillic, and extended Latin diacritics without script confusion.
              </p>
            </div>

            <div className="card card-hover" style={{ padding: '2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <TableIcon size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Automated Table & Grid Extraction
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Identify borderless tables, multi-line row entries, and complex headers. Export directly to clean HTML tables, CSV, or nested JSON structures for your ERP or database.
              </p>
            </div>

            <div className="card card-hover" style={{ padding: '2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#eef2ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Cpu size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Semantic Named Entity Recognition
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Automatically tag and extract critical fields like Tax IDs, Total Amounts, Due Dates, Names, Addresses, and Banking IBANs with statistical confidence scores.
              </p>
            </div>

            <div className="card card-hover" style={{ padding: '2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#fffbeb',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Layers size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                High-Throughput Batch Pipeline
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Queue hundreds of documents simultaneously. Monitor live pipeline status, progress bars, and download consolidated zip archives with full JSON metadata.
              </p>
            </div>

            <div className="card card-hover" style={{ padding: '2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#ecfeff',
                color: '#06b6d4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Languages size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Integrated Neural Translation
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Translate extracted foreign texts (e.g. Japanese certificates or German invoices) into English, Spanish, French, or Hindi in one synchronized view.
              </p>
            </div>

            <div className="card card-hover" style={{ padding: '2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#f8fafc',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Code2 size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Developer-First REST & Webhooks API
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Plug NexusOCR into your Python, Node.js, Go, or Java microservices with standard multipart upload endpoints and asynchronous webhook callbacks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SUPPORTED LANGUAGES MATRIX ================= */}
      <section className="container">
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem' }}>
          <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>
            Universal Linguistic Matrix
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            Supported Languages & Script Families
          </h2>
          <p style={{ color: '#64748b' }}>
            Engineered with deep learning models trained on millions of authentic multilingual real-world documents.
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))',
            gap: '10px'
          }}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <div
                key={lang.code}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', display: 'block' }}>
                    {lang.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {lang.script}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL CALL TO ACTION ================= */}
      <section className="container">
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #4f46e5 100%)',
          borderRadius: '24px',
          padding: '4rem 2rem',
          color: '#ffffff',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -15px rgba(37, 99, 235, 0.4)'
        }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, color: '#ffffff', marginBottom: '1rem' }}>
              Ready to automate your multilingual document workflow?
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.6, marginBottom: '2rem' }}>
              Try our live interactive OCR Studio or create a free enterprise account to get 5,000 monthly extraction credits.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="btn btn-lg"
                style={{ background: '#ffffff', color: '#1e40af', fontWeight: 700 }}
              >
                <FileSearch size={19} />
                <span>Open OCR Studio</span>
              </button>

              {!user && (
                <button
                  onClick={() => setCurrentView('register')}
                  className="btn btn-lg btn-outline"
                  style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)' }}
                >
                  <Sparkles size={18} />
                  <span>Create Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
