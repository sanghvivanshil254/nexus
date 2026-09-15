import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Dict, List
import logging
from backend.config import FONTS_DIR

logger = logging.getLogger("nexus.fonts")

# Windows system font paths
WINDOWS_FONTS = Path("C:/Windows/Fonts")

# Directories searched by the PyMuPDF Story archive. Bundled Noto fonts in
# backend/fonts/ win over system fonts so output is reproducible across machines.
FONT_SEARCH_DIRS: List[Path] = [d for d in (Path(FONTS_DIR), WINDOWS_FONTS) if d.exists()]

# Scripts written right-to-left, keyed by the Flores-200 script suffix.
RTL_SCRIPTS = {"Arab", "Hebr", "Thaa", "Syrc", "Nkoo", "Adlm", "Rohg", "Samr", "Mand"}

# Font candidates per Flores-200 script suffix, best first. A script entry covers
# every language written in it (e.g. Deva serves Hindi, Marathi, Sanskrit, Nepali).
SCRIPT_FONT_CANDIDATES: Dict[str, List[Path]] = {
    # --- Indic scripts ---
    "Gujr": [FONTS_DIR / "NotoSansGujarati-Regular.ttf", WINDOWS_FONTS / "shruti.ttf",
             WINDOWS_FONTS / "Nirmala.ttf"],
    "Deva": [FONTS_DIR / "NotoSansDevanagari-Regular.ttf", WINDOWS_FONTS / "mangal.ttf",
             WINDOWS_FONTS / "Nirmala.ttf"],
    "Beng": [FONTS_DIR / "NotoSansBengali-Regular.ttf", WINDOWS_FONTS / "vrinda.ttf",
             WINDOWS_FONTS / "Nirmala.ttf"],
    "Taml": [FONTS_DIR / "NotoSansTamil-Regular.ttf", WINDOWS_FONTS / "latha.ttf",
             WINDOWS_FONTS / "Nirmala.ttf"],
    "Telu": [FONTS_DIR / "NotoSansTelugu-Regular.ttf", WINDOWS_FONTS / "gautami.ttf",
             WINDOWS_FONTS / "Nirmala.ttf"],
    "Knda": [FONTS_DIR / "NotoSansKannada-Regular.ttf", WINDOWS_FONTS / "tunga.ttf",
             WINDOWS_FONTS / "Nirmala.ttf"],
    "Mlym": [FONTS_DIR / "NotoSansMalayalam-Regular.ttf", WINDOWS_FONTS / "kartika.ttf",
             WINDOWS_FONTS / "Nirmala.ttf"],
    "Guru": [FONTS_DIR / "NotoSansGurmukhi-Regular.ttf", WINDOWS_FONTS / "raavi.ttf",
             WINDOWS_FONTS / "Nirmala.ttf"],
    "Orya": [FONTS_DIR / "NotoSansOriya-Regular.ttf", WINDOWS_FONTS / "kalinga.ttf",
             WINDOWS_FONTS / "Nirmala.ttf"],
    "Olck": [FONTS_DIR / "NotoSansOlChiki-Regular.ttf", WINDOWS_FONTS / "Nirmala.ttf"],
    "Mtei": [FONTS_DIR / "NotoSansMeeteiMayek-Regular.ttf", WINDOWS_FONTS / "Nirmala.ttf"],
    "Sinh": [FONTS_DIR / "NotoSansSinhala-Regular.ttf", WINDOWS_FONTS / "iskpota.ttf",
             WINDOWS_FONTS / "Nirmala.ttf"],
    "Tibt": [FONTS_DIR / "NotoSerifTibetan-Regular.ttf", WINDOWS_FONTS / "monbaiti.ttf"],

    # --- Right-to-left scripts. Nirmala has no Arabic/Hebrew coverage; Arial and
    # Tahoma both ship full Arabic and Hebrew tables on Windows. ---
    "Arab": [FONTS_DIR / "NotoNaskhArabic-Regular.ttf", WINDOWS_FONTS / "tahoma.ttf",
             WINDOWS_FONTS / "arial.ttf", WINDOWS_FONTS / "times.ttf"],
    "Hebr": [FONTS_DIR / "NotoSansHebrew-Regular.ttf", WINDOWS_FONTS / "david.ttf",
             WINDOWS_FONTS / "arial.ttf", WINDOWS_FONTS / "tahoma.ttf"],
    "Thaa": [FONTS_DIR / "NotoSansThaana-Regular.ttf", WINDOWS_FONTS / "mvboli.ttf"],
    "Syrc": [FONTS_DIR / "NotoSansSyriac-Regular.ttf", WINDOWS_FONTS / "estre.ttf"],
    "Nkoo": [FONTS_DIR / "NotoSansNKo-Regular.ttf", WINDOWS_FONTS / "ebrima.ttf"],
    "Adlm": [FONTS_DIR / "NotoSansAdlam-Regular.ttf", WINDOWS_FONTS / "ebrima.ttf"],

    # --- CJK. .ttc collections load correctly through the Story archive. ---
    "Hans": [FONTS_DIR / "NotoSansSC-Regular.otf", WINDOWS_FONTS / "msyh.ttc",
             WINDOWS_FONTS / "simsun.ttc", WINDOWS_FONTS / "simhei.ttf"],
    "Hant": [FONTS_DIR / "NotoSansTC-Regular.otf", WINDOWS_FONTS / "msjh.ttc",
             WINDOWS_FONTS / "mingliu.ttc", WINDOWS_FONTS / "msyh.ttc"],
    "Jpan": [FONTS_DIR / "NotoSansJP-Regular.otf", WINDOWS_FONTS / "YuGothM.ttc",
             WINDOWS_FONTS / "msgothic.ttc", WINDOWS_FONTS / "meiryo.ttc"],
    "Hang": [FONTS_DIR / "NotoSansKR-Regular.otf", WINDOWS_FONTS / "malgun.ttf",
             WINDOWS_FONTS / "gulim.ttc", WINDOWS_FONTS / "batang.ttc"],

    # --- South-East Asian ---
    "Thai": [FONTS_DIR / "NotoSansThai-Regular.ttf", WINDOWS_FONTS / "leelawui.ttf",
             WINDOWS_FONTS / "leelawad.ttf", WINDOWS_FONTS / "tahoma.ttf"],
    "Laoo": [FONTS_DIR / "NotoSansLao-Regular.ttf", WINDOWS_FONTS / "laoui.ttf"],
    "Khmr": [FONTS_DIR / "NotoSansKhmer-Regular.ttf", WINDOWS_FONTS / "khmerui.ttf"],
    "Mymr": [FONTS_DIR / "NotoSansMyanmar-Regular.ttf", WINDOWS_FONTS / "mmrtext.ttf"],

    # --- Other non-Latin ---
    "Cyrl": [FONTS_DIR / "NotoSans-Regular.ttf", WINDOWS_FONTS / "arial.ttf",
             WINDOWS_FONTS / "segoeui.ttf", WINDOWS_FONTS / "calibri.ttf"],
    "Grek": [FONTS_DIR / "NotoSans-Regular.ttf", WINDOWS_FONTS / "arial.ttf",
             WINDOWS_FONTS / "segoeui.ttf"],
    "Armn": [FONTS_DIR / "NotoSansArmenian-Regular.ttf", WINDOWS_FONTS / "sylfaen.ttf"],
    "Geor": [FONTS_DIR / "NotoSansGeorgian-Regular.ttf", WINDOWS_FONTS / "sylfaen.ttf"],
    "Ethi": [FONTS_DIR / "NotoSansEthiopic-Regular.ttf", WINDOWS_FONTS / "nyala.ttf",
             WINDOWS_FONTS / "ebrima.ttf"],
    "Vaii": [FONTS_DIR / "NotoSansVai-Regular.ttf", WINDOWS_FONTS / "ebrima.ttf"],
    "Tfng": [FONTS_DIR / "NotoSansTifinagh-Regular.ttf", WINDOWS_FONTS / "ebrima.ttf"],

    # --- Latin ---
    "Latn": [FONTS_DIR / "NotoSans-Regular.ttf", WINDOWS_FONTS / "arial.ttf",
             WINDOWS_FONTS / "calibri.ttf", WINDOWS_FONTS / "segoeui.ttf"],
}

