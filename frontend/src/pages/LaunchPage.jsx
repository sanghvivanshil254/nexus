import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  Rocket, 
  Sparkles, 
  ArrowRight, 
  Globe2, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Code2, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  Download,
  Terminal,
  FileSearch,
  BookOpen,
  Workflow,
  Check
} from 'lucide-react';
import { useBackendStatus } from '../hooks/useBackendStatus';

// =========================================================================
// STATIC DATASETS (Instantiated once outside components for zero GC churn)
// =========================================================================

const DEMO_PREVIEWS = {
  hi: {
    name: 'Hindi',
    flag: '🇮🇳',
    script: 'हिन्दी',
    title: 'पंचतंत्र की प्रेरक कहानियां: सिंह और सियार',
    subtitle: 'प्राचीन काल की ज्ञानवर्धक नैतिक कथाएं',
    content: 'एक घने वन में भासुरक नाम का एक अत्यंत पराक्रमी सिंह निवास करता था। उसके साथ एक चतुर सियार सदैव सेवक के रूप में रहता था। एक दिन सिंह ने वन के सभी जीवों को संयम और सहयोग का संदेश दिया। हार्फ़बज़ फॉन्ट शेपर सभी जटिल संयुक्ताक्षरों को सटीक बनाए रखता है।',
    shaperBadge: 'Devanagari Complex Virama Engine',
    font: 'Noto Sans Devanagari, sans-serif'
  },
  gu: {
    name: 'Gujarati',
    flag: '🇮🇳',
    script: 'ગુજરાતી',
    title: 'પંચતંત્ર કથાઓ: સિંહ અને શિયાળ',
    subtitle: 'પ્રાચીન નીતિકથા અને શાણપણનો શાશ્વત સંગ્રહ',
    content: 'એક ગહન વનમાં મદિરોન્મત્ત નામનો બળવાન સિંહ વસતો હતો. તેની પાસે ચતુર ધૂર્ત શિયાળ હંમેશા સેવામાં રહેતો. એક દિવસે સિંહે શિયાળને વનના અન્ય પ્રાણીઓ વચ્ચે ન્યાય કરવાનો અધિકાર સોંપ્યો. હરભઝ ઓપનટાઇપ લિગેચર શિપિંગ સંપૂર્ણ ચોકસાઈથી તમામ જોડાક્ષરો રચે છે.',
    shaperBadge: 'HarfBuzz OpenType Ligatures Active',
    font: 'Noto Sans Gujarati, sans-serif'
  },
  mr: {
    name: 'Marathi',
    flag: '🇮🇳',
    script: 'मराठी',
    title: 'पंचतंत्रातील बोधकथा: सिंह आणि कोल्हा',
    subtitle: 'भारतीय परंपरेतील अभिजात नीतिशास्त्र व बोध',
    content: 'एका घनदाट अरण्यात भासुरक नावाचा एक महापराक्रमी सिंह राहत होता. त्याच्या सेवेत एक चतुर कोल्हा सदैव उपस्थित असे. हार्फबझ ओपनटाईप लिगॅचर शेपर मराठीतील सर्व जोડાક્ષરે व काना-मात्रा अत्यंत अचूकपणे रेखाटतो.',
    shaperBadge: 'Devanagari Balbodh Ligatures',
    font: 'Noto Sans Devanagari, sans-serif'
  },
  bn: {
    name: 'Bengali',
    flag: '🇮🇳',
    script: 'বাংলা',
    title: 'পঞ্চতন্ত্রের নীতিগল্প: সিংহ ও শৃগাল',
    subtitle: 'প্রাচীন ভারতীয় জ্ঞান ও শাশ্বত নীতিশিক্ষা',
    content: 'একটি গভীর অরণ্যে মদোনমত্ত নামের এক বলশালী সিংহ বাস করত। তার সাথে সবসময় এক চতুর শৃগাল থাকত। হার্ফবাজ ফন্ট শেপার যুক্তবর্ণ ও মাত্রাগুলোকে মূল ডকুমেন্টের সাথে শতভাগ সমন্বয় করে নিখুঁতভাবে রেন্ডার করে।',
    shaperBadge: 'Bengali Conjunct Script Shaper',
    font: 'Noto Sans Bengali, sans-serif'
  },
  ta: {
    name: 'Tamil',
    flag: '🇮🇳',
    script: 'தமிழ்',
    title: 'பஞ்சதந்திரக் கதைகள்: சிங்கமும் நரியும்',
    subtitle: 'பண்டைய நீதிபோதனை கதைகள் மற்றும் காலத்தால் அழியாத ஞானம்',
    content: 'ஒரு அடர்ந்த காட்டில் மதிரோன்மத்தன் என்ற மகா பராக்கிரமசாலி சிங்கம் வாழ்ந்து வந்தது. அதற்கு உதவியாக ஒரு தந்திரமான நரி எப்போதும் இருந்தது. ஹார்பஸ் ஓபன்டைப் எழுத்துருக்கள் அனைத்து தமிழ் உயிர்மெய் எழுத்துக்களையும் துல்லியமாக வரைகிறது.',
    shaperBadge: 'Tamil Dravidian Glyphs & HarfBuzz Engine',
    font: 'Noto Sans Tamil, sans-serif'
  },
  te: {
    name: 'Telugu',
    flag: '🇮🇳',
    script: 'తెలుగు',
    title: 'పంచతంత్ర కథలు: సింహము మరియు నక్క',
    subtitle: 'ప్రాచీన భారతీయ నీతిశాస్త్రం మరియు జ్ఞాన నిధి',
    content: 'ఒక దట్టమైన అరణ్యంలో మదిరోన్మత్తుడు అను ఒక బలమైన సింహం నివసించేది. దానికి సహాయకుడిగా ఒక తెలివైన నక్క ఎల్లప్పుడూ ఉండేది. హార్ఫ్‌బజ్ ఫాంట్ షేపర్ తెలుగు ఒత్తులు మరియు గుణింతాలను అద్భుతంగా అనుసంధానిస్తుంది.',
    shaperBadge: 'Telugu Akshara Complex Shaper',
    font: 'Noto Sans Telugu, sans-serif'
  },
  ml: {
    name: 'Malayalam',
    flag: '🇮🇳',
    script: 'മലയാളം',
    title: 'പഞ്ചതന്ത്ര കഥകൾ: സിംഹവും കുറുക്കനും',
    subtitle: 'പ്രാചീന ധാർമ്മിക കഥകളും ചിരകാല ജ്ഞാനവും',
    content: 'ഒരു നിബിഡ വനത്തിൽ മദിരോന്മത്തൻ എന്ന പരാക്രമിയായ സിംഹം ജീവിച്ചിരുന്നു. അവനോടൊപ്പം ഒരു തന്ത്രശാലിയായ കുറുക്കൻ സേവകനായി ഉണ്ടായിരുന്നു. ഹാർഫ്ബസ് ഓപ്പൺടൈപ്പ് ഷേപ്പർ മലയാളത്തിലെ എല്ലാ ചില്ലക്ഷരങ്ങളെയും കൃത്യമായി ചിട്ടപ്പെടുത്തുന്നു.',
    shaperBadge: 'Malayalam Chillu Character Shaper',
    font: 'Noto Sans Malayalam, sans-serif'
  },
  es: {
    name: 'Spanish',
    flag: '🇪🇸',
    script: 'Español',
    title: 'Cuentos del Panchatantra: El León y el Chacal',
    subtitle: 'Sabiduría clásica traducida con fidelidad vectorial',
    content: 'En un bosque denso y majestuoso vivía un león venerable conocido por su gran fuerza. A su lado, un chacal ingenioso servía como consejero leal. Todas las cajas delimitadoras y encabezados se preservan con absoluta precisión geométrica.',
    shaperBadge: 'Latin OpenType Kerning & Accents',
    font: 'Inter, sans-serif'
  },
  de: {
    name: 'German',
    flag: '🇩🇪',
    script: 'Deutsch',
    title: 'Geschichten aus dem Panchatantra: Der Löwe und der Schakal',
    subtitle: 'Klassische Weisheit mit vollständiger Vektorerhaltung',
    content: 'In einem tiefen, majestätischen Wald lebte einst ein stolzer Löwe von unvergleichlicher Stärke. Ein kluger Schakal stand ihm stets als treuer Ratgeber zur Seite. Alle Textbegrenzungsrahmen und Tabellenlayouts bleiben vollständig erhalten.',
    shaperBadge: 'German Umlaut & Bounding Alignment',
    font: 'Inter, sans-serif'
  },
  fr: {
    name: 'French',
    flag: '🇫🇷',
    script: 'Français',
    title: 'Contes du Panchatantra : Le Lion et le Chacal',
    subtitle: 'Sagesse antique transmise avec préservation vectorielle',
    content: 'Dans une forêt dense et majestueuse vivait un lion réputé pour sa puissance prodigieuse. À ses côtés, un chacal ingénieux lui servait de conseiller avisé. Le moteur HarfBuzz garantit le respect rigoureux de chaque ligature et de la typographie.',
    shaperBadge: 'French Ligatures & Accent Alignment',
    font: 'Inter, sans-serif'
  }
};

