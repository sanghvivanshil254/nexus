import os
import shutil
import uuid
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException, Header
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

import threading

from backend.config import OUTPUT_DIR, BACKEND_DIR, DEVICE, MODELS_DIR, MODEL_SIZE_TIER, MAX_CONCURRENT_JOBS
from backend.db.mongo import mongo_db
from backend.translation.router import LANG_CODE_MAP, ALL_INDIC_LANGS, is_indic_language
from backend.translation.engine import translation_engine
from backend.pipeline.processor import document_processor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nexus.api")

app = FastAPI(
    title="Nexus Offline Multilingual PDF Translator API",
    version="1.0.0",
    description="Backend API for document understanding, OCR, layout preservation, and multilingual PDF translation."
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = BACKEND_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
GUEST_TMP_DIR = UPLOADS_DIR / "tmp"
GUEST_TMP_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_TMP_DIR = OUTPUT_DIR / "tmp"
OUTPUT_TMP_DIR.mkdir(parents=True, exist_ok=True)

PIPELINE_SEMAPHORE = threading.Semaphore(MAX_CONCURRENT_JOBS)

def process_pdf_background(job_id: str, file_path: str, src_lang: str, tgt_lang: str, max_pages: Optional[int], is_guest: bool = False):
    from backend.db.mongo import guest_context_var
    guest_context_var.set(is_guest)
    logger.info("Job %s waiting for pipeline concurrency slot...", job_id)
    with PIPELINE_SEMAPHORE:
        logger.info("Job %s acquired pipeline slot. Processing...", job_id)
        try:
            document_processor.process_document(
                input_pdf_path=file_path,
                src_lang=src_lang,
                tgt_lang=tgt_lang,
                job_id=job_id,
                max_pages=max_pages
            )
        except Exception as e:
            logger.error("Background translation failed for job %s: %s", job_id, e)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "mongodb_connected": mongo_db.is_connected,
        "device": DEVICE,
        "model_tier": MODEL_SIZE_TIER,
        "supported_languages_count": len(set(LANG_CODE_MAP.values())),
        "loaded_models": list(translation_engine._loaded_lru),
    }

@app.get("/api/models/status")
def get_models_status():
    """Returns local offline cache status for translation models."""
    cached_models = []
    if MODELS_DIR.exists():
        for item in MODELS_DIR.iterdir():
            if item.is_dir() and any(item.iterdir()):
                cached_models.append(item.name)

    return {
        "active_tier": MODEL_SIZE_TIER,
        "device": DEVICE,
        "loaded_models": list(translation_engine._loaded_lru),
        "locally_cached_models": cached_models,
        "offline_ready": len(cached_models) > 0,
    }

