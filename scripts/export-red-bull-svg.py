"""Export all nine Red Bull pages without rasterizing PDF text/vector artwork.
Embedded source images retain their native dimensions. Originals stay untouched.
Requires PyMuPDF. Run from any directory with python scripts/export-red-bull-svg.py.
"""
from pathlib import Path
import fitz
root = Path(__file__).resolve().parents[1]
doc = fitz.open(root / 'public/projects/lv-bao-er-portfolio.pdf')
out = root / 'public/enhanced/red-bull'
out.mkdir(parents=True, exist_ok=True)
for number in range(25, 34):
    svg = doc[number - 1].get_svg_image(text_as_path=True)
    # Outlined fonts make rendering independent of the visitor's installed fonts.
    target = out / f'page-{number:02}.svg'
    target.write_text(svg)
    print(target.name, target.stat().st_size)
