import os
import json
import shutil
import time
import uuid
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
import pymupdf
import logging

from backend.config import (
    AUTO_DETECT_SOURCE_LANG,
    OUTPUT_DIR,
    PREVIEWS_DIR,
    PARALLEL_BATCH_SIZE,
    PAGE_BATCH_SIZE,
    SKIP_HEADERS_FOOTERS,
)
from backend.db.mongo import mongo_db
from backend.translation.engine import translation_engine
from backend.translation.router import (
    detect_script_language,
    flores_to_display_name,
    normalize_lang_code,
)
from backend.layout.fonts import script_of
from backend.pipeline.analyzer import PDFStructureAnalyzer
from backend.pipeline.layout import PDFLayoutReconstructor
from backend.pipeline.cleaner import clean_ocr_text
from backend.pipeline.ocr import ocr_engine

logger = logging.getLogger("nexus.processor")


class DocumentProcessor:
    """
    End-to-End Orchestrator for Multilingual PDF Translation:
    1. Loads PDF via PyMuPDF
    2. Runs PDFStructureAnalyzer per page, falling back to OCR on scanned pages
    3. Validates the declared source language against the script on the page
    4. Translates text blocks in parallel inference batches with 256-token chunking and MongoDB caching
    5. Reconstructs layout using PDFLayoutReconstructor and script-appropriate fonts
    6. Saves output PDF to output/ folder, renders realtime page previews, and updates MongoDB job status
    """

    def __init__(self):
        self.analyzer = PDFStructureAnalyzer()
        self.reconstructor = PDFLayoutReconstructor()

    # ------------------------------------------------------------------ #
    # Page text acquisition
    # ------------------------------------------------------------------ #

    def _extract_page_blocks(
        self, page: pymupdf.Page, analysis: Dict[str, Any], page_num: int
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        Returns the translatable blocks for a page plus an optional warning.

        Scanned pages carry their text inside a raster image, so get_text() finds
        nothing and the page would pass through untranslated. Those pages are
        routed to OCR instead.
        """
        text_blocks = analysis.get("text_blocks", [])

        if not analysis.get("is_scanned"):
            return text_blocks, None

        if not ocr_engine.is_available:
            warning = (
                f"Page {page_num} is a scanned image and no OCR engine is available "
                f"({ocr_engine.unavailable_reason}). The page will be copied "
                f"untranslated."
            )
            logger.error(warning)
            return text_blocks, warning

        logger.info("Page %d is scanned; running OCR (%s).", page_num, ocr_engine.engine_name)
        ocr_blocks = ocr_engine.ocr_page(page)
        if not ocr_blocks:
            warning = (
                f"Page {page_num} is a scanned image but OCR ({ocr_engine.engine_name}) "
                f"returned no text. The page will be copied untranslated."
            )
            logger.warning(warning)
            return text_blocks, warning

        logger.info("OCR recovered %d text blocks from scanned page %d.", len(ocr_blocks), page_num)
        # Replace rather than merge: the few native blocks on a scanned page are
        # normally artefacts, and keeping both would double-render the same text.
        analysis["text_blocks"] = ocr_blocks
        analysis["ocr_applied"] = True
        return ocr_blocks, None

    @staticmethod
    def _is_translatable_block(block: Dict[str, Any]) -> bool:
        """Running heads and page numbers are layout furniture, not content."""
        if SKIP_HEADERS_FOOTERS and (block.get("is_header") or block.get("is_footer")):
            return False
        return True

    # ------------------------------------------------------------------ #
    # Source language validation
    # ------------------------------------------------------------------ #

    @staticmethod
    def _verify_source_language(
        sample_text: str, declared_src: str
    ) -> Tuple[str, Optional[str]]:
        """
        Compares the declared source language against the script actually present.

        Returns (source_language_to_use, optional_warning). Only a *script*
        mismatch counts: declaring Marathi for Devanagari text is fine, while
        declaring English for Devanagari text is not.
        """
        if not AUTO_DETECT_SOURCE_LANG or not sample_text.strip():
            return declared_src, None

        detected = detect_script_language(sample_text)
        if not detected or script_of(detected) == script_of(declared_src):
            return declared_src, None

        warning = (
            f"Declared source language {declared_src} "
            f"({flores_to_display_name(declared_src)}) does not match the "
            f"{script_of(detected)} script found in the document; using "
            f"{detected} ({flores_to_display_name(detected)}) instead. "
            f"Set AUTO_DETECT_SOURCE_LANG=0 to disable this correction."
        )
        logger.warning(warning)
        return detected, warning

    # ------------------------------------------------------------------ #
    # Main entry point
    # ------------------------------------------------------------------ #

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
            output_filename = f"{p.stem}_{flores_to_display_name(tgt)}_{timestamp_str}.pdf"
        output_path = OUTPUT_DIR / output_filename

        job_previews_dir = PREVIEWS_DIR / job_id
        job_previews_dir.mkdir(parents=True, exist_ok=True)

        # Register or update job in MongoDB
        mongo_db.create_job(job_id, p.name, src, tgt, total_pages=total_pages)
        logger.info("Starting processing job %s: %s (%d pages) [%s -> %s]", job_id, p.name, total_pages, src, tgt)

        # Pre-render original pages for side-by-side / diff comparisons
        orig_doc = pymupdf.open(str(p))

        start_time = time.time()
        total_elapsed = 0.0
        page_batch_size = max(1, PAGE_BATCH_SIZE)
        warnings: List[str] = []
        ocr_pages: List[int] = []
        untranslated_pages: List[int] = []
        source_verified = False

        try:
            for batch_start in range(0, total_pages, page_batch_size):
                batch_end = min(batch_start + page_batch_size, total_pages)
                page_indices = list(range(batch_start, batch_end))

                # 1. Analyze all pages in this batch and collect text blocks
                batch_pages_data = []
                all_batch_texts = []
                batch_text_counts = []

                for page_idx in page_indices:
                    completed_count = page_idx + 1
                    page = doc[page_idx]

                    # Cache original page preview
                    orig_preview_path = job_previews_dir / f"page_{completed_count}_orig.png"
                    if not orig_preview_path.exists() and page_idx < len(orig_doc):
                        try:
                            orig_pix = orig_doc[page_idx].get_pixmap(dpi=150)
                            orig_pix.save(str(orig_preview_path))
                        except Exception as oe:
                            logger.warning("Original preview error for page %d: %s", completed_count, oe)

                    analysis = self.analyzer.analyze_page(page, page_num=completed_count)
                    page_blocks, warning = self._extract_page_blocks(page, analysis, completed_count)
                    if warning:
                        warnings.append(warning)
                        untranslated_pages.append(completed_count)
                    if analysis.get("ocr_applied"):
                        ocr_pages.append(completed_count)

                    # Headers and footers stay in the original language, so they
                    # are excluded from translation but kept for redaction-free
                    # passthrough.
                    text_blocks = [b for b in page_blocks if self._is_translatable_block(b)]
                    cleaned_texts = [clean_ocr_text(b["text"]) for b in text_blocks]

                    batch_pages_data.append({
                        "page_idx": page_idx,
                        "page_num": completed_count,
                        "page": page,
                        "analysis": analysis,
                        "text_blocks": text_blocks,
                        "cleaned_texts": cleaned_texts,
                    })

                    all_batch_texts.extend(cleaned_texts)
                    batch_text_counts.append(len(cleaned_texts))

                # 1b. Validate the declared source language once, against real text
                if not source_verified and all_batch_texts:
                    sample = " ".join(all_batch_texts[:40])[:4000]
                    corrected_src, lang_warning = self._verify_source_language(sample, src)
                    if lang_warning:
                        warnings.append(lang_warning)
                    if corrected_src != src:
                        src = corrected_src
                        mongo_db.update_job_progress(
                            job_id=job_id,
                            completed_pages=batch_start,
                            total_pages=total_pages,
                            src_lang=src,
                            warnings=warnings,
                        )
                    source_verified = True

                # 2. Parallel Batch Translate ALL blocks across all pages in this window in one GPU pass
                translated_batch_texts = []
                if all_batch_texts:
                    translated_batch_texts = translation_engine.translate_batch(
                        all_batch_texts,
                        src_lang=src,
                        tgt_lang=tgt,
                        batch_size=PARALLEL_BATCH_SIZE
                    )

                # 3. Distribute translated texts back to pages, reconstruct layout & render previews
                text_offset = 0
                for p_idx_in_batch, p_data in enumerate(batch_pages_data):
                    page = p_data["page"]
                    p_num = p_data["page_num"]
                    num_blocks = batch_text_counts[p_idx_in_batch]
                    p_translated = translated_batch_texts[text_offset : text_offset + num_blocks]
                    text_offset += num_blocks

                    translated_blocks = []
                    for b, trans in zip(p_data["text_blocks"], p_translated):
                        b_copy = dict(b)
                        b_copy["translated_text"] = trans
                        translated_blocks.append(b_copy)

                    # Reconstruct layout with HarfBuzz & OpenType shaping
                    if translated_blocks:
                        self.reconstructor.reconstruct_page(
                            page=page,
                            page_analysis=p_data["analysis"],
                            translated_blocks=translated_blocks,
                            tgt_lang=tgt
                        )

                    # Render real-time translated page image
                    rendered_preview_path = job_previews_dir / f"page_{p_num}_rendered.png"
                    try:
                        rendered_pix = page.get_pixmap(dpi=150)
                        rendered_pix.save(str(rendered_preview_path))
                    except Exception as preview_err:
                        logger.warning("Rendered preview error for page %d: %s", p_num, preview_err)

                    # Build percentage-scaled bounding boxes for interactive canvas overlay
                    p_width = max(1.0, page.rect.width)
                    p_height = max(1.0, page.rect.height)
                    formatted_blocks = []
                    for b_idx, b in enumerate(translated_blocks):
                        bbox = b.get("bbox", [0, 0, 0, 0])
                        x0, y0, x1, y1 = bbox
                        formatted_blocks.append({
                            "id": f"blk_{p_num}_{b_idx}",
                            "x": round((x0 / p_width) * 100, 2),
                            "y": round((y0 / p_height) * 100, 2),
                            "width": round(((x1 - x0) / p_width) * 100, 2),
                            "height": round(((y1 - y0) / p_height) * 100, 2),
                            "original_text": b.get("text", ""),
                            "translated_text": b.get("translated_text", ""),
                            "type": "header" if b.get("is_header") else ("table" if b.get("is_table") else "text"),
                            "source": "ocr" if b.get("is_ocr") else "native",
                            # OCR confidence is measured; native text extraction is exact.
                            "confidence": round(b.get("ocr_confidence", 1.0) * 100, 1),
                        })

                    page_trans_text = "\n\n".join([b.get("translated_text", "") for b in translated_blocks if b.get("translated_text")])
                    page_orig_text = "\n\n".join([b.get("text", "") for b in p_data["text_blocks"] if b.get("text")])

                    # Save page metadata JSON
                    page_meta = {
                        "job_id": job_id,
                        "page_num": p_num,
                        "total_pages": total_pages,
                        "translated_text": page_trans_text,
                        "original_text": page_orig_text,
                        "blocks": formatted_blocks,
                        "is_scanned": bool(p_data["analysis"].get("is_scanned")),
                        "ocr_applied": bool(p_data["analysis"].get("ocr_applied")),
                        "rendered_image_url": f"/api/jobs/{job_id}/pages/{p_num}/rendered",
                        "original_image_url": f"/api/jobs/{job_id}/pages/{p_num}/original"
                    }
                    try:
                        meta_path = job_previews_dir / f"page_{p_num}_data.json"
                        meta_path.write_text(json.dumps(page_meta, ensure_ascii=False, indent=2), encoding="utf-8")
                    except Exception as we:
                        logger.warning("Page metadata write error: %s", we)

                    # Progress calculation & logging
                    elapsed = time.time() - start_time
                    avg_time_per_page = elapsed / p_num
                    remaining_pages = total_pages - p_num
                    eta_seconds = remaining_pages * avg_time_per_page
                    eta_str = f"{int(eta_seconds // 60)}m {int(eta_seconds % 60)}s"

                    logger.info(
                        "Page %d/%d completed (%.1f%%). Elapsed: %.1fs, ETA: %s",
                        p_num,
                        total_pages,
                        (p_num / total_pages) * 100,
                        elapsed,
                        eta_str
                    )

                    # Update progress in MongoDB with rich realtime preview data
                    mongo_db.update_job_progress(
                        job_id=job_id,
                        completed_pages=p_num,
                        total_pages=total_pages,
                        latest_page_num=p_num,
                        latest_translated_text=page_trans_text[:1500],
                        latest_blocks=formatted_blocks[:40],
                        latest_page_image=f"/api/jobs/{job_id}/pages/{p_num}/rendered",
                        output_file=str(output_path),
                        warnings=warnings or None,
                    )

                # Incremental Checkpoint: save progress periodically
                is_last_batch = (batch_end == total_pages)
                should_checkpoint = is_last_batch or (batch_end % 20 == 0) or (batch_end <= page_batch_size)
                if should_checkpoint:
                    checkpoint_temp = output_path.with_suffix(".tmp.pdf")
                    try:
                        if checkpoint_temp.exists():
                            checkpoint_temp.unlink()
                        # Fast save without deflate on intermediate checkpoints; full compression on final
                        doc.save(str(checkpoint_temp), garbage=3 if is_last_batch else 0, deflate=is_last_batch)
                        if output_path.exists():
                            output_path.unlink()
                        shutil.move(str(checkpoint_temp), str(output_path))
                        logger.info("Batch checkpoint saved to: %s (%d/%d pages)", output_path, batch_end, total_pages)
                    except Exception as ce:
                        logger.warning("Checkpoint save non-critical warning: %s", ce)

            # Final check and save with full garbage collection and deflate compression
            checkpoint_temp = output_path.with_suffix(".tmp.pdf")
            try:
                if checkpoint_temp.exists():
                    checkpoint_temp.unlink()
                doc.save(str(checkpoint_temp), garbage=3, deflate=True)
                if output_path.exists():
                    output_path.unlink()
                shutil.move(str(checkpoint_temp), str(output_path))
            except Exception as fe:
                logger.warning("Final save non-critical warning: %s", fe)

            total_elapsed = round(time.time() - start_time, 2)
            logger.info("Job %s completed in %s seconds. Output saved to %s", job_id, total_elapsed, output_path)

            if untranslated_pages:
                logger.error(
                    "Job %s: %d page(s) were copied WITHOUT translation: %s",
                    job_id, len(untranslated_pages), untranslated_pages,
                )

            mongo_db.complete_job(job_id, str(output_path))
            if warnings:
                mongo_db.update_job_progress(
                    job_id=job_id,
                    completed_pages=total_pages,
                    total_pages=total_pages,
                    status="completed",
                    warnings=warnings,
                )

            return {
                "job_id": job_id,
                "status": "completed",
                "total_pages": total_pages,
                "elapsed_seconds": total_elapsed,
                "output_pdf": str(output_path),
                "output_filename": output_filename,
                "src_lang": src,
                "tgt_lang": tgt,
                "ocr_pages": ocr_pages,
                "untranslated_pages": untranslated_pages,
                "warnings": warnings,
            }

        except Exception as e:
            logger.error("Job %s failed with error: %s", job_id, e, exc_info=True)
            mongo_db.fail_job(job_id, str(e))
            raise
        finally:
            # Both handles must close on every path, or Windows keeps a lock on
            # the uploaded PDF and it cannot be cleaned up.
            for handle in (doc, orig_doc):
                try:
                    handle.close()
                except Exception:
                    pass


document_processor = DocumentProcessor()
