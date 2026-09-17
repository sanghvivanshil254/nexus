import re
from dataclasses import dataclass
from typing import Optional, Dict, Tuple, Set

from backend.config import (
    INDIC_PIVOT_VIA_ENGLISH,
    INDICTRANS_REGISTRY,
    MODEL_SIZE_TIER,
    NLLB_REGISTRY,
    AFRINLLB_REGISTRY,
    OPUS_MT_PREFIX,
    REGISTERED_OPUS_MT_PAIRS,
    BENCHMARKED_OPUS_MT_PAIRS,
    get_local_model_dir,
)

# All 22 Scheduled Indian Languages (Flores-200 / IndicTrans2 codes)
ALL_INDIC_LANGS: Set[str] = {
    "asm_Beng",  # Assamese
    "ben_Beng",  # Bengali
    "bod_Deva",  # Bodo
    "doi_Deva",  # Dogri
    "guj_Gujr",  # Gujarati
    "hin_Deva",  # Hindi
    "kan_Knda",  # Kannada
    "kas_Arab",  # Kashmiri (Arabic)
    "kas_Deva",  # Kashmiri (Devanagari)
    "kok_Deva",  # Konkani
    "mai_Deva",  # Maithili
    "mal_Mlym",  # Malayalam
    "mni_Beng",  # Manipuri (Bengali)
    "mni_Mtei",  # Manipuri (Meitei)
    "mar_Deva",  # Marathi
    "npi_Deva",  # Nepali
    "ory_Orya",  # Odia
    "pan_Guru",  # Punjabi
    "san_Deva",  # Sanskrit
    "sat_Olck",  # Santali
    "snd_Arab",  # Sindhi (Arabic)
    "snd_Deva",  # Sindhi (Devanagari)
    "tam_Taml",  # Tamil
    "tel_Telu",  # Telugu
    "urd_Arab",  # Urdu
}

# The 27 Authentically Supported Languages:
# 22 Scheduled Indian Languages + English + 4 Benchmarked Global Languages
LANG_CODE_MAP: Dict[str, str] = {
    # 22 Scheduled Indian Languages (IndicTrans2)
    "as": "asm_Beng", "asm": "asm_Beng", "assamese": "asm_Beng",
    "bn": "ben_Beng", "ben": "ben_Beng", "bengali": "ben_Beng",
    "brx": "bod_Deva", "bod": "bod_Deva", "bodo": "bod_Deva",
    "doi": "doi_Deva", "dogri": "doi_Deva",
    "gu": "guj_Gujr", "guj": "guj_Gujr", "gujarati": "guj_Gujr",
    "hi": "hin_Deva", "hin": "hin_Deva", "hindi": "hin_Deva",
    "kn": "kan_Knda", "kan": "kan_Knda", "kannada": "kan_Knda",
    "ks": "kas_Arab", "kas": "kas_Arab", "kashmiri": "kas_Arab",
    "kok": "kok_Deva", "konkani": "kok_Deva",
    "mai": "mai_Deva", "maithili": "mai_Deva",
    "ml": "mal_Mlym", "mal": "mal_Mlym", "malayalam": "mal_Mlym",
    "mni": "mni_Beng", "manipuri": "mni_Beng",
    "mr": "mar_Deva", "mar": "mar_Deva", "marathi": "mar_Deva",
    "ne": "npi_Deva", "npi": "npi_Deva", "nepali": "npi_Deva",
    "or": "ory_Orya", "ory": "ory_Orya", "odia": "ory_Orya", "oriya": "ory_Orya",
    "pa": "pan_Guru", "pan": "pan_Guru", "punjabi": "pan_Guru",
    "sa": "san_Deva", "san": "san_Deva", "sanskrit": "san_Deva",
    "sat": "sat_Olck", "santali": "sat_Olck",
    "sd": "snd_Arab", "snd": "snd_Arab", "sindhi": "snd_Arab",
    "ta": "tam_Taml", "tam": "tam_Taml", "tamil": "tam_Taml",
    "te": "tel_Telu", "tel": "tel_Telu", "telugu": "tel_Telu",
    "ur": "urd_Arab", "urd": "urd_Arab", "urdu": "urd_Arab",

    # English & Core Global Languages (OPUS-MT / Neural)
    "en": "eng_Latn", "eng": "eng_Latn", "english": "eng_Latn",
    "es": "spa_Latn", "spa": "spa_Latn", "spanish": "spa_Latn",
    "fr": "fra_Latn", "fra": "fra_Latn", "french": "fra_Latn",
    "de": "deu_Latn", "deu": "deu_Latn", "german": "deu_Latn",
    "ru": "rus_Cyrl", "rus": "rus_Cyrl", "russian": "rus_Cyrl",
}