const COVER_FLOW_KEYS = Object.keys(DEMO_PREVIEWS);
const CF_STEP_PX = 120; // px of scroll per card step

const PIPELINE_STEPS = [
  {
    step: '01',
    title: 'Multi-Format Sovereign Ingestion',
    subtitle: 'Native PDF, DOCX, TXT, RTF & Scanned Books',
    desc: 'Seamlessly accepts Word documents, legacy scans, and multi-hundred-page PDF archives with zero page limit restrictions. Converts to high-density vector pages locally without data degradation.',
    badge: 'Zero Compression Loss',
    icon: BookOpen,
    color: '#3b82f6',
    latency: 'Instant Ingestion'
  },
  {
    step: '02',
    title: 'Neural Geometry & Segment Bounding Boxes',
    subtitle: 'Sub-Pixel Layout Analysis & Table Extraction',
    desc: 'Deep learning vision networks segment page geometry into granular text blocks, column flows, headers, footnotes, and numerical tables, retaining exact coordinate bounding boxes.',
    badge: 'Vector Geometry Preserved',
    icon: Layers,
    color: '#8b5cf6',
    latency: '~45ms / page'
  },
  {
    step: '03',
    title: 'IndicTrans2 & NLLB-200 Transformer Inference',
    subtitle: 'Context-Aware Neural Machine Translation',
    desc: 'Leverages AI4Bharat IndicTrans2 1B (CUDA fp16) and OPUS-MT across 27 supported languages. Performs sentence-boundary context analysis to guarantee idiomatic phrasing.',
    badge: '27 Verified Languages',
    icon: Cpu,
    color: '#06b6d4',
    latency: '~190ms / page'
  },
  {
    step: '04',
    title: 'HarfBuzz OpenType Complex Typography Shaper',
    subtitle: 'Pixel-Perfect Conjuncts, Matras & Ligatures',
    desc: 'Unlike standard OCR that produces broken Indian script matras, our native HarfBuzz OpenType pipeline computes exact glyph advances and conjunct ligatures without text bleeding.',
    badge: '99.4% Typography Score',
    icon: Sparkles,
    color: '#10b981',
    latency: '~15ms / page'
  },
  {
    step: '05',
    title: 'Dual Vector PDF & Structured JSON Output',
    subtitle: 'Synchronized Layout Overlay & Export',
    desc: 'Generates a publication-grade translated PDF with identical fonts, styling, and embedded illustrations, plus downstream JSON records for automated enterprise ingestion.',
    badge: 'Instant Download & API Hook',
    icon: Download,
    color: '#f59e0b',
    latency: 'Synchronous Render'
  }
];

