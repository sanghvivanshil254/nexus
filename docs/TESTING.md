<!-- generated-by: gsd-doc-writer -->
# Testing Guide

This document details the testing architecture, test execution commands, and guidelines for writing and maintaining tests in Nexus.

---

## Test Framework & Setup

- **Backend Test Framework**: Standard Python `unittest` framework.
- **Test Directory**: [`backend/tests/`](file:///c:/Users/sangh/Downloads/to%20desktop/nexus/backend/tests/)
- **Core Test Suite**: [`backend/tests/test_offline_translation_models.py`](file:///c:/Users/sangh/Downloads/to%20desktop/nexus/backend/tests/test_offline_translation_models.py)
- **Sample Test Documents**: [`testing data/`](file:///c:/Users/sangh/Downloads/to%20desktop/nexus/testing%20data/) containing benchmark PDFs (e.g., `Panchatantra.pdf`)

---

## Running Tests

### 1. Run the Complete Test Suite
Execute the test runner from the repository root:

```bash
python -m unittest backend/tests/test_offline_translation_models.py
```

### 2. Run a Specific Test Method
To execute a single test case for rapid iteration:

```bash
# Test language normalization across all 22 Scheduled Indian Languages:
python -m unittest backend.tests.test_offline_translation_models.TestOfflineTranslationModels.test_all_22_indic_languages_normalized

# Test Unicode script detection:
python -m unittest backend.tests.test_offline_translation_models.TestOfflineTranslationModels.test_script_detection

# Test ModelRouter selection logic:
python -m unittest backend.tests.test_offline_translation_models.TestOfflineTranslationModels.test_router_best_tier_indictrans2
```

### 3. Verify Offline Model Weights
Use the dedicated model verification utility to validate checksums and tensor file integrity:

```bash
python backend/scripts/verify_models.py
```

### 4. End-to-End Pipeline Smoke Test
Verify the complete ingestion, translation, HarfBuzz shaping, and PDF rendering pipeline with a test document:

```bash
python backend/run_pipeline.py --input "testing data/Panchatantra.pdf" --src en --tgt gu --output "output/smoke_test.pdf"
```

---

## Writing New Tests

When adding new tests for translation backends, layout shaping, or OCR cleaning:

1. **File Placement**: Place new test files in `backend/tests/` with the prefix `test_*.py`.
2. **Path Setup**: Ensure the project root is added to `sys.path` so relative imports resolve cleanly:
   ```python
   from pathlib import Path
   import sys
   import unittest

   BASE_DIR = Path(__file__).resolve().parent.parent.parent
   sys.path.insert(0, str(BASE_DIR))
   ```
3. **Mocking Offline Models**:
   - Heavy neural model weights (1B+ parameters) should not be downloaded dynamically during CI unit tests.
   - Mock model inference outputs when verifying pipeline logic, token chunking, and font fitting.
   - For router tests, verify that `ModelRouter.route(src, tgt)` returns the expected `RouteDecision` without loading weights into VRAM.

---

## Coverage Requirements

| Type | Threshold |
| :--- | :--- |
| Lines | No strict threshold enforced <!-- VERIFY: coverage threshold --> |
| Critical Modules (`backend/translation/router.py`, `backend/pipeline/cleaner.py`) | > 85% recommended |

To measure test coverage locally using `coverage.py`:

```bash
pip install coverage
coverage run -m unittest discover backend/tests
coverage report -m
```

---

## CI / CD Integration

Continuous integration workflows validate commits on pull requests:
- **Lint Step**: `cd frontend && npm run lint` verifies React UI syntax with `oxlint`.
- **Unit Test Step**: `python -m unittest discover backend/tests` executes offline routing, language normalization, script detection, and cache unit tests.
