import logging
from pathlib import Path
from typing import Optional
import pymupdf

logger = logging.getLogger("nexus.converter")

SUPPORTED_DOC_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".rtf", ".odt"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif", ".svg", ".tiff"}

def is_image_file(file_name: str) -> bool:
    return Path(file_name).suffix.lower() in IMAGE_EXTENSIONS

def is_supported_document(file_name: str) -> bool:
    return Path(file_name).suffix.lower() in SUPPORTED_DOC_EXTENSIONS

def convert_document_to_pdf(input_path: Path, output_pdf_path: Path) -> Path:
    """
    Converts supported text and word documents (.docx, .doc, .txt, .rtf, .odt)
    into a standardized, layout-ready PDF for the neural translation pipeline.
    If already a PDF, returns input_path directly.
    """
    ext = input_path.suffix.lower()
    if ext == ".pdf":
        return input_path

    if ext in IMAGE_EXTENSIONS:
        raise ValueError(f"Image files ({ext}) are not supported. Only documents (.pdf, .docx, .txt, .doc, .rtf) are allowed.")

    output_pdf_path.parent.mkdir(parents=True, exist_ok=True)

    # 1. Plain Text (.txt) and Rich Text (.rtf)
    if ext in (".txt", ".rtf"):
        try:
            # PyMuPDF can open text documents natively
            doc = pymupdf.open(str(input_path))
            pdf_bytes = doc.convert_to_pdf()
            pdf_doc = pymupdf.open("pdf", pdf_bytes)
            pdf_doc.save(str(output_pdf_path))
            pdf_doc.close()
            doc.close()
            logger.info("Successfully converted %s to PDF via PyMuPDF (pages=%d)", input_path.name, len(pdf_doc))
            return output_pdf_path
        except Exception as e:
            logger.warning("PyMuPDF direct convert failed for %s (%s). Falling back to structured text paginator.", input_path.name, e)
            return _paginate_plain_text(input_path, output_pdf_path)

    # 2. Microsoft Word Document (.docx, .doc)
    if ext in (".docx", ".doc"):
        try:
            import docx
            docx_doc = docx.Document(str(input_path))
            pdf_doc = pymupdf.open()
            
            # Standard A4: 595 x 842 pt
            PAGE_WIDTH, PAGE_HEIGHT, MARGIN = 595, 842, 54
            USABLE_WIDTH = PAGE_WIDTH - 2 * MARGIN
            USABLE_HEIGHT = PAGE_HEIGHT - 2 * MARGIN

            page = pdf_doc.new_page(width=PAGE_WIDTH, height=PAGE_HEIGHT)
            y = MARGIN

            for p in docx_doc.paragraphs:
                text = p.text.strip()
                if not text:
                    y += 10
                    continue

                is_heading = p.style.name.startswith("Heading") or p.style.name.startswith("Title")
                font_size = 15 if is_heading else 10.5
                line_height = font_size * 1.35
                approx_lines = max(1, len(text) // 75 + 1)
                block_height = approx_lines * line_height + 8

                if y + block_height > PAGE_HEIGHT - MARGIN:
                    page = pdf_doc.new_page(width=PAGE_WIDTH, height=PAGE_HEIGHT)
                    y = MARGIN

                rect = pymupdf.Rect(MARGIN, y, PAGE_WIDTH - MARGIN, y + block_height)
                page.insert_textbox(rect, text, fontsize=font_size, fontname="helv")
                y += block_height + 6

            # Tables in docx
            for table in docx_doc.tables:
                for row in table.rows:
                    row_text = "  |  ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                    if not row_text:
                        continue
                    if y + 26 > PAGE_HEIGHT - MARGIN:
                        page = pdf_doc.new_page(width=PAGE_WIDTH, height=PAGE_HEIGHT)
                        y = MARGIN
                    rect = pymupdf.Rect(MARGIN, y, PAGE_WIDTH - MARGIN, y + 26)
                    page.insert_textbox(rect, row_text, fontsize=9.5, fontname="helv")
                    y += 26

            if len(pdf_doc) == 0:
                page = pdf_doc.new_page(width=PAGE_WIDTH, height=PAGE_HEIGHT)
                page.insert_textbox(pymupdf.Rect(MARGIN, MARGIN, PAGE_WIDTH - MARGIN, MARGIN + 30), "(Empty Document)", fontsize=11, fontname="helv")

            pdf_doc.save(str(output_pdf_path))
            total_pages = len(pdf_doc)
            pdf_doc.close()
            logger.info("Successfully converted %s (.docx) to PDF (pages=%d)", input_path.name, total_pages)
            return output_pdf_path
        except Exception as err:
            logger.warning("docx conversion failed for %s: %s. Falling back to plain text extraction.", input_path.name, err)
            return _paginate_plain_text(input_path, output_pdf_path)

    # 3. OpenDocument Text (.odt)
    if ext == ".odt":
        try:
            import zipfile
            import xml.etree.ElementTree as ET
            with zipfile.ZipFile(str(input_path)) as z:
                content_xml = z.read("content.xml")
            root = ET.fromstring(content_xml)
            text_chunks = []
            for elem in root.iter():
                if elem.text and elem.text.strip():
                    text_chunks.append(elem.text.strip())
            full_text = "\n\n".join(text_chunks)
            
            tmp_txt = input_path.with_suffix(".tmp.txt")
            tmp_txt.write_text(full_text, encoding="utf-8", errors="replace")
            res = _paginate_plain_text(tmp_txt, output_pdf_path)
            tmp_txt.unlink(missing_ok=True)
            return res
        except Exception as e:
            logger.warning("ODT extraction failed for %s: %s", input_path.name, e)
            return _paginate_plain_text(input_path, output_pdf_path)

    raise ValueError(f"Unsupported document extension: '{ext}'. Supported: {SUPPORTED_DOC_EXTENSIONS}")


def _paginate_plain_text(txt_path: Path, output_pdf_path: Path) -> Path:
    """Paginates raw text into standard A4 PDF pages with clean line breaks."""
    text = txt_path.read_text(encoding="utf-8", errors="replace")
    doc = pymupdf.open()
    PAGE_WIDTH, PAGE_HEIGHT, MARGIN = 595, 842, 54
    
    paragraphs = text.split("\n")
    page = doc.new_page(width=PAGE_WIDTH, height=PAGE_HEIGHT)
    y = MARGIN

    for p in paragraphs:
        p_text = p.strip()
        if not p_text:
            y += 12
            continue
        approx_lines = max(1, len(p_text) // 80 + 1)
        height = approx_lines * 14 + 6
        if y + height > PAGE_HEIGHT - MARGIN:
            page = doc.new_page(width=PAGE_WIDTH, height=PAGE_HEIGHT)
            y = MARGIN
        rect = pymupdf.Rect(MARGIN, y, PAGE_WIDTH - MARGIN, y + height)
        page.insert_textbox(rect, p_text, fontsize=10.5, fontname="helv")
        y += height + 4

    if len(doc) == 0:
        doc.new_page(width=PAGE_WIDTH, height=PAGE_HEIGHT)

    doc.save(str(output_pdf_path))
    doc.close()
    return output_pdf_path
