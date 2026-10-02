<!-- generated-by: gsd-doc-writer -->
# REST API Reference

Nexus provides a high-performance REST API powered by FastAPI for document ingestion, asynchronous translation job processing, preview rendering, and system health monitoring.

---

## Base URL & Interactive Documentation

- **Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc UI**: `http://127.0.0.1:8000/redoc`

---

## Authentication & Access Control

- **Public Endpoints**: Health checks, model status, language registries, text translation, and document submission operate without authentication.
- **Guest Job Isolation**: File uploads without special credentials use guest isolation with temporary file retention and automated cleanup.
- **Admin Endpoints**: Endpoints under `/api/admin/*` require the header:
  ```http
  X-Admin-Role: admin
  ```
  If missing or invalid, the API returns `403 Forbidden`.

---

## Endpoints Overview

| Method | Path | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | System health, MongoDB status, GPU device, and model tier. | No |
| `GET` | `/api/models/status` | List of locally cached offline translation models in `MODELS_DIR`. | No |
| `GET` | `/api/languages` | Supported languages registry (22 Indic + global languages). | No |
| `POST` | `/api/translate-text` | Translates a raw text snippet synchronously. | No |
| `POST` | `/api/translate` | Submits a document (PDF, DOCX) for background translation. | No |
| `GET` | `/api/jobs/{job_id}` | Detailed job status, progress percentage, and page counts. | No |
| `GET` | `/api/jobs/{job_id}/status` | Lightweight status check for job polling. | No |
| `GET` | `/api/jobs/{job_id}/pages` | List of rendered page preview filenames. | No |
| `GET` | `/api/jobs/{job_id}/pages/{page_num}/rendered` | Fetches rendered image preview of translated page. | No |
| `GET` | `/api/jobs/{job_id}/pages/{page_num}/original` | Fetches rendered image preview of original source page. | No |
| `GET` | `/api/jobs/{job_id}/pages/{page_num}/data` | Returns bounding boxes and text spans for interactive split viewer. | No |
| `GET` | `/api/jobs/{job_id}/download` | Downloads the completed translated PDF document. | No |
| `GET` | `/api/admin/jobs` | Lists all jobs across system storage. | Yes (`X-Admin-Role`) |
| `DELETE` | `/api/admin/jobs/{job_id}` | Deletes job metadata, uploads, and preview files. | Yes (`X-Admin-Role`) |
| `POST` | `/api/admin/jobs/purge-guests` | Purges all temporary guest translations. | Yes (`X-Admin-Role`) |

---

## Request & Response Formats

### 1. Health Check
`GET /api/health`

**Response Example (200 OK):**
```json
{
  "status": "healthy",
  "mongodb_connected": true,
  "device": "cuda",
  "model_tier": "compact",
  "supported_languages_count": 27,
  "loaded_models": ["ai4bharat/indictrans2-en-indic-dist-200M"]
}
```

### 2. Direct Text Translation
`POST /api/translate-text`

**Request Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "text": "The Panchatantra is an ancient Indian collection of interrelated animal fables.",
  "src_lang": "en",
  "tgt_lang": "gu"
}
```

**Response Example (200 OK):**
```json
{
  "translated_text": "પંચતંત્ર એ પરસ્પર સંબંધિત પ્રાણીઓની વાર્તાઓનો એક પ્રાચીન ભારતીય સંગ્રહ છે.",
  "src_lang": "en",
  "tgt_lang": "gu",
  "cached": false
}
```

### 3. Submit Document Translation
`POST /api/translate`

**Request Format:** `multipart/form-data`

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `file` | Binary File | Yes | Input document (PDF or DOCX). |
| `src_lang` | String | Yes | Source language code (e.g. `en`, `hi`, `gu`). |
| `tgt_lang` | String | Yes | Target language code (e.g. `gu`, `hi`, `ta`). |
| `is_guest` | Boolean | No | Mark as temporary guest job (default: `false`). |

**Response Example (200 OK):**
```json
{
  "job_id": "a3b8e2f1-6c4d-49a7-9b21-123456789abc",
  "status": "queued",
  "src_lang": "en",
  "tgt_lang": "gu",
  "filename": "Panchatantra.pdf",
  "message": "Document translation scheduled in background."
}
```

### 4. Query Job Progress
`GET /api/jobs/{job_id}`

**Response Example (200 OK):**
```json
{
  "job_id": "a3b8e2f1-6c4d-49a7-9b21-123456789abc",
  "status": "processing",
  "progress": 45.0,
  "total_pages": 20,
  "completed_pages": 9,
  "src_lang": "en",
  "tgt_lang": "gu",
  "output_file": null
}
```

---

## Error Handling

Standard HTTP status codes are returned on errors:

| Status Code | Meaning | Example Scenario |
| :--- | :--- | :--- |
| `400 Bad Request` | Invalid parameters or unsupported language code. | Submitting an unmapped language tag. |
| `403 Forbidden` | Missing administrative credentials. | Calling `/api/admin/*` without `X-Admin-Role`. |
| `404 Not Found` | Requested entity does not exist. | Querying an unknown `job_id` or non-existent page number. |
| `500 Internal Server Error` | Pipeline processing exception. | Corrupt PDF file structure. |

**Standard Error Response Envelope:**
```json
{
  "detail": "Job a3b8e2f1-6c4d-49a7-9b21-123456789abc not found."
}
```

---

## Concurrency & Resource Throttling

To prevent GPU Out of Memory (OOM) failures under heavy traffic, translation jobs are governed by an internal semaphore in `backend/main.py`:

- **Concurrency Ceiling**: Controlled by `MAX_CONCURRENT_JOBS` (default: `1`).
- Additional jobs wait in queue until active pipeline slots become available.
