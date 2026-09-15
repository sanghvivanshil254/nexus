import sys, io, warnings, logging
sys.stdout.reconfigure(encoding="utf-8")
warnings.filterwarnings("ignore"); logging.basicConfig(level=logging.ERROR)
import pymupdf
from backend.pipeline.layout import SHARED_ARCHIVE
from backend.layout.fonts import font_manager

AR = "فكر ابن آوى طويلا في الطبل الملقى في الغابة ثم اقترب منه بحذر شديد ليكتشف سره."
spec = font_manager.get_font_spec_for_lang("arb_Arab")
css = f"@font-face {{ font-family: {spec.family}; src: url('{spec.file_name}'); }}"
RECT = pymupdf.Rect(60, 80, 360, 200)

variants = {
  "A plain (no dir, no align)": f'<div style="font-family:{spec.family};font-size:11.0pt">{AR}</div>',
  "B dir=rtl only":             f'<div dir="rtl" style="font-family:{spec.family};font-size:11.0pt">{AR}</div>',
  "C text-align:right only":    f'<div style="font-family:{spec.family};font-size:11.0pt;text-align:right">{AR}</div>',
  "D dir=rtl + align (current)":f'<div dir="rtl" style="font-family:{spec.family};font-size:11.0pt;text-align:right">{AR}</div>',
  "E body-level css":           f'<div style="font-size:11.0pt">{AR}</div>',
}
BODYCSS = css + f" body {{ font-family:{spec.family}; direction:rtl; text-align:right; margin:0; }}"

def probe(html, user_css, mode):
    buf = io.BytesIO(); w = pymupdf.DocumentWriter(buf)
    st = pymupdf.Story(html=html, user_css=user_css, archive=SHARED_ARCHIVE)
    if mode == "write":
        st.write(w, lambda n,f: (pymupdf.Rect(), pymupdf.Rect(), None) if n>0 else (pymupdf.Rect(0,0,420,560), RECT, None))
    w.close()
    d = pymupdf.open(stream=buf.getvalue(), filetype="pdf")
    lines = [ln["bbox"] for b in d[0].get_text("dict")["blocks"] for ln in b.get("lines",[])]
    d.close()
    return lines

print(f"target rect x: [{RECT.x0:.0f} .. {RECT.x1:.0f}]   (right-aligned => lines END at 360)")
for name, html in variants.items():
    use_css = BODYCSS if name.startswith("E") else css
    lines = probe(html, use_css, "write")
    if not lines:
        print(f"  {name:30s} -> NO TEXT"); continue
    desc = "  ".join(f"[{b[0]:.0f}..{b[2]:.0f}]" for b in lines)
    last = lines[-1]
    verdict = "RIGHT-aligned" if (RECT.x1 - last[2]) < (last[0] - RECT.x0) else "left-aligned"
    print(f"  {name:30s} -> {desc}   => {verdict}")
