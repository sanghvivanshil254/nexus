import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pymupdf

from backend.config import OCR_ENGINE, OCR_MIN_CONFIDENCE, OCR_RENDER_DPI

logger = logging.getLogger("nexus.ocr")


class OCREngine:
    """
    Text recognition for scanned / image-only PDF pages.

    Tries several backends so a scanned book is never silently skipped:
      1. PaddleOCR      - best quality, needs `pip install paddleocr paddlepaddle`
      2. pytesseract    - needs the Tesseract binary plus `pip install pytesseract`
      3. PyMuPDF/MuPDF  - built-in Tesseract bridge, needs the Tesseract binary
                          and TESSDATA_PREFIX

    `is_available` is False when none of them load. Callers must treat that as a
    hard failure for scanned pages rather than producing an untranslated copy.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OCREngine, cls).__new__(cls)
            cls._instance._init_ocr()
        return cls._instance

    def _init_ocr(self):
        self.paddle_ocr = None
        self.pytesseract = None
        self.engine_name: Optional[str] = None
        self.is_available = False
        self.unavailable_reason = ""

        attempts: List[str] = []
        want = OCR_ENGINE if OCR_ENGINE in ("paddle", "tesseract", "pymupdf") else None

        if want in (None, "paddle") and self._try_paddle(attempts):
            return
        if want in (None, "tesseract") and self._try_pytesseract(attempts):
            return
        if want in (None, "pymupdf") and self._try_pymupdf_ocr(attempts):
            return

        self.unavailable_reason = "; ".join(attempts) or "no OCR backend configured"
        logger.warning(
            "No OCR engine available (%s). Scanned pages CANNOT be translated. "
            "Install one of: `pip install paddleocr paddlepaddle`, "
            "`pip install pytesseract` + the Tesseract binary, or set "
            "TESSDATA_PREFIX for MuPDF's built-in Tesseract bridge.",
            self.unavailable_reason,
        )

    def _try_paddle(self, attempts: List[str]) -> bool:
        try:
            from paddleocr import PaddleOCR
            self.paddle_ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
            self.engine_name = "paddle"
            self.is_available = True
            logger.info("OCR engine: PaddleOCR initialized successfully.")
            return True
        except Exception as e:
            attempts.append(f"paddleocr: {type(e).__name__}: {e}")
            self.paddle_ocr = None
            return False

    def _try_pytesseract(self, attempts: List[str]) -> bool:
        try:
            import pytesseract
            # Fails fast when the Tesseract binary is missing from PATH.
            version = pytesseract.get_tesseract_version()
            self.pytesseract = pytesseract
            self.engine_name = "tesseract"
            self.is_available = True
            logger.info("OCR engine: pytesseract initialized (Tesseract %s).", version)
            return True
        except Exception as e:
            attempts.append(f"pytesseract: {type(e).__name__}: {e}")
            self.pytesseract = None
            return False

    def _try_pymupdf_ocr(self, attempts: List[str]) -> bool:
        try:
            if not hasattr(pymupdf.Page, "get_textpage_ocr"):
                raise RuntimeError("PyMuPDF build lacks get_textpage_ocr")
            # Probe a throwaway page: MuPDF raises here when Tesseract or
            # TESSDATA_PREFIX is missing, which is exactly what we want to know.
            probe = pymupdf.open()
            try:
                page = probe.new_page()
                page.get_textpage_ocr(dpi=72, full=True)
            finally:
                probe.close()
            self.engine_name = "pymupdf"
            self.is_available = True
            logger.info("OCR engine: MuPDF built-in Tesseract bridge initialized.")
            return True
        except Exception as e:
            attempts.append(f"pymupdf-tesseract: {type(e).__name__}: {e}")
            return False

    # ------------------------------------------------------------------ #
    # Recognition
    # ------------------------------------------------------------------ #

    def ocr_image(self, image_np: np.ndarray) -> List[Dict[str, Any]]:
        """
        Runs OCR on an image array and returns text with bounding boxes in
        *image pixel* coordinates.
        Format:
        [
            {"text": "...", "bbox": [x0, y0, x1, y1], "confidence": 0.95}
        ]
        """
        if not self.is_available:
            return []
        if self.engine_name == "paddle":
            return self._ocr_paddle(image_np)
        if self.engine_name == "tesseract":
            return self._ocr_pytesseract(image_np)
        return []

    def _ocr_paddle(self, image_np: np.ndarray) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        try:
            ocr_res = self.paddle_ocr.ocr(image_np, cls=True)
            if ocr_res and ocr_res[0]:
                for line in ocr_res[0]:
                    box = line[0]  # [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
                    text_conf = line[1]  # (text, confidence)
                    confidence = float(text_conf[1])
                    if confidence < OCR_MIN_CONFIDENCE:
                        continue
                    results.append({
                        "text": text_conf[0],
                        "confidence": confidence,
                        "bbox": [
                            min(p[0] for p in box), min(p[1] for p in box),
                            max(p[0] for p in box), max(p[1] for p in box),
                        ],
                    })
        except Exception as e:
            logger.error("PaddleOCR execution error: %s", e)
        return results

    def _ocr_pytesseract(self, image_np: np.ndarray) -> List[Dict[str, Any]]:
        """Groups Tesseract word boxes into lines, which translate far better."""
        results: List[Dict[str, Any]] = []
        try:
            data = self.pytesseract.image_to_data(
                image_np, output_type=self.pytesseract.Output.DICT
            )
        except Exception as e:
            logger.error("pytesseract execution error: %s", e)
            return results

        lines: Dict[Tuple[int, int, int], Dict[str, Any]] = {}
        for i, word in enumerate(data.get("text", [])):
            if not word or not word.strip():
                continue
            try:
                confidence = float(data["conf"][i])
            except (TypeError, ValueError):
                continue
            if confidence < 0:  # Tesseract uses -1 for non-text regions
                continue
            key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
            x, y = data["left"][i], data["top"][i]
            w, h = data["width"][i], data["height"][i]
            entry = lines.setdefault(
                key, {"words": [], "confs": [], "bbox": [x, y, x + w, y + h]}
            )
            entry["words"].append(word)
            entry["confs"].append(confidence)
            bbox = entry["bbox"]
            bbox[0], bbox[1] = min(bbox[0], x), min(bbox[1], y)
            bbox[2], bbox[3] = max(bbox[2], x + w), max(bbox[3], y + h)

        for entry in lines.values():
            # Tesseract reports 0-100; normalize to the 0-1 scale Paddle uses.
            confidence = sum(entry["confs"]) / len(entry["confs"]) / 100.0
            if confidence < OCR_MIN_CONFIDENCE:
                continue
            results.append({
                "text": " ".join(entry["words"]),
                "confidence": confidence,
                "bbox": [float(v) for v in entry["bbox"]],
            })
        return results

    def ocr_page(self, page: pymupdf.Page, dpi: int = OCR_RENDER_DPI) -> List[Dict[str, Any]]:
        """
        Recognizes a scanned PDF page and returns blocks in **PDF point
        coordinates**, matching the shape of analyzer text_blocks so the
        translate -> reconstruct path can consume them unchanged.
        """
        if not self.is_available:
            return []

        if self.engine_name == "pymupdf":
            return self._ocr_page_pymupdf(page, dpi)

        try:
            pixmap = page.get_pixmap(dpi=dpi)
        except Exception as e:
            logger.error("Page rasterization failed for OCR: %s", e)
            return []

        image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(
            pixmap.height, pixmap.width, pixmap.n
        )
        if pixmap.n == 4:  # drop alpha; OCR backends expect RGB
            image = image[:, :, :3]

        raw = self.ocr_image(image)
        # Rasterized pixels -> PDF points
        scale = 72.0 / float(dpi)
        return [
            self._as_text_block(
                item["text"],
                [v * scale for v in item["bbox"]],
                item.get("confidence", 0.0),
            )
            for item in raw
        ]

    def _ocr_page_pymupdf(self, page: pymupdf.Page, dpi: int) -> List[Dict[str, Any]]:
        """MuPDF's Tesseract bridge already returns PDF-space coordinates."""
        blocks: List[Dict[str, Any]] = []
        try:
            textpage = page.get_textpage_ocr(dpi=dpi, full=True)
            raw = page.get_text("dict", textpage=textpage)
        except Exception as e:
            logger.error("MuPDF OCR error: %s", e)
            return blocks

        for b in raw.get("blocks", []):
            if b.get("type", 0) != 0:
                continue
            parts, sizes = [], []
            for line in b.get("lines", []):
                for span in line.get("spans", []):
                    if span.get("text", "").strip():
                        parts.append(span["text"])
                        sizes.append(span.get("size", 10.0))
            text = " ".join(parts).strip()
            if text:
                blocks.append(self._as_text_block(
                    text,
                    list(b.get("bbox", [0, 0, 0, 0])),
                    0.9,
                    font_size=sum(sizes) / len(sizes) if sizes else 10.0,
                ))
        return blocks

    @staticmethod
    def _as_text_block(
        text: str,
        bbox: List[float],
        confidence: float,
        font_size: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Shapes an OCR result like an analyzer text_block."""
        height = max(1.0, bbox[3] - bbox[1])
        return {
            "bbox": [float(v) for v in bbox],
            "text": text,
            # Cap the height-derived size: OCR line boxes include ascender and
            # descender padding, so raw height overestimates the type size.
            "avg_font_size": float(font_size) if font_size else min(max(height * 0.72, 6.0), 18.0),
            "is_header": False,
            "is_footer": False,
            "is_ocr": True,
            "ocr_confidence": confidence,
            "lines": [],
        }


ocr_engine = OCREngine()
