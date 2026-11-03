"""Separate original PDF page 39 into interactive SVG layers; no source edits."""
from pathlib import Path
from copy import deepcopy
import xml.etree.ElementTree as ET
import fitz
root=Path(__file__).resolve().parents[1]
page=fitz.open(root/'public/projects/lv-bao-er-portfolio.pdf')[38]
svg=ET.fromstring(page.get_svg_image(text_as_path=True))
ns='{http://www.w3.org/2000/svg}'
ET.register_namespace('',ns[1:-1]);ET.register_namespace('xlink','http://www.w3.org/1999/xlink')
defs, artwork=list(svg)
parts=list(artwork)
out=root/'public/interactive/vision-claw';out.mkdir(parents=True,exist_ok=True)
def save(name,nodes):
    doc=ET.Element(ns+'svg',svg.attrib)
    doc.append(deepcopy(defs))
    for n in nodes:doc.append(deepcopy(n))
    ET.ElementTree(doc).write(out/f'{name}.svg',encoding='unicode')
# Put original embedded image definitions in defs so all references stay valid.
for node in artwork.iter(ns+'image'):defs.append(deepcopy(node))
# PDF has 12 vector drawing paths, in original paint order.
paths=[n for n in artwork.iter(ns+'path')]
assert len(paths)==12
save('background',paths[3:8])
save('word-random',[parts[1],parts[8]])
save('word-choose',parts[2:8])
save('claw-left',[paths[0]])
save('claw-right',[paths[8]])
save('claw-hub',[paths[2]]+paths[9:12])
for name,index in [('mouth',9),('eyes',11),('ears',13),('hair',14)]:save(name,[parts[index]])
print('Exported original page 39 into faithful SVG layers with independently interactive titles.')