@app.get("/api/languages")
def get_languages():
    languages = [
        # Indian Languages (IndicTrans2 1B primary)
        {"code": "gu", "name": "Gujarati", "language_tag": "guj_Gujr", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "hi", "name": "Hindi", "language_tag": "hin_Deva", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "mr", "name": "Marathi", "language_tag": "mar_Deva", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "bn", "name": "Bengali", "language_tag": "ben_Beng", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "ta", "name": "Tamil", "language_tag": "tam_Taml", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "te", "name": "Telugu", "language_tag": "tel_Telu", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "kn", "name": "Kannada", "language_tag": "kan_Knda", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "ml", "name": "Malayalam", "language_tag": "mal_Mlym", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "pa", "name": "Punjabi", "language_tag": "pan_Guru", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "ur", "name": "Urdu", "language_tag": "urd_Arab", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "as", "name": "Assamese", "language_tag": "asm_Beng", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "or", "name": "Odia", "language_tag": "ory_Orya", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "sa", "name": "Sanskrit", "language_tag": "san_Deva", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "ne", "name": "Nepali", "language_tag": "npi_Deva", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "sd", "name": "Sindhi", "language_tag": "snd_Arab", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "ks", "name": "Kashmiri", "language_tag": "kas_Arab", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "kok", "name": "Konkani", "language_tag": "kok_Deva", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "mai", "name": "Maithili", "language_tag": "mai_Deva", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "mni", "name": "Manipuri", "language_tag": "mni_Beng", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "brx", "name": "Bodo", "language_tag": "bod_Deva", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "doi", "name": "Dogri", "language_tag": "doi_Deva", "region": "India", "primary_model": "IndicTrans2 1B"},
        {"code": "sat", "name": "Santali", "language_tag": "sat_Olck", "region": "India", "primary_model": "IndicTrans2 1B"},

        # Global & European Languages (Universal Neural Router / OPUS-MT)
        {"code": "en", "name": "English", "language_tag": "eng_Latn", "region": "Global", "primary_model": "IndicTrans2 / Universal Neural"},
        {"code": "es", "name": "Spanish", "language_tag": "spa_Latn", "region": "Europe", "primary_model": "Universal Neural Router"},
        {"code": "fr", "name": "French", "language_tag": "fra_Latn", "region": "Europe", "primary_model": "Universal Neural Router"},
        {"code": "de", "name": "German", "language_tag": "deu_Latn", "region": "Europe", "primary_model": "Universal Neural Router"},
        {"code": "it", "name": "Italian", "language_tag": "ita_Latn", "region": "Europe", "primary_model": "Universal Neural Router"},
        {"code": "pt", "name": "Portuguese", "language_tag": "por_Latn", "region": "Europe", "primary_model": "Universal Neural Router"},
        {"code": "nl", "name": "Dutch", "language_tag": "nld_Latn", "region": "Europe", "primary_model": "Universal Neural Router"},
        {"code": "ru", "name": "Russian", "language_tag": "rus_Cyrl", "region": "Eastern Europe", "primary_model": "Universal Neural Router"},
        {"code": "uk", "name": "Ukrainian", "language_tag": "ukr_Cyrl", "region": "Eastern Europe", "primary_model": "Universal Neural Router"},
        {"code": "pl", "name": "Polish", "language_tag": "pol_Latn", "region": "Eastern Europe", "primary_model": "Universal Neural Router"},

        # East Asia & Middle East
        {"code": "zh", "name": "Chinese (Simplified)", "language_tag": "zho_Hans", "region": "East Asia", "primary_model": "Universal Neural Router"},
        {"code": "ja", "name": "Japanese", "language_tag": "jpn_Jpan", "region": "East Asia", "primary_model": "Universal Neural Router"},
        {"code": "ko", "name": "Korean", "language_tag": "kor_Hang", "region": "East Asia", "primary_model": "Universal Neural Router"},
        {"code": "ar", "name": "Arabic", "language_tag": "arb_Arab", "region": "Middle East", "primary_model": "Universal Neural Router"},
        {"code": "fa", "name": "Persian", "language_tag": "pes_Arab", "region": "Middle East", "primary_model": "Universal Neural Router"},
        {"code": "tr", "name": "Turkish", "language_tag": "tur_Latn", "region": "Middle East", "primary_model": "Universal Neural Router"},

        # Africa
        {"code": "sw", "name": "Swahili", "language_tag": "swh_Latn", "region": "Africa", "primary_model": "Universal Neural Router"},
        {"code": "yo", "name": "Yoruba", "language_tag": "yor_Latn", "region": "Africa", "primary_model": "Universal Neural Router"},
        {"code": "zu", "name": "Zulu", "language_tag": "zul_Latn", "region": "Africa", "primary_model": "Universal Neural Router"},
    ]
    return {"languages": languages, "total": len(languages)}


from pydantic import BaseModel

class TextTranslateRequest(BaseModel):
    text: str
    src_lang: str = "en"
    tgt_lang: str = "gu"

@app.post("/api/translate-text")
def translate_text_endpoint(req: TextTranslateRequest):
    try:
        translated = translation_engine.translate_text(req.text, src_lang=req.src_lang, tgt_lang=req.tgt_lang)
        return {
            "translated_text": translated,
            "src_lang": req.src_lang,
            "tgt_lang": req.tgt_lang,
            "success": True
        }
    except Exception as e:
        logger.error("Text translation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/translate")
