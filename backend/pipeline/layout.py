import io
import html
from pathlib import Path
from typing import Dict, Any, List, Optional
import pymupdf
import logging

from backend.layout.fonts import font_manager
from backend.translation.router import normalize_lang_code

logger = logging.getLogger("nexus.layout")

# Shared archive for HarfBuzz font shaping
FONTS_DIR_PATH = Path("C:/Windows/Fonts")
SHARED_ARCHIVE = pymupdf.Archive(str(FONTS_DIR_PATH)) if FONTS_DIR_PATH.exists() else pymupdf.Archive()

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
        font_file = font_manager.get_font_file_for_lang(tgt)
        font_family = "Nirmala"

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

        # Step 3: Render shaped text using PyMuPDF Story with HarfBuzz shaping
        try:
            PDFLayoutReconstructor._render_with_story(page, valid_blocks, font_family)
        except Exception as e:
            logger.warning("Story layout rendering fallback to insert_textbox: %s", e)
            PDFLayoutReconstructor._render_with_insert_textbox(page, valid_blocks, font_file)

    @staticmethod
    def _render_with_story(page: pymupdf.Page, blocks: List[Dict[str, Any]], font_family: str):
        """
        Renders complex Indic scripts using PyMuPDF Story + DocumentWriter with HarfBuzz shaping.
        """
        user_css = f"""
        @font-face {{
            font-family: {font_family};
            src: url('{font_family}.ttf');
        }}
        body {{
            font-family: {font_family}, sans-serif;
            margin: 0;
            padding: 0;
        }}
        """

        out_buf = io.BytesIO()
        writer = pymupdf.DocumentWriter(out_buf)
        rendered_any = False

        for block in blocks:
            bbox = block.get("bbox")
            text = block.get("translated_text", "").strip()
            if not bbox or not text:
                continue

            rect = pymupdf.Rect(bbox)
            orig_font_size = block.get("avg_font_size", 10.0)
            font_size = max(min(orig_font_size * 0.95, 18.0), 7.0)

            # Escape HTML characters for safety in Story
            safe_text = html.escape(text).replace("\n", "<br/>")
            block_html = (
                f'<div style="font-family: {font_family}, sans-serif; '
                f'font-size: {font_size:.1f}pt; line-height: 1.35; color: #111;">'
                f'{safe_text}</div>'
            )

            try:
                story = pymupdf.Story(html=block_html, user_css=user_css, archive=SHARED_ARCHIVE)
                def rfn(n, f, target_rect=rect):
                    if n > 0:
                        return pymupdf.Rect(), pymupdf.Rect(), None
                    return page.rect, target_rect, None

                story.write(writer, rfn)
                rendered_any = True
            except Exception as block_err:
                logger.debug("Failed to write block via Story: %s", block_err)

        writer.close()

        if rendered_any:
            overlay_doc = pymupdf.open(stream=out_buf.getvalue(), filetype="pdf")
            for p_idx in range(len(overlay_doc)):
                page.show_pdf_page(page.rect, overlay_doc, p_idx, overlay=True)

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
            current_font_size = max(orig_font_size, 7.0)
            min_font_size = 5.5

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
                current_font_size -= 0.5

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
