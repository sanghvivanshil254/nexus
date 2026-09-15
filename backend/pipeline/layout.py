import io
import html
from typing import Dict, Any, List, Optional, Tuple
import pymupdf
import logging

from backend.config import (
    LAYOUT_FONT_MIN_SIZE,
    LAYOUT_FONT_MAX_SIZE,
    LAYOUT_FONT_STEP,
    LAYOUT_MAX_BOX_GROWTH,
)
from backend.layout.fonts import FONT_SEARCH_DIRS, FontSpec, font_manager
from backend.translation.router import normalize_lang_code

logger = logging.getLogger("nexus.layout")


def _build_font_archive() -> pymupdf.Archive:
    """Archive covering every directory the font manager may resolve a file from."""
    archive = pymupdf.Archive()
    for directory in FONT_SEARCH_DIRS:
        try:
            archive.add(str(directory))
        except Exception as e:  # a missing or unreadable dir must not be fatal
            logger.debug("Could not add font dir %s to archive: %s", directory, e)
    return archive


# Shared archive for HarfBuzz font shaping
SHARED_ARCHIVE = _build_font_archive()


class PDFLayoutReconstructor:
    """
    Preserves original visual geometry, margins, images, and tables while
    replacing text with translated content using language-compatible fonts
    and full HarfBuzz complex-script OpenType shaping via PyMuPDF Story.
    """

    @staticmethod
    def reconstruct_page(
        page: pymupdf.Page,
        page_analysis: Dict[str, Any],
        translated_blocks: List[Dict[str, Any]],
        tgt_lang: str
    ):
        """
        Applies redactions to original text boxes and renders shaped translated text into the identical bboxes.
        """
        tgt = normalize_lang_code(tgt_lang)
        font_spec = font_manager.get_font_spec_for_lang(tgt)
        font_file = font_manager.get_font_file_for_lang(tgt)

        # Step 1: Add redaction annotations for all text blocks that will be translated
        valid_blocks = []
        for block in translated_blocks:
            bbox = block.get("bbox")
            translated_text = block.get("translated_text", "")
            if not bbox or not translated_text.strip():
                continue
            valid_blocks.append(block)

            rect = pymupdf.Rect(bbox)
            # Add a slight margin buffer
            expanded_rect = pymupdf.Rect(rect.x0 - 0.5, rect.y0 - 0.5, rect.x1 + 0.5, rect.y1 + 0.5)
            # White background fill for clean text redaction
            page.add_redact_annot(expanded_rect, fill=(1, 1, 1))

        # Step 2: Apply redactions (preserve images and vector line art)
        try:
            page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)
        except Exception as e:
            logger.warning("Redaction application warning: %s", e)

        if not valid_blocks:
            return

        # Step 2b: On a scanned page the text lives inside the page image, which
        # PDF_REDACT_IMAGE_NONE deliberately keeps. Paint over each recognized
        # region so the translation is not drawn on top of the original glyphs.
        for block in valid_blocks:
            if not block.get("is_ocr"):
                continue
            rect = pymupdf.Rect(block["bbox"])
            # Pad to swallow the antialiased edges of scanned type.
            cover = pymupdf.Rect(rect.x0 - 1.0, rect.y0 - 1.0, rect.x1 + 1.0, rect.y1 + 1.0)
            try:
                page.draw_rect(cover, color=None, fill=(1, 1, 1), overlay=True)
            except Exception as e:
                logger.warning("Could not mask OCR region %s: %s", [round(v) for v in block["bbox"]], e)

        # Step 3: Render shaped text using PyMuPDF Story with HarfBuzz shaping
        try:
            PDFLayoutReconstructor._render_with_story(
                page, valid_blocks, font_spec, page_analysis
            )
        except Exception as e:
            logger.warning("Story layout rendering fallback to insert_textbox: %s", e)
            PDFLayoutReconstructor._render_with_insert_textbox(page, valid_blocks, font_file)

    # ------------------------------------------------------------------ #
    # Box fitting
    # ------------------------------------------------------------------ #

    @staticmethod
    def _collect_obstacles(
        page_analysis: Dict[str, Any], blocks: List[Dict[str, Any]]
    ) -> List[pymupdf.Rect]:
        """Every rect that translated text must not grow into."""
        obstacles: List[pymupdf.Rect] = []
        for block in blocks:
            bbox = block.get("bbox")
            if bbox:
                obstacles.append(pymupdf.Rect(bbox))
        for image in page_analysis.get("image_blocks", []):
            bbox = image.get("bbox")
            if bbox:
                obstacles.append(pymupdf.Rect(bbox))
        for table in page_analysis.get("tables", []):
            bbox = table.get("bbox")
            if bbox:
                obstacles.append(pymupdf.Rect(bbox))
        return obstacles

    @staticmethod
    def _growable_rect(
        rect: pymupdf.Rect,
        obstacles: List[pymupdf.Rect],
        page_rect: pymupdf.Rect,
    ) -> pymupdf.Rect:
        """
        Extends a block's rect downward into genuinely empty space.

        Translated Indic and CJK text commonly needs 30-60% more room than the
        English source, so a same-size box forces heavy font shrinking. Growing
        into whitespace below the block preserves the original font size instead.
        """
        max_bottom = min(page_rect.y1 - 2.0, rect.y1 + rect.height * LAYOUT_MAX_BOX_GROWTH)

        for other in obstacles:
            # Only obstacles that start below this block and overlap horizontally
            if other.y0 < rect.y1 - 0.5:
                continue
            if other.x1 <= rect.x0 + 0.5 or other.x0 >= rect.x1 - 0.5:
                continue
            max_bottom = min(max_bottom, other.y0 - 1.5)

        if max_bottom <= rect.y1:
            return pymupdf.Rect(rect)
        return pymupdf.Rect(rect.x0, rect.y0, rect.x1, max_bottom)

    @staticmethod
    def _block_html(text: str, font_spec: Optional[FontSpec], font_size: float) -> str:
        """Builds the Story HTML for one block, honouring script direction."""
        family = font_spec.family if font_spec else "sans-serif"
        is_rtl = font_spec.is_rtl if font_spec else False

        # RTL scripts need an explicit base direction so the paragraph aligns to
        # the right margin and line-final punctuation lands on the correct side.
        direction_attr = ' dir="rtl"' if is_rtl else ""
        text_align = "right" if is_rtl else "left"

        safe_text = html.escape(text).replace("\n", "<br/>")
        return (
            f'<div{direction_attr} style="font-family: {family}, sans-serif; '
            f'font-size: {font_size:.1f}pt; line-height: 1.35; color: #111; '
            f'text-align: {text_align};">'
            f'{safe_text}</div>'
        )

    @staticmethod
    def _fits(html_str: str, user_css: str, rect: pymupdf.Rect) -> bool:
        """
        True when the whole fragment fits inside rect.

        Story.place() reports more=1 when content remains unplaced. The writer
        callback discards anything past the first rect, so an unfitted block
        loses text silently - this check is what prevents that.
        """
        try:
            story = pymupdf.Story(html=html_str, user_css=user_css, archive=SHARED_ARCHIVE)
            more, _ = story.place(rect)
            return not more
        except Exception as e:
            logger.debug("Story place() probe failed: %s", e)
            # Assume it fits; the writer below will do its best.
            return True

    @staticmethod
    def _fit_font_size(
        text: str,
        font_spec: Optional[FontSpec],
        user_css: str,
        rect: pymupdf.Rect,
        target_size: float,
    ) -> Tuple[float, bool]:
        """
        Largest size <= target_size at which text fits rect.

        Returns (size, fitted). fitted=False means even the minimum size
        overflows and the block will be truncated.
        """
        ceiling = max(LAYOUT_FONT_MIN_SIZE, min(target_size, LAYOUT_FONT_MAX_SIZE))
        if PDFLayoutReconstructor._fits(
            PDFLayoutReconstructor._block_html(text, font_spec, ceiling), user_css, rect
        ):
            return ceiling, True

        floor = LAYOUT_FONT_MIN_SIZE
        if not PDFLayoutReconstructor._fits(
            PDFLayoutReconstructor._block_html(text, font_spec, floor), user_css, rect
        ):
            return floor, False

        # Bisect the size ladder; ~5 probes covers 5.0-18.0pt at 0.5pt steps.
        step = LAYOUT_FONT_STEP
        low, high = floor, ceiling
        while high - low > step:
            mid = round((low + high) / 2 / step) * step
            if mid <= low or mid >= high:
                break
            if PDFLayoutReconstructor._fits(
                PDFLayoutReconstructor._block_html(text, font_spec, mid), user_css, rect
            ):
                low = mid
            else:
                high = mid
        return low, True

    # ------------------------------------------------------------------ #
    # Renderers
    # ------------------------------------------------------------------ #

    @staticmethod
    def _render_with_story(
        page: pymupdf.Page,
        blocks: List[Dict[str, Any]],
        font_spec: Optional[FontSpec],
        page_analysis: Dict[str, Any],
    ):
        """
        Renders complex scripts using PyMuPDF Story + DocumentWriter with HarfBuzz shaping.
        """
        user_css = ""
        if font_spec:
            user_css = f"""
        @font-face {{
            font-family: {font_spec.family};
            src: url('{font_spec.file_name}');
        }}
        body {{
            font-family: {font_spec.family}, sans-serif;
            margin: 0;
            padding: 0;
        }}
        """

        obstacles = PDFLayoutReconstructor._collect_obstacles(page_analysis, blocks)
        out_buf = io.BytesIO()
        writer = pymupdf.DocumentWriter(out_buf)
        rendered_any = False
        truncated = 0

        for block in blocks:
            bbox = block.get("bbox")
            text = block.get("translated_text", "").strip()
            if not bbox or not text:
                continue

            rect = pymupdf.Rect(bbox)
            if block.get("is_table"):
                # Keep table text inside its own cell. Growing downward would
                # spill into the next row and destroy the column alignment, so
                # cells are fitted by shrinking the font only.
                cell_bbox = block.get("cell_bbox")
                target_rect = pymupdf.Rect(cell_bbox) if cell_bbox else rect
            else:
                target_rect = PDFLayoutReconstructor._growable_rect(rect, obstacles, page.rect)
            orig_font_size = block.get("avg_font_size", 10.0)

            font_size, fitted = PDFLayoutReconstructor._fit_font_size(
                text, font_spec, user_css, target_rect, orig_font_size
            )
            if not fitted:
                truncated += 1
                logger.warning(
                    "Block at %s overflows even at %.1fpt (%d chars); text will be "
                    "truncated. Original size %.1fpt.",
                    [round(v) for v in bbox], font_size, len(text), orig_font_size,
                )

            block_html = PDFLayoutReconstructor._block_html(text, font_spec, font_size)

            try:
                story = pymupdf.Story(html=block_html, user_css=user_css, archive=SHARED_ARCHIVE)

                def rfn(n, f, target=target_rect):
                    if n > 0:
                        return pymupdf.Rect(), pymupdf.Rect(), None
                    return page.rect, target, None

                story.write(writer, rfn)
                rendered_any = True
            except Exception as block_err:
                logger.debug("Failed to write block via Story: %s", block_err)

        writer.close()

        if truncated:
            logger.warning("Page %s: %d/%d blocks truncated after font fitting.",
                           page_analysis.get("page_num", "?"), truncated, len(blocks))

        if rendered_any:
            overlay_doc = pymupdf.open(stream=out_buf.getvalue(), filetype="pdf")
            try:
                for p_idx in range(len(overlay_doc)):
                    page.show_pdf_page(page.rect, overlay_doc, p_idx, overlay=True)
            finally:
                overlay_doc.close()

    @staticmethod
    def _render_with_insert_textbox(page: pymupdf.Page, blocks: List[Dict[str, Any]], font_file: Optional[str]):
        """Fallback renderer using basic insert_textbox."""
        font_name = "FallbackFont"
        for block in blocks:
            bbox = block.get("bbox")
            translated_text = block.get("translated_text", "")
            if not bbox or not translated_text.strip():
                continue

            rect = pymupdf.Rect(bbox)
            orig_font_size = block.get("avg_font_size", 10.0)
            current_font_size = max(orig_font_size, LAYOUT_FONT_MIN_SIZE)
            min_font_size = LAYOUT_FONT_MIN_SIZE

            success = False
            while current_font_size >= min_font_size:
                try:
                    overflow = page.insert_textbox(
                        rect,
                        translated_text,
                        fontsize=current_font_size,
                        fontname=font_name,
                        fontfile=font_file,
                        align=pymupdf.TEXT_ALIGN_LEFT,
                        color=(0, 0, 0)
                    )
                    if overflow >= 0:
                        success = True
                        break
                except Exception:
                    break
                current_font_size -= LAYOUT_FONT_STEP

            if not success:
                try:
                    page.insert_textbox(
                        rect,
                        translated_text,
                        fontsize=min_font_size,
                        fontname=font_name,
                        fontfile=font_file,
                        align=pymupdf.TEXT_ALIGN_LEFT,
                        color=(0, 0, 0)
                    )
                except Exception as e:
                    logger.error("Fallback insert_textbox error: %s", e)