# Last-resort chain when the script has no entry at all. Nirmala covers every
# Indic script; Arial covers Latin, Cyrillic, Greek, Arabic and Hebrew.
UNIVERSAL_FALLBACKS: List[Path] = [
    FONTS_DIR / "NotoSans-Regular.ttf",
    WINDOWS_FONTS / "arial.ttf",
    WINDOWS_FONTS / "Nirmala.ttf",
    WINDOWS_FONTS / "segoeui.ttf",
    WINDOWS_FONTS / "tahoma.ttf",
]

# Retained for backwards compatibility with earlier per-language callers.
DEFAULT_FONT_PREFERENCES: Dict[str, list] = {
    "guj_Gujr": SCRIPT_FONT_CANDIDATES["Gujr"],
    "hin_Deva": SCRIPT_FONT_CANDIDATES["Deva"],
    "mar_Deva": SCRIPT_FONT_CANDIDATES["Deva"],
    "ben_Beng": SCRIPT_FONT_CANDIDATES["Beng"],
    "tam_Taml": SCRIPT_FONT_CANDIDATES["Taml"],
    "tel_Telu": SCRIPT_FONT_CANDIDATES["Telu"],
    "eng_Latn": SCRIPT_FONT_CANDIDATES["Latn"],
}


@dataclass(frozen=True)
class FontSpec:
    """A resolved font for one target language."""
    family: str      # CSS-safe @font-face family name
    file_name: str   # basename, resolved against the Story archive
    path: str        # absolute path on disk
    is_rtl: bool     # True when the target script is right-to-left