# Published AfriNLLB directions: English<->African/AU languages and
# French<->Lingala/Wolof. Values are the M2M-100 tokenizer language codes.
AFRINLLB_LANG_CODES = {
    "eng_Latn": "en", "fra_Latn": "fr", "spa_Latn": "es", "por_Latn": "pt",
    "arb_Arab": "ar", "arz_Arab": "arz", "swh_Latn": "sw", "hau_Latn": "ha",
    "yor_Latn": "yo", "amh_Ethi": "am", "som_Latn": "so", "zul_Latn": "zu",
    "lin_Latn": "ln", "afr_Latn": "af", "wol_Latn": "wo",
}
AFRINLLB_ENGLISH_PAIRS = set(AFRINLLB_LANG_CODES) - {"eng_Latn", "fra_Latn"}
AFRINLLB_FRENCH_PAIRS = {"lin_Latn", "wol_Latn"}

# Inverted mapping to convert Flores tag to primary 2-letter ISO code
FLORES_TO_ISO_MAP: Dict[str, str] = {
    "eng_Latn": "en", "guj_Gujr": "gu", "hin_Deva": "hi", "mar_Deva": "mr",
    "ben_Beng": "bn", "tam_Taml": "ta", "tel_Telu": "te", "kan_Knda": "kn",
    "mal_Mlym": "ml", "pan_Guru": "pa", "urd_Arab": "ur", "asm_Beng": "as",
    "ory_Orya": "or", "san_Deva": "sa", "npi_Deva": "ne", "snd_Arab": "sd",
    "bod_Deva": "brx", "doi_Deva": "doi", "kas_Arab": "ks", "kok_Deva": "kok",
    "mai_Deva": "mai", "mni_Beng": "mni", "sat_Olck": "sat",
    "spa_Latn": "es", "fra_Latn": "fr", "deu_Latn": "de", "rus_Cyrl": "ru",
}

def normalize_lang_code(code: str) -> str:
    """
    Normalizes any ISO-639 code or language name to a Flores-200 / IndicTrans2 tag.
    Returns the tag as-is if already normalized.
    """
    if not code:
        return "eng_Latn"
    clean = code.strip().lower()
    if clean in ("auto", "auto_detect", "autodetect"):
        return "auto"
    if clean in LANG_CODE_MAP:
        return LANG_CODE_MAP[clean]
    for _, v in LANG_CODE_MAP.items():
        if clean == v.lower():
            return v
    return code


def _build_display_names() -> Dict[str, str]:
    """
    Inverts LANG_CODE_MAP into Flores tag -> human-readable English name.
    Only the spelled-out aliases are used as names, never the 2/3-letter codes.
    """
    names: Dict[str, str] = {}
    for alias, flores in LANG_CODE_MAP.items():
        if len(alias) <= 3:
            continue  # "gu", "guj" are codes, not names
        pretty = alias.replace("_", " ").title()
        # Keep the shortest spelled-out alias: "Odia" over "Oriya".
        if flores not in names or len(pretty) < len(names[flores]):
            names[flores] = pretty
    return names


LANGUAGE_DISPLAY_NAMES: Dict[str, str] = _build_display_names()


def flores_to_display_name(flores_code: str) -> str:
    """
    Human-readable language name for filenames and UI labels
    ('guj_Gujr' -> 'Gujarati'). Falls back to the tag itself when unknown.
    """
    if not flores_code:
        return "Unknown"
    return LANGUAGE_DISPLAY_NAMES.get(flores_code, flores_code)

def flores_to_iso(flores_code: str) -> str:
    """Converts a Flores-200 tag (e.g. 'eng_Latn') to 2-letter ISO ('en')."""
    return FLORES_TO_ISO_MAP.get(flores_code, flores_code[:2].lower())

def is_indic_language(flores_code: str) -> bool:
    """Returns True if the language tag belongs to the 22 Indian scheduled languages."""
    return flores_code in ALL_INDIC_LANGS

