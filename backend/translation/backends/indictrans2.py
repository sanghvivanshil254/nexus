import logging
import os
from typing import List, Optional
from pathlib import Path
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

from backend.config import (
    DEVICE,
    INDICTRANS_MAX_INPUT_TOKENS,
    PARALLEL_BATCH_SIZE,
    NUM_BEAMS,
    TORCH_DTYPE,
    BACKEND_DIR,
    get_local_model_dir,
)
from backend.translation.backends.base import BaseTranslationBackend

logger = logging.getLogger("nexus.translation.indictrans2")

class IndicTrans2Backend(BaseTranslationBackend):
    """
    Backend for AI4Bharat IndicTrans2 models:
    - ai4bharat/indictrans2-en-indic-1B (or dist-200M)
    - ai4bharat/indictrans2-indic-en-1B (or dist-200M)
    - ai4bharat/indictrans2-indic-indic-1B (or dist-320M)
    """

    def __init__(
        self,
        model_id: str,
        direction: str = "en-indic",
        device: str = DEVICE,
        torch_dtype: Optional[torch.dtype] = TORCH_DTYPE,
    ):
        super().__init__(model_id, device, torch_dtype)
        self.direction = direction  # 'en-indic', 'indic-en', 'indic-indic'
        self.processor = None

    def load(self, force_reload: bool = False):
        if self.is_loaded and not force_reload:
            return

        try:
            from IndicTransToolkit import IndicProcessor
        except ImportError as exc:
            raise RuntimeError(
                "IndicTransToolkit is required for IndicTrans2. Run: python -m pip install IndicTransToolkit"
            ) from exc

        local_path = get_local_model_dir(self.model_id)
        if not local_path.exists() or not any(local_path.iterdir()):
            raise FileNotFoundError(
                f"Offline model '{self.model_id}' is not cached at {local_path}. "
                "Run: python backend/scripts/download_models.py --model indictrans2"
            )
        model_source = str(local_path)
        logger.info("Loading IndicTrans2 (%s) from: %s on %s", self.direction, model_source, self.device)

        try:
            # IndicTrans2 ships local custom tokenizer/model modules. Keep their
            # runtime cache within the writable project instead of the user's
            # protected Hugging Face cache directory.
            module_cache = BACKEND_DIR / "hf_modules"
            module_cache.mkdir(parents=True, exist_ok=True)
            os.environ["HF_MODULES_CACHE"] = str(module_cache)
            from transformers import dynamic_module_utils
            dynamic_module_utils.HF_MODULES_CACHE = str(module_cache)
            self.tokenizer = AutoTokenizer.from_pretrained(model_source, trust_remote_code=True, local_files_only=True)
            model_kwargs = {"low_cpu_mem_usage": True, "trust_remote_code": True, "local_files_only": True}
            if self.device == "cuda":
                model_kwargs["torch_dtype"] = self.torch_dtype
            self.model = AutoModelForSeq2SeqLM.from_pretrained(model_source, **model_kwargs).to(self.device)
            self.model.eval()
            self.processor = IndicProcessor(inference=True)
            self.is_loaded = True
            logger.info("IndicTrans2 [%s] ready.", self.model_id)
        except OSError as exc:
            if "gated repo" in str(exc).lower() or "401" in str(exc):
                raise RuntimeError(
                    f"IndicTrans2 model {self.model_id} requires Hugging Face access terms. "
                    f"Accept terms on HF and run `python backend/scripts/download_models.py --model indictrans2`"
                ) from exc
            logger.error("Failed to load IndicTrans2: %s", exc)
            raise
        except Exception as exc:
            logger.error("Failed to load IndicTrans2: %s", exc)
            raise

    def unload(self):
        self.processor = None
        super().unload()

    def _generate_batch(self, batch: List[str], src_lang: str, tgt_lang: str, num_beams: int = NUM_BEAMS) -> List[str]:
        processed = self.processor.preprocess_batch(batch, src_lang=src_lang, tgt_lang=tgt_lang)
        inputs = self.tokenizer(
            processed,
            truncation=True,
            max_length=INDICTRANS_MAX_INPUT_TOKENS,
            padding=True,
            return_tensors="pt",
            return_attention_mask=True,
        ).to(self.device)

        try:
            with torch.inference_mode():
                generated = self.model.generate(
                    **inputs,
                    max_new_tokens=INDICTRANS_MAX_INPUT_TOKENS,
                    num_beams=num_beams,
                    # IndicTrans2's custom model code predates the newer
                    # Transformers cache object. Disable cache decoding for
                    # compatibility with the installed runtime.
                    use_cache=False,
                    early_stopping=True,
                )

            decoded = self.tokenizer.batch_decode(generated, skip_special_tokens=True, clean_up_tokenization_spaces=True)
            translated = self.processor.postprocess_batch(decoded, lang=tgt_lang)
            return [t.strip() for t in translated]
        except Exception as err:
            if "out of memory" in str(err).lower() or isinstance(err, torch.cuda.OutOfMemoryError):
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                if len(batch) > 1:
                    mid = len(batch) // 2
                    logger.warning("CUDA OOM detected. Splitting batch (%d -> %d, %d) and retrying...", len(batch), mid, len(batch) - mid)
                    return (
                        self._generate_batch(batch[:mid], src_lang, tgt_lang, num_beams=num_beams)
                        + self._generate_batch(batch[mid:], src_lang, tgt_lang, num_beams=num_beams)
                    )
                elif num_beams > 1:
                    logger.warning("CUDA OOM on single item. Retrying with num_beams=1...")
                    return self._generate_batch(batch, src_lang, tgt_lang, num_beams=1)
            logger.error("Inference error in IndicTrans2: %s", err)
            raise

    def translate_batch(
        self, texts: List[str], src_lang: str, tgt_lang: str, batch_size: int = PARALLEL_BATCH_SIZE
    ) -> List[str]:
        if not texts:
            return []
        self.load()

        all_outputs: List[str] = []
        eff_batch_size = min(batch_size, 2)
        for i in range(0, len(texts), eff_batch_size):
            batch = texts[i : i + eff_batch_size]
            batch_results = self._generate_batch(batch, src_lang=src_lang, tgt_lang=tgt_lang, num_beams=4)
            all_outputs.extend(batch_results)
            if self.device == "cuda":
                torch.cuda.empty_cache()

        return all_outputs