def script_of(flores_code: str) -> str:
    """Extracts the script suffix from a Flores-200 tag ('guj_Gujr' -> 'Gujr')."""
    if not flores_code:
        return "Latn"
    parts = flores_code.split("_")
    return parts[1] if len(parts) > 1 and len(parts[1]) == 4 else "Latn"


def is_rtl_language(flores_code: str) -> bool:
    """True when the language's script is written right-to-left."""
    return script_of(flores_code) in RTL_SCRIPTS


def _css_family_name(font_path: Path) -> str:
    """Derives a CSS-safe @font-face family name from a font filename."""
    stem = re.sub(r"[^A-Za-z0-9]", "", font_path.stem)
    return f"NX{stem}" if stem else "NXFallback"


class FontManager:
    def __init__(self):
        self.cached_font_paths: Dict[str, str] = {}
        self._spec_cache: Dict[str, Optional[FontSpec]] = {}

    def _candidates_for(self, lang_code: str) -> List[Path]:
        script = script_of(lang_code)
        candidates = list(DEFAULT_FONT_PREFERENCES.get(lang_code, []))
        candidates += SCRIPT_FONT_CANDIDATES.get(script, [])
        candidates += UNIVERSAL_FALLBACKS
        return candidates

    def _first_existing(self, candidates: List[Path]) -> Optional[Path]:
        for candidate in candidates:
            p = Path(candidate)
            if p.exists() and p.is_file():
                return p
        return None

    def get_font_spec_for_lang(self, lang_code: str) -> Optional[FontSpec]:
        """
        Resolves the best available font for a target language, along with the
        CSS family name and RTL flag needed to build Story HTML.
        """
        if lang_code in self._spec_cache:
            return self._spec_cache[lang_code]

        chosen = self._first_existing(self._candidates_for(lang_code))
        if chosen is None:
            logger.warning(
                "No font file found for %s (script %s). Story will fall back to a "
                "MuPDF built-in font, which may use an unintended typeface. Drop a "
                "Noto font for this script into %s to fix.",
                lang_code, script_of(lang_code), FONTS_DIR,
            )
            self._spec_cache[lang_code] = None
            return None

        spec = FontSpec(
            family=_css_family_name(chosen),
            file_name=chosen.name,
            path=str(chosen.resolve()),
            is_rtl=is_rtl_language(lang_code),
        )
        logger.info("Font for %s (%s): %s [family=%s, rtl=%s]",
                    lang_code, script_of(lang_code), chosen.name, spec.family, spec.is_rtl)
        self._spec_cache[lang_code] = spec
        return spec

    def get_font_file_for_lang(self, lang_code: str) -> Optional[str]:
        """
        Returns the absolute path to a .ttf/.otf that supports the target script.
        Used by the insert_textbox fallback renderer, which needs a real file path.
        """
        if lang_code in self.cached_font_paths:
            return self.cached_font_paths[lang_code]

        spec = self.get_font_spec_for_lang(lang_code)
        if spec is None:
            return None

        # insert_textbox cannot load a .ttc collection; fall back to a plain file.
        if spec.path.lower().endswith(".ttc"):
            plain = self._first_existing([
                c for c in self._candidates_for(lang_code)
                if not str(c).lower().endswith(".ttc")
            ])
            if plain is None:
                logger.warning("Only a .ttc font is available for %s; insert_textbox "
                               "fallback may fail for this language.", lang_code)
                return None
            resolved = str(plain.resolve())
        else:
            resolved = spec.path

        self.cached_font_paths[lang_code] = resolved
        return resolved


font_manager = FontManager()
