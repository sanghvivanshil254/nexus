<!-- generated-by: gsd-doc-writer -->
# Development Guide

This document outlines local development practices, build commands, linting standards, and pull request workflows for contributors working on the Nexus codebase.

---

## Local Setup

### 1. Development Environment Prerequisites
- Python 3.10+ with `pip`
- Node.js 18+ with `npm`
- Visual Studio Code or IDE with Python and React extensions

### 2. Setup Procedure
```bash
# Clone the repository
git clone https://github.com/sanghvivanshil254/nexus.git
cd nexus

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Linux / macOS

# Install backend dependencies in editable/dev mode
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## Build & Development Commands

### Backend Commands

| Command | Description |
| :--- | :--- |
| `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload` | Starts FastAPI backend development server with auto-reload. |
| `python backend/run_pipeline.py --input <path> --src <lang> --tgt <lang>` | Executes standalone CLI translation pipeline on a sample PDF. |
| `python backend/scripts/download_models.py --model <id> --tier <tier>` | Downloads offline HuggingFace models to local `backend/models/`. |
| `python backend/scripts/verify_models.py` | Validates local model weights, checksums, and tensor structures. |
| `python -m unittest backend/tests/test_offline_translation_models.py` | Runs backend unit and offline router test suite. |

### Frontend Commands (`frontend/`)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite development server at `http://localhost:5173` with proxy to backend. |
| `npm run build` | Compiles optimized production bundle into `frontend/dist/`. |
| `npm run lint` | Runs `oxlint` high-speed linter across frontend JavaScript/React code. |
| `npm run preview` | Locally previews production build output. |

### Windows Launcher Commands

| Command | Description |
| :--- | :--- |
| `start.bat` | Starts full-stack development environment with health probing and browser launch. |
| `start.bat --no-browser` | Starts full-stack development environment without opening the browser. |
| `stop.bat` | Cleanly terminates all backend and frontend instances and frees ports 8000 and 5173. |

---

## Code Style & Quality Standards

### Python Standards
- **Typing**: Use standard Python type annotations (`typing.Optional`, `typing.List`, `typing.Dict`, `Path`) for public module interfaces.
- **Formatting**: Adhere to PEP 8 conventions (4 spaces indentation, snake_case functions and variables).
- **Error Resilience**: Handle GPU tensor allocation exceptions gracefully; always provide fallback paths for missing optional services (e.g. MongoDB, OCR engines).
- **Logging**: Use Python's standard `logging.getLogger("nexus.*")` rather than raw `print()` statements in production pipeline code.

### Frontend Standards (React / Vite)
- **Linter**: The project uses **oxlint** configured in [`frontend/.oxlintrc.json`](file:///c:/Users/sangh/Downloads/to%20desktop/nexus/frontend/.oxlintrc.json).
- **Execution**: Run `npm run lint` inside `frontend/` before pushing commits.
- **Component Architecture**: Keep UI components modular, clean, and typed with descriptive prop contracts. Avoid inline style hacks; prefer clean CSS classes and structured flex/grid containers.

---

## Branch Conventions

- **Default Branch**: `main`
- **Feature Branches**: `feat/<short-feature-name>` (e.g. `feat/harfbuzz-tamil-shaping`, `feat/batch-worker`)
- **Bug Fix Branches**: `fix/<bug-description>` (e.g. `fix/port-collision-shutdown`, `fix/line-hyphen-cleaner`)
- **Documentation Branches**: `docs/<topic>` (e.g. `docs/api-spec`, `docs/gpu-benchmarks`)

---

## Pull Request (PR) Process

1. **Create Branch**: Branch off the latest `main` branch using the naming conventions above.
2. **Implement Changes**: Keep commits focused and provide clear, descriptive commit messages.
3. **Verify Locally**:
   - Run frontend linter: `cd frontend && npm run lint`
   - Run unit tests: `python -m unittest backend/tests/test_offline_translation_models.py`
   - Verify sample PDF translation: `python backend/run_pipeline.py --input "testing data/Panchatantra.pdf" --src en --tgt gu`
4. **Submit PR**: Open a pull request against `main` on GitHub detailing:
   - Summary of modifications
   - Motivation and context
   - Verification steps performed (including sample input/output images or logs)
