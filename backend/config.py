import os
from pathlib import Path
import torch

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_DIR = BASE_DIR / "frontend"
TRAINING_DATA_DIR = BASE_DIR / "training data"
TESTING_DATA_DIR = BASE_DIR / "testing data"
OUTPUT_DIR = BASE_DIR / "output"
PREVIEWS_DIR = OUTPUT_DIR / "previews"
MODELS_DIR = BACKEND_DIR / "models"
FONTS_DIR = BACKEND_DIR / "fonts"

# Ensure essential directories exist
for d in [BACKEND_DIR, FRONTEND_DIR, TRAINING_DATA_DIR, TESTING_DATA_DIR, OUTPUT_DIR, PREVIEWS_DIR, MODELS_DIR, FONTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAME = os.getenv("DB_NAME", "nexus_translator")
CACHE_COLLECTION = "translation_cache"
JOBS_COLLECTION = "translation_jobs"

# Model Tier Configuration ("best" for highest quality 1B/1.3B parameters, "compact" for distilled 200M/600M)
MODEL_SIZE_TIER = os.getenv("MODEL_SIZE_TIER", "compact").lower()

# IndicTrans2 Registry (ai4bharat)
INDICTRANS_REGISTRY = {
    "best": {
        "en-indic": "ai4bharat/indictrans2-en-indic-1B",
        "indic-en": "ai4bharat/indictrans2-indic-en-1B",
        "indic-indic": "ai4bharat/indictrans2-indic-indic-1B",
    },
    "compact": {
        "en-indic": "ai4bharat/indictrans2-en-indic-dist-200M",
        "indic-en": "ai4bharat/indictrans2-indic-en-dist-200M",
        "indic-indic": "ai4bharat/indictrans2-indic-indic-dist-320M",
    },
}

# NLLB-200 Registry (facebook)
NLLB_REGISTRY = {
    "best": "facebook/nllb-200-1.3B",
    "compact": "facebook/nllb-200-distilled-600M",
}

# AfriNLLB is a fine-tuned multilingual model for its published African pairs.
# Keep it separate from NLLB: it uses M2M-100 language codes rather than FLORES tags.
AFRINLLB_REGISTRY = {
    "best": "AfriNLP/AfriNLLB-12enc-12dec-full-ft-kd",
    "compact": "AfriNLP/AfriNLLB-12enc-4dec-iterative-481m-ft",
}

# OPUS-MT Registry (Helsinki-NLP)
OPUS_MT_PREFIX = "Helsinki-NLP/opus-mt"
REGISTERED_OPUS_MT_PAIRS = {
    "en-es", "es-en",
    "en-fr", "fr-en",
    "en-de", "de-en",
    "en-ru", "ru-en",
    "en-it", "it-en",
    "en-nl", "nl-en",
}
# A downloaded OPUS model is only a candidate. Add pairs after recording a
# benchmark win against NLLB, e.g. NEXUS_BENCHMARKED_OPUS_MT_PAIRS=en-es,es-en.
BENCHMARKED_OPUS_MT_PAIRS = {
    pair.strip().lower()
    for pair in os.getenv("NEXUS_BENCHMARKED_OPUS_MT_PAIRS", "").split(",")
    if pair.strip()
} & REGISTERED_OPUS_MT_PAIRS

def get_local_model_dir(model_id: str) -> Path:
    """Returns local cache path for a model inside MODELS_DIR."""
    folder_name = model_id.split("/")[-1]
    return MODELS_DIR / folder_name

# Backward compatibility defaults
INDICTRANS_MODEL_ID = INDICTRANS_REGISTRY[MODEL_SIZE_TIER]["en-indic"]
LOCAL_INDICTRANS_DIR = get_local_model_dir(INDICTRANS_MODEL_ID)
TRANSLATION_MODEL_CACHE_KEY = f"indictrans2-en-indic-{MODEL_SIZE_TIER}-v1"

# Hardware Acceleration
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
TORCH_DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32

# Memory / LRU model offloading (keep 1 model loaded in VRAM by default to prevent OOM)
MAX_LOADED_MODELS = int(os.getenv("MAX_LOADED_MODELS", "1"))

# Translation token limits
INDICTRANS_MAX_INPUT_TOKENS = int(os.getenv("INDICTRANS_MAX_INPUT_TOKENS", "512"))
NLLB_MAX_INPUT_TOKENS = int(os.getenv("NLLB_MAX_INPUT_TOKENS", "512"))
OPUS_MT_MAX_INPUT_TOKENS = int(os.getenv("OPUS_MT_MAX_INPUT_TOKENS", "512"))
CHUNK_MAX_TOKENS = int(os.getenv("CHUNK_MAX_TOKENS", "512"))

# High-Performance Parallel Batching and Beam Configuration
# Greedy decoding (num_beams=1) runs ~5x faster with virtually identical BLEU score
NUM_BEAMS = int(os.getenv("NEXUS_NUM_BEAMS", "1"))
# Parallel batch size for GPU inference (24 chunks in parallel per pass)
PARALLEL_BATCH_SIZE = int(os.getenv("PARALLEL_BATCH_SIZE", "24"))
# Number of pages to process together in parallel multi-page batches
PAGE_BATCH_SIZE = int(os.getenv("PAGE_BATCH_SIZE", "6"))

# Layout reconstruction: font fitting bounds for translated text.
# Translated Indic/CJK text is typically 30-60% longer than the English source,
# so blocks are fitted by growing the box into free space first, then shrinking
# the font down to LAYOUT_FONT_MIN_SIZE.
LAYOUT_FONT_MIN_SIZE = float(os.getenv("LAYOUT_FONT_MIN_SIZE", "5.0"))
LAYOUT_FONT_MAX_SIZE = float(os.getenv("LAYOUT_FONT_MAX_SIZE", "18.0"))
LAYOUT_FONT_STEP = float(os.getenv("LAYOUT_FONT_STEP", "0.5"))
# Fraction of a block's own height it may grow downward into verified empty space.
LAYOUT_MAX_BOX_GROWTH = float(os.getenv("LAYOUT_MAX_BOX_GROWTH", "0.6"))

# OCR: DPI used to rasterize scanned pages before recognition. 300 is the
# standard floor for reliable text recognition on book scans.
OCR_RENDER_DPI = int(os.getenv("OCR_RENDER_DPI", "300"))
# Drop OCR results below this confidence; they are usually scan noise.
OCR_MIN_CONFIDENCE = float(os.getenv("OCR_MIN_CONFIDENCE", "0.5"))
# Preferred OCR engine: "auto", "paddle", "tesseract" (pytesseract) or "pymupdf".
OCR_ENGINE = os.getenv("OCR_ENGINE", "auto").lower()

# Skip running headers and footers (page numbers, running titles) through the
# translation model. They are detected by position in the page analyzer.
SKIP_HEADERS_FOOTERS = os.getenv("SKIP_HEADERS_FOOTERS", "1") not in ("0", "false", "False")

# Compare the declared source language against the script actually found in the
# document, and correct it when they contradict. Guards against a Hindi PDF
# being submitted as src_lang=en, which makes IndicTrans2 hallucinate.
AUTO_DETECT_SOURCE_LANG = os.getenv("AUTO_DETECT_SOURCE_LANG", "1") not in ("0", "false", "False")

# Route distant Indic<->Indic pairs through English (Tamil -> English -> Gujarati)
# instead of the direct indic-indic model. "auto" pivots only when the direct
# model is not present on disk; "1" always pivots; "0" never does.
INDIC_PIVOT_VIA_ENGLISH = os.getenv("INDIC_PIVOT_VIA_ENGLISH", "auto").lower()