def is_afrinllb_pair(src: str, tgt: str) -> bool:
    """Returns whether a FLORES pair is in AfriNLLB's published directions."""
    return (
        src == "eng_Latn" and tgt in AFRINLLB_ENGLISH_PAIRS
    ) or (
        tgt == "eng_Latn" and src in AFRINLLB_ENGLISH_PAIRS
    ) or (
        src == "fra_Latn" and tgt in AFRINLLB_FRENCH_PAIRS
    ) or (
        tgt == "fra_Latn" and src in AFRINLLB_FRENCH_PAIRS
    )

@dataclass
class RouteDecision:
    backend_type: str        # 'indictrans2', 'afrinllb', 'nllb', or 'opus_mt'
    model_id: str            # HuggingFace ID or local folder
    direction_key: str       # e.g. 'en-indic', 'indic-en', 'indic-indic', 'nllb', 'opus-mt'
    src_lang: str            # Normalized source tag
    tgt_lang: str            # Normalized target tag
    tier: str                # 'best' or 'compact'
    is_offline_ready: bool   # True if model files exist on disk

class ModelRouter:
    """
    Routes translation requests according to the offline translation model matrix:
    1. IndicTrans2 1B (or distilled): Specialized for Indian languages (En <-> Indic, Indic <-> Indic).
    2. AfriNLLB: Published African specialist directions only.
    3. OPUS-MT: Locally available, benchmark-approved pair specialists.
    4. NLLB-200 1.3B (or distilled 600M): Global safety net for all other language pairs.
    """

    @classmethod
    def route(cls, src_lang: str, tgt_lang: str, tier: Optional[str] = None) -> RouteDecision:
        src = normalize_lang_code(src_lang)
        tgt = normalize_lang_code(tgt_lang)
        active_tier = tier or MODEL_SIZE_TIER

        # 1. IndicTrans2 Routing
        is_src_indic = is_indic_language(src)
        is_tgt_indic = is_indic_language(tgt)

        if src == "eng_Latn" and is_tgt_indic:
            model_id = INDICTRANS_REGISTRY[active_tier]["en-indic"]
            local_dir = get_local_model_dir(model_id)
            return RouteDecision(
                backend_type="indictrans2",
                model_id=model_id,
                direction_key="en-indic",
                src_lang=src,
                tgt_lang=tgt,
                tier=active_tier,
                is_offline_ready=local_dir.exists() and any(local_dir.iterdir()),
            )

        if is_src_indic and tgt == "eng_Latn":
            model_id = INDICTRANS_REGISTRY[active_tier]["indic-en"]
            local_dir = get_local_model_dir(model_id)
            return RouteDecision(
                backend_type="indictrans2",
                model_id=model_id,
                direction_key="indic-en",
                src_lang=src,
                tgt_lang=tgt,
                tier=active_tier,
                is_offline_ready=local_dir.exists() and any(local_dir.iterdir()),
            )

        if is_src_indic and is_tgt_indic:
            model_id = INDICTRANS_REGISTRY[active_tier]["indic-indic"]
            local_dir = get_local_model_dir(model_id)
            return RouteDecision(
                backend_type="indictrans2",
                model_id=model_id,
                direction_key="indic-indic",
                src_lang=src,
                tgt_lang=tgt,
                tier=active_tier,
                is_offline_ready=local_dir.exists() and any(local_dir.iterdir()),
            )

        # 2. AfriNLLB is used only for its documented language directions.
        if is_afrinllb_pair(src, tgt):
            model_id = AFRINLLB_REGISTRY[active_tier]
            local_dir = get_local_model_dir(model_id)
            return RouteDecision("afrinllb", model_id, "afrinllb", src, tgt, active_tier,
                                 local_dir.exists() and any(local_dir.iterdir()))

        # 3. OPUS-MT requires both a downloaded model and a benchmark approval.
        src_iso = flores_to_iso(src)
        tgt_iso = flores_to_iso(tgt)
        opus_pair = f"{src_iso}-{tgt_iso}"
        if opus_pair in BENCHMARKED_OPUS_MT_PAIRS:
            opus_model_id = f"{OPUS_MT_PREFIX}-{opus_pair}"
            local_dir = get_local_model_dir(opus_model_id)
            if local_dir.exists() and any(local_dir.iterdir()):
                return RouteDecision(
                    backend_type="opus_mt",
                    model_id=opus_model_id,
                    direction_key=f"opus-{opus_pair}",
                    src_lang=src,
                    tgt_lang=tgt,
                    tier="specialist",
                    is_offline_ready=True,
                )

        # 4. Universal High-Speed Alternative for Global Languages (Russian, Spanish, French, etc.)
        # Provides instant, zero-RAM, zero-VRAM translation avoiding heavy 5.5GB NLLB memory crashes.
        return RouteDecision(
            backend_type="web_universal",
            model_id="nexus-universal-web",
            direction_key="web-universal",
            src_lang=src,
            tgt_lang=tgt,
            tier=active_tier,
            is_offline_ready=False,
        )

