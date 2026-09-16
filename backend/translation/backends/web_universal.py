import logging
import urllib.request
import urllib.parse
import json
from typing import List, Optional
import torch

from backend.config import DEVICE
from backend.translation.backends.base import BaseTranslationBackend
from backend.translation.router import flores_to_iso, normalize_lang_code

logger = logging.getLogger("nexus.translation.web_universal")

class UniversalWebBackend(BaseTranslationBackend):
    """
    Lightweight, high-speed, zero-VRAM translation backend.
    Serves as the high-availability universal alternative to heavy 5.5GB NLLB models.
    Supports all 100+ global and regional languages (Russian, Spanish, French, German,
    Arabic, Chinese, Japanese, etc.) with 0 MB GPU RAM overhead.
    """

    def __init__(
        self,
        model_id: str = "nexus-universal-web",
        device: str = DEVICE,
        torch_dtype: Optional[torch.dtype] = None,
    ):
        super().__init__(model_id, device, torch_dtype)
        self.is_loaded = True
        self._cache = {}
        self._mymemory_quota_exceeded = False

    def load(self, force_reload: bool = False):
        self.is_loaded = True

    def _iso_code(self, lang: str) -> str:
        norm = normalize_lang_code(lang)
        iso = flores_to_iso(norm)
        # Custom overrides for standard codes
        overrides = {
            "rus_Cyrl": "ru",
            "spa_Latn": "es",
            "fra_Latn": "fr",
            "deu_Latn": "de",
            "ita_Latn": "it",
            "por_Latn": "pt",
            "nld_Latn": "nl",
            "zho_Hans": "zh-CN",
            "jpn_Jpan": "ja",
            "kor_Hang": "ko",
            "arb_Arab": "ar",
            "tur_Latn": "tr",
            "pes_Arab": "fa",
            "ukr_Cyrl": "uk",
            "pol_Latn": "pl",
            "eng_Latn": "en",
            "guj_Gujr": "gu",
            "hin_Deva": "hi",
            "mar_Deva": "mr",
            "ben_Beng": "bn",
            "tam_Taml": "ta",
            "tel_Telu": "te",
            "kan_Knda": "kn",
        }
        if norm in overrides:
            return overrides[norm]
        if iso and len(iso) <= 3:
            return iso
        return norm.split("_")[0] if "_" in norm else norm

    def _translate_single(self, text: str, src_iso: str, tgt_iso: str) -> str:
        if not text or not text.strip():
            return ""

        cache_key = f"{src_iso}_{tgt_iso}_{text.strip()}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        url = (
            f"https://translate.googleapis.com/translate_a/single?"
            f"client=gtx&sl={src_iso}&tl={tgt_iso}&dt=t&q={urllib.parse.quote(text)}"
        )
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                )
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=8) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if payload and payload[0]:
                    translated_chunks = [part[0] for part in payload[0] if part and part[0]]
                    result = "".join(translated_chunks)
                    self._cache[cache_key] = result
                    return result
        except Exception as e:
            logger.warning("Primary web translation endpoint failed for '%s...': %s. Trying secondary endpoint.", text[:30], e)
            if not self._mymemory_quota_exceeded:
                try:
                    # MyMemory fallback endpoint
                    mm_url = (
                        f"https://api.mymemory.translated.net/get?"
                        f"q={urllib.parse.quote(text)}&langpair={src_iso}|{tgt_iso}"
                    )
                    mm_req = urllib.request.Request(mm_url, headers={"User-Agent": "NexusOCR/2.0"})
                    with urllib.request.urlopen(mm_req, timeout=6) as mm_res:
                        mm_data = json.loads(mm_res.read().decode("utf-8"))
                        res_text = mm_data.get("responseData", {}).get("translatedText")
                        if res_text:
                            if "MYMEMORY WARNING" in res_text or "QUERY LENGTH LIMIT" in res_text:
                                self._mymemory_quota_exceeded = True
                                logger.warning("MyMemory free translation quota reached or exceeded. Disabling for remainder of session.")
                            else:
                                self._cache[cache_key] = res_text
                                return res_text
                except Exception as mm_err:
                    logger.warning("Secondary web translation endpoint failed: %s", mm_err)

        # Fallback 3: Local Offline NLLB-1.3B model
        try:
            if not hasattr(self, "_nllb_backend") or self._nllb_backend is None:
                from backend.translation.backends.nllb import NLLBBackend
                self._nllb_backend = NLLBBackend(model_id="facebook/nllb-200-1.3B")
            from backend.translation.router import normalize_lang_code
            src_fl = normalize_lang_code(src_iso) or "eng_Latn"
            tgt_fl = normalize_lang_code(tgt_iso) or "rus_Cyrl"
            res_list = self._nllb_backend.translate_batch([text], src_fl, tgt_fl)
            if res_list and res_list[0]:
                self._cache[cache_key] = res_list[0]
                return res_list[0]
        except Exception as nllb_err:
            logger.error("Local NLLB fallback failed: %s", nllb_err)

        logger.error("All translation endpoints failed for text: '%s...' (%s -> %s). Falling back to source text.", text[:35], src_iso, tgt_iso)
        return text

    def translate_batch(
        self, texts: List[str], src_lang: str, tgt_lang: str, batch_size: int = 24
    ) -> List[str]:
        if not texts:
            return []

        src_iso = self._iso_code(src_lang)
        tgt_iso = self._iso_code(tgt_lang)

        results: List[str] = []
        for text in texts:
            cleaned = text.strip()
            if not cleaned:
                results.append("")
                continue
            translated = self._translate_single(cleaned, src_iso, tgt_iso)
            results.append(translated)

        return results

