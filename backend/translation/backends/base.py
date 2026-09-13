import gc
import logging
from abc import ABC, abstractmethod
from typing import List, Optional
import torch

logger = logging.getLogger("nexus.translation.backend")

class BaseTranslationBackend(ABC):
    """
    Abstract Base Class for all offline translation backends:
    - IndicTrans2 (1B or distilled)
    - NLLB-200 (1.3B or distilled 600M)
    - OPUS-MT (MarianMT pairs)
    """

    def __init__(self, model_id: str, device: str = "cpu", torch_dtype: Optional[torch.dtype] = None):
        self.model_id = model_id
        self.device = device
        self.torch_dtype = torch_dtype or (torch.float16 if device == "cuda" else torch.float32)
        self.tokenizer = None
        self.model = None
        self.is_loaded = False

    @abstractmethod
    def load(self, force_reload: bool = False):
        """Loads model and tokenizer into RAM/VRAM."""
        pass

    def unload(self):
        """Explicitly offloads model from VRAM/RAM to prevent memory bloat."""
        if not self.is_loaded:
            return
        logger.info("Unloading backend [%s] from device %s", self.model_id, self.device)
        self.model = None
        self.tokenizer = None
        self.is_loaded = False
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()

    @abstractmethod
    def translate_batch(
        self, texts: List[str], src_lang: str, tgt_lang: str, batch_size: int = 8
    ) -> List[str]:
        """Translates a batch of texts/chunks between src_lang and tgt_lang."""
        pass
