import os
from pathlib import Path
from typing import Optional, Dict
import logging
from backend.config import FONTS_DIR

logger = logging.getLogger("nexus.fonts")

# Windows system font paths
WINDOWS_FONTS = Path("C:/Windows/Fonts")

DEFAULT_FONT_PREFERENCES: Dict[str, list] = {
    # Gujarati fonts
    "guj_Gujr": [
        FONTS_DIR / "NotoSansGujarati-Regular.ttf",
        WINDOWS_FONTS / "shruti.ttf",
        WINDOWS_FONTS / "Nirmala.ttf",
        WINDOWS_FONTS / "NirmalaS.ttf"
    ],
    # Devanagari (Hindi / Marathi) fonts
    "hin_Deva": [
        FONTS_DIR / "NotoSansDevanagari-Regular.ttf",
        WINDOWS_FONTS / "mangal.ttf",
        WINDOWS_FONTS / "Nirmala.ttf",
        WINDOWS_FONTS / "NirmalaS.ttf"
    ],
    "mar_Deva": [
        FONTS_DIR / "NotoSansDevanagari-Regular.ttf",
        WINDOWS_FONTS / "mangal.ttf",
        WINDOWS_FONTS / "Nirmala.ttf"
    ],
    # Bengali
    "ben_Beng": [
        FONTS_DIR / "NotoSansBengali-Regular.ttf",
        WINDOWS_FONTS / "vrinda.ttf",
        WINDOWS_FONTS / "Nirmala.ttf"
    ],
    # Tamil
    "tam_Taml": [
        FONTS_DIR / "NotoSansTamil-Regular.ttf",
        WINDOWS_FONTS / "latha.ttf",
        WINDOWS_FONTS / "Nirmala.ttf"
    ],
    # Telugu
    "tel_Telu": [
        FONTS_DIR / "NotoSansTelugu-Regular.ttf",
        WINDOWS_FONTS / "gautami.ttf",
        WINDOWS_FONTS / "Nirmala.ttf"
    ],
    # Default Latin / English
    "eng_Latn": [
        WINDOWS_FONTS / "arial.ttf",
        WINDOWS_FONTS / "calibri.ttf",
        WINDOWS_FONTS / "segoeui.ttf"
    ]
}

class FontManager:
    def __init__(self):
        self.cached_font_paths: Dict[str, str] = {}

    def get_font_file_for_lang(self, lang_code: str) -> Optional[str]:
        """
        Returns the absolute path to a valid .ttf font file that supports the target language script.
        """
        if lang_code in self.cached_font_paths:
            return self.cached_font_paths[lang_code]

        candidates = DEFAULT_FONT_PREFERENCES.get(lang_code, [])
        # Always fallback to Nirmala UI (Windows universal Indic font) if available
        candidates.append(WINDOWS_FONTS / "Nirmala.ttf")
        candidates.append(WINDOWS_FONTS / "arial.ttf")

        for candidate in candidates:
            p = Path(candidate)
            if p.exists() and p.is_file():
                font_path = str(p.resolve())
                self.cached_font_paths[lang_code] = font_path
                logger.debug("Selected font for %s: %s", lang_code, font_path)
                return font_path

        logger.warning("No font file found for language %s, falling back to None", lang_code)
        return None

font_manager = FontManager()
