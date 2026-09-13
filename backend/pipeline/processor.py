import os
import shutil
import time
import uuid
from pathlib import Path
from typing import Optional, Dict, Any, List
import pymupdf
import logging

from backend.config import OUTPUT_DIR, PARALLEL_BATCH_SIZE
from backend.db.mongo import mongo_db
from backend.translation.engine import translation_engine
from backend.translation.router import normalize_lang_code
from backend.pipeline.analyzer import PDFStructureAnalyzer
from backend.pipeline.layout import PDFLayoutReconstructor
from backend.pipeline.cleaner import clean_ocr_text

logger = logging.getLogger("nexus.processor")

class DocumentProcessor:
    """
    End-to-End Orchestrator for Multilingual PDF Translation:
    1. Loads PDF via PyMuPDF
    2. Runs PDFStructureAnalyzer per page
    3. Translates text blocks in parallel inference batches with 256-token chunking and MongoDB caching
    4. Reconstructs layout using PDFLayoutReconstructor and Indic fonts
    5. Saves output PDF to output/ folder and updates MongoDB job status
    """

    def __init__(self):
        self.analyzer = PDFStructureAnalyzer()
        self.reconstructor = PDFLayoutReconstructor()

    def process_document(
        self,
        input_pdf_path: str,
        src_lang: str = "en",
        tgt_lang: str = "gu",
        job_id: Optional[str] = None,
        max_pages: Optional[int] = None,
        output_filename: Optional[str] = None
    ) -> Dict[str, Any]:
        p = Path(input_pdf_path)
        if not p.exists():
            raise FileNotFoundError(f"Input PDF not found: {input_pdf_path}")

        if not job_id:
            job_id = f"job_{int(time.time())}_{uuid.uuid4().hex[:6]}"

        src = normalize_lang_code(src_lang)
        tgt = normalize_lang_code(tgt_lang)

        doc = pymupdf.open(str(p))
        total_pages = len(doc)
        if max_pages and max_pages > 0:
            total_pages = min(total_pages, max_pages)

        if not output_filename:
            timestamp_str = time.strftime("%Y%m%d_%H%M%S")
            tgt_readable = "Gujarati" if tgt in ["gu", "guj_Gujr"] else tgt
            output_filename = f"{p.stem}_{tgt_readable}_{timestamp_str}.pdf"
        output_path = OUTPUT_DIR / output_filename

        # Register or update job in MongoDB
        mongo_db.create_job(job_id, p.name, src, tgt, total_pages=total_pages)
        logger.info("Starting processing job %s: %s (%d pages) [%s -> %s]", job_id, p.name, total_pages, src, tgt)

        start_time = time.time()

        try:
            for page_idx in range(total_pages):
                page_start_time = time.time()
                page = doc[page_idx]
                
                # 1. Structure Analysis
                analysis = self.analyzer.analyze_page(page, page_num=page_idx + 1)
                text_blocks = analysis.get("text_blocks", [])

                if text_blocks:
                    # 2. Extract and pre-clean block texts for translation
                    texts_to_translate = [clean_ocr_text(b["text"]) for b in text_blocks]

                    # 3. Translate in batch (with 256-token chunking and caching inside engine)
                    translated_texts = translation_engine.translate_batch(
                        texts_to_translate,
                        src_lang=src,
                        tgt_lang=tgt,
                        batch_size=PARALLEL_BATCH_SIZE
                    )

                    # 4. Attach translated text to each block
                    translated_blocks = []
                    for b, trans in zip(text_blocks, translated_texts):
                        block_copy = dict(b)
                        block_copy["translated_text"] = trans
                        translated_blocks.append(block_copy)

                    # 5. Reconstruct layout on the page
                    self.reconstructor.reconstruct_page(
                        page=page,
                        page_analysis=analysis,
                        translated_blocks=translated_blocks,
                        tgt_lang=tgt
                    )

                # Progress calculation & logging
                completed_count = page_idx + 1
                elapsed = time.time() - start_time
                avg_time_per_page = elapsed / completed_count
                remaining_pages = total_pages - completed_count
                eta_seconds = remaining_pages * avg_time_per_page
                eta_str = f"{int(eta_seconds // 60)}m {int(eta_seconds % 60)}s"

                logger.info(
                    "Page %d/%d completed (%.1f%%) in %.2fs. Elapsed: %.1fs, ETA: %s",
                    completed_count,
                    total_pages,
                    (completed_count / total_pages) * 100,
                    time.time() - page_start_time,
                    elapsed,
                    eta_str
                )

                # Update progress in MongoDB
                mongo_db.update_job_progress(job_id, completed_pages=completed_count, total_pages=total_pages)

                # Incremental Checkpoint: save progress every 5 pages or at the end
                if completed_count % 5 == 0 or completed_count == total_pages:
                    checkpoint_temp = output_path.with_suffix(".tmp.pdf")
                    try:
                        if checkpoint_temp.exists():
                            checkpoint_temp.unlink()
                        doc.save(str(checkpoint_temp), garbage=3, deflate=True)
                        if output_path.exists():
                            output_path.unlink()
                        shutil.move(str(checkpoint_temp), str(output_path))
                        logger.info("Checkpoint saved to: %s (%d/%d pages)", output_path, completed_count, total_pages)
                    except Exception as ce:
                        logger.warning("Checkpoint save non-critical warning: %s", ce)

            # Final check and save
            if not output_path.exists():
                checkpoint_temp = output_path.with_suffix(".tmp.pdf")
                if checkpoint_temp.exists():
                    checkpoint_temp.unlink()
                doc.save(str(checkpoint_temp), garbage=3, deflate=True)
                if output_path.exists():
                    output_path.unlink()
                shutil.move(str(checkpoint_temp), str(output_path))
            
            doc.close()
            total_elapsed = round(time.time() - start_time, 2)
            logger.info("Job %s completed in %s seconds. Output saved to %s", job_id, total_elapsed, output_path)

            mongo_db.complete_job(job_id, str(output_path))

            return {
                "job_id": job_id,
                "status": "completed",
                "total_pages": total_pages,
                "elapsed_seconds": elapsed,
                "output_pdf": str(output_path),
                "output_filename": output_filename,
                "src_lang": src,
                "tgt_lang": tgt
            }

        except Exception as e:
            logger.error("Job %s failed with error: %s", job_id, e, exc_info=True)
            mongo_db.fail_job(job_id, str(e))
            raise e

document_processor = DocumentProcessor()