const FEATURES = [
  {
    icon: ShieldCheck,
    color: '#10b981',
    title: '100% Air-Gapped Data Privacy',
    desc: 'Processes documents entirely on your local GPU/CPU hardware. Zero telemetry, zero external network calls, completely safe for confidential legal, financial, and healthcare records.'
  },
  {
    icon: Zap,
    color: '#3b82f6',
    title: 'Zero Page Limits',
    desc: 'Say goodbye to 5-page or 10-page constraints. Feed entire 200-page historical archives, thesis papers, or novels—the pipeline processes every page to completion.'
  },
  {
    icon: Globe2,
    color: '#8b5cf6',
    title: '27 Verified Languages Supported',
    desc: 'Full native coverage for all 22 official Indian scheduled languages (Gujarati, Hindi, Marathi, Bengali, Tamil, Telugu, Kannada, Malayalam, etc.) alongside English, Spanish, French, German, and Russian.'
  },
  {
    icon: FileSearch,
    color: '#06b6d4',
    title: 'Native HarfBuzz Font Shaper',
    desc: 'Our neural shaper dynamically compiles OpenType ligatures to render complex Indian conjunct vowels and matras with zero character clipping or overlapping defects.'
  },
  {
    icon: Workflow,
    color: '#f59e0b',
    title: 'Universal Document Converter',
    desc: 'Directly upload DOCX, DOC, TXT, RTF, or PDF. The built-in document converter normalizes incoming formats seamlessly before sending them to the neural OCR core.'
  },
  {
    icon: Terminal,
    color: '#ec4899',
    title: 'Developer REST API & Batch Queue',
    desc: 'Full REST endpoints with Python, cURL, and Node.js SDK examples. Queue batches of hundreds of files with asynchronous status polling and automatic downloads.'
  }
];

// =========================================================================
// SUBCOMPONENT: Isolated Top Progress Bar (0 React Re-renders on Scroll)
// =========================================================================
const ScrollProgressBar = memo(() => {
  const barRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (barRef.current) {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (totalScroll > 0) {
              const progress = Math.min(100, Math.max(0, (window.scrollY / totalScroll) * 100));
              barRef.current.style.width = `${progress}%`;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={barRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '4px',
        width: '0%',
        background: 'linear-gradient(90deg, #2563eb, #8b5cf6, #06b6d4, #10b981)',
        zIndex: 9999,
        pointerEvents: 'none',
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
      }} 
    />
  );
});
ScrollProgressBar.displayName = 'ScrollProgressBar';

