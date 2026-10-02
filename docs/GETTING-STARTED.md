<!-- generated-by: gsd-doc-writer -->
# Getting Started with Nexus

This guide walks you through setting up and running Nexus on your local machine from scratch.

---

## Prerequisites

Before beginning, ensure your system meets the following requirements:

- **Python**: `>= 3.10` (Python 3.10, 3.11, or 3.12 supported). Ensure "Add Python to PATH" is checked during installation.
- **Node.js**: `>= 18.0.0` (includes `npm`). Recommended: Node 20 LTS or Node 24.
- **Git**: For cloning the repository.
- **CUDA / GPU Acceleration** *(Recommended)*: NVIDIA GPU with CUDA 11.8+ or 12.x and PyTorch with CUDA enabled. CPU-only mode is also fully supported as an automatic fallback.
- **MongoDB** *(Optional)*: MongoDB running locally on port `27017` or accessible via `MONGO_URI`. If absent, Nexus automatically switches to in-memory caching.

---

## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/sanghvivanshil254/nexus.git
cd nexus
```

### 2. Set Up Python Virtual Environment
Creating a dedicated virtual environment ensures dependencies do not collide with your system Python packages:

```bash
# On Windows:
python -m venv .venv
.venv\Scripts\activate

# On Linux / macOS:
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 5. Download Translation Models
Nexus performs neural inference locally and offline. Download the required model weights to `backend/models/`:

```bash
# Download IndicTrans2 compact model (200M) for English -> Indic translation
python backend/scripts/download_models.py --model indictrans2 --tier compact --direction en-indic

# Or download the 1B parameter model for maximum translation accuracy
python backend/scripts/download_models.py --model indictrans2 --tier best --direction en-indic

# Verify downloaded model integrity
python backend/scripts/verify_models.py
```

---

## First Run

### Method A: One-Click Full-Stack Launcher (Windows)

On Windows systems, launch both the backend API and frontend React interface with a single command:

```cmd
start.bat
```

The script performs automated health checks, cleans any stale port locks on `8000` or `5173`, and opens `http://localhost:5173` in your default browser.

To stop the servers at any time, run:
```cmd
stop.bat
```

### Method B: Command Line Interface (CLI) Translation

You can immediately translate a PDF document without starting a web server:

```bash
# Translate sample PDF from English to Gujarati
python backend/run_pipeline.py --input "testing data/Panchatantra.pdf" --src en --tgt gu
```

The translated document will be generated in `output/` with preserved geometry, font styles, and images:
`output/Panchatantra_gu_<timestamp>.pdf`

### Method C: Manual Full-Stack Startup (Any OS)

**Start Backend (Terminal 1):**
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**Start Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## Common Setup Issues

### 1. CUDA Out of Memory (OOM)
- **Symptom**: `torch.cuda.OutOfMemoryError` during document processing.
- **Solution**:
  - Switch to the compact model tier by setting `MODEL_SIZE_TIER=compact`.
  - Decrease batch size: set `PARALLEL_BATCH_SIZE=8` in your environment.
  - Set `MAX_LOADED_MODELS=1` in `backend/config.py` to ensure only one neural model resides in VRAM at a time.

### 2. Missing OCR Engine
- **Symptom**: `No OCR engine available ... Scanned pages CANNOT be translated.`
- **Solution**: This warning applies only to image-only or scanned PDFs. Native digital PDFs process normally without OCR. To enable scanned page support, install PaddleOCR (`pip install paddleocr paddlepaddle`) or install Tesseract binary and set the `TESSDATA_PREFIX` environment variable.

### 3. Port Conflicts (`8000` or `5173` already in use)
- **Symptom**: `Address already in use` or Vite defaulting to `5174`.
- **Solution**:
  - On Windows, simply run `stop.bat`, which terminates orphaned listeners.
  - Or manually identify and terminate the process:
    ```cmd
    netstat -ano | findstr :8000
    taskkill /F /PID <PID>
    ```

### 4. MongoDB Not Detected
- **Symptom**: `[INFO] MongoDB is not active on port 27017.`
- **Solution**: No action is required. Nexus automatically runs in in-memory cache mode. If you want persistent caching across reboots, start a local MongoDB instance (`mongod`).

---

## Next Steps

Explore the following guides to learn more about the internal workings and customization of Nexus:

- [**System Architecture**](ARCHITECTURE.md) — Pipeline stages, font shaping, and structural analysis
- [**Configuration Guide**](CONFIGURATION.md) — Tuning inference parameters, batch sizes, and thresholds
- [**Development Workflow**](DEVELOPMENT.md) — Local development, scripts, and code conventions
- [**Testing Guide**](TESTING.md) — Running test suites and validating translation models
- [**API Reference**](API.md) — REST API endpoints for document and text translation
