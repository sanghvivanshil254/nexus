// Nexus Document Schema & Languages Configuration
// All mock documents removed - application runs purely on user-uploaded and real pipeline data

export const SAMPLE_DOCUMENTS = [];

export const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect Script & Language', flag: '🌐', script: 'Universal', active: true },
  { code: 'en', name: 'English', flag: '🇬🇧', script: 'Latin', active: true },
  
  // 22 Scheduled Indian Languages (IndicTrans2)
  { code: 'hi', name: 'Hindi (हिन्दी)', flag: '🇮🇳', script: 'Devanagari', active: true },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)', flag: '🇮🇳', script: 'Gujarati', active: true },
  { code: 'mr', name: 'Marathi (मराठी)', flag: '🇮🇳', script: 'Devanagari', active: true },
  { code: 'bn', name: 'Bengali (বাংলা)', flag: '🇮🇳', script: 'Bengali-Assamese', active: true },
  { code: 'ta', name: 'Tamil (தமிழ்)', flag: '🇮🇳', script: 'Dravidian (Tamil)', active: true },
  { code: 'te', name: 'Telugu (తెలుగు)', flag: '🇮🇳', script: 'Telugu', active: true },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳', script: 'Kannada', active: true },
  { code: 'ml', name: 'Malayalam (മലയാളം)', flag: '🇮🇳', script: 'Malayalam', active: true },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)', flag: '🇮🇳', script: 'Gurmukhi', active: true },
  { code: 'ur', name: 'Urdu (اردو)', flag: '🇮🇳', script: 'Perso-Arabic', active: true },
  { code: 'as', name: 'Assamese (অসমীয়া)', flag: '🇮🇳', script: 'Bengali-Assamese', active: true },
  { code: 'or', name: 'Odia (ଓଡ଼ିଆ)', flag: '🇮🇳', script: 'Odia', active: true },
  { code: 'sa', name: 'Sanskrit (संस्कृतम्)', flag: '🇮🇳', script: 'Devanagari', active: true },
  { code: 'ne', name: 'Nepali (नेपाली)', flag: '🇳🇵', script: 'Devanagari', active: true },
  { code: 'sd', name: 'Sindhi (سنڌي)', flag: '🇮🇳', script: 'Perso-Arabic', active: true },
  { code: 'ks', name: 'Kashmiri (کٲشُر)', flag: '🇮🇳', script: 'Perso-Arabic', active: true },
  { code: 'kok', name: 'Konkani (कोंकणी)', flag: '🇮🇳', script: 'Devanagari', active: true },
  { code: 'mai', name: 'Maithili (मैथिली)', flag: '🇮🇳', script: 'Devanagari', active: true },
  { code: 'mni', name: 'Manipuri (মৈতৈলোন্)', flag: '🇮🇳', script: 'Bengali-Assamese', active: true },
  { code: 'brx', name: 'Bodo (बर\')', flag: '🇮🇳', script: 'Devanagari', active: true },
  { code: 'doi', name: 'Dogri (डोगरी)', flag: '🇮🇳', script: 'Devanagari', active: true },
  { code: 'sat', name: 'Santali (ᱥᱟᱱᱛᱟᱲᱤ)', flag: '🇮🇳', script: 'Ol Chiki', active: true },

  // Global & European Languages (OPUS-MT / Neural)
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸', script: 'Latin', active: true },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷', script: 'Latin', active: true },
  { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪', script: 'Latin', active: true },
  { code: 'ru', name: 'Russian (Русский)', flag: '🇷🇺', script: 'Cyrillic', active: true }
];

export const OCR_PIPELINE_STAGES = [
  { id: 'preprocess', name: 'Pre-processing & Enhancement', desc: 'Binarization, Deskewing, Noise Reduction, Contrast Equalization', time: '45ms' },
  { id: 'layout', name: 'Layout & Geometry Analysis', desc: 'Neural Region Detection, Column/Paragraph segmentation, Table grid discovery', time: '120ms' },
  { id: 'multilingual_ocr', name: 'Multilingual Script OCR', desc: 'Deep Transformer Recognition across 100+ scripts with character confidence heatmaps', time: '180ms' },
  { id: 'ner_extraction', name: 'Entity & Key-Value Parsing', desc: 'Semantic extraction of Names, Dates, Totals, Tax IDs, Addresses, Line items', time: '65ms' },
  { id: 'translation', name: 'Neural Machine Translation', desc: 'Context-aware multilingual translation into 30+ international languages', time: '90ms' }
];

export const EXTRACTION_HISTORY_SEED = [];
