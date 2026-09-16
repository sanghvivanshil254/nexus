import logging
import re
from typing import Dict, List, Optional, Tuple

from backend.config import (
    CHUNK_MAX_TOKENS,
    DEVICE,
    MAX_LOADED_MODELS,
    PARALLEL_BATCH_SIZE,
    TORCH_DTYPE,
)
from backend.translation.backends.base import BaseTranslationBackend
from backend.translation.backends.indictrans2 import IndicTrans2Backend
from backend.translation.backends.nllb import NLLBBackend
from backend.translation.backends.opus_mt import OpusMTBackend
from backend.translation.backends.afrinllb import AfriNLLBBackend
from backend.translation.cache import translation_cache
from backend.translation.chunker import chunk_text
from backend.translation.router import ModelRouter, normalize_lang_code, should_pivot_via_english

logger = logging.getLogger("nexus.translation.engine")

# Bridge language for two-stage translation of distant pairs.
PIVOT_LANG = "eng_Latn"


class UniversalTranslationEngine:
    """
    Universal Multilingual Offline Translation Hub.
    Orchestrates multiple specialist and global backends:
    - IndicTrans2 (1B or distilled): Purpose-built for 22 scheduled Indian languages
    - NLLB-200 (1.3B or 600M): Broad multilingual safety net for global languages
    - OPUS-MT (MarianMT): Targeted pair specialists for high-performing pairs

    Features:
    - Smart routing based on source and target language pairs
    - LRU backend offloading to prevent GPU/RAM exhaustion
    - Two-tier caching (RAM + MongoDB) partitioned by model ID
    - Sentence-aware parallel chunking
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_engine()
        return cls._instance

    def _init_engine(self):
        self.device = DEVICE
        self.torch_dtype = TORCH_DTYPE
        self.max_loaded_models = MAX_LOADED_MODELS
        self._backends: Dict[str, BaseTranslationBackend] = {}
        self._loaded_lru: List[str] = []
        logger.info("UniversalTranslationEngine initialized (device=%s, max_loaded=%d).", self.device, self.max_loaded_models)

    def get_backend(self, src_lang: str, tgt_lang: str) -> Tuple[BaseTranslationBackend, str]:
        """
        Resolves the appropriate backend for (src_lang, tgt_lang) via ModelRouter,
        and manages LRU memory loading/unloading.
        """
        decision = ModelRouter.route(src_lang, tgt_lang)
        backend_key = f"{decision.backend_type}::{decision.model_id}"

        if backend_key not in self._backends:
            if decision.backend_type == "indictrans2":
                self._backends[backend_key] = IndicTrans2Backend(
                    model_id=decision.model_id,
                    direction=decision.direction_key,
                    device=self.device,
                    torch_dtype=self.torch_dtype,
                )
            elif decision.backend_type == "nllb":
                self._backends[backend_key] = NLLBBackend(
                    model_id=decision.model_id,
                    device=self.device,
                    torch_dtype=self.torch_dtype,
                )
            elif decision.backend_type == "afrinllb":
                self._backends[backend_key] = AfriNLLBBackend(
                    model_id=decision.model_id,
                    device=self.device,
                    torch_dtype=self.torch_dtype,
                )
            elif decision.backend_type == "opus_mt":
                self._backends[backend_key] = OpusMTBackend(
                    model_id=decision.model_id,
                    device=self.device,
                    torch_dtype=self.torch_dtype,
                )
            elif decision.backend_type == "web_universal":
                from backend.translation.backends.web_universal import UniversalWebBackend
                self._backends[backend_key] = UniversalWebBackend(
                    model_id=decision.model_id,
                    device=self.device
                )
            else:
                from backend.translation.backends.web_universal import UniversalWebBackend
                self._backends[backend_key] = UniversalWebBackend(
                    model_id="nexus-universal-web",
                    device=self.device
                )

        backend = self._backends[backend_key]

        # Enforce LRU memory bounds
        if not backend.is_loaded:
            while len(self._loaded_lru) >= self.max_loaded_models:
                lru_key = self._loaded_lru.pop(0)
                if lru_key in self._backends:
                    logger.info("Evicting backend [%s] from VRAM to make room for [%s]", lru_key, backend_key)
                    self._backends[lru_key].unload()

            try:
                backend.load()
                self._loaded_lru.append(backend_key)
            except Exception as load_err:
                logger.warning(
                    "Backend [%s] failed to load (%s). Seamlessly falling back to UniversalWebBackend.",
                    backend_key,
                    load_err,
                )
                from backend.translation.backends.web_universal import UniversalWebBackend
                fallback_key = "web_universal::nexus-universal-web"
                if fallback_key not in self._backends:
                    self._backends[fallback_key] = UniversalWebBackend(model_id="nexus-universal-web")
                return self._backends[fallback_key], "nexus-universal-web"
        else:
            # Refresh LRU position
            if backend_key in self._loaded_lru:
                self._loaded_lru.remove(backend_key)
            self._loaded_lru.append(backend_key)

        return backend, decision.model_id

    @staticmethod
    def is_translatable(text: str) -> bool:
        """Determines if text contains translatable words or is purely numbers/symbols."""
        s = text.strip()
        if len(s) < 2:
            return False
        if re.fullmatch(r"[\d\s\.,;:/\-+\(\)%=#@\$!_]+", s):
            return False
        return not re.match(r"^(https?://|www\.|mailto:|[\w.+-]+@[\w.-]+$)", s)

    def translate_chunks_parallel(
        self, chunks: List[str], src_lang: str, tgt_lang: str, batch_size: int = PARALLEL_BATCH_SIZE
    ) -> List[str]:
        """
        Translates text chunks with two-tier cache lookup and batch inference.

        This is the direct single-model primitive: it does not pivot. Callers
        wanting automatic English pivoting for distant pairs should use
        translate_batch / translate_text.
        """
        if not chunks:
            return []

        src = normalize_lang_code(src_lang)
        tgt = normalize_lang_code(tgt_lang)
        if src == tgt:
            return chunks

        backend, model_id = self.get_backend(src, tgt)

        results: List[Optional[str]] = [None] * len(chunks)
        uncached_indices: List[int] = []
        uncached_chunks: List[str] = []

        for index, chunk in enumerate(chunks):
            if not self.is_translatable(chunk):
                results[index] = chunk
                continue
            cached = translation_cache.get(chunk, src, tgt, model=model_id)
            if cached is not None:
                results[index] = cached
            else:
                uncached_indices.append(index)
                uncached_chunks.append(chunk)

        if not uncached_chunks:
            return [item or "" for item in results]

        translated_batch = backend.translate_batch(uncached_chunks, src_lang=src, tgt_lang=tgt, batch_size=batch_size)

        # A backend that returns a short list would silently blank out the tail
        # of the document via zip(), so fail loudly instead.
        if len(translated_batch) != len(uncached_chunks):
            raise RuntimeError(
                f"Backend returned {len(translated_batch)} translations for "
                f"{len(uncached_chunks)} chunks ({src}->{tgt}, model={model_id}). "
                "Refusing to drop text."
            )

        for index, source, output in zip(uncached_indices, uncached_chunks, translated_batch):
            clean = output.strip()
            results[index] = clean
            translation_cache.set(source, clean, src, tgt, model=model_id)

        return [item or "" for item in results]

    def translate_text(self, text: str, src_lang: str = "en", tgt_lang: str = "gu") -> str:
        """Translates a single string with sentence-level chunking and English pivoting."""
        if not text or not text.strip() or not self.is_translatable(text):
            return text
        src, tgt = normalize_lang_code(src_lang), normalize_lang_code(tgt_lang)
        if src == tgt:
            return text
        return self.translate_batch([text], src_lang=src, tgt_lang=tgt)[0]

    def translate_batch(
        self, texts: List[str], src_lang: str = "en", tgt_lang: str = "gu", batch_size: int = PARALLEL_BATCH_SIZE
    ) -> List[str]:
        """Translates a batch of texts with chunking, caching, and layout preservation."""
        if not texts:
            return []
        src, tgt = normalize_lang_code(src_lang), normalize_lang_code(tgt_lang)
        if src == tgt:
            return texts

        # Distant Indic pairs (and any pair whose direct model is not downloaded)
        # are routed through English in two passes.
        if should_pivot_via_english(src, tgt):
            return self._translate_batch_pivoted(texts, src, tgt, batch_size)

        return self._translate_batch_direct(texts, src, tgt, batch_size)

    def _translate_batch_pivoted(
        self, texts: List[str], src: str, tgt: str, batch_size: int
    ) -> List[str]:
        """
        Two-stage translation via English: src -> eng_Latn -> tgt.

        Each stage uses the specialist indic-en / en-indic models, which are
        higher quality than the direct indic-indic model and avoid needing a
        third model on disk. Both stages cache independently, so the English
        intermediate is reused across target languages.
        """
        logger.info("Pivoting %s -> %s via English (2 passes, %d texts).", src, tgt, len(texts))
        english = self._translate_batch_direct(texts, src, PIVOT_LANG, batch_size)
        # Preserve untranslatable entries (numbers, URLs) from the original.
        english = [
            original if not self.is_translatable(original) else pivoted
            for original, pivoted in zip(texts, english)
        ]
        return self._translate_batch_direct(english, PIVOT_LANG, tgt, batch_size)

    def _translate_batch_direct(
        self, texts: List[str], src: str, tgt: str, batch_size: int
    ) -> List[str]:
        """Single-model batch translation with block- and chunk-level caching."""
        if src == tgt:
            return texts

        backend, model_id = self.get_backend(src, tgt)

        results: List[Optional[str]] = [None] * len(texts)
        chunk_map: Dict[int, List[int]] = {}
        all_chunks: List[str] = []

        for text_index, text in enumerate(texts):
            if not self.is_translatable(text):
                results[text_index] = text
                continue
            cached = translation_cache.get(text, src, tgt, model=model_id)
            if cached is not None:
                results[text_index] = cached
                continue
            start = len(all_chunks)
            all_chunks.extend(chunk_text(text, max_tokens=CHUNK_MAX_TOKENS, tokenizer=backend.tokenizer))
            chunk_map[text_index] = list(range(start, len(all_chunks)))

        if all_chunks:
            translated_chunks = self.translate_chunks_parallel(all_chunks, src, tgt, batch_size)
            for text_index, indexes in chunk_map.items():
                source = texts[text_index]
                output = ("\n" if "\n" in source else " ").join(translated_chunks[i] for i in indexes)
                results[text_index] = output
                translation_cache.set(source, output, src, tgt, model=model_id)

        return [item or "" for item in results]


# Singleton instance and backward-compatible alias
UniversalEngine = UniversalTranslationEngine
IndicTrans2TranslationEngine = UniversalTranslationEngine
translation_engine = UniversalTranslationEngine()