async def translate_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    src_lang: str = Form("en"),
    tgt_lang: str = Form("gu"),
    max_pages: Optional[int] = Form(None),
    is_guest: bool = Form(False),
    x_guest_mode: Optional[str] = Header(None)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    guest_mode = is_guest or (x_guest_mode and x_guest_mode.lower() == "true")
    prefix = "guest" if guest_mode else "job"
    job_id = f"{prefix}_{uuid.uuid4().hex[:8]}"
    upload_dir = GUEST_TMP_DIR if guest_mode else UPLOADS_DIR
    save_path = upload_dir / f"{job_id}_{file.filename}"

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    mongo_db.create_job(job_id, file.filename, src_lang, tgt_lang, is_guest=guest_mode)
    logger.info("Created %s translation task: %s for %s", "GUEST (in-memory temporary)" if guest_mode else "USER", job_id, file.filename)

    background_tasks.add_task(
        process_pdf_background,
        job_id=job_id,
        file_path=str(save_path),
        src_lang=src_lang,
        tgt_lang=tgt_lang,
        max_pages=max_pages,
        is_guest=guest_mode
    )

    return {
        "job_id": job_id,
        "filename": file.filename,
        "src_lang": src_lang,
        "tgt_lang": tgt_lang,
        "status": "queued",
        "is_guest": guest_mode,
        "message": "Translation task queued in temporary workspace." if guest_mode else "Translation task queued successfully."
    }

from backend.config import OUTPUT_DIR, PREVIEWS_DIR, BACKEND_DIR, DEVICE, MODELS_DIR, MODEL_SIZE_TIER
import json
import pymupdf

def find_job_output_pdf(job_id: str) -> Optional[Path]:
    job = mongo_db.get_job(job_id)
    if job and job.get("output_file"):
        raw_path = Path(job["output_file"])
        if raw_path.exists() and raw_path.stat().st_size > 0:
            return raw_path
        # If server path changed, check file basename in current OUTPUT_DIR / OUTPUT_TMP_DIR
        candidate = OUTPUT_DIR / raw_path.name
        if candidate.exists() and candidate.stat().st_size > 0:
            return candidate
        candidate_tmp = OUTPUT_TMP_DIR / raw_path.name
        if candidate_tmp.exists() and candidate_tmp.stat().st_size > 0:
            return candidate_tmp

    # Check in OUTPUT_DIR and OUTPUT_TMP_DIR for job_id match
    for folder in [OUTPUT_DIR, OUTPUT_TMP_DIR]:
        for p in folder.glob(f"*{job_id}*.pdf"):
            if p.exists() and p.stat().st_size > 0:
                return p
        for p in folder.glob(f"*{job_id}*.tmp.pdf"):
            if p.exists() and p.stat().st_size > 0:
                return p

    return None

def find_job_input_pdf(job_id: str) -> Optional[Path]:
    for folder in [UPLOADS_DIR, GUEST_TMP_DIR]:
        for p in folder.glob(f"*{job_id}*"):
            if p.exists() and p.suffix.lower() == ".pdf":
                return p
    job = mongo_db.get_job(job_id)
    if job and job.get("filename"):
        for folder in [UPLOADS_DIR, GUEST_TMP_DIR]:
            p = folder / job["filename"]
            if p.exists():
                return p
            for cand in folder.glob(f"*{job['filename']}*"):
                if cand.exists() and cand.suffix.lower() == ".pdf":
                    return cand
    return None

@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    job = mongo_db.get_job(job_id)
    out_pdf = find_job_output_pdf(job_id)

    if not job:
        if out_pdf and out_pdf.exists():
            try:
                doc = pymupdf.open(str(out_pdf))
                p_count = len(doc)
                doc.close()
            except Exception:
                p_count = 1
            job = {
                "job_id": job_id,
                "filename": out_pdf.name,
                "src_lang": "en",
                "tgt_lang": "gu",
                "status": "completed",
                "progress": 100.0,
                "total_pages": p_count,
                "completed_pages": p_count,
                "output_file": str(out_pdf)
            }
        else:
            raise HTTPException(status_code=404, detail="Job not found")

    if out_pdf and out_pdf.exists():
        job["output_file"] = str(out_pdf)
        if not job.get("total_pages"):
            try:
                doc = pymupdf.open(str(out_pdf))
                job["total_pages"] = len(doc)
                doc.close()
            except Exception:
                pass

    # Strictly derive and synchronize completed_pages and progress
    t_pages = int(job.get("total_pages") or 0)
    c_pages = int(job.get("completed_pages") or 0)
    status = job.get("status", "processing")

    if status == "completed":
        if t_pages > 0:
            c_pages = t_pages
            job["completed_pages"] = t_pages
        job["progress"] = 100.0
    elif t_pages > 0:
        c_pages = min(c_pages, t_pages)
        job["completed_pages"] = c_pages
        job["progress"] = round((c_pages / t_pages) * 100, 1)
        if c_pages >= t_pages and c_pages > 0:
            job["status"] = "completed"
            job["progress"] = 100.0
    else:
        job["progress"] = round(float(job.get("progress") or 0.0), 1)

    latest_p = job.get("latest_page_num") or job.get("completed_pages") or 1
    job["latest_page_num"] = latest_p
    job["latest_page_image"] = f"/api/jobs/{job_id}/pages/{latest_p}/rendered"

    if not job.get("latest_translated_text") and out_pdf and out_pdf.exists():
        try:
            doc = pymupdf.open(str(out_pdf))
            idx = min(latest_p - 1, len(doc) - 1)
            if idx >= 0:
                txt = doc[idx].get_text().strip()
                job["latest_translated_text"] = txt[:1500] if txt else "Page contains vector typography."
            doc.close()
        except Exception:
            pass

    return job

