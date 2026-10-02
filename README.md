<!-- generated-by: gsd-doc-writer -->
# Nexus: Offline Multilingual PDF Translation & Layout Reconstruction Engine

> An enterprise-grade, offline-first pipeline engineered to translate complex documents and books into Indic and global languages while strictly preserving visual geometry, typography, tables, illustrations, and layout styling.

[![License](https://img.shields.io/badge/license-Apache%202.0%20%2F%20MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0.0-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![HarfBuzz](https://img.shields.io/badge/HarfBuzz-Shaping-orange.svg)](https://harfbuzz.github.io)

---

## Key Highlights

- **Native HarfBuzz OpenType Complex-Script Shaping**:
  Leverages MuPDF's Story layout engine to correctly shape Indic scripts (Gujarati, Hindi, Tamil, Bengali, Telugu, Kannada, etc.), ensuring proper consonant conjuncts (`ક્ષ`, `જ્ઞ`, `ત્ર`, `દ્વ`) and vowel matra positioning (`િ`, `ી`, `ુ`, `ૂ`).
- **Offline Neural Translation**:
  - **IndicTrans2** (AI4Bharat): 1B parameter primary and 200M/320M distilled models for English ↔ Indic and Indic ↔ Indic translation across 22 Scheduled Indian languages.
  - **NLLB-200** (Meta): 1.3B parameter primary and distilled 600M models for 200+ global languages.
  - **AfriNLLB**: Specialized models for published African language pairs.
  - **OPUS-MT**: Helsinki-NLP models for benchmarked European language pairs.
- **Pre-Translation OCR Cleaner & Fallback**:
  Normalizes scanner and OCR font-substitution artifacts (e.g. archaic Georgian glyph substitutions, soft-hyphens, split line-breaks) to prevent model hallucinations and gibberish transliteration.
- **GPU Batch Inference & OOM Protection**:
  Dynamic batch halving and automatic CUDA cache recovery to run reliably on consumer GPUs (e.g., 4GB VRAM) without out-of-memory crashes.
- **Sentence-Aware 512-Token Chunking**:
  Splits paragraphs along sentence boundaries while preserving grammatical integrity and structural bounding boxes.
- **Two-Tier Caching System**:
  Tier 1 ultra-fast in-memory LRU cache + Tier 2 persistent MongoDB storage for instant resumption and zero redundant compute.
- **Incremental Checkpointing**:
  Automatically saves document progress every 5 pages to guarantee data safety across long books (e.g., 200+ pages).
- **One-Click Windows Launcher**:
  Provides a robust, self-healing startup script (`start.bat`) that resolves port conflicts, auto-detects virtual environments, verifies service health, and launches the browser.

---

## Architecture Overview

```
[ Input Document (PDF / DOCX / Image) ]
                   │
                   ▼
       [ PDFStructureAnalyzer ] ── (Extracts bboxes, text spans, images, tables, font sizes)
                   │
                   ▼
      [ OCR Normalizer / Cleaner ] ── (Strips glyph errors, fixes line-break hyphens)
                   │
                   ▼
     [ Sentence Chunker (≤ 512 tokens) ]
                   │
                   ▼
     [ Translation Engine (IndicTrans2 / NLLB / AfriNLLB / OPUS-MT) ]
                   │ (Parallel GPU Batch Inference + In-Memory / MongoDB Cache)
                   ▼
      [ PDFLayoutReconstructor ] ── (White redaction + HarfBuzz Story Vector Overlay)
                   │
                   ▼
     [ Checkpointed Output PDF (Timestamped) ]
```

---

## Installation

### 1. Prerequisites
- **Python**: `>= 3.10`
- **Node.js**: `>= 18.0.0` and `npm`
- **PyTorch**: Recommended with CUDA support for GPU acceleration (`torch.cuda.is_available()`)
- **MongoDB**: Optional (port `27017`) for persistent translation caching; automatically falls back to in-memory caching if absent

### 2. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## Model Setup

Download offline neural translation models to `backend/models/`:

```bash
# Download IndicTrans2 English → Indic compact model (200M)
python backend/scripts/download_models.py --model indictrans2 --tier compact --direction en-indic

# Or download IndicTrans2 1B primary model tier
python backend/scripts/download_models.py --model indictrans2 --tier best --direction en-indic

# Verify model checksums and tensor integrity
python backend/scripts/verify_models.py
```

---

## Quick Start

### 1. Full-Stack Web Application (Recommended for Windows)

Nexus includes a robust, automated launcher that starts both the FastAPI backend and Vite React frontend:

```cmd
:: Double-click start.bat in File Explorer, or run in terminal:
start.bat

:: Launch without auto-opening the default browser:
start.bat --no-browser

:: Cleanly terminate all running Nexus servers anytime:
stop.bat
```

The launcher automatically:
- Resolves virtual environments (`.venv`, `venv`, `backend/.venv`)
- Validates Node.js and installs missing `frontend/node_modules`
- Detects and clears orphaned processes on ports **8000** and **5173**
- Opens the web application at `http://localhost:5173`
- Provides an interactive supervisor dashboard for restarting or stopping services

### 2. Manual Service Startup

If you prefer starting services manually in separate terminals:

**Terminal 1 (Backend API):**
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Endpoint: `http://127.0.0.1:8000`
- Swagger Documentation: `http://127.0.0.1:8000/docs`

**Terminal 2 (Frontend UI):**
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## Usage Examples

### Command Line Interface (CLI)

Translate any PDF directly with automatic layout and typography preservation:

```bash
# Translate an English PDF to Gujarati
python backend/run_pipeline.py --input "testing data/Panchatantra.pdf" --src en --tgt gu

# Custom output destination
python backend/run_pipeline.py --input "testing data/Panchatantra.pdf" --src en --tgt gu --output "MyTranslation.pdf"
```

Output files are stored in `output/` with timestamped filenames:
`output/<DocumentName>_<Language>_<YYYYMMDD_HHMMSS>.pdf`

### REST API Example

Translate a text snippet directly using the FastAPI endpoint:

```bash
curl -X POST "http://127.0.0.1:8000/api/translate-text" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world, welcome to Nexus offline translation.", "src_lang": "en", "tgt_lang": "hi"}'
```

---

## Documentation Index

Comprehensive documentation for architecture, configuration, development, and testing is available in the `docs/` directory:

| Document | Description |
| :--- | :--- |
| [**Architecture**](docs/ARCHITECTURE.md) | High-level system design, pipeline flow, and core abstractions |
| [**Configuration**](docs/CONFIGURATION.md) | Environment variables, model registries, and runtime tuning |
| [**Getting Started**](docs/GETTING-STARTED.md) | Step-by-step onboarding, prerequisites, and common setup issues |
| [**Development**](docs/DEVELOPMENT.md) | Local development workflow, scripts, code style, and PR guidelines |
| [**Testing**](docs/TESTING.md) | Test framework, test execution commands, and offline model verification |
| [**API Reference**](docs/API.md) | Complete REST API endpoint reference and payload specifications |
| [**Model Collection**](offline_translation_model_collection.md) | Deep dive into supported neural translation model weights |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on code style, branch conventions, and submitting pull requests.

---

## License

This project is licensed under the Apache 2.0 / MIT License.
