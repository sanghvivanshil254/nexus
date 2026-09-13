import logging
from typing import List, Optional
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

from backend.config import (
    DEVICE,
    NLLB_MAX_INPUT_TOKENS,
    PARALLEL_BATCH_SIZE,
    NUM_BEAMS,
    TORCH_DTYPE,
    get_local_model_dir,
)
from backend.translation.backends.base import BaseTranslationBackend

logger = logging.getLogger("nexus.translation.nllb")

class NLLBBackend(BaseTranslationBackend):
    """
    Backend for Meta's NLLB-200 model (1.3B or distilled 600M).
    Handles 200+ languages natively with Flores-200 codes (e.g. 'fra_Latn', 'rus_Cyrl', 'spa_Latn').
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
                "Run: python backend/scripts/download_models.py --model nllb"
            )
        model_source = str(local_path)
        logger.info("Loading NLLB-200 from: %s on %s", model_source, self.device)

        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_source, local_files_only=True)
            model_kwargs = {"low_cpu_mem_usage": True, "local_files_only": True}
            if self.device == "cuda":
                model_kwargs["torch_dtype"] = self.torch_dtype
            self.model = AutoModelForSeq2SeqLM.from_pretrained(model_source, **model_kwargs).to(self.device)
            self.model.eval()
            self.is_loaded = True
            logger.info("NLLB-200 [%s] ready.", self.model_id)
        except Exception as exc:
            logger.error("Failed to load NLLB-200 model: %s", exc)
            raise

    def _get_target_token_id(self, tgt_lang: str) -> int:
        """Resolves the forced_bos_token_id for the target language in NLLB."""
        if hasattr(self.tokenizer, "lang_code_to_id") and tgt_lang in self.tokenizer.lang_code_to_id:
            return self.tokenizer.lang_code_to_id[tgt_lang]
        token_id = self.tokenizer.convert_tokens_to_ids(tgt_lang)
        if token_id != self.tokenizer.unk_token_id:
            return token_id
        raise ValueError(f"Language code '{tgt_lang}' not found in NLLB tokenizer vocabulary.")

    def translate_batch(
        self, texts: List[str], src_lang: str, tgt_lang: str, batch_size: int = PARALLEL_BATCH_SIZE
    ) -> List[str]:
        if not texts:
            return []
        self.load()

        self.tokenizer.src_lang = src_lang
        tgt_token_id = self._get_target_token_id(tgt_lang)

        all_outputs: List[str] = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            inputs = self.tokenizer(
                batch,
                truncation=True,
                max_length=NLLB_MAX_INPUT_TOKENS,
                padding=True,
                return_tensors="pt",
            ).to(self.device)

            with torch.inference_mode():
                generated = self.model.generate(
                    **inputs,
                    forced_bos_token_id=tgt_token_id,
                    max_new_tokens=NLLB_MAX_INPUT_TOKENS,
                    num_beams=NUM_BEAMS,
                    early_stopping=True,
                )

            decoded = self.tokenizer.batch_decode(generated, skip_special_tokens=True)
            all_outputs.extend([d.strip() for d in decoded])

        return all_outputs
