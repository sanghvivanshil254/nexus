<!-- generated-by: gsd-doc-writer -->
# Contributing to Nexus

Thank you for your interest in contributing to Nexus! We welcome contributions to improve multilingual PDF translation, complex-script font shaping, OCR extraction, and user experience.

---

## Development Setup

See [**GETTING-STARTED.md**](docs/GETTING-STARTED.md) for prerequisites and initial setup, and [**DEVELOPMENT.md**](docs/DEVELOPMENT.md) for local development workflows and build commands.

---

## Coding Standards

Contributors should adhere to the following standards:

1. **Python**:
   - Follow PEP 8 guidelines and maintain explicit type hints on public module functions.
   - Preserve error handling fallbacks: ensure optional components (CUDA, MongoDB, OCR) degrade gracefully without throwing unhandled exceptions.
2. **Frontend (React / Vite)**:
   - Run the high-speed linter before committing: `cd frontend && npm run lint`.
   - Maintain clean, responsive component hierarchies using Lucide icons and modular styling.
3. **Typography & Script Preservation**:
   - When modifying layout reconstruction logic in `backend/layout/` or `backend/pipeline/layout.py`, verify that HarfBuzz complex-script shaping is preserved for Indic conjuncts (`ક્ષ`, `જ્ઞ`, `ત્ર`) and vowel matras.

---

## Pull Request (PR) Guidelines

When submitting pull requests:

- **Branch Naming**: Use descriptive prefixes: `feat/<name>`, `fix/<issue>`, or `docs/<topic>`.
- **Commit Messages**: Write clear, imperative commit messages (e.g. `feat: add Kannada font mapping in HarfBuzz layout`).
- **Test Validation**:
  - Run the test suite: `python -m unittest backend/tests/test_offline_translation_models.py`.
  - Perform a smoke translation run on a test document from `testing data/`.
- **PR Description**: Include a clear summary of changes, rationale, and sample test outputs or screenshots.

---

## Reporting Issues

If you encounter bugs, font rendering glitches, or unexpected translation artifacts:

1. Search existing issues to ensure the problem has not already been reported.
2. Submit a new issue on GitHub providing:
   - **Environment Details**: OS (Windows, Linux, macOS), Python version, Node.js version, and whether CUDA is enabled.
   - **Model Configuration**: Active tier (`compact` or `best`) and language pair (`src_lang`, `tgt_lang`).
   - **Steps to Reproduce**: Minimal document or text snippet demonstrating the bug.
   - **Expected vs Actual Behavior**: Include error tracebacks or visual screenshots if a layout distortion occurred.
