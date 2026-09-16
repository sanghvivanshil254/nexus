// Nexus Document Schema & Languages Configuration
// All mock documents removed - application runs purely on user-uploaded and real pipeline data

export const SAMPLE_DOCUMENTS = [];

export const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect Script & Language', flag: '🌐', script: 'Universal', active: true },
  { code: 'en', name: 'English', flag: '🇬🇧', script: 'Latin', active: true },
  { code: 'hi', name: 'Hindi (हिन्दी)', flag: '🇮🇳', script: 'Devanagari', active: true },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)', flag: '🇮🇳', script: 'Gujarati', active: true },
  { code: 'mr', name: 'Marathi (मराठी)', flag: '🇮🇳', script: 'Devanagari', active: true },
  { code: 'bn', name: 'Bengali (বাংলা)', flag: '🇮🇳', script: 'Bengali-Assamese', active: true },
  { code: 'ta', name: 'Tamil (தமிழ்)', flag: '🇮🇳', script: 'Dravidian (Tamil)', active: true },
  { code: 'te', name: 'Telugu (తెలుగు)', flag: '🇮🇳', script: 'Telugu', active: true },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳', script: 'Kannada', active: true },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)', flag: '🇮🇳', script: 'Gurmukhi', active: true },
  { code: 'ru', name: 'Russian (Русский)', flag: '🇷🇺', script: 'Cyrillic', active: true },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸', script: 'Latin', active: true },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷', script: 'Latin', active: true },
  { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪', script: 'Latin', active: true },
  { code: 'ja', name: 'Japanese (日本語)', flag: '🇯🇵', script: 'CJK (Kanji/Kana)', active: true },
  { code: 'ar', name: 'Arabic (العربية)', flag: '🇦🇪', script: 'Arabic (RTL)', active: true },
  { code: 'zh', name: 'Chinese (中文 - 简体)', flag: '🇨🇳', script: 'CJK (Hanzi)', active: true },
  { code: 'pt', name: 'Portuguese (Português)', flag: '🇵🇹', script: 'Latin', active: true },
  { code: 'it', name: 'Italian (Italiano)', flag: '🇮🇹', script: 'Latin', active: true },
  { code: 'ko', name: 'Korean (한국어)', flag: '🇰🇷', script: 'Hangul', active: true },
  { code: 'tr', name: 'Turkish (Türkçe)', flag: '🇹🇷', script: 'Latin', active: true },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)', flag: '🇻🇳', script: 'Latin (Diacritics)', active: true },
  { code: 'nl', name: 'Dutch (Nederlands)', flag: '🇳🇱', script: 'Latin', active: true },
  { code: 'pl', name: 'Polish (Polski)', flag: '🇵🇱', script: 'Latin', active: true },
  { code: 'th', name: 'Thai (ไทย)', flag: '🇹🇭', script: 'Thai', active: true },
  { code: 'id', name: 'Indonesian (Bahasa)', flag: '🇮🇩', script: 'Latin', active: true },
  { code: 'el', name: 'Greek (Ελληνικά)', flag: '🇬🇷', script: 'Greek', active: true },
  { code: 'he', name: 'Hebrew (עברית)', flag: '🇮🇱', script: 'Hebrew (RTL)', active: true }
];

export const OCR_PIPELINE_STAGES = [
  { id: 'preprocess', name: 'Pre-processing & Enhancement', desc: 'Binarization, Deskewing, Noise Reduction, Contrast Equalization', time: '45ms' },
  { id: 'layout', name: 'Layout & Geometry Analysis', desc: 'Neural Region Detection, Column/Paragraph segmentation, Table grid discovery', time: '120ms' },
  { id: 'multilingual_ocr', name: 'Multilingual Script OCR', desc: 'Deep Transformer Recognition across 100+ scripts with character confidence heatmaps', time: '180ms' },
  { id: 'ner_extraction', name: 'Entity & Key-Value Parsing', desc: 'Semantic extraction of Names, Dates, Totals, Tax IDs, Addresses, Line items', time: '65ms' },
  { id: 'translation', name: 'Neural Machine Translation', desc: 'Context-aware multilingual translation into 30+ international languages', time: '90ms' }
];

export const EXTRACTION_HISTORY_SEED = [];