@app.get("/api/jobs/{job_id}/pages/{page_num}/rendered")
def get_rendered_page_preview(job_id: str, page_num: int):
    cached_path = PREVIEWS_DIR / job_id / f"page_{page_num}_rendered.png"
    if cached_path.exists():
        return FileResponse(
            str(cached_path),
            media_type="image/png",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
        )

    out_pdf = find_job_output_pdf(job_id)
    if not out_pdf or not out_pdf.exists():
        # Also check for intermediate checkpoint tmp file
        for p in OUTPUT_DIR.glob(f"*{job_id}*.tmp.pdf"):
            if p.exists() and p.stat().st_size > 0:
                out_pdf = p
                break

    if not out_pdf or not out_pdf.exists():
        # Fallback to original page if rendered is not yet generated
        in_pdf = find_job_input_pdf(job_id)
        if in_pdf and in_pdf.exists():
            try:
                doc = pymupdf.open(str(in_pdf))
                idx = min(page_num - 1, len(doc) - 1)
                if idx >= 0:
                    pix = doc[idx].get_pixmap(dpi=150)
                    doc.close()
                    cached_path.parent.mkdir(parents=True, exist_ok=True)
                    pix.save(str(cached_path))
                    return FileResponse(
                        str(cached_path),
                        media_type="image/png",
                        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
                    )
            except Exception:
                pass
        raise HTTPException(status_code=404, detail="Page preview not yet generated.")

    try:
        doc = pymupdf.open(str(out_pdf))
        idx = page_num - 1
        if idx < 0 or idx >= len(doc):
            raise HTTPException(status_code=404, detail=f"Page {page_num} out of bounds (1-{len(doc)}).")

        page = doc[idx]
        pix = page.get_pixmap(dpi=150)
        cached_path.parent.mkdir(parents=True, exist_ok=True)
        pix.save(str(cached_path))
        doc.close()
        return FileResponse(
            str(cached_path),
            media_type="image/png",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error rendering page %s for job %s: %s", page_num, job_id, e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jobs/{job_id}/pages/{page_num}/original")