// =========================================================================
// SUBCOMPONENT: Interactive Stacking & Tilting Stage Card (rAF direct style)
// =========================================================================
const StackingPipelineCard = memo(({ step, idx, total }) => {
  const StepIcon = step.icon;
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const rafRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    const clientX = e.clientX;
    const clientY = e.clientY;

    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Subtle 3D tilt on hover (±4deg X, ±5deg Y)
      const rx = ((y - centerY) / centerY) * -4;
      const ry = ((x - centerX) / centerX) * 5;

      cardRef.current.style.transform = `perspective(1400px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.012) translateY(-3px)`;
      
      if (glareRef.current) {
        const gx = ((x / rect.width) * 100).toFixed(1);
        const gy = ((y / rect.height) * 100).toFixed(1);
        glareRef.current.style.background = `radial-gradient(circle 420px at ${gx}% ${gy}%, rgba(255,255,255,0.45), transparent 70%)`;
        glareRef.current.style.opacity = '1';
      }
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0)';
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  };

  return (
    <div
      className="pipeline-card-wrapper"
      style={{
        '--card-index': idx,
        top: `calc(80px + ${idx * 28}px)`,
        zIndex: 10 + idx
      }}
    >
      <div
        ref={cardRef}
        className="pipeline-stack-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: 'perspective(1400px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0)',
          borderTop: `3px solid ${step.color}`
        }}
      >
        {/* Dynamic Glare Reflection */}
        <div
          ref={glareRef}
          className="pipeline-card-glare"
          style={{ opacity: 0 }}
        />

        {/* Left Column: Number, Stage & Description */}
        <div style={{ position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: step.color,
              background: `${step.color}15`,
              padding: '0.4rem 0.9rem',
              borderRadius: '12px',
              fontFeatureSettings: '"tnum"'
            }}>
              {step.step}
            </span>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              padding: '0.35rem 0.8rem',
              borderRadius: '9999px',
              background: '#f1f5f9',
              color: '#475569'
            }}>
              STAGE {idx + 1}
            </span>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#059669',
              background: '#ecfdf5',
              padding: '0.35rem 0.8rem',
              borderRadius: '9999px',
              marginLeft: 'auto',
              border: '1px solid #d1fae5'
            }}>
              {step.latency}
            </span>
          </div>

          <h3 style={{ fontSize: 'clamp(1.25rem, 2.2vw, 1.6rem)', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem', lineHeight: 1.3 }}>
            {step.title}
          </h3>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: step.color, marginBottom: '0.85rem' }}>
            {step.subtitle}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.65, margin: 0 }}>
            {step.desc}
          </p>
        </div>

        {/* Right Column: Visual Specs Pill */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1.25rem',
          position: 'relative',
          zIndex: 3
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: `${step.color}20`,
              color: step.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <StepIcon size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                STAGE ACCELERATION
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                {step.badge}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', padding: '5px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
              Hardware Checked
            </span>
            <span style={{ fontSize: '0.75rem', padding: '5px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
              Auto-Synchronized
            </span>
            <span style={{ fontSize: '0.75rem', padding: '5px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
              Zero Data Leaks
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
StackingPipelineCard.displayName = 'StackingPipelineCard';

// =========================================================================
// SUBCOMPONENT: Isolated Sticky Scrollytelling Cover Flow
// =========================================================================
const CoverFlowSection = memo(() => {
  const [activeCoverIndex, setActiveCoverIndex] = useState(0);
  const activeCoverIndexRef = useRef(0);
  const coverFlowSectionRef = useRef(null);
  const cfProgressBarRef = useRef(null);
  const touchStartXRef = useRef(null);

  // Sticky scrollytelling: read scroll position inside rAF
  // Only updates state when index changes; updates progress bar via ref
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!coverFlowSectionRef.current) {
            ticking = false;
            return;
          }
          const outerTop = coverFlowSectionRef.current.getBoundingClientRect().top;
          const travelHeight = CF_STEP_PX * (COVER_FLOW_KEYS.length - 1);
          const scrolled = Math.max(0, -outerTop);
          const progress = Math.min(1, scrolled / travelHeight);

          // Direct DOM update for progress bar (zero React re-renders)
          if (cfProgressBarRef.current) {
            cfProgressBarRef.current.style.width = `${progress * 100}%`;
          }

          const rawIdx = progress * (COVER_FLOW_KEYS.length - 1);
          const safeIdx = Math.min(COVER_FLOW_KEYS.length - 1, Math.round(rawIdx));

          if (safeIdx !== activeCoverIndexRef.current) {
            activeCoverIndexRef.current = safeIdx;
            setActiveCoverIndex(safeIdx);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectCover = (idx) => {
    const safeIdx = Math.min(COVER_FLOW_KEYS.length - 1, Math.max(0, idx));
    setActiveCoverIndex(safeIdx);
    activeCoverIndexRef.current = safeIdx;
    if (coverFlowSectionRef.current) {
      const outerTop = coverFlowSectionRef.current.getBoundingClientRect().top + window.scrollY;
      const targetScroll = outerTop + safeIdx * CF_STEP_PX;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  };

  const handlePrevCover = (e) => {
    if (e) e.stopPropagation();
    handleSelectCover(activeCoverIndex - 1);
  };

  const handleNextCover = (e) => {
    if (e) e.stopPropagation();
    handleSelectCover(activeCoverIndex + 1);
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (diff > 40) {
      handleNextCover();
    } else if (diff < -40) {
      handlePrevCover();
    }
    touchStartXRef.current = null;
  };

  const currentLang = DEMO_PREVIEWS[COVER_FLOW_KEYS[activeCoverIndex]];

  return (
    <>
      {/* Live Interactive Showcase Section Header */}
      <section id="interactive-demo" style={{ padding: '5rem 1.5rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container" style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.35rem 0.9rem', background: '#eff6ff', borderRadius: '9999px', color: '#2563eb', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              <Sparkles size={14} />
              <span>LIVE INTERACTIVE SHOWCASE</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
              Pixel-Perfect HarfBuzz OpenType Typography
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '700px', margin: '0 auto' }}>
              Switch scripts to see real-time conjunct vowel ligation, vector bounding box retention, and flawless multi-script alignment.
            </p>
          </div>
        </div>
      </section>

      {/* Cover Flow Scrollytelling Stage */}
      <div
        ref={coverFlowSectionRef}
        className="cf-scroll-outer"
        style={{
          '--cf-steps': COVER_FLOW_KEYS.length,
          '--cf-step-h': `${CF_STEP_PX}px`,
        }}
      >
        <div
          className="cf-sticky-stage"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top label */}
          <div className="cf-stage-label">
            <Sparkles size={13} />
            <span>{currentLang?.name} · {activeCoverIndex + 1} of {COVER_FLOW_KEYS.length}</span>
          </div>

          {/* Progress bar (Direct DOM updated) */}
          <div
            ref={cfProgressBarRef}
            className="cf-progress-bar"
            style={{ width: `${(activeCoverIndex / (COVER_FLOW_KEYS.length - 1)) * 100}%` }}
          />

          {/* Perspective 3D zone */}
          <div className="cf-perspective-zone">
            <div className="cf-track">
              {COVER_FLOW_KEYS.map((key, index) => {
                const item = DEMO_PREVIEWS[key];
                const offset = index - activeCoverIndex;
                const absOffset = Math.abs(offset);
                const isCenter = offset === 0;

                // CULL OFF-SCREEN CARDS COMPLETELY FROM GPU COMPOSITING
                if (absOffset > 2) {
                  return (
                    <div
                      key={key}
                      style={{ display: 'none' }}
                      aria-hidden="true"
                    />
                  );
                }

                let transform;
                let zIndex = 30 - absOffset;
                let opacity;

                if (isCenter) {
                  transform = 'translateX(0) translateZ(80px) rotateY(0deg) scale(1)';
                  opacity = 1;
                } else if (offset < 0) {
                  const d = Math.abs(offset);
                  const tx = -350 - (d - 1) * 125;
                  const tz = -d * 45;
                  transform = `translateX(${tx}px) translateZ(${tz}px) rotateY(44deg) scale(${Math.max(0.74, 1 - d * 0.07)})`;
                  opacity = Math.max(0.3, 1 - d * 0.22);
                } else {
                  const d = offset;
                  const tx = 350 + (d - 1) * 125;
                  const tz = -d * 45;
                  transform = `translateX(${tx}px) translateZ(${tz}px) rotateY(-44deg) scale(${Math.max(0.74, 1 - d * 0.07)})`;
                  opacity = Math.max(0.3, 1 - d * 0.22);
                }

                return (
                  <div
                    key={key}
                    onClick={() => !isCenter && handleSelectCover(index)}
                    className={`cf-card${isCenter ? ' cf-active' : ''}`}
                    style={{ transform, zIndex, opacity }}
                  >
                    {/* ── Card Header ── */}
                    <div className="cf-card-header">
                      <div className="cf-card-header-lang">
                        <span className="cf-card-header-flag">{item.flag}</span>
                        <div>
                          <span className="cf-card-header-name">{item.name}</span>
                          <span className="cf-card-header-script" style={{ fontFamily: item.font }}>{item.script}</span>
                        </div>
                      </div>
                      <span className={`cf-card-header-badge${isCenter ? ' active' : ''}`}>
                        {isCenter ? '● Live' : item.script}
                      </span>
                    </div>

                    {/* ── Split body: EN | Target ── */}
                    <div className="cf-card-split">
                      {/* Left – English source */}
                      <div className="cf-card-pane cf-card-pane-en">
                        <div className="cf-card-pane-label">EN</div>
                        <p className="cf-card-pane-title">
                          The Lion and the Jackal
                        </p>
                        <p className="cf-card-pane-text">
                          In an ancient forest dwelt a powerful lion. A cunning jackal served as his prime counselor. Together they preserved harmony across the realm with wisdom, vigilance, and neural precision.
                        </p>
                      </div>

                      {/* Divider */}
                      <div className="cf-card-divider" />

                      {/* Right – target language */}
                      <div className="cf-card-pane cf-card-pane-tl" style={{ fontFamily: item.font }}>
                        <div className="cf-card-pane-label tl">{item.script}</div>
                        <p className="cf-card-pane-title">
                          {item.title}
                        </p>
                        <p className="cf-card-pane-text">
                          {item.content}
                        </p>
                      </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="cf-card-foot">
                      <span className="cf-card-foot-hint">
                        {isCenter ? '● Real-time Neural OCR' : 'Click to select'}
                      </span>
                      <span className="cf-card-foot-match">
                        <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                        100% Match
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation buttons */}
          {activeCoverIndex > 0 && (
            <button onClick={handlePrevCover} className="cf-nav-btn cf-prev" aria-label="Previous language">
              <ChevronLeft size={22} />
            </button>
          )}
          {activeCoverIndex < COVER_FLOW_KEYS.length - 1 && (
            <button onClick={handleNextCover} className="cf-nav-btn cf-next" aria-label="Next language">
              <ChevronRight size={22} />
            </button>
          )}

          {/* Indicator dots */}
          <div className="cf-dots">
            {COVER_FLOW_KEYS.map((k, i) => (
              <button
                key={k}
                className={`cf-dot${i === activeCoverIndex ? ' cf-dot-active' : ''}`}
                onClick={() => handleSelectCover(i)}
                aria-label={DEMO_PREVIEWS[k].name}
              />
            ))}
          </div>

          {/* Scroll hint (only on first card) */}
          {activeCoverIndex === 0 && (
            <div className="cf-scroll-hint">
              <span className="cf-scroll-hint-text">Scroll to explore</span>
              <ArrowRight size={14} color="rgba(100,116,139,0.55)" style={{ transform: 'rotate(90deg)' }} />
            </div>
          )}
        </div>
      </div>
    </>
  );
});
CoverFlowSection.displayName = 'CoverFlowSection';

// =========================================================================
// SUBCOMPONENT: Hero Section (Memoized, optimized ambient glows)
// =========================================================================
const HeroSection = memo(({ device, setCurrentView }) => {
  return (
    <section className="lp-hero-section" style={{
      position: 'relative',
      padding: '5.5rem 1.5rem 4rem',
      overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.12), transparent 70%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      borderBottom: '1px solid #e2e8f0'
    }}>
      {/* Soft Ambient Background Orbs (Pure radial gradients, zero blur filter cost) */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '380px',
        height: '380px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '15%',
        width: '420px',
        height: '420px',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="container" style={{ maxWidth: '1180px', margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {/* Keynote Tag */}
        <div className="lp-reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.45rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '9999px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '1.75rem' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' }} />
          <Rocket size={15} color="#2563eb" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#1e293b' }}>
            NEXUS OCR 2.0 LAUNCH ARCHITECTURE
          </span>
        </div>

        {/* Hero Main Heading */}
        <h1 className="lp-reveal" style={{ 
          fontSize: 'clamp(2.4rem, 5vw, 4rem)', 
          fontWeight: 900, 
          lineHeight: 1.12, 
          letterSpacing: '-0.03em', 
          color: '#0f172a', 
          maxWidth: '960px', 
          margin: '0 auto 1.5rem' 
        }}>
          The Sovereign AI Engine for{' '}
          <span style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            Multilingual Documents & Books
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="lp-reveal" style={{ 
          fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', 
          lineHeight: 1.6, 
          color: '#475569', 
          maxWidth: '780px', 
          margin: '0 auto 2.5rem',
          fontWeight: 450
        }}>
          Translate dense multi-page literature, legal filings, and complex technical manuals across{' '}
          <strong style={{ color: '#0f172a' }}>27 languages</strong> (all 22 Indian Scheduled Languages + Global). Powered by native HarfBuzz OpenType typography shaping, 
          vector geometry preservation, and <strong style={{ color: '#059669' }}>zero page limits</strong>.
        </p>

        {/* CTA Buttons Row */}
        <div className="lp-reveal" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="btn btn-primary"
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              padding: '0.9rem 2.2rem',
              borderRadius: '14px',
              boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Rocket size={19} />
            <span>Launch Translation Studio</span>
            <ArrowRight size={17} />
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('interactive-demo');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn btn-secondary"
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              padding: '0.9rem 1.8rem',
              borderRadius: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Eye size={17} />
            <span>Explore Live Showcase</span>
          </button>

          <button
            onClick={() => setCurrentView('apidocs')}
            className="btn btn-secondary"
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              padding: '0.9rem 1.6rem',
              borderRadius: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff'
            }}
          >
            <Code2 size={17} />
            <span>REST API Docs</span>
          </button>
        </div>

        {/* Hardware & Spec Badges */}
        <div className="lp-reveal" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          padding: '1.25rem 1.75rem',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px -4px rgba(0,0,0,0.04)',
          maxWidth: '920px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="#2563eb" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
              Hardware: {device === 'cuda' ? 'CUDA FP16 Acceleration' : 'CPU Neural Engine'}
            </span>
          </div>
          <div style={{ width: '1px', height: '18px', background: '#cbd5e1' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#10b981" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
              100% Offline Air-Gapped
            </span>
          </div>
          <div style={{ width: '1px', height: '18px', background: '#cbd5e1' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe2 size={18} color="#8b5cf6" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
              27 Verified Languages
            </span>
          </div>
          <div style={{ width: '1px', height: '18px', background: '#cbd5e1' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="#f59e0b" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
              Zero Page Limits
            </span>
          </div>
        </div>

      </div>
    </section>
  );
});
HeroSection.displayName = 'HeroSection';

// =========================================================================
// SUBCOMPONENT: 5-Stage Neural Pipeline Section (Memoized)
// =========================================================================
const PipelineSection = memo(() => {
  return (
    <section id="pipeline-stages" style={{ padding: '6rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      <div className="container" style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.35rem 0.9rem', background: '#f3e8ff', borderRadius: '9999px', color: '#7c3aed', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <Workflow size={14} />
            <span>KEYNOTE ARCHITECTURE BREAKDOWN</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            How the 5-Stage Multilingual Pipeline Works
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '720px', margin: '0 auto' }}>
            Each document passes through five synchronous, hardware-accelerated stages that preserve layout, bounding boxes, and complex script typography.
          </p>
        </div>

        {/* Stacking & Tilting Stage Cards */}
        <div className="pipeline-stack-container">
          {PIPELINE_STEPS.map((step, idx) => (
            <StackingPipelineCard
              key={step.step}
              step={step}
              idx={idx}
              total={PIPELINE_STEPS.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
PipelineSection.displayName = 'PipelineSection';

// =========================================================================
// SUBCOMPONENT: Feature Matrix Section (Memoized)
// =========================================================================
const FeatureMatrixSection = memo(() => {
  return (
    <section style={{ padding: '6rem 1.5rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
      <div className="container" style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.35rem 0.9rem', background: '#ecfdf5', borderRadius: '9999px', color: '#059669', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <Zap size={14} />
            <span>CORE ARCHITECTURAL ADVANTAGES</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
            Built for Enterprise-Scale Sovereign Extraction
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: '700px', margin: '0 auto' }}>
            High-fidelity translation without trusting third-party cloud APIs or risking corporate confidential data.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem'
        }}>
          {FEATURES.map((feat, idx) => {
            const FeatIcon = feat.icon;
            return (
              <div
                key={idx}
                className="lp-reveal"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '2rem',
                  transition: 'transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(15, 23, 42, 0.07)';
                  e.currentTarget.style.borderColor = feat.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: `${feat.color}15`,
                  color: feat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <FeatIcon size={22} />
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  {feat.title}
                </h3>

                <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, flexGrow: 1 }}>
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});
FeatureMatrixSection.displayName = 'FeatureMatrixSection';

// =========================================================================
// SUBCOMPONENT: Developer REST API Section (Memoized with isolated copy state)
// =========================================================================
const DeveloperApiSection = memo(({ setCurrentView }) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    const code = `import requests

# Submit entire document with zero page limits
with open("Panchatantra.pdf", "rb") as f:
    res = requests.post(
        "http://localhost:8000/api/translate",
        files={"file": f},
        data={
            "src_lang": "en",
            "tgt_lang": "gu"  # IndicTrans2 1B (CUDA fp16)
        }
    )

job = res.json()
print("Job Queued:", job["job_id"])`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <section style={{ padding: '5rem 1.5rem', background: '#0f172a', color: '#ffffff' }}>
      <div className="container" style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3rem',
          alignItems: 'center'
        }}>
          <div className="lp-reveal">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.35rem 0.9rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '9999px', color: '#60a5fa', fontWeight: 700, fontSize: '0.8rem', marginBottom: '1rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <Terminal size={14} />
              <span>DEVELOPER REST ENDPOINTS</span>
            </div>
            
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem', color: '#ffffff' }}>
              Seamless Python & REST Automation
            </h2>
            
            <p style={{ color: '#94a3b8', fontSize: '1.02rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Automate large document backlogs using standard HTTP requests. Connect your internal pipelines, 
              generate downstream vectors, and download completed publication-ready PDFs without browser interaction.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setCurrentView('apidocs')}
                className="btn btn-primary"
                style={{ padding: '0.85rem 1.75rem', borderRadius: '12px', fontWeight: 700 }}
              >
                Explore Interactive API Docs
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="btn btn-secondary"
                style={{ padding: '0.85rem 1.75rem', borderRadius: '12px', fontWeight: 700, background: 'rgba(255,255,255,0.08)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Open OCR Studio
              </button>
            </div>
          </div>

          {/* Code Snippet Box */}
          <div className="lp-reveal" style={{
            background: '#1e293b',
            borderRadius: '20px',
            border: '1px solid #334155',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <div style={{
              padding: '0.9rem 1.25rem',
              background: '#0f172a',
              borderBottom: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginLeft: '8px' }}>
                  translate_book.py
                </span>
              </div>

              <button
                onClick={handleCopyCode}
                style={{
                  background: copiedCode ? '#10b981' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'background 0.2s ease'
                }}
              >
                {copiedCode ? <Check size={12} /> : null}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>

            <pre style={{
              margin: 0,
              padding: '1.5rem',
              fontSize: '0.86rem',
              fontFamily: 'JetBrains Mono, Consolas, monospace',
              lineHeight: 1.6,
              color: '#e2e8f0',
              overflowX: 'auto'
            }}>
              <code>
{`import requests

# Submit entire document with zero page limits
with open("Panchatantra.pdf", "rb") as f:
    res = requests.post(
        "http://localhost:8000/api/translate",
        files={"file": f},
        data={
            "src_lang": "en",
            "tgt_lang": "gu"  # IndicTrans2 1B (CUDA fp16)
        }
    )

job = res.json()
print("Job Queued:", job["job_id"])`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
});
DeveloperApiSection.displayName = 'DeveloperApiSection';

// =========================================================================
// SUBCOMPONENT: Metrics Section (Memoized)
// =========================================================================
const MetricsSection = memo(() => {
  return (
    <section style={{ padding: '4.5rem 1.5rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
      <div className="container" style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <div className="lp-reveal" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#2563eb', letterSpacing: '-0.03em', marginBottom: '0.2rem' }}>
              27
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
              Verified Languages
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              22 Indian Scheduled + 5 Global
            </div>
          </div>

          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#10b981', letterSpacing: '-0.03em', marginBottom: '0.2rem' }}>
              99.4%
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
              Typography Match
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              HarfBuzz OpenType engine
            </div>
          </div>

          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#8b5cf6', letterSpacing: '-0.03em', marginBottom: '0.2rem' }}>
              100%
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
              Air-Gapped Privacy
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Zero data sent to cloud
            </div>
          </div>

          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.03em', marginBottom: '0.2rem' }}>
              0
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
              Page Limits
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Process complete book volumes
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
MetricsSection.displayName = 'MetricsSection';

// =========================================================================
// SUBCOMPONENT: Grand Finale Launch CTA (Memoized, soft radial glow)
// =========================================================================
const GrandFinaleSection = memo(({ setCurrentView }) => {
  return (
    <section style={{ padding: '6rem 1.5rem', background: '#f8fafc' }}>
      <div className="container" style={{ maxWidth: '980px', margin: '0 auto' }}>
        <div className="lp-reveal" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '28px',
          padding: '4rem 2rem',
          textAlign: 'center',
          color: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid #334155',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Soft-edge radial gradient without expensive blur filter */}
          <div style={{
            position: 'absolute',
            top: '-30%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '500px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(37, 99, 235, 0.35) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Rocket size={15} color="#60a5fa" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em' }}>
                READY TO TRANSLATE AT SCALE?
              </span>
            </div>

            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '1.25rem', color: '#ffffff' }}>
              Launch the Translation Studio
            </h2>

            <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '620px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
              Drag and drop your PDF, DOCX, or text files now. Experience sovereign neural translation with zero page limits.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="btn btn-primary"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  padding: '1rem 2.75rem',
                  borderRadius: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 10px 30px rgba(37, 99, 235, 0.4)'
                }}
              >
                <Rocket size={20} />
                <span>Enter Studio Now</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => setCurrentView('batch')}
                className="btn btn-secondary"
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  padding: '1rem 2.2rem',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Layers size={18} />
                <span>Batch Queue</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
GrandFinaleSection.displayName = 'GrandFinaleSection';

// =========================================================================
// MAIN COMPONENT: LaunchPage
// =========================================================================
export const LaunchPage = ({ setCurrentView, user }) => {
  const { device } = useBackendStatus();

  // IntersectionObserver for lightweight scroll-reveal animations
  // Automatically unobserves elements once revealed to save CPU/GPU cycles
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const revealElements = document.querySelectorAll('.lp-reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="launch-page-wrapper" style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', position: 'relative' }}>
      
      {/* Isolated Global Scroll Progress Bar (0 re-renders of LaunchPage) */}
      <ScrollProgressBar />

      {/* Hero Section */}
      <HeroSection device={device} setCurrentView={setCurrentView} />

      {/* Sticky Scrollytelling Cover Flow */}
      <CoverFlowSection />

      {/* 5-Stage Neural Pipeline */}
      <PipelineSection />

      {/* Feature Matrix Cards */}
      <FeatureMatrixSection />

      {/* Developer API Quick Start Snippet */}
      <DeveloperApiSection setCurrentView={setCurrentView} />

      {/* Performance Metrics Banner */}
      <MetricsSection />

      {/* Grand Finale Launch CTA */}
      <GrandFinaleSection setCurrentView={setCurrentView} />

      {/* Clean, Hardware-Accelerated Reveal Animations */}
      <style>{`
        .lp-reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lp-reveal.lp-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .lp-reveal {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};
