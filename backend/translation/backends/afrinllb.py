import logging
from typing import List, Optional

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

from backend.config import DEVICE, NLLB_MAX_INPUT_TOKENS, PARALLEL_BATCH_SIZE, TORCH_DTYPE, get_local_model_dir
from backend.translation.backends.base import BaseTranslationBackend
from backend.translation.router import AFRINLLB_LANG_CODES

logger = logging.getLogger("nexus.translation.afrinllb")


class AfriNLLBBackend(BaseTranslationBackend):
    """Offline AfriNLLB backend for the project's published African directions."""

    def __init__(self, model_id: str, device: str = DEVICE, torch_dtype: Optional[torch.dtype] = TORCH_DTYPE):
        super().__init__(model_id, device, torch_dtype)

    def load(self, force_reload: bool = False):
        if self.is_loaded and not force_reload:
            return
        local_path = get_local_model_dir(self.model_id)
        if not local_path.exists() or not any(local_path.iterdir()):
            raise FileNotFoundError(
                f"Offline model '{self.model_id}' is not cached at {local_path}. "
                "Run: python backend/scripts/download_models.py --model afrinllb"
            )
        logger.info("Loading AfriNLLB from: %s on %s", local_path, self.device)
        kwargs = {"local_files_only": True}
        self.tokenizer = AutoTokenizer.from_pretrained(str(local_path), **kwargs)
        model_kwargs = {"low_cpu_mem_usage": True, "local_files_only": True}
        if self.device == "cuda":
            model_kwargs["torch_dtype"] = self.torch_dtype
        self.model = AutoModelForSeq2SeqLM.from_pretrained(str(local_path), **model_kwargs).to(self.device)
        self.model.eval()
        self.is_loaded = True

    def _token_id(self, lang: str) -> int:
        if hasattr(self.tokenizer, "get_lang_id"):
            return self.tokenizer.get_lang_id(lang)
        if hasattr(self.tokenizer, "lang_code_to_id"):
            return self.tokenizer.lang_code_to_id[lang]
        return self.tokenizer.convert_tokens_to_ids(lang)

    def translate_batch(self, texts: List[str], src_lang: str, tgt_lang: str,
                        batch_size: int = PARALLEL_BATCH_SIZE) -> List[str]:
        self.load()
        try:
            src, tgt = AFRINLLB_LANG_CODES[src_lang], AFRINLLB_LANG_CODES[tgt_lang]
        except KeyError as exc:
            raise ValueError(f"Unsupported AfriNLLB language: {exc.args[0]}") from exc
        self.tokenizer.src_lang = src
        target_token_id = self._token_id(tgt)
        outputs: List[str] = []
        for index in range(0, len(texts), batch_size):
            inputs = self.tokenizer(texts[index:index + batch_size], truncation=True,
                                    max_length=NLLB_MAX_INPUT_TOKENS, padding=True,
                                    return_tensors="pt").to(self.device)
            with torch.inference_mode():
                generated = self.model.generate(**inputs, forced_bos_token_id=target_token_id,
                                                max_new_tokens=NLLB_MAX_INPUT_TOKENS, num_beams=4,
                                                early_stopping=True)
            outputs.extend(value.strip() for value in self.tokenizer.batch_decode(generated, skip_special_tokens=True))
        return outputs
