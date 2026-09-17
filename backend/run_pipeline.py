import argparse
import sys
import logging
from pathlib import Path

# Add root directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.pipeline.processor import document_processor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nexus.cli")

def main():
    parser = argparse.ArgumentParser(description="Offline Multilingual PDF Translator CLI")
    parser.add_argument("--input", "-i", type=str, required=True, help="Path to input PDF")
    parser.add_argument("--src", "-s", type=str, default="en", help="Source language (e.g. en, gu, hi)")
    parser.add_argument("--tgt", "-t", type=str, default="gu", help="Target language (e.g. gu, hi, en)")
    parser.add_argument("--output", "-o", type=str, default=None, help="Custom output PDF filename")

    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        logger.error("Input file not found: %s", args.input)
        sys.exit(1)

    logger.info("Running translation pipeline: %s -> %s for '%s'...", args.src, args.tgt, input_path.name)
    
    result = document_processor.process_document(
        input_pdf_path=str(input_path),
        src_lang=args.src,
        tgt_lang=args.tgt,
        output_filename=args.output
    )

    logger.info("=" * 60)
    logger.info("Translation Complete!")
    logger.info("Output PDF: %s", result["output_pdf"])
    logger.info("Pages processed: %s", result["total_pages"])
    logger.info("Time taken: %s s", result["elapsed_seconds"])
    logger.info("=" * 60)

if __name__ == "__main__":
    main()
