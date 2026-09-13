import unittest
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.config import (
    INDICTRANS_REGISTRY,
    NLLB_REGISTRY,
    MODEL_SIZE_TIER,
)
from backend.translation.router import (
    ALL_INDIC_LANGS,
    AFRINLLB_LANG_CODES,
    ModelRouter,
    RouteDecision,
    detect_script_language,
    flores_to_iso,
    is_indic_language,
    normalize_lang_code,
)
from backend.translation.cache import translation_cache
from backend.translation.engine import UniversalTranslationEngine
from backend.translation.backends.nllb import NLLBBackend


class TestOfflineTranslationModels(unittest.TestCase):

    def test_all_22_indic_languages_normalized(self):
        """Verify all 22 scheduled Indian languages normalize to Flores tags."""
        expected_mappings = {
            "as": "asm_Beng", "bn": "ben_Beng", "brx": "bod_Deva",
            "doi": "doi_Deva", "gu": "guj_Gujr", "hi": "hin_Deva",
            "kn": "kan_Knda", "ks": "kas_Arab", "kok": "kok_Deva",
            "mai": "mai_Deva", "ml": "mal_Mlym", "mni": "mni_Beng",
            "mr": "mar_Deva", "ne": "npi_Deva", "or": "ory_Orya",
            "pa": "pan_Guru", "sa": "san_Deva", "sat": "sat_Olck",
            "sd": "snd_Arab", "ta": "tam_Taml", "te": "tel_Telu",
            "ur": "urd_Arab",
        }
        for code, expected_tag in expected_mappings.items():
            self.assertEqual(normalize_lang_code(code), expected_tag, f"Failed for code {code}")
            self.assertTrue(is_indic_language(expected_tag), f"{expected_tag} should be identified as Indic")

    def test_global_languages_normalized(self):
        """Verify European, Asian, African, and Middle Eastern languages normalize."""
        self.assertEqual(normalize_lang_code("es"), "spa_Latn")
        self.assertEqual(normalize_lang_code("french"), "fra_Latn")
        self.assertEqual(normalize_lang_code("de"), "deu_Latn")
        self.assertEqual(normalize_lang_code("russian"), "rus_Cyrl")
        self.assertEqual(normalize_lang_code("zh"), "zho_Hans")
        self.assertEqual(normalize_lang_code("ja"), "jpn_Jpan")
        self.assertEqual(normalize_lang_code("ar"), "arb_Arab")
        self.assertEqual(normalize_lang_code("sw"), "swh_Latn")

    def test_router_best_tier_indictrans2(self):
        """Verify ModelRouter selects IndicTrans2 1B for Indian language pairs in 'best' tier."""
        # En -> Indic
        decision = ModelRouter.route("en", "gu", tier="best")
        self.assertEqual(decision.backend_type, "indictrans2")
        self.assertEqual(decision.direction_key, "en-indic")
        self.assertEqual(decision.model_id, "ai4bharat/indictrans2-en-indic-1B")

        # Indic -> En
        decision_indic_en = ModelRouter.route("hindi", "english", tier="best")
        self.assertEqual(decision_indic_en.backend_type, "indictrans2")
        self.assertEqual(decision_indic_en.direction_key, "indic-en")
        self.assertEqual(decision_indic_en.model_id, "ai4bharat/indictrans2-indic-en-1B")

        # Indic -> Indic
        decision_indic_indic = ModelRouter.route("bengali", "tamil", tier="best")
        self.assertEqual(decision_indic_indic.backend_type, "indictrans2")
        self.assertEqual(decision_indic_indic.direction_key, "indic-indic")
        self.assertEqual(decision_indic_indic.model_id, "ai4bharat/indictrans2-indic-indic-1B")

    def test_router_compact_tier_indictrans2(self):
        """Verify ModelRouter selects distilled models when 'compact' tier is requested."""
        decision = ModelRouter.route("en", "hi", tier="compact")
        self.assertEqual(decision.backend_type, "indictrans2")
        self.assertEqual(decision.model_id, "ai4bharat/indictrans2-en-indic-dist-200M")

        decision_indic = ModelRouter.route("hi", "mr", tier="compact")
        self.assertEqual(decision_indic.backend_type, "indictrans2")
        self.assertEqual(decision_indic.model_id, "ai4bharat/indictrans2-indic-indic-dist-320M")

    def test_router_nllb_global(self):
        """Verify ModelRouter routes non-Indic language pairs to NLLB-200 1.3B by default."""
        # French to German
        decision = ModelRouter.route("fr", "de", tier="best")
        self.assertEqual(decision.backend_type, "nllb")
        self.assertEqual(decision.model_id, "facebook/nllb-200-1.3B")

        # Japanese to Spanish
        decision2 = ModelRouter.route("ja", "es", tier="best")
        self.assertEqual(decision2.backend_type, "nllb")
        self.assertEqual(decision2.model_id, "facebook/nllb-200-1.3B")

        # A non-AfriNLLB global pair
        decision3 = ModelRouter.route("sw", "en", tier="best")
        self.assertEqual(decision3.backend_type, "afrinllb")
        self.assertEqual(decision3.model_id, "AfriNLP/AfriNLLB-12enc-12dec-full-ft-kd")

    def test_router_afrinllb_only_for_published_pairs(self):
        """AfriNLLB is selected only for documented directions, otherwise NLLB is used."""
        self.assertEqual(ModelRouter.route("en", "yo").backend_type, "afrinllb")
        self.assertEqual(ModelRouter.route("fr", "wolof").backend_type, "afrinllb")
        self.assertEqual(ModelRouter.route("yo", "sw").backend_type, "nllb")
        self.assertEqual(AFRINLLB_LANG_CODES["yor_Latn"], "yo")

    def test_missing_model_fails_without_network_fallback(self):
        """A missing cache must fail locally instead of triggering a Hub download."""
        backend = NLLBBackend("facebook/nllb-200-1.3B")
        with self.assertRaises(FileNotFoundError):
            backend.load()

    def test_script_detection(self):
        """Verify Unicode script detection for multiple scripts."""
        self.assertEqual(detect_script_language("નમસ્તે વિશ્વ"), "guj_Gujr")
        self.assertEqual(detect_script_language("नमस्ते दुनिया"), "hin_Deva")
        self.assertEqual(detect_script_language("নমস্কার বিশ্ব"), "ben_Beng")
        self.assertEqual(detect_script_language("வணக்கம் உலகம்"), "tam_Taml")
        self.assertEqual(detect_script_language("నమస్కారం ప్రపంచం"), "tel_Telu")
        self.assertEqual(detect_script_language("مرحبا بالعالم"), "urd_Arab")
        self.assertEqual(detect_script_language("Привет мир"), "rus_Cyrl")
        self.assertEqual(detect_script_language("你好世界"), "zho_Hans")
        self.assertEqual(detect_script_language("Hello world"), "eng_Latn")

    def test_is_translatable(self):
        """Verify translatable filtering."""
        engine = UniversalTranslationEngine()
        self.assertFalse(engine.is_translatable(""))
        self.assertFalse(engine.is_translatable("   "))
        self.assertFalse(engine.is_translatable("a"))
        self.assertFalse(engine.is_translatable("12345"))
        self.assertFalse(engine.is_translatable("12/05/2026"))
        self.assertFalse(engine.is_translatable("https://example.com"))
        self.assertFalse(engine.is_translatable("user@example.com"))
        self.assertTrue(engine.is_translatable("This is an official document."))
        self.assertTrue(engine.is_translatable("આ એક મહત્વપૂર્ણ દસ્તાવેજ છે."))

    def test_cache_model_isolation(self):
        """Verify cache keys correctly isolate different models."""
        cache = translation_cache
        key1 = cache._make_key("Hello", "eng_Latn", "guj_Gujr", model="ai4bharat/indictrans2-en-indic-1B")
        key2 = cache._make_key("Hello", "eng_Latn", "guj_Gujr", model="facebook/nllb-200-1.3B")
        self.assertNotEqual(key1, key2)
        self.assertIn("indictrans2-en-indic-1B", key1)
        self.assertIn("nllb-200-1.3B", key2)


if __name__ == "__main__":
    unittest.main()
