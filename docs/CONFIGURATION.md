<!-- generated-by: gsd-doc-writer -->
# Configuration Guide

Nexus provides comprehensive configuration options across its offline neural translation subsystem, PyMuPDF HarfBuzz layout reconstruction engine, FastAPI backend server, and Vite React frontend.

---

## Environment Variables

All core pipeline parameters can be customized via environment variables. If a variable is omitted, Nexus falls back to safe defaults tuned for consumer hardware (e.g. 4GB–8GB VRAM).

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `MONGO_URI` | Optional | `mongodb://127.0.0.1:27017` | MongoDB connection URI for persistent translation caching and job tracking. |
| `DB_NAME` | Optional | `nexus_translator` | MongoDB database name storing translation cache and job metadata. |
| `MODEL_SIZE_TIER` | Optional | `compact` | Translation model size tier: `compact` (distilled 200M/600M models) or `best` (full 1B/1.3B models). |
| `MAX_LOADED_MODELS` | Optional | `1` | Maximum neural models simultaneously retained in GPU VRAM (LRU eviction protects against OOM). |
| `MAX_CONCURRENT_JOBS` | Optional | `1` | Concurrency slot limit for simultaneous document translation jobs. |
| `NEXUS_NUM_BEAMS` | Optional | `1` | Beam search width during translation generation (`1` enables high-speed greedy decoding). |
| `PARALLEL_BATCH_SIZE`| Optional | `24` | Batch size of text sentence chunks translated simultaneously per GPU inference pass. |
| `PAGE_BATCH_SIZE` | Optional | `6` | Number of document pages analyzed and processed together in a single pipeline pass. |
| `INDICTRANS_MAX_INPUT_TOKENS` | Optional | `512` | Maximum token sequence length for IndicTrans2 encoder input. |
| `INDICTRANS_MAX_OUTPUT_TOKENS` | Optional | `768` | Maximum token sequence length for IndicTrans2 decoder generation. |
| `NLLB_MAX_INPUT_TOKENS` | Optional | `512` | Maximum token sequence length for NLLB-200 encoder input. |
| `NLLB_MAX_OUTPUT_TOKENS` | Optional | `768` | Maximum token sequence length for NLLB-200 decoder generation. |
| `CHUNK_MAX_TOKENS` | Optional | `512` | Maximum token limit when splitting paragraphs into sentence chunks. |
| `LAYOUT_FONT_MIN_SIZE` | Optional | `5.0` | Minimum point size threshold during automatic font shrink fitting. |
| `LAYOUT_FONT_MAX_SIZE` | Optional | `18.0` | Maximum point size cap allowed for reconstructed text spans. |
| `LAYOUT_FONT_STEP` | Optional | `0.5` | Point size decrement step used during HarfBuzz text fitting iterations. |
| `LAYOUT_MAX_BOX_GROWTH` | Optional | `0.6` | Maximum fraction of its own height a text box may expand downward into verified whitespace. |
| `OCR_ENGINE` | Optional | `auto` | Preferred OCR engine fallback: `auto`, `paddle` (PaddleOCR), `tesseract`, or `pymupdf`. |
| `OCR_RENDER_DPI` | Optional | `300` | Rasterization resolution (DPI) when rendering scanned document pages for OCR. |
| `OCR_MIN_CONFIDENCE` | Optional | `0.5` | Minimum confidence threshold below which OCR noisy glyphs are discarded. |
| `SKIP_HEADERS_FOOTERS` | Optional | `1` | When enabled (`1`), excludes running headers, footers, and page numbers from neural translation. |
| `AUTO_DETECT_SOURCE_LANG` | Optional | `1` | When enabled (`1`), inspects Unicode script to verify and correct declared source language. |
| `INDIC_PIVOT_VIA_ENGLISH` | Optional | `auto` | Controls Indic-to-Indic routing: `auto` (pivots via English if direct model missing), `1` (always), `0` (never). |
| `NEXUS_BENCHMARKED_OPUS_MT_PAIRS` | Optional | `""` | Comma-delimited list of European language pairs routed to OPUS-MT (e.g. `en-es,es-en`). |

---

## Configuration Files

### 1. Backend Central Configuration (`backend/config.py`)

All environment variables and directories are initialized and exported from [`backend/config.py`](file:///c:/Users/sangh/Downloads/to%20desktop/nexus/backend/config.py):

```python
# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_DIR = BASE_DIR / "frontend"
OUTPUT_DIR = BASE_DIR / "output"
MODELS_DIR = BACKEND_DIR / "models"
FONTS_DIR = BACKEND_DIR / "fonts"

# Hardware auto-detection
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
TORCH_DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32
```

### 2. Frontend Development Proxy (`frontend/vite.config.js`)

The Vite dev server proxies API calls under `/api` directly to the backend FastAPI server:

```javascript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

### 3. Windows Orchestrator Settings (`start.bat`)

Settings at the top of [`start.bat`](file:///c:/Users/sangh/Downloads/to%20desktop/nexus/start.bat) control the Windows launcher behavior:

```cmd
set "BACKEND_HOST=127.0.0.1"
set "BACKEND_PORT=8000"
set "FRONTEND_HOST=localhost"
set "FRONTEND_PORT=5173"
set "DEV_RELOAD=1"
set "AUTO_OPEN_BROWSER=1"
set "MAX_HEALTH_WAIT_SEC=30"
```

---

## Required vs Optional Settings

- **Required**:
  - Python runtime environment with PyTorch and FastAPI installed (`requirements.txt`).
  - At least one downloaded offline translation model corresponding to requested language pairs (located in `backend/models/`).
- **Optional (Graceful Degradation)**:
  - **MongoDB**: If absent, the translation engine seamlessly operates using high-speed in-memory LRU caching.
  - **CUDA GPU**: If unavailable, the engine automatically selects CPU execution with `float32` tensors.
  - **OCR Engine**: If PaddleOCR and Tesseract are not installed, digital PDFs process normally; scanned documents display a descriptive notice without crashing.

---

## Per-Environment Overrides

### Development Environment (Default)
- `MODEL_SIZE_TIER=compact` (minimizes VRAM footprint and enables rapid testing)
- `DEV_RELOAD=1` (enables Uvicorn hot-reloading on code changes)
- `MAX_LOADED_MODELS=1`
- `PARALLEL_BATCH_SIZE=16`

### High-Throughput Production Environment
- `MODEL_SIZE_TIER=best` (employs 1B IndicTrans2 and 1.3B NLLB models for maximum translation accuracy)
- `DEV_RELOAD=0` (disables reload file watcher overhead)
- `MAX_LOADED_MODELS=2` (if 16GB+ VRAM available)
- `PARALLEL_BATCH_SIZE=32`
- `MONGO_URI=mongodb://production-mongo-host:27017` <!-- VERIFY: production-mongo-host -->
