import logging
from typing import List, Optional
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

from backend.config import (
    DEVICE,
    OPUS_MT_MAX_INPUT_TOKENS,
    PARALLEL_BATCH_SIZE,
    TORCH_DTYPE,
    get_local_model_dir,
)
from backend.translation.backends.base import BaseTranslationBackend

logger = logging.getLogger("nexus.translation.opus_mt")

class OpusMTBackend(BaseTranslationBackend):
    """
    Backend for Helsinki-NLP OPUS-MT / MarianMT language-pair models.
    Specialist lightweight models for tested language pairs (e.g., en-es, en-fr, en-ru).
    """

    def __init__(
        self,
        model_id: str,
        device: str = DEVICE,
        torch_dtype: Optional[torch.dtype] = TORCH_DTYPE,
    ):
        super().__init__(model_id, device, torch_dtype)

    def load(self, force_reload: bool = False):
        if self.is_loaded and not force_reload:
            return

        local_path = get_local_model_dir(self.model_id)
        if not local_path.exists() or not any(local_path.iterdir()):
            raise FileNotFoundError(
                f"Offline model '{self.model_id}' is not cached at {local_path}. "
                "Download it explicitly with backend/scripts/download_models.py."
            )
        model_source = str(local_path)
        logger.info("Loading OPUS-MT from: %s on %s", model_source, self.device)

        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_source, local_files_only=True)
            model_kwargs = {"low_cpu_mem_usage": True, "local_files_only": True}
            if self.device == "cuda":
                model_kwargs["torch_dtype"] = self.torch_dtype
            self.model = AutoModelForSeq2SeqLM.from_pretrained(model_source, **model_kwargs).to(self.device)
            self.model.eval()
            self.is_loaded = True
            logger.info("OPUS-MT [%s] ready.", self.model_id)
        except Exception as exc:
            logger.error("Failed to load OPUS-MT model: %s", exc)
            raise

    def translate_batch(
        self, texts: List[str], src_lang: str, tgt_lang: str, batch_size: int = PARALLEL_BATCH_SIZE
    ) -> List[str]:
        if not texts:
            return []
        self.load()

        all_outputs: List[str] = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            inputs = self.tokenizer(
                batch,
                truncation=True,
                max_length=OPUS_MT_MAX_INPUT_TOKENS,
                padding=True,
                return_tensors="pt",
            ).to(self.device)

            with torch.inference_mode():
                generated = self.model.generate(
                    **inputs,
                    max_new_tokens=OPUS_MT_MAX_INPUT_TOKENS,
                    num_beams=4,
                    early_stopping=True,
                )

            decoded = self.tokenizer.batch_decode(generated, skip_special_tokens=True)
            all_outputs.extend([d.strip() for d in decoded])

        return all_outputs