def should_pivot_via_english(src_lang: str, tgt_lang: str) -> bool:
    """
    Whether an Indic->Indic pair should be routed as src -> English -> tgt.

    Controlled by INDIC_PIVOT_VIA_ENGLISH:
      "auto" (default) - pivot only when the direct indic-indic model is absent
                         from disk, so a missing download degrades instead of
                         crashing at load time.
      "1" / "true"     - always pivot.
      "0" / "false"    - never pivot; use the direct model.

    Pivoting costs two model passes and loses some quality to double
    translation, so it is deliberately not the default for available models.
    """
    src = normalize_lang_code(src_lang)
    tgt = normalize_lang_code(tgt_lang)
    if not (is_indic_language(src) and is_indic_language(tgt)) or src == tgt:
        return False

    mode = INDIC_PIVOT_VIA_ENGLISH
    if mode in ("0", "false", "no", "off"):
        return False
    if mode in ("1", "true", "yes", "on", "always"):
        return True

    # "auto": pivot when the direct model is not downloaded.
    decision = ModelRouter.route(src, tgt)
    return decision.direction_key == "indic-indic" and not decision.is_offline_ready


def detect_script_language(text: str) -> Optional[str]:
    """
    Deterministically detects the primary script/language from text using Unicode ranges:
    - Gujarati: \u0A80-\u0AFF
    - Devanagari (Hindi, Marathi, Sanskrit, Nepali): \u0900-\u097F
    - Bengali/Assamese: \u0980-\u09FF
    - Gurmukhi (Punjabi): \u0A00-\u0A7F
    - Tamil: \u0B80-\u0BFF
    - Telugu: \u0C00-\u0C7F
    - Kannada: \u0C80-\u0CFF
    - Malayalam: \u0D00-\u0D7F
    - Odia: \u0B00-\u0B7F
    - Arabic / Urdu: \u0600-\u06FF
    - Cyrillic (Russian, Ukrainian, etc.): \u0400-\u04FF
    - CJK (Chinese/Japanese/Korean): \u4E00-\u9FFF
    - Latin / English: [A-Za-z]
    """
    if not text or not text.strip():
        return None

    counts = {
        "guj_Gujr": len(re.findall(r'[\u0A80-\u0AFF]', text)),
        "hin_Deva": len(re.findall(r'[\u0900-\u097F]', text)),
        "ben_Beng": len(re.findall(r'[\u0980-\u09FF]', text)),
        "pan_Guru": len(re.findall(r'[\u0A00-\u0A7F]', text)),
        "tam_Taml": len(re.findall(r'[\u0B80-\u0BFF]', text)),
        "tel_Telu": len(re.findall(r'[\u0C00-\u0C7F]', text)),
        "kan_Knda": len(re.findall(r'[\u0C80-\u0CFF]', text)),
        "mal_Mlym": len(re.findall(r'[\u0D00-\u0D7F]', text)),
        "ory_Orya": len(re.findall(r'[\u0B00-\u0B7F]', text)),
        "urd_Arab": len(re.findall(r'[\u0600-\u06FF]', text)),
        "rus_Cyrl": len(re.findall(r'[\u0400-\u04FF]', text)),
        "zho_Hans": len(re.findall(r'[\u4E00-\u9FFF]', text)),
        "eng_Latn": len(re.findall(r'[A-Za-z]', text)),
    }

    max_lang = max(counts, key=counts.get)
    if counts[max_lang] > 0:
        return max_lang
    return "eng_Latn"
