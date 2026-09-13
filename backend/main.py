import os
import shutil
import uuid
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

from backend.config import OUTPUT_DIR, BACKEND_DIR, DEVICE, MODELS_DIR, MODEL_SIZE_TIER
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

def process_pdf_background(job_id: str, file_path: str, src_lang: str, tgt_lang: str, max_pages: Optional[int]):
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

        # Global & European Languages (NLLB-200 1.3B / OPUS-MT)
        {"code": "en", "name": "English", "language_tag": "eng_Latn", "region": "Global", "primary_model": "IndicTrans2 / NLLB"},
        {"code": "es", "name": "Spanish", "language_tag": "spa_Latn", "region": "Europe", "primary_model": "NLLB-200 1.3B / OPUS-MT"},
        {"code": "fr", "name": "French", "language_tag": "fra_Latn", "region": "Europe", "primary_model": "NLLB-200 1.3B / OPUS-MT"},
        {"code": "de", "name": "German", "language_tag": "deu_Latn", "region": "Europe", "primary_model": "NLLB-200 1.3B / OPUS-MT"},
        {"code": "it", "name": "Italian", "language_tag": "ita_Latn", "region": "Europe", "primary_model": "NLLB-200 1.3B / OPUS-MT"},
        {"code": "pt", "name": "Portuguese", "language_tag": "por_Latn", "region": "Europe", "primary_model": "NLLB-200 1.3B"},
        {"code": "nl", "name": "Dutch", "language_tag": "nld_Latn", "region": "Europe", "primary_model": "NLLB-200 1.3B"},
        {"code": "ru", "name": "Russian", "language_tag": "rus_Cyrl", "region": "Eastern Europe", "primary_model": "NLLB-200 1.3B / OPUS-MT"},
        {"code": "uk", "name": "Ukrainian", "language_tag": "ukr_Cyrl", "region": "Eastern Europe", "primary_model": "NLLB-200 1.3B"},
        {"code": "pl", "name": "Polish", "language_tag": "pol_Latn", "region": "Eastern Europe", "primary_model": "NLLB-200 1.3B"},

        # East Asia & Middle East
        {"code": "zh", "name": "Chinese (Simplified)", "language_tag": "zho_Hans", "region": "East Asia", "primary_model": "NLLB-200 1.3B"},
        {"code": "ja", "name": "Japanese", "language_tag": "jpn_Jpan", "region": "East Asia", "primary_model": "NLLB-200 1.3B"},
        {"code": "ko", "name": "Korean", "language_tag": "kor_Hang", "region": "East Asia", "primary_model": "NLLB-200 1.3B"},
        {"code": "ar", "name": "Arabic", "language_tag": "arb_Arab", "region": "Middle East", "primary_model": "NLLB-200 1.3B"},
        {"code": "fa", "name": "Persian", "language_tag": "pes_Arab", "region": "Middle East", "primary_model": "NLLB-200 1.3B"},
        {"code": "tr", "name": "Turkish", "language_tag": "tur_Latn", "region": "Middle East", "primary_model": "NLLB-200 1.3B"},

        # Africa
        {"code": "sw", "name": "Swahili", "language_tag": "swh_Latn", "region": "Africa", "primary_model": "NLLB-200 1.3B / AfriNLLB"},
        {"code": "yo", "name": "Yoruba", "language_tag": "yor_Latn", "region": "Africa", "primary_model": "NLLB-200 1.3B / AfriNLLB"},
        {"code": "zu", "name": "Zulu", "language_tag": "zul_Latn", "region": "Africa", "primary_model": "NLLB-200 1.3B / AfriNLLB"},
    ]
    return {"languages": languages, "total": len(languages)}


@app.post("/api/translate")
async def translate_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    src_lang: str = Form("en"),
    tgt_lang: str = Form("gu"),
    max_pages: Optional[int] = Form(None)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    job_id = f"job_{uuid.uuid4().hex[:8]}"
    save_path = UPLOADS_DIR / f"{job_id}_{file.filename}"

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    mongo_db.create_job(job_id, file.filename, src_lang, tgt_lang)

    background_tasks.add_task(
        process_pdf_background,
        job_id=job_id,
        file_path=str(save_path),
        src_lang=src_lang,
        tgt_lang=tgt_lang,
        max_pages=max_pages
    )

    return {
        "job_id": job_id,
        "filename": file.filename,
        "src_lang": src_lang,
        "tgt_lang": tgt_lang,
        "status": "queued",
        "message": "Translation task queued successfully."
    }

@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    job = mongo_db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.get("/api/jobs/{job_id}/download")
def download_translated_pdf(job_id: str):
    job = mongo_db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") != "completed":
        raise HTTPException(status_code=400, detail=f"Job is not completed. Current status: {job.get('status')}")

    output_file = job.get("output_file")
    if not output_file or not Path(output_file).exists():
        raise HTTPException(status_code=404, detail="Output file not found on disk.")

    return FileResponse(
        output_file,
        media_type="application/pdf",
        filename=Path(output_file).name
    )
