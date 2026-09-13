import logging
from typing import List, Dict, Any, Optional
import numpy as np

logger = logging.getLogger("nexus.ocr")

class OCREngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OCREngine, cls).__new__(cls)
            cls._instance._init_ocr()
        return cls._instance

    def _init_ocr(self):
        self.paddle_ocr = None
        self.is_available = False
        try:
            from paddleocr import PaddleOCR
            # Initialize with English / Multilingual support
            self.paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            self.is_available = True
            logger.info("PaddleOCR engine initialized successfully.")
        except Exception as e:
            logger.warning("PaddleOCR not loaded (%s). OCR features will use heuristic fallback.", e)
            self.is_available = False

    def ocr_image(self, image_np: np.ndarray) -> List[Dict[str, Any]]:
        """
        Runs OCR on an image (numpy array or PIL image) and returns text with bounding boxes.
        Format:
        [
            {"text": "...", "bbox": [x0, y0, x1, y1], "confidence": 0.95}
        ]
        """
        results = []
        if not self.is_available:
            return results

        try:
            ocr_res = self.paddle_ocr.ocr(image_np, cls=True)
            if ocr_res and ocr_res[0]:
                for line in ocr_res[0]:
                    box = line[0]  # [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
                    text_conf = line[1]  # (text, confidence)
                    
                    x0 = min(p[0] for p in box)
                    y0 = min(p[1] for p in box)
                    x1 = max(p[0] for p in box)
                    y1 = max(p[1] for p in box)
                    
                    results.append({
                        "text": text_conf[0],
                        "confidence": float(text_conf[1]),
                        "bbox": [x0, y0, x1, y1]
                    })
        except Exception as e:
            logger.error("OCR execution error: %s", e)

        return results

ocr_engine = OCREngine()
