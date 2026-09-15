import sys, warnings, logging
sys.stdout.reconfigure(encoding="utf-8")
warnings.filterwarnings("ignore"); logging.basicConfig(level=logging.ERROR)
import pymupdf
from backend.pipeline.analyzer import PDFStructureAnalyzer
from backend.pipeline.layout import PDFLayoutReconstructor
from backend.layout.fonts import font_manager

EN = ("The jackal thought for a long while about the drum lying in the forest, "
      "and then approached it with great caution to discover its secret.")
GU = ("શિયાળે જંગલમાં પડેલા ઢોલ વિશે લાંબા સમય સુધી વિચાર્યું, અને પછી તેનું રહસ્ય "
      "શોધવા માટે ખૂબ સાવધાનીથી તેની પાસે ગયો.")
AR = "فكر ابن آوى طويلا في الطبل الملقى في الغابة ثم اقترب منه بحذر شديد ليكتشف سره."

def wide_page():
    """A page with one realistic full-width paragraph block."""
    doc = pymupdf.open(); page = doc.new_page(width=420, height=560)
    page.insert_textbox(pymupdf.Rect(60, 80, 360, 140), EN, fontsize=11)
    return doc, page

print("=" * 74)
print("TEST 1  RTL base direction through the real reconstruct_page() path")
print("=" * 74)
for tgt, label, txt in (("guj_Gujr", "Gujarati LTR", GU), ("arb_Arab", "Arabic RTL", AR)):
    doc, page = wide_page()
    an = PDFStructureAnalyzer.analyze_page(page, 1)
    blocks = [dict(b, translated_text=txt) for b in an["text_blocks"]]
    bx = blocks[0]["bbox"]
    PDFLayoutReconstructor.reconstruct_page(page, an, blocks, tgt)
    lines = [ln for bl in page.get_text("dict")["blocks"] for ln in bl.get("lines", [])]
    spec = font_manager.get_font_spec_for_lang(tgt)
    if lines:
        first, last = lines[0]["bbox"], lines[-1]["bbox"]
        gap_l = first[0] - bx[0]           # indent of first line from box left
        gap_r = bx[2] - last[2]            # gap from last line end to box right
        print(f"  {label:13s} font={spec.file_name:11s} dir={'rtl' if spec.is_rtl else 'ltr'}  "
              f"box=[{bx[0]:.0f}..{bx[2]:.0f}]  last_line=[{last[0]:.0f}..{last[2]:.0f}]  "
              f"left_gap={gap_l:5.1f} right_gap={gap_r:5.1f}")
        print(f"                {'-> last line hugs RIGHT margin (correct RTL)' if gap_r < gap_l else '-> last line hugs LEFT margin (correct LTR)'}")
    doc.close()

print()
print("=" * 74)
print("TEST 2  Font fitting on a realistic paragraph (Gujarati ~ +35% length)")
print("=" * 74)
import backend.pipeline.layout as L
for growth in (0.0, 0.6):
    L.LAYOUT_MAX_BOX_GROWTH = growth
    doc, page = wide_page()
    an = PDFStructureAnalyzer.analyze_page(page, 1)
    blocks = [dict(b, translated_text=GU) for b in an["text_blocks"]]
    PDFLayoutReconstructor.reconstruct_page(page, an, blocks, "guj_Gujr")
    d = page.get_text("dict")
    sizes = {round(s["size"],1) for bl in d["blocks"] for ln in bl.get("lines",[]) for s in ln.get("spans",[])}
    nch = sum(len(s["text"]) for bl in d["blocks"] for ln in bl.get("lines",[]) for s in ln.get("spans",[]))
    print(f"  box_growth={growth:.1f} -> font_size={sorted(sizes)}  chars_kept={nch}  (orig 11.0pt)")
    doc.close()
L.LAYOUT_MAX_BOX_GROWTH = 0.6

print()
print("=" * 74)
print("TEST 3  Tables: is_table flag, cell pinning, and no downward growth")
print("=" * 74)
doc = pymupdf.open(); page = doc.new_page(width=420, height=560)
# draw a 2x3 grid with text in cells
xs, ys = [60, 180, 300, 380], [100, 130, 160]
for x in xs: page.draw_line(pymupdf.Point(x, ys[0]), pymupdf.Point(x, ys[-1]))
for y in ys: page.draw_line(pymupdf.Point(xs[0], y), pymupdf.Point(xs[-1], y))
cells = [("Name","Qty","Cost"),("Drum","2","150")]
for r, row in enumerate(cells):
    for c, val in enumerate(row):
        page.insert_text((xs[c]+4, ys[r]+18), val, fontsize=10)
page.insert_textbox(pymupdf.Rect(60, 220, 360, 280), EN, fontsize=11)
an = PDFStructureAnalyzer.analyze_page(page, 1)
print(f"  tables detected: {len(an['tables'])}")
tb = [b for b in an["text_blocks"] if b.get("is_table")]
nb = [b for b in an["text_blocks"] if not b.get("is_table")]
print(f"  blocks flagged is_table: {len(tb)} / {len(an['text_blocks'])}   (body blocks: {len(nb)})")
print(f"  blocks pinned to a cell_bbox: {sum(1 for b in tb if b.get('cell_bbox'))}")
for b in tb[:3]:
    print(f"    {b['text'][:12]!r:15s} bbox={[round(v) for v in b['bbox']]} cell={[round(v) for v in b['cell_bbox']] if b.get('cell_bbox') else None}")
# confirm a table block is NOT grown downward
obstacles = PDFLayoutReconstructor._collect_obstacles(an, an["text_blocks"])
if tb:
    r = pymupdf.Rect(tb[0]["bbox"])
    grown = PDFLayoutReconstructor._growable_rect(r, obstacles, page.rect)
    print(f"  body-path growth on a table block would be: {r.height:.0f}pt -> {grown.height:.0f}pt "
          f"(table path bypasses this, using cell_bbox)")
doc.close()
