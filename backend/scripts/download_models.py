"""
Multi-Model Offline Downloader for Nexus.
Downloads and caches state-of-the-art translation models locally for 100% offline inference:
- IndicTrans2 (1B or distilled 200M/320M): En->Indic, Indic->En, Indic->Indic
- AfriNLLB: African-language specialist for published directions
- NLLB-200 (1.3B or distilled 600M): Global multilingual safety net (200+ languages)
- OPUS-MT (MarianMT): High-efficiency pair specialists (en-es, en-fr, en-ru, etc.)
"""
import argparse
import logging
import sys
import time
from pathlib import Path
from typing import List, Optional

from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.config import (
    INDICTRANS_REGISTRY,
    MODELS_DIR,
    NLLB_REGISTRY,
    AFRINLLB_REGISTRY,
    OPUS_MT_PREFIX,
    REGISTERED_OPUS_MT_PAIRS,
    get_local_model_dir,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("nexus.download")


def download_single_model(model_id: str, trust_remote_code: bool = False, dry_run: bool = False) -> bool:
    """Downloads model weights and tokenizer into local cache folder."""
    target_dir = get_local_model_dir(model_id)
    if dry_run:
        logger.info("[DRY-RUN] Would download %s -> %s", model_id, target_dir)
        return True

    target_dir.mkdir(parents=True, exist_ok=True)

    logger.info("=" * 60)
    logger.info("Downloading: %s", model_id)
    logger.info("Destination: %s", target_dir)
    start_time = time.time()

    try:
        logger.info("Fetching tokenizer for %s...", model_id)
        tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=trust_remote_code)
        tokenizer.save_pretrained(target_dir)

        logger.info("Fetching model weights for %s...", model_id)
        model = AutoModelForSeq2SeqLM.from_pretrained(
            model_id,
            low_cpu_mem_usage=True,
            trust_remote_code=trust_remote_code,
        )
        model.save_pretrained(target_dir)

        elapsed = time.time() - start_time
        logger.info("Successfully cached %s in %.1f seconds.", model_id, elapsed)
        return True
    except OSError as exc:
        if "gated repo" in str(exc).lower() or "401" in str(exc):
            logger.error(
                "Access restricted for %s. Please visit https://huggingface.co/%s to accept the terms, "
                "then run `hf auth login` in your terminal and try again.",
                model_id, model_id
            )
        else:
            logger.error("Network or disk error downloading %s: %s", model_id, exc)
        return False
    except Exception as exc:
        logger.error("Unexpected error downloading %s: %s", model_id, exc)
        return False


def download_indictrans2(tier: str = "best", directions: Optional[List[str]] = None, dry_run: bool = False):
    """Downloads IndicTrans2 models for specified directions."""
    registry = INDICTRANS_REGISTRY.get(tier, INDICTRANS_REGISTRY["best"])
    dirs = directions or ["en-indic", "indic-en", "indic-indic"]
    for d in dirs:
        if d in registry:
            model_id = registry[d]
            download_single_model(model_id, trust_remote_code=True, dry_run=dry_run)


def download_nllb(tier: str = "best", dry_run: bool = False):
    """Downloads NLLB-200 model (1.3B best or 600M compact)."""
    model_id = NLLB_REGISTRY.get(tier, NLLB_REGISTRY["best"])
    download_single_model(model_id, trust_remote_code=False, dry_run=dry_run)

def download_afrinllb(tier: str = "best", dry_run: bool = False):
    """Downloads the AfriNLLB model for its published African-language pairs."""
    model_id = AFRINLLB_REGISTRY.get(tier, AFRINLLB_REGISTRY["best"])
    download_single_model(model_id, trust_remote_code=False, dry_run=dry_run)


def download_opus_mt(pairs: List[str], dry_run: bool = False):
    """Downloads OPUS-MT models for specific language pairs."""
    for pair in pairs:
        clean_pair = pair.strip().lower()
        model_id = f"{OPUS_MT_PREFIX}-{clean_pair}"
        download_single_model(model_id, trust_remote_code=False, dry_run=dry_run)


def main():
    parser = argparse.ArgumentParser(description="Nexus Offline Translation Model Downloader")
    parser.add_argument(
        "--recommended",
        action="store_true",
        help="Download the recommended stack: IndicTrans2 + AfriNLLB + NLLB-200",
    )
    parser.add_argument(
        "--model",
        type=str,
        choices=["indictrans2", "afrinllb", "nllb", "opus-mt", "all"],
        help="Model family to download",
    )
    parser.add_argument(
        "--tier",
        type=str,
        choices=["best", "compact"],
        default="best",
        help="Parameter size tier ('best' = 1B/1.3B high quality; 'compact' = distilled 200M/320M/600M)",
    )
    parser.add_argument(
        "--directions",
        type=str,
        default="en-indic,indic-en,indic-indic",
        help="Comma-separated directions for IndicTrans2 (e.g. 'en-indic', 'indic-en', 'indic-indic')",
    )
    parser.add_argument(
        "--pairs",
        type=str,
        default="en-es,en-fr,en-ru",
        help="Comma-separated pairs for OPUS-MT (e.g. 'en-es,en-fr,en-ru')",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be downloaded without actually downloading files",
    )
    parser.add_argument(
        "--list-cached",
        action="store_true",
        help="List models currently downloaded on local disk",
    )

    args = parser.parse_args()

    if args.list_cached:
        logger.info("Scanning local model directory: %s", MODELS_DIR)
        found = 0
        for item in MODELS_DIR.iterdir():
            if item.is_dir() and any(item.iterdir()):
                logger.info("  [READY] %s", item.name)
                found += 1
            elif item.is_dir():
                logger.info("  [EMPTY] %s", item.name)
        if found == 0:
            logger.info("No models currently downloaded. Run with --recommended to populate.")
        return

    if args.recommended or args.model == "all":
        logger.info("Initiating download for RECOMMENDED offline stack (Tier: %s)...", args.tier)
        download_indictrans2(tier=args.tier, dry_run=args.dry_run)
        download_nllb(tier=args.tier, dry_run=args.dry_run)
        download_afrinllb(tier=args.tier, dry_run=args.dry_run)
        return

    if args.model == "indictrans2":
        dirs = [d.strip() for d in args.directions.split(",") if d.strip()]
        download_indictrans2(tier=args.tier, directions=dirs, dry_run=args.dry_run)
    elif args.model == "nllb":
        download_nllb(tier=args.tier, dry_run=args.dry_run)
    elif args.model == "afrinllb":
        download_afrinllb(tier=args.tier, dry_run=args.dry_run)
    elif args.model == "opus-mt":
        pairs = [p.strip() for p in args.pairs.split(",") if p.strip()]
        download_opus_mt(pairs=pairs, dry_run=args.dry_run)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
