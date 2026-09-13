import re

# Direct character substitutions for known OCR / font-encoding artifacts in scanned PDFs
OCR_CHAR_REPLACEMENTS = {
    "\u10c3": "s",   # Georgian 'Ⴣ' used for 's' (e.g. 'courჃe' -> 'course')
    "\u10c4": "a",   # Georgian 'Ⴤ' used for 'a' (e.g. 'lranslჄted' -> 'translated')
    "\u10c5": "t",   # Georgian 'Ⴥ' used for 't' (e.g. 'Ⴥhe' -> 'the')
    "\u10c6": "av",  # Georgian '჆' used for 'av' (e.g. 'h჆ye' -> 'have')
    "\u10c7": "d",   # Georgian 'Ⴧ' used for 'd' (e.g. 'andჇ' -> 'and')
    "\xad": "",      # Soft hyphen
    "\u200b": "",    # Zero width space
}

# Regex-based word corrections for recurring OCR typos in Panchatantra.pdf
OCR_WORD_PATTERNS = [
    (re.compile(r"\bPei:sia\b", re.IGNORECASE), "Persia"),
    (re.compile(r"\bpre-ISiamic\b", re.IGNORECASE), "pre-Islamic"),
    (re.compile(r"\b8t_h\b", re.IGNORECASE), "8th"),
    (re.compile(r"\bSQme\b"), "Some"),
    (re.compile(r"\bmcust-be\b", re.IGNORECASE), "must be"),
    (re.compile(r"\bwQuld\b", re.IGNORECASE), "would"),
    (re.compile(r"\bth\s*['’]e\b", re.IGNORECASE), "the"),
    (re.compile(r"\bth['’]e\s+dose\b", re.IGNORECASE), "the close"),
    (re.compile(r"\btowards\s+the\s+dose\b", re.IGNORECASE), "towards the close"),
    (re.compile(r"\bPanchataritra\b", re.IGNORECASE), "Panchatantra"),
    (re.compile(r"\bhavye\b", re.IGNORECASE), "have"),
    (re.compile(r"\bh\u10c6ye\b", re.IGNORECASE), "have"),
    (re.compile(r"\bscholar\s*,\s*\.", re.IGNORECASE), "scholar,"),
    (re.compile(r"\bthe\s*['’]\s*translation", re.IGNORECASE), "the translation"),
    (re.compile(r"\btranslation\s+\.of\b", re.IGNORECASE), "translation of"),
    (re.compile(r"(?<=\w)\s*·\s*(?=\w)"), " "),  # Stray middle dots between words
    (re.compile(r"_([A-Za-z]+)"), r"\1"),        # Stray leading underscores on names e.g. _Sharma
    (re.compile(r"([A-Za-z]+)_([A-Za-z]+)"), r"\1 \2"),
]

def clean_ocr_text(text: str) -> str:
    """
    Cleans raw OCR extracted text from PDF documents:
    - Normalizes corrupted glyph encodings (e.g. Georgian letter substitutions)
    - Fixes hyphenated words split across line breaks
    - Corrects recurring OCR scanner typographical errors
    - Strips rogue formatting noise
    """
    if not text:
        return ""

    # 1. Replace corrupted glyph substitutions
    for char, replacement in OCR_CHAR_REPLACEMENTS.items():
        if char in text:
            text = text.replace(char, replacement)

    # 2. De-hyphenate line-broken words: e.g. "trust-\nworthy" -> "trustworthy"
    text = re.sub(r"(\b[A-Za-z]+)-\s*\n\s*([A-Za-z]+\b)", r"\1\2", text)

    # 3. Apply specific OCR word corrections
    for pattern, replacement in OCR_WORD_PATTERNS:
        text = pattern.sub(replacement, text)

    # 4. Clean stray slashes e.g. "many/Westerners" -> "many Westerners"
    text = re.sub(r"(\w+)\s*/\s*([A-Z]\w+)", r"\1 \2", text)

    # 5. Normalize internal whitespace while preserving single newlines
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    cleaned = "\n".join(line for line in lines if line)

    return cleaned
