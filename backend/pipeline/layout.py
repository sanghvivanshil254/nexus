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
        font_spec_sans = font_manager.get_font_spec_for_lang(tgt, is_serif=False)
        font_spec_serif = font_manager.get_font_spec_for_lang(tgt, is_serif=True)
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
                page, valid_blocks, font_spec_sans, font_spec_serif, page_analysis
            )
        except Exception as e:
            logger.warning("Story layout rendering fallback to insert_textbox: %s", e)
            PDFLayoutReconstructor._render_with_insert_textbox(page, valid_blocks, font_file)

    # ------------------------------------------------------------------ #
    # Box fitting & Typography
    # ------------------------------------------------------------------ #

    @staticmethod
    def _block_html(
        text: str,
        font_spec: Optional[FontSpec],
        font_size: float,
        is_bold: bool = False,
        is_italic: bool = False,
        color: str = "#111",
        alignment: str = "left",
        line_height: float = 1.18,
    ) -> str:
        """Builds the Story HTML for one block, honouring typography, alignment, and script direction."""
        family = font_spec.family if font_spec else "sans-serif"
        is_rtl = font_spec.is_rtl if font_spec else False

        direction_attr = ' dir="rtl"' if is_rtl else ""
        text_align = "right" if is_rtl else alignment
        align_extra = "text-justify: inter-word; " if text_align == "justify" else ""
        weight_style = "font-weight: 700; " if is_bold else "font-weight: 400; "
        italic_style = "font-style: italic; " if is_italic else "font-style: normal; "

        safe_text = html.escape(text).replace("\n", "<br/>")
        return (
            f'<div{direction_attr} style="font-family: {family}, sans-serif; '
            f'font-size: {font_size:.1f}pt; line-height: {line_height:.2f}; {weight_style}{italic_style}'
            f'color: {color}; text-align: {text_align}; {align_extra}">'
            f'{safe_text}</div>'
        )

    @staticmethod
    def _fits(html_str: str, user_css: str, rect: pymupdf.Rect) -> bool:
        """True when the whole fragment fits inside rect."""
        try:
            story = pymupdf.Story(html=html_str, user_css=user_css, archive=SHARED_ARCHIVE)
            more, _ = story.place(rect)
            return not more
        except Exception as e:
            logger.debug("Story place() probe failed: %s", e)
            return True

    @staticmethod
    def _fit_font_size(
        text: str,
        font_spec: Optional[FontSpec],
        user_css: str,
        rect: pymupdf.Rect,
        target_size: float,
        is_bold: bool = False,
        is_italic: bool = False,
        color: str = "#111",
        alignment: str = "left",
        line_height: float = 1.18,
    ) -> Tuple[float, bool]:
        """
        Largest size <= target_size at which text fits rect.
        Enforces a minimum font size clamp (at least 85% of target_size) to avoid font shrinking.
        """
        ceiling = max(LAYOUT_FONT_MIN_SIZE, min(target_size, LAYOUT_FONT_MAX_SIZE))
        if PDFLayoutReconstructor._fits(
            PDFLayoutReconstructor._block_html(
                text, font_spec, ceiling, is_bold=is_bold, is_italic=is_italic,
                color=color, alignment=alignment, line_height=line_height
            ),
            user_css, rect
        ):
            return ceiling, True

        # Clamp floor to 85% of target_size to prevent excessive font degradation
        floor = max(LAYOUT_FONT_MIN_SIZE, round(target_size * 0.85 * 2) / 2)
        if not PDFLayoutReconstructor._fits(
            PDFLayoutReconstructor._block_html(
                text, font_spec, floor, is_bold=is_bold, is_italic=is_italic,
                color=color, alignment=alignment, line_height=line_height
            ),
            user_css, rect
        ):
            return floor, False

        step = LAYOUT_FONT_STEP
        low, high = floor, ceiling
        while high - low > step:
            mid = round((low + high) / 2 / step) * step
            if mid <= low or mid >= high:
                break
            if PDFLayoutReconstructor._fits(
                PDFLayoutReconstructor._block_html(
                    text, font_spec, mid, is_bold=is_bold, is_italic=is_italic,
                    color=color, alignment=alignment, line_height=line_height
                ),
                user_css, rect
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
        font_spec_sans: Optional[FontSpec],
        font_spec_serif: Optional[FontSpec],
        page_analysis: Dict[str, Any],
    ):
        """
        Renders complex scripts with OpenType shaping, dynamic font classes (Serif/Sans),
        justified alignment, and cascading column flow to preserve original 1:1 sizing.
        """
        css_rules = []
        if font_spec_sans:
            css_rules.append(f"""
        @font-face {{
            font-family: {font_spec_sans.family};
            src: url('{font_spec_sans.file_name}');
        }}
            """)
        if font_spec_serif and (not font_spec_sans or font_spec_serif.family != font_spec_sans.family):
            css_rules.append(f"""
        @font-face {{
            font-family: {font_spec_serif.family};
            src: url('{font_spec_serif.file_name}');
        }}
            """)
        user_css = "\n".join(css_rules) + """
        body {
            margin: 0;
            padding: 0;
        }
        """

        # Hard obstacles: images, tables, and bottom page margin boundary
        hard_obstacles = []
        for image in page_analysis.get("image_blocks", []):
            if image.get("bbox"):
                hard_obstacles.append(pymupdf.Rect(image["bbox"]))
        for table in page_analysis.get("tables", []):
            if table.get("bbox"):
                hard_obstacles.append(pymupdf.Rect(table["bbox"]))

        page_safe_bottom = page.rect.y1 * 0.94

        # Sort blocks vertically from top to bottom
        sorted_blocks = sorted(blocks, key=lambda b: (b.get("bbox", [0, 0, 0, 0])[1], b.get("bbox", [0, 0, 0, 0])[0]))

        # Track accumulated downward shifts for vertical column flow
        accumulated_shifts = [0.0] * len(sorted_blocks)

        out_buf = io.BytesIO()
        writer = pymupdf.DocumentWriter(out_buf)
        rendered_any = False
        truncated = 0

        try:
            for i, block in enumerate(sorted_blocks):
                bbox = block.get("bbox")
                text = block.get("translated_text", "").strip()
                if not bbox or not text:
                    continue

                is_serif = block.get("is_serif", False)
                is_bold = block.get("is_bold", False)
                is_italic = block.get("is_italic", False)
                color = block.get("color", "#111111")
                alignment = block.get("alignment", "left")
                orig_font_size = block.get("avg_font_size", 10.0)

                font_spec = font_spec_serif if is_serif and font_spec_serif else font_spec_sans

                if block.get("is_table"):
                    cell_bbox = block.get("cell_bbox")
                    target_rect = pymupdf.Rect(cell_bbox) if cell_bbox else pymupdf.Rect(bbox)
                else:
                    shift = accumulated_shifts[i]
                    current_y0 = bbox[1] + shift
                    orig_h = bbox[3] - bbox[1]
                    current_y1 = current_y0 + orig_h
                    rect = pymupdf.Rect(bbox[0], current_y0, bbox[2], current_y1)

                    # Check nearest hard obstacle below this column block
                    nearest_obstacle_y = page_safe_bottom
                    for obs in hard_obstacles:
                        if obs.y0 > current_y1 - 2.0:
                            # Check horizontal overlap with column
                            if not (obs.x1 <= rect.x0 or obs.x0 >= rect.x1):
                                nearest_obstacle_y = min(nearest_obstacle_y, obs.y0 - 3.0)

                    max_growth = max(0.0, nearest_obstacle_y - current_y1)
                    extra_needed = 0.0

                    # Test if text fits at original size with line-height 1.18
                    html_full = PDFLayoutReconstructor._block_html(
                        text, font_spec, orig_font_size,
                        is_bold=is_bold, is_italic=is_italic, color=color, alignment=alignment, line_height=1.18
                    )
                    if not PDFLayoutReconstructor._fits(html_full, user_css, rect):
                        # Probe extra height in progressive steps
                        for test_extra in [4.0, 8.0, 12.0, 16.0, 22.0, 30.0, 40.0]:
                            if test_extra > max_growth:
                                break
                            test_rect = pymupdf.Rect(rect.x0, rect.y0, rect.x1, rect.y1 + test_extra)
                            if PDFLayoutReconstructor._fits(html_full, user_css, test_rect):
                                extra_needed = test_extra
                                break
                        if extra_needed == 0.0 and max_growth > 0:
                            extra_needed = min(max_growth, orig_h * 0.4)

                    target_rect = pymupdf.Rect(rect.x0, rect.y0, rect.x1, rect.y1 + extra_needed)

                    # Propagate shift to subsequent blocks in the same column
                    if extra_needed > 0.0:
                        for j in range(i + 1, len(sorted_blocks)):
                            other_bbox = sorted_blocks[j].get("bbox")
                            if other_bbox and other_bbox[1] >= bbox[3] - 2.0:
                                # Horizontal overlap check (same column)
                                overlap_x = max(0.0, min(bbox[2], other_bbox[2]) - max(bbox[0], other_bbox[0]))
                                min_w = min(bbox[2] - bbox[0], other_bbox[2] - other_bbox[0])
                                if min_w > 0 and (overlap_x / min_w) > 0.5:
                                    accumulated_shifts[j] += extra_needed

                font_size, fitted = PDFLayoutReconstructor._fit_font_size(
                    text, font_spec, user_css, target_rect, orig_font_size,
                    is_bold=is_bold, is_italic=is_italic, color=color, alignment=alignment, line_height=1.18
                )
                if not fitted:
                    truncated += 1

                block_html = PDFLayoutReconstructor._block_html(
                    text, font_spec, font_size,
                    is_bold=is_bold, is_italic=is_italic, color=color, alignment=alignment, line_height=1.18
                )

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
        finally:
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
        """Fallback renderer using basic insert_textbox with universal font resolution."""
        if not font_file:
            from backend.layout.fonts import WINDOWS_FONTS, FONTS_DIR
            for candidate in [
                WINDOWS_FONTS / "Nirmala.ttf",
                WINDOWS_FONTS / "arial.ttf",
                WINDOWS_FONTS / "segoeui.ttf",
                FONTS_DIR / "NotoSansDevanagari-Regular.ttf",
            ]:
                if candidate.exists():
                    font_file = str(candidate)
                    break

        font_name = "FallbackFont" if font_file else None
        for block in blocks:
            bbox = block.get("bbox")
            translated_text = block.get("translated_text", "")
            if not bbox or not translated_text.strip():
                continue

            rect = pymupdf.Rect(bbox)
            orig_font_size = block.get("avg_font_size", 10.0)
            current_font_size = max(orig_font_size, LAYOUT_FONT_MIN_SIZE)
            min_font_size = max(orig_font_size * 0.85, LAYOUT_FONT_MIN_SIZE)

            align = pymupdf.TEXT_ALIGN_LEFT
            if block.get("alignment") == "justify":
                align = pymupdf.TEXT_ALIGN_JUSTIFY
            elif block.get("alignment") == "center":
                align = pymupdf.TEXT_ALIGN_CENTER
            elif block.get("alignment") == "right":
                align = pymupdf.TEXT_ALIGN_RIGHT

            success = False
            while current_font_size >= min_font_size:
                try:
                    kwargs = {
                        "fontsize": current_font_size,
                        "align": align,
                        "color": (0, 0, 0),
                    }
                    if font_file:
                        kwargs["fontfile"] = font_file
                        kwargs["fontname"] = font_name
                    overflow = page.insert_textbox(rect, translated_text, **kwargs)
                    if overflow >= 0:
                        success = True
                        break
                except Exception:
                    break
                current_font_size -= LAYOUT_FONT_STEP

            if not success:
                try:
                    kwargs = {
                        "fontsize": min_font_size,
                        "align": align,
                        "color": (0, 0, 0),
                    }
                    if font_file:
                        kwargs["fontfile"] = font_file
                        kwargs["fontname"] = font_name
                    page.insert_textbox(rect, translated_text, **kwargs)
                except Exception as e:
                    logger.error("Fallback insert_textbox error: %s", e)

