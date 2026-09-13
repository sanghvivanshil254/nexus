from typing import Optional, Dict
from backend.config import TRANSLATION_MODEL_CACHE_KEY
from backend.db.mongo import mongo_db

class TranslationCache:
    """
    Two-tier cache:
    Tier 1: Fast in-memory dictionary for immediate page/session lookups
    Tier 2: MongoDB persistent database for long-term offline storage
    """
    def __init__(self, max_memory_entries: int = 10000):
        self.memory_cache: Dict[str, str] = {}
        self.max_memory_entries = max_memory_entries

    def _make_key(self, text: str, src_lang: str, tgt_lang: str, model: str = TRANSLATION_MODEL_CACHE_KEY) -> str:
        return f"{model}::{src_lang}::{tgt_lang}::{text.strip()}"

    def get(self, text: str, src_lang: str, tgt_lang: str, model: str = TRANSLATION_MODEL_CACHE_KEY) -> Optional[str]:
        if not text or not text.strip():
            return ""
        
        # Check Tier 1 (In-Memory)
        key = self._make_key(text, src_lang, tgt_lang, model=model)
        if key in self.memory_cache:
            return self.memory_cache[key]
            
        # Check Tier 2 (MongoDB)
        cached_mongo = mongo_db.get_cached_translation(
            text, src_lang, tgt_lang, model=model
        )
        if cached_mongo:
            # Promote to Tier 1
            if len(self.memory_cache) < self.max_memory_entries:
                self.memory_cache[key] = cached_mongo
            return cached_mongo
            
        return None

    def set(self, text: str, translated: str, src_lang: str, tgt_lang: str, model: str = TRANSLATION_MODEL_CACHE_KEY):
        if not text or not text.strip():
            return
        key = self._make_key(text, src_lang, tgt_lang, model=model)
        if len(self.memory_cache) < self.max_memory_entries:
            self.memory_cache[key] = translated
        # Save to Tier 2 (MongoDB)
        mongo_db.set_cached_translation(text, translated, src_lang, tgt_lang, model=model)

translation_cache = TranslationCache()
