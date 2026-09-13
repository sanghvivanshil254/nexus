from backend.translation.backends.base import BaseTranslationBackend
from backend.translation.backends.indictrans2 import IndicTrans2Backend
from backend.translation.backends.nllb import NLLBBackend
from backend.translation.backends.opus_mt import OpusMTBackend
from backend.translation.backends.afrinllb import AfriNLLBBackend

__all__ = [
    "BaseTranslationBackend",
    "IndicTrans2Backend",
    "NLLBBackend",
    "OpusMTBackend",
    "AfriNLLBBackend",
]