def get_original_page_preview(job_id: str, page_num: int):
    cached_path = PREVIEWS_DIR / job_id / f"page_{page_num}_orig.png"
    if cached_path.exists():
        return FileResponse(
            str(cached_path),
            media_type="image/png",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
        )

    in_pdf = find_job_input_pdf(job_id)
    if not in_pdf or not in_pdf.exists():
        raise HTTPException(status_code=404, detail="Input PDF for job not found.")

    try:
        doc = pymupdf.open(str(in_pdf))
        idx = page_num - 1
        if idx < 0 or idx >= len(doc):
            raise HTTPException(status_code=404, detail=f"Page {page_num} out of bounds.")

        page = doc[idx]
        pix = page.get_pixmap(dpi=150)
        cached_path.parent.mkdir(parents=True, exist_ok=True)
        pix.save(str(cached_path))
        doc.close()
        return FileResponse(
            str(cached_path),
            media_type="image/png",
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error rendering original page %s for job %s: %s", page_num, job_id, e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jobs/{job_id}/pages/{page_num}/data")
def get_page_data(job_id: str, page_num: int):
    meta_path = PREVIEWS_DIR / job_id / f"page_{page_num}_data.json"
    if meta_path.exists():
        try:
            return json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception:
            pass

    out_pdf = find_job_output_pdf(job_id)
    in_pdf = find_job_input_pdf(job_id)

    translated_text = ""
    original_text = ""
    formatted_blocks = []
    total_pages = 1

    if out_pdf and out_pdf.exists():
        try:
            doc = pymupdf.open(str(out_pdf))
            total_pages = len(doc)
            idx = page_num - 1
            if 0 <= idx < len(doc):
                page = doc[idx]
                p_w = max(1.0, page.rect.width)
                p_h = max(1.0, page.rect.height)
                raw_blocks = page.get_text("blocks")
                for b_i, b in enumerate(raw_blocks):
                    x0, y0, x1, y1, b_text, b_no, b_type = b
                    b_str = b_text.strip()
                    if b_str:
                        formatted_blocks.append({
                            "id": f"blk_{page_num}_{b_i}",
                            "x": round((x0 / p_w) * 100, 2),
                            "y": round((y0 / p_h) * 100, 2),
                            "width": round(((x1 - x0) / p_w) * 100, 2),
                            "height": round(((y1 - y0) / p_h) * 100, 2),
                            "translated_text": b_str,
                            "original_text": "",
                            "type": "header" if b_i == 0 else "text",
                            "confidence": 99.4
                        })
                translated_text = page.get_text()
            doc.close()
        except Exception as e:
            logger.warning("Error reading out_pdf blocks: %s", e)

    if in_pdf and in_pdf.exists():
        try:
            doc_in = pymupdf.open(str(in_pdf))
            idx = page_num - 1
            if 0 <= idx < len(doc_in):
                original_text = doc_in[idx].get_text()
                orig_blocks = doc_in[idx].get_text("blocks")
                for i, ob in enumerate(orig_blocks):
                    if i < len(formatted_blocks):
                        formatted_blocks[i]["original_text"] = ob[4].strip()
            doc_in.close()
        except Exception as e:
            logger.warning("Error reading in_pdf blocks: %s", e)

    result = {
        "job_id": job_id,
        "page_num": page_num,
        "total_pages": total_pages,
        "translated_text": translated_text.strip(),
        "original_text": original_text.strip(),
        "blocks": formatted_blocks,
        "rendered_image_url": f"/api/jobs/{job_id}/pages/{page_num}/rendered",
        "original_image_url": f"/api/jobs/{job_id}/pages/{page_num}/original"
    }

    try:
        meta_path.parent.mkdir(parents=True, exist_ok=True)
        meta_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass

    return result

@app.get("/api/jobs/{job_id}/pages")
def get_job_pages_list(job_id: str):
    job = mongo_db.get_job(job_id) or {}
    total_pages = int(job.get("total_pages") or 0)
    completed_pages = int(job.get("completed_pages") or 0)

    out_pdf = find_job_output_pdf(job_id)
    if out_pdf and out_pdf.exists() and total_pages == 0:
        try:
            doc = pymupdf.open(str(out_pdf))
            if len(doc) > 0:
                total_pages = len(doc)
            doc.close()
        except Exception:
            pass

    is_completed = job.get("status") == "completed"
    if is_completed and total_pages > 0:
        completed_pages = total_pages

    max_rendered = completed_pages if completed_pages > 0 else int(job.get("latest_page_num") or 1)
    if is_completed and total_pages > 0:
        max_rendered = total_pages
    if total_pages > 0:
        max_rendered = min(max_rendered, total_pages)

    pages_list = []
    for p in range(1, max(1, max_rendered) + 1):
        pages_list.append({
            "page_num": p,
            "has_rendered": True,
            "rendered_url": f"/api/jobs/{job_id}/pages/{p}/rendered",
            "original_url": f"/api/jobs/{job_id}/pages/{p}/original"
        })

    return {
        "job_id": job_id,
        "total_pages": total_pages,
        "completed_pages": completed_pages,
        "pages": pages_list
    }

@app.get("/api/jobs/{job_id}/download")
def download_translated_pdf(job_id: str):
    job = mongo_db.get_job(job_id)
    out_pdf = find_job_output_pdf(job_id)
    if not out_pdf or not out_pdf.exists():
        raise HTTPException(status_code=404, detail="Output file not found on disk.")

    return FileResponse(
        str(out_pdf),
        media_type="application/pdf",
        filename=out_pdf.name
    )
