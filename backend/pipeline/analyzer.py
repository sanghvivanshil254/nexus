import pymupdf
from typing import Dict, Any, List
import logging

logger = logging.getLogger("nexus.analyzer")

class PDFStructureAnalyzer:
    """
    Analyzes a PDF document or page to identify structural components:
    - Text blocks and paragraph spans (with bounding boxes, font size, color)
    - Tables and cell coordinates
    - Embedded images and graphics
    - Scanned page detection
    """

    @staticmethod
    def is_scanned_page(page: pymupdf.Page) -> bool:
        """
        Determines if a page is a scanned document (little or no text, but has large images).
        """
        text = page.get_text().strip()
        if len(text) > 50:
            return False
            
        images = page.get_images()
        if not images:
            return False
            
        # Check if any image covers a significant portion of the page area
        page_area = page.rect.width * page.rect.height
        image_rects = page.get_image_info()
        for img in image_rects:
            bbox = img.get("bbox")
            if bbox:
                w = bbox[2] - bbox[0]
                h = bbox[3] - bbox[1]
                if (w * h) / page_area > 0.4:
                    return True
        return False

    @staticmethod
    def extract_tables(page: pymupdf.Page) -> List[Dict[str, Any]]:
        """
        Extracts table structures and cell bboxes from the page.
        """
        tables_data = []
        try:
            tabs = page.find_tables()
            for tab in tabs.tables:
                tables_data.append({
                    "bbox": list(tab.bbox),
                    "rows": tab.row_count,
                    "cols": tab.col_count,
                    "cells": [
                        {
                            "row": r,
                            "col": c,
                            "bbox": list(cell_bbox),
                            "text": tab.extract()[r][c] if r < len(tab.extract()) and c < len(tab.extract()[r]) else ""
                        }
                        for r, row in enumerate(tab.cells)
                        for c, cell_bbox in enumerate(row) if cell_bbox
                    ]
                })
        except Exception as e:
            logger.debug("Table detection warning: %s", e)
        return tables_data

    @staticmethod
    def analyze_page(page: pymupdf.Page, page_num: int) -> Dict[str, Any]:
        """
        Comprehensive page element extraction.
        """
        page_rect = page.rect
        width = page_rect.width
        height = page_rect.height
        is_scanned = PDFStructureAnalyzer.is_scanned_page(page)

        # Extract text blocks with detailed span info
        # get_text("dict") returns blocks with lines, spans, bbox, font, size, color
        raw_dict = page.get_text("dict")
        text_blocks = []
        image_blocks = []

        for b in raw_dict.get("blocks", []):
            block_type = b.get("type", 0)  # 0 = text, 1 = image
            bbox = list(b.get("bbox", [0, 0, 0, 0]))
            
            if block_type == 0:
                # Text block
                block_lines = []
                full_text_parts = []
                font_sizes = []
                
                for line in b.get("lines", []):
                    line_spans = []
                    line_text_parts = []
                    for span in line.get("spans", []):
                        span_text = span.get("text", "")
                        if span_text.strip():
                            full_text_parts.append(span_text)
                            line_text_parts.append(span_text)
                            font_sizes.append(span.get("size", 10.0))
                            line_spans.append({
                                "text": span_text,
                                "bbox": list(span.get("bbox", bbox)),
                                "font": span.get("font", "helv"),
                                "size": span.get("size", 10.0),
                                "color": span.get("color", 0),
                                "flags": span.get("flags", 0)
                            })
                    if line_spans:
                        block_lines.append({
                            "bbox": list(line.get("bbox", bbox)),
                            "text": "".join(line_text_parts),
                            "spans": line_spans
                        })

                full_text = " ".join(full_text_parts).strip()
                if full_text:
                    # Detect if header (top 7%) or footer (bottom 7%)
                    is_header = bbox[3] <= height * 0.08
                    is_footer = bbox[1] >= height * 0.92
                    
                    avg_font_size = sum(font_sizes) / len(font_sizes) if font_sizes else 10.0
                    
                    text_blocks.append({
                        "bbox": bbox,
                        "text": full_text,
                        "avg_font_size": avg_font_size,
                        "is_header": is_header,
                        "is_footer": is_footer,
                        "lines": block_lines
                    })
            elif block_type == 1:
                # Image block
                image_blocks.append({
                    "bbox": bbox,
                    "width": b.get("width", 0),
                    "height": b.get("height", 0),
                    "ext": b.get("ext", "png")
                })

        tables = PDFStructureAnalyzer.extract_tables(page)

        return {
            "page_num": page_num,
            "width": width,
            "height": height,
            "is_scanned": is_scanned,
            "text_blocks": text_blocks,
            "image_blocks": image_blocks,
            "tables": tables
        }
