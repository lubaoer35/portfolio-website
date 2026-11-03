"""Keep PDF page 38 intact while separating its two suspended collage pieces."""
from pathlib import Path
from copy import deepcopy
import xml.etree.ElementTree as ET
import fitz
root=Path(__file__).resolve().parents[1]
doc=fitz.open(root/'public/projects/lv-bao-er-portfolio.pdf')
svg=ET.fromstring(doc[37].get_svg_image(text_as_path=True))
ns='{http://www.w3.org/2000/svg}'
ET.register_namespace('',ns[1:-1]);ET.register_namespace('xlink','http://www.w3.org/1999/xlink')
defs,artwork=list(svg);parts=list(artwork)
assert len(parts)==549, 'PDF layout changed; inspect layers before exporting'
for node in artwork.iter(ns+'image'):defs.append(deepcopy(node))
out=root/'public/interactive/vision-hanger';out.mkdir(parents=True,exist_ok=True)
for name,nodes in [('background',parts[:547]),('mouth',[parts[547]]),('eyes',[parts[548]])]:
    result=ET.Element(ns+'svg',svg.attrib);result.append(deepcopy(defs))
    for node in nodes:result.append(deepcopy(node))
    ET.ElementTree(result).write(out/f'{name}.svg',encoding='unicode')
    print(name)
