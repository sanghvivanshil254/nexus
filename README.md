# Nexus: Offline Multilingual PDF Translation & Layout Reconstruction Engine

Nexus is an enterprise-grade, offline-first pipeline designed to translate complex documents and books into Indic and international languages while **preserving the exact visual geometry, typography, tables, and illustrations** of the original PDF.

---

## Key Highlights

- **Native HarfBuzz OpenType Complex-Script Shaping**:
  Uses MuPDF's Story layout engine to correctly shape Indic scripts (Gujarati, Hindi, Tamil, Bengali, Telugu, etc.), ensuring proper consonant conjuncts (`ક્ષ`, `જ્ઞ`, `ત્ર`, `દ્વ`) and vowel matra positioning (`િ`, `ી`, `ુ`, `ૂ`).
- **Offline Neural Translation**:
  - **IndicTrans2** (ai4bharat): 1B and 200M compact distilled models for English ↔ Indic and Indic ↔ Indic translation.
  - **NLLB-200** (Meta): 1.3B and distilled 600M models for 200+ global languages.
  - **AfriNLLB**: Specialized models for African languages.
- **Pre-Translation OCR Cleaner**:
  Normalizes scanner and OCR font-substitution artifacts (e.g. archaic Georgian glyph substitutions, soft-hyphens, split line-breaks) to prevent model hallucinations and gibberish transliteration.
- **GPU Batch Inference & OOM Protection**:
  Dynamic batch halving and automatic CUDA cache recovery to run reliably on consumer GPUs (e.g., 4GB VRAM) without out-of-memory crashes.
- **Sentence-Aware 256-Token Chunking**:
  Splits paragraphs along sentence boundaries while preserving grammatical integrity.
- **Two-Tier Caching System**:
  Tier 1 ultra-fast in-memory cache + Tier 2 persistent MongoDB storage for instant resumption and zero redundant compute.
- **Incremental Checkpointing**:
  Automatically saves document progress every 5 pages to guarantee data safety across long books (e.g., 200+ pages).

---

## Architecture

```
[ Input PDF ]
      │
      ▼
[ PDFStructureAnalyzer ] ── (Detects bboxes, text spans, images, tables)
      │
      ▼
[ OCR Normalizer / Cleaner ] ── (Strips glyph errors, fixes line-break hyphens)
      │
      ▼
[ Sentence Chunker (≤ 256 tokens) ]
      │
      ▼
[ Translation Engine (IndicTrans2 / NLLB) ] ── [ In-Memory + MongoDB Cache ]
      │ (Parallel GPU Batch Inference)
      ▼
[ PDFLayoutReconstructor ] ── (White redaction + HarfBuzz Story Vector Overlay)
      │
      ▼
[ Checkpointed Output PDF (Timestamped) ]
```

---

## Installation

### 1. Prerequisites
- Python 3.10+
- PyTorch with CUDA support (for GPU acceleration)
- MongoDB (optional, for persistent translation caching; falls back to in-memory mode if absent)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## Model Setup

Download required translation models to `backend/models/`:

```bash
# Download IndicTrans2 English → Indic compact model (200M)
python backend/scripts/download_models.py --model indictrans2 --tier compact --direction en-indic

# Or download 1B model tier
python backend/scripts/download_models.py --model indictrans2 --tier best --direction en-indic
```

---

## Usage

### Command Line Interface (CLI)

Translate any PDF with automatic layout preservation:

```bash
# Translate English PDF to Gujarati
python backend/run_pipeline.py --input "testing data/Panchatantra.pdf" --src en --tgt gu

# Custom output filename
python backend/run_pipeline.py --input "testing data/Panchatantra.pdf" --src en --tgt gu --output "MyTranslation.pdf"
```

Output files are saved to `output/` with timestamped filenames:
`output/<DocumentName>_<Language>_<YYYYMMDD_HHMMSS>.pdf`

---

## Directory Structure

```
nexus/
├── backend/
│   ├── config.py                 # Core configurations and model registries
│   ├── run_pipeline.py           # CLI entrypoint for PDF translation
│   ├── db/
│   │   └── mongo.py              # MongoDB cache & job manager
│   ├── layout/
│   │   └── fonts.py              # Language-to-font mapping & preferences
│   ├── pipeline/
│   │   ├── analyzer.py           # PDF layout & structural block analyzer
│   │   ├── cleaner.py            # OCR noise & font-substitution cleaner
│   │   ├── layout.py             # HarfBuzz Story text shaping & overlay
│   │   ├── processor.py          # Document processor & checkpoint orchestrator
│   │   └── ocr.py                # OCR fallback processor
│   ├── scripts/
│   │   ├── download_models.py    # Model downloading & validation utility
│   │   └── verify_models.py      # Checksum & tensor integrity checker
│   └── translation/
│       ├── engine.py             # Universal translation orchestrator
│       ├── router.py             # Model selection & language routing
│       ├── chunker.py            # Sentence & token chunking utility
│       ├── cache.py              # Tier 1 & Tier 2 caching
│       └── backends/
│           ├── indictrans2.py    # AI4Bharat IndicTrans2 backend
│           ├── nllb.py           # Meta NLLB-200 backend
│           ├── afrinllb.py       # AfriNLLB backend
│           └── opus_mt.py        # OPUS-MT backend
├── models/                       # Offline model directory
├── output/                       # Output translated PDFs & checkpoints
├── testing data/                 # Sample documents & test files
├── requirements.txt              # Project dependencies
└── README.md
```

---

## License

Apache 2.0 / MIT
