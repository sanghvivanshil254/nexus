---
slug: stuck-at-5-percent
status: resolved
goal: find_and_fix
trigger: "can you see why it is stuck at 5% (Translation tab shows 'Translating page 0 of ...' 5% forever)"
created: 2026-10-03
updated: 2026-10-03
root_cause_confirmed: true
---

# Symptom

OCR Studio → Translation tab for `resume.pdf` (en → gu) never advanced:
badge `Translating 0/?`, banner `Translating page 0 of ...`, `5%`, status
`Generating neural translation with HarfBuzz complex-script font shaping...`
repeated indefinitely. `/api/admin/jobs` showed every recent job stuck at
`status: pending, total_pages: 0, completed_pages: 0, progress: 0.0`.

# Hypothesis (confirmed)

`backend/main.py::process_pdf_background` called
`document_processor.process_document(..., max_pages=None)`, but
`DocumentProcessor.process_document()` has no `max_pages` parameter
(introduced by commit `5e6d792` — `git log -S "max_pages=None"`).

The resulting `TypeError` was raised *before* any pipeline work and was
swallowed by the broad `except Exception` that only logged — it never called
`mongo_db.fail_job()`, so the job stayed `pending` forever and the UI kept
showing its optimistic placeholder.

Reproduced directly:

```
TypeError: DocumentProcessor.process_document() got an unexpected keyword argument 'max_pages'
```

# Why "5%"

`OcrPipelineDashboard.jsx:1426` hardcoded the fallback: when `total_pages`
is 0/unknown the banner rendered `: 5}%`, i.e. a fake constant 5% — not real
progress. `handleStartPdfTranslation` also seeds `progress: 5.0` optimistically.

# Evidence

- `- timestamp: 2026-10-03` — `inspect.signature(process_document)` = `(input_pdf_path, src_lang, tgt_lang, job_id, output_filename)`; no `max_pages`.
- `- timestamp: 2026-10-03` — direct call with `max_pages=None` raised `TypeError`.
- `- timestamp: 2026-10-03` — `/api/admin/jobs`: job_80b3b853, job_f35cc23c, guest_7bab3fc3 all `pending`, `total_pages: 0`, `error: null` (error never persisted).
- `- timestamp: 2026-10-03` — backend log: `Background translation failed for job ...` was the only trace; job record unchanged.

# Fix

1. `backend/main.py` — removed the invalid `max_pages=None` kwarg; the
   `except` now also calls `mongo_db.fail_job(job_id, str(e))` so any future
   background failure surfaces in the UI instead of hanging.
2. `frontend/src/pages/Dashboard/OcrPipelineDashboard.jsx` — the progress
   banner renders `Starting…` (instead of the fake `5%`) while `total_pages`
   is still unknown.

# Verification

- `python -m compileall backend/main.py` → OK; `inspect.signature(...).bind(...)` → OK.
- Full `process_pdf_background` run for job_80b3b853: `completed 100.0 1/1` in 32.9s.
- End-to-end through the live uvicorn (`--reload`): POST `/api/translate` → `job_3d668333` polled to `completed 100.0 1/1`.
- `npm run lint` → 0 errors (67 pre-existing warnings); `npm run build` → success.
- `pytest backend/tests` → 4 failures in `test_offline_translation_models.py`
  are pre-existing and unrelated (they exercise `backend.translation.router` /
  NLLB routing; `backend.main` is not imported by that suite).

# Files changed

- backend/main.py
- frontend/src/pages/Dashboard/OcrPipelineDashboard.jsx
