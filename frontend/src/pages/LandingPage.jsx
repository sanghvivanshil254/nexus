import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  Database,
  Lock,
  Download,
  Terminal,
  Activity,
  Workflow
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/sampleDocuments';

export const LandingPage = ({ setCurrentView, user }) => {
  const [selectedLangIndex, setSelectedLangIndex] = useState(0);
  const [carouselProgress, setCarouselProgress] = useState(0);
  const carouselRef = useRef(null);
  const pageContainerRef = useRef(null);

  // Progressive Fallback: Apply IntersectionObserver for browsers without CSS view-timeline support
  useEffect(() => {
    const supportsViewTimeline = 
      typeof window !== 'undefined' && 
      window.CSS && 
      CSS.supports && 
      CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

    if (!supportsViewTimeline) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('sda-fallback-visible');
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
      );

      const elements = document.querySelectorAll('.sda-reveal, .sda-reveal-clip');
      elements.forEach((el) => {
        el.classList.add('sda-fallback-hidden');
        observer.observe(el);
      });

      return () => observer.disconnect();
    }
  }, []);

  // Horizontal Carousel Step Indicator Handler (scroll-driven-animations.style demo inspired)
  const handleCarouselScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        const progress = Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100));
        setCarouselProgress(progress);
      }
    }
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 340;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
    <div ref={pageContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '5.5rem', paddingBottom: '4rem', position: 'relative' }}>
      
      {/* 1. SCROLL-DRIVEN READING PROGRESS INDICATOR (scroll-driven-animations.style) */}
      <div className="scroll-progress-line" title="Scroll Progress" />

      {/* ================= HERO SECTION WITH PARALLAX & GLOW ================= */}
      <section style={{
        position: 'relative',
        paddingTop: 'clamp(2.5rem, 5vw, 4.5rem)',
        paddingBottom: '2rem',
        overflow: 'hidden'
      }}>
        {/* Background Ambient Glow (Shrinks & expands with scroll) */}
        <div 
          className="sda-hero-glow"
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-100px',
            width: 'clamp(350px, 45vw, 650px)',
            height: 'clamp(350px, 45vw, 650px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.16) 0%, rgba(79, 70, 229, 0.08) 50%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0
          }} 
        />
        <div 
          className="sda-hero-glow"
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: 'clamp(300px, 40vw, 550px)',
            height: 'clamp(300px, 40vw, 550px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(16, 185, 129, 0.06) 50%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0
          }} 
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 'clamp(2rem, 4vw, 4rem)',
            alignItems: 'center'
          }}>
            
            {/* Left Hero Text Content (Parallax subtly on scroll) */}
            <div className="sda-hero-parallax">
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
                boxShadow: '0 2px 10px rgba(37, 99, 235, 0.08)'
              }}>
                <Sparkles size={16} />
                <span>AI4Bharat IndicTrans2 1B & Meta NLLB-200 v2.4</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2.4rem, 4.8vw, 3.6rem)',
                fontWeight: 900,
                color: '#0f172a',
                lineHeight: 1.12,
                letterSpacing: '-0.035em',
                marginBottom: '1.25rem'
              }}>
                Offline Multilingual PDF <br />
                <span style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Translation & Layout Engine
                </span>
              </h1>

              <p style={{
                fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
                color: '#475569',
                lineHeight: 1.65,
                marginBottom: '2rem',
                maxWidth: '560px'
              }}>
                Translate dense multi-page books and complex scans across <strong>100+ languages</strong> with 
                <strong> native HarfBuzz OpenType shaping</strong>, keeping every table, typography weight, and illustration geometry 100% intact.
              </p>

              {/* Action CTA Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem' }}>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="btn btn-primary btn-lg"
                  style={{ fontWeight: 700, padding: '12px 24px', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.28)' }}
                >
                  <FileSearch size={20} />
                  <span>Launch OCR Studio</span>
                  <ArrowRight size={17} />
                </button>

                {user?.isAdmin ? (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="btn btn-secondary btn-lg"
                    style={{ fontWeight: 700, background: '#0f172a', color: '#38bdf8', border: '1px solid #334155' }}
                  >
                    <ShieldCheck size={18} />
                    <span>Admin Audit Console</span>
                  </button>
                ) : !user ? (
                  <button
                    onClick={() => setCurrentView('register')}
                    className="btn btn-secondary btn-lg"
                    style={{ fontWeight: 600 }}
                  >
                    <span>Start Free Trial</span>
                  </button>
                ) : null}

                <button
                  onClick={() => setCurrentView('batch')}
                  className="btn btn-outline btn-lg"
                  style={{ fontWeight: 600 }}
                >
                  <Layers size={18} />
                  <span>Batch Queue</span>
                </button>
              </div>

              {/* Trust & Hardware Indicators */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '1.25rem',
                fontSize: '0.84rem',
                color: '#64748b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>99.4% Multi-Script Shaping</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Zero Cloud Leaks (100% Offline)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>CUDA Accelerated fp16</span>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Mini-Studio Card */}
            <div 
              className="card sda-reveal-clip"
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.8)',
                padding: 'clamp(1.25rem, 3vw, 1.75rem)',
                position: 'relative'
              }}
            >
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
                    boxShadow: '0 0 10px #10b981'
                  }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
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
                      padding: '5px 11px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: selectedLangIndex === idx ? '#2563eb' : '#e2e8f0',
                      background: selectedLangIndex === idx ? '#eff6ff' : '#ffffff',
                      color: selectedLangIndex === idx ? '#2563eb' : '#64748b',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {eng.flag} {eng.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Neural Model Engine Architecture Card */}
              <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '14px',
                border: '1px solid #334155',
                padding: '1.25rem',
                minHeight: '230px',
                overflow: 'hidden',
                marginBottom: '1rem',
                color: '#f8fafc',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
              }}>
                {/* Visualizer header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Target Pipeline Engine
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                    {activeEngine.vram}
                  </span>
                </div>

                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
                  {activeEngine.engine}
                </div>
                
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '12px' }}>
                  Font Shaper: <strong style={{ color: '#e2e8f0' }}>{activeEngine.shaper}</strong>
                </div>

                {/* Features checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  {activeEngine.features.map((feat, fIdx) => (
                    <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                      <CheckCircle2 size={13} color="#34d399" style={{ flexShrink: 0 }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.74rem',
                  color: '#94a3b8',
                  lineHeight: 1.4
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
                borderRadius: '12px',
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
                className="btn btn-primary btn-block"
                style={{ padding: '10px' }}
              >
                <span>Launch Interactive Studio</span>
                <ChevronRight size={16} />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ================= PIPELINE ARCHITECTURE FLOW (STACKED CARDS / SEQUENTIAL ENTRY) ================= */}
      <section className="container">
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem' }} className="sda-reveal">
          <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>
            Multi-Stage Architecture
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
            How the Multilingual Pipeline Works
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            From raw, skewed multi-language scans to structured downstream JSON records and shaped vector PDFs in 5 neural stages.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
          gap: '1.25rem',
          position: 'relative'
        }}>
          {[
            {
              step: '01',
              title: 'Pre-Processing',
              desc: 'Adaptive binarization, skew correction, noise suppression & scanner glyph cleanup.',
              icon: ScanText,
              color: '#3b82f6'
            },
            {
              step: '02',
              title: 'Layout Analysis',
              desc: 'Neural segmentation of blocks, columns, headers, tables, and bounding boxes.',
              icon: Layers,
              color: '#4f46e5'
            },
            {
              step: '03',
              title: 'Multi-Script OCR',
              desc: 'Deep Vision Transformers recognizing Devanagari, Gujarati, Arabic, CJK, & Latin.',
              icon: Globe2,
              color: '#06b6d4'
            },
            {
              step: '04',
              title: 'Entity & Table Parser',
              desc: 'Extracting key-value records (amounts, dates, tax IDs) and table coordinates.',
              icon: TableIcon,
              color: '#10b981'
            },
            {
              step: '05',
              title: 'HarfBuzz Vector Shaping',
              desc: 'White redaction + HarfBuzz Story text overlay with zero font clipping.',
              icon: Languages,
              color: '#f59e0b'
            }
          ].map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={idx}
                className="card card-hover sda-reveal"
                style={{
                  padding: '1.75rem 1.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  position: 'relative',
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${stage.color}15`,
                    color: stage.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={22} />
                  </div>
                  <span style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: '#cbd5e1',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {stage.step}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0f172a' }}>
                  {stage.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.55 }}>
                  {stage.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= STEPPED HORIZONTAL CAROUSEL (scroll-driven-animations.style) ================= */}
      <section className="container sda-reveal">
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <span className="badge badge-primary">Interactive Stepped Scroller</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>41+ High-Resource Scripts</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#0f172a' }}>
              Supported Languages & Script Families
            </h2>
          </div>

          {/* Carousel Navigation Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => scrollCarousel('left')}
              className="btn btn-secondary btn-sm"
              style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Previous languages"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="btn btn-secondary btn-sm"
              style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Next languages"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Stepped Progress Bar Indicator */}
        <div style={{
          height: '4px',
          background: '#e2e8f0',
          borderRadius: '4px',
          marginBottom: '1.5rem',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.max(15, carouselProgress)}%`,
            background: 'linear-gradient(90deg, #2563eb, #7c3aed, #06b6d4)',
            borderRadius: '4px',
            transition: 'width 0.15s ease-out'
          }} />
        </div>

        {/* Horizontal Track Container */}
        <div 
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="sda-carousel-track"
        >
          {SUPPORTED_LANGUAGES.map((lang, idx) => (
            <div
              key={lang.code}
              className="card sda-carousel-item"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '2rem' }}>{lang.flag}</span>
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                  {lang.code.toUpperCase()}
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
                  {lang.name}
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {lang.script}
                </span>
              </div>

              <div style={{
                paddingTop: '8px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: '#2563eb',
                fontWeight: 600
              }}>
                <span>IndicTrans2 / NLLB</span>
                <ChevronRight size={13} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CORE CAPABILITIES & BENCHMARKS (REVEAL ENTRY) ================= */}
      <section style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.5rem' }} className="sda-reveal">
            <span className="badge badge-success" style={{ marginBottom: '0.75rem' }}>
              Production Grade Engine
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
              Engineered for Real-World PDF Typography
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>
              Complex document topologies rendered with micro-exact bounding boxes and HarfBuzz ligature vector shaper.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 'clamp(1rem, 2.5vw, 2rem)'
          }}>
            <div className="card card-hover sda-reveal" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Globe2 size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                Universal Multi-Script Support
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Native recognition of Right-to-Left (Arabic, Hebrew), CJK ideographs (Japanese, Chinese), Devanagari (Hindi, Marathi), Cyrillic, and extended Latin diacritics without script confusion.
              </p>
            </div>

            <div className="card card-hover sda-reveal" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <TableIcon size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                Automated Table & Grid Extraction
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Identify borderless tables, multi-line row entries, and complex headers. Export directly to clean HTML tables, CSV, or nested JSON structures for your ERP or database.
              </p>
            </div>

            <div className="card card-hover sda-reveal" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: '#eef2ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Cpu size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                Semantic Named Entity Recognition
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Automatically tag and extract critical fields like Tax IDs, Total Amounts, Due Dates, Names, Addresses, and Banking IBANs with statistical confidence scores.
              </p>
            </div>

            <div className="card card-hover sda-reveal" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: '#fffbeb',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Layers size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                High-Throughput Batch Pipeline
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Queue hundreds of documents simultaneously. Monitor live pipeline status, progress bars, and download consolidated zip archives with full JSON metadata.
              </p>
            </div>

            <div className="card card-hover sda-reveal" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: '#ecfeff',
                color: '#06b6d4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Languages size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                HarfBuzz Story Typography Overlay
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Correctly shapes Indic conjuncts (ક્ષ, જ્ઞ, ત્ર, દ્વ) and matras (િ, ી, ુ, ૂ) using MuPDF Story layout vector primitives without font-substitution corruption.
              </p>
            </div>

            <div className="card card-hover sda-reveal" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: '#f8fafc',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                <Code2 size={26} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                Developer-First REST API & Docs
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Plug NexusOCR into your Python, Node.js, Go, or Java microservices with standard multipart upload endpoints and asynchronous job polling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINAL CALL TO ACTION (CLIP-PATH ENTRANCE) ================= */}
      <section className="container">
        <div 
          className="sda-reveal-clip"
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #4f46e5 100%)',
            borderRadius: '28px',
            padding: 'clamp(3rem, 6vw, 5rem) 2rem',
            color: '#ffffff',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -15px rgba(37, 99, 235, 0.4)'
          }}
        >
          {/* Subtle Ambient Orb */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.12)',
            pointerEvents: 'none'
          }} />

          <div style={{ maxWidth: '660px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '1.25rem'
            }}>
              <Zap size={14} color="#fde047" />
              <span>Offline Ready Architecture</span>
            </span>

            <h2 style={{ fontSize: 'clamp(2.1rem, 4vw, 3rem)', fontWeight: 900, color: '#ffffff', marginBottom: '1.25rem', letterSpacing: '-0.025em' }}>
              Ready to translate your PDFs with exact layout preservation?
            </h2>

            <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
              Try our live interactive OCR Studio or create a free enterprise account to get full 90-day translation history and audit logs.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="btn btn-lg"
                style={{ background: '#ffffff', color: '#1e40af', fontWeight: 800, padding: '14px 28px', boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}
              >
                <FileSearch size={20} />
                <span>Open OCR Studio</span>
              </button>

              {!user && (
                <button
                  onClick={() => setCurrentView('register')}
                  className="btn btn-lg btn-outline"
                  style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.12)', fontWeight: 700 }}
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
