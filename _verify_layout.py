import sys, warnings, logging
sys.stdout.reconfigure(encoding="utf-8")
warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.ERROR)
import pymupdf
from backend.pipeline.analyzer import PDFStructureAnalyzer
from backend.pipeline.layout import PDFLayoutReconstructor
from backend.layout.fonts import font_manager

GU = "આ એક ઘણું લાંબુ ગુજરાતી વાક્ય છે જે મૂળ અંગ્રેજી લખાણ કરતાં ઘણી વધારે જગ્યા માંગે છે."
AR = "هذه جملة عربية طويلة تحتاج مساحة أكبر من النص الإنجليزي الأصلي."

def make_pdf():
    doc = pymupdf.open(); page = doc.new_page(width=400, height=500)
    page.insert_text((50, 100), "Short line.", fontsize=11)
    page.insert_text((50, 200), "Another paragraph here.", fontsize=11)
    return doc, page

print("=" * 72)
print("TEST 1  RTL: does dir=rtl right-align the block?")
print("=" * 72)
for tgt, label, txt in (("guj_Gujr", "Gujarati (LTR)", GU), ("arb_Arab", "Arabic (RTL)", AR)):
    doc, page = make_pdf()
    analysis = PDFStructureAnalyzer.analyze_page(page, 1)
    blocks = [dict(b, translated_text=txt) for b in analysis["text_blocks"]]
    box = blocks[0]["bbox"]
    PDFLayoutReconstructor.reconstruct_page(page, analysis, blocks, tgt)
    words = page.get_text("words")
    if words:
        xs = [w[0] for w in words]
        spec = font_manager.get_font_spec_for_lang(tgt)
        # distance from block's left edge vs right edge
        print(f"  {label:16s} font={spec.file_name:12s} rtl={spec.is_rtl!s:5s} "
              f"box_x=[{box[0]:.0f},{box[2]:.0f}] text_x=[{min(xs):.0f},{max(xs):.0f}]")
    doc.close()

print()
print("=" * 72)
print("TEST 2  Font fitting: is long text kept, and at what size?")
print("=" * 72)
for growth in (0.0, 0.6):
    import backend.config as cfg
    import backend.pipeline.layout as L
    cfg.LAYOUT_MAX_BOX_GROWTH = growth; L.LAYOUT_MAX_BOX_GROWTH = growth
    doc, page = make_pdf()
    analysis = PDFStructureAnalyzer.analyze_page(page, 1)
    blocks = [dict(b, translated_text=GU * 2) for b in analysis["text_blocks"]]
    orig_box = pymupdf.Rect(blocks[0]["bbox"])
    PDFLayoutReconstructor.reconstruct_page(page, analysis, blocks, "guj_Gujr")
    sizes = {round(s["size"], 1) for bl in page.get_text("dict")["blocks"]
             for ln in bl.get("lines", []) for s in ln.get("spans", [])}
    nchars = len("".join(s["text"] for bl in page.get_text("dict")["blocks"]
                 for ln in bl.get("lines", []) for s in ln.get("spans", [])))
    print(f"  box_growth={growth:.1f}  orig_box_h={orig_box.height:.0f}pt  "
          f"rendered_sizes={sorted(sizes)}  chars_rendered={nchars}")
    doc.close()

print()
print("=" * 72)
print("TEST 3  Overflow detection: is oversize text reported, not dropped silently?")
print("=" * 72)
doc = pymupdf.open(); page = doc.new_page(width=200, height=120)
page.insert_text((10, 30), "x", fontsize=9)
analysis = PDFStructureAnalyzer.analyze_page(page, 1)
blocks = [dict(b, translated_text=GU * 12) for b in analysis["text_blocks"]]
caught = []
class H(logging.Handler):
    def emit(self, r): caught.append(r.getMessage())
lg = logging.getLogger("nexus.layout"); lg.addHandler(H()); lg.setLevel(logging.WARNING)
PDFLayoutReconstructor.reconstruct_page(page, analysis, blocks, "guj_Gujr")
print("  warnings emitted:", len([c for c in caught if "overflow" in c or "truncat" in c]))
for c in caught[:3]: print("   ->", c[:110])
doc.close()
