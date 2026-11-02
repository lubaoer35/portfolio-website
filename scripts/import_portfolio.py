"""Faithful PDF import. Usage: python3 scripts/import_portfolio.py /path/to/作品集.pdf
Requires PyMuPDF and Pillow. Writes only generated assets and the source audit.
"""
from pathlib import Path
import sys, json, hashlib, shutil
import fitz
from PIL import Image
from io import BytesIO

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
doc = fitz.open(source)
assert len(doc) == 54, 'Expected the reviewed 54-page portfolio'
out = root / 'public' / 'projects'
out.mkdir(parents=True, exist_ok=True)

def group(n):
    if n <= 3 or n in [24, 34, 44, 50]: return 'archive'
    for a, b, slug in [(4,10,'iqiyi-vision'),(11,23,'free-in-the-wind'),(25,33,'red-bull'),(35,36,'hermes-scarf'),(37,40,'vision-reconstructed'),(41,43,'gentle-monster'),(45,49,'cool-penguin'),(51,54,'other-works')]:
        if a <= n <= b: return slug

def raster(xref, mask=0):
    pix = fitz.Pixmap(doc, xref)
    if pix.colorspace and pix.colorspace.n != 3: pix = fitz.Pixmap(fitz.csRGB, pix)
    if mask:
        if pix.alpha: pix = fitz.Pixmap(pix, 0)
        pix = fitz.Pixmap(pix, fitz.Pixmap(doc, mask))
    return Image.open(BytesIO(pix.tobytes('png')))

manifest=[]
for i, page in enumerate(doc):
    n=i+1; slug=group(n); folder=out/slug; folder.mkdir(exist_ok=True)
    stem=f'page-{n:02}'
    for width, suffix, quality in [(3200,'',94),(960,'-small',88)]:
        pix=page.get_pixmap(matrix=fitz.Matrix(width/page.rect.width,width/page.rect.width),alpha=False,colorspace=fitz.csRGB)
        Image.frombytes('RGB',[pix.width,pix.height],pix.samples).save(folder/f'{stem}{suffix}.webp',quality=quality,method=6)
    assets=[]
    for entry in page.get_images(full=True):
        xref,mask,w,h=entry[:4]
        if min(w,h)<80: continue
        assetfolder=folder/'extracted';assetfolder.mkdir(exist_ok=True)
        info=doc.extract_image(xref)
        ext='png' if mask else info['ext']
        path=assetfolder/f'asset-{xref}.{ext}'
        if not path.exists():
            if mask: raster(xref,mask).save(path,optimize=True)
            else: path.write_bytes(info['image'])
        assets.append({'xref':xref,'width':w,'height':h,'file':'/projects/'+str(path.relative_to(out))})
    manifest.append({'page':n,'project':slug,'image':f'/projects/{slug}/{stem}.webp','thumbnail':f'/projects/{slug}/{stem}-small.webp','width':3200,'height':round(3200*page.rect.height/page.rect.width),'embeddedImages':assets,'text':page.get_text()})
    print(f'Imported {n}/54: {slug}',flush=True)
# Original cover lettering and paper are separate embedded images; retain alpha and RGB.
assets=out/'identity';assets.mkdir(exist_ok=True)
raster(1162,1161).save(assets/'portfolio-lettering.webp',lossless=True)
raster(1154).save(assets/'paper.webp',quality=90)
raster(15,14).save(assets/'portrait.webp',lossless=True)
# Source-art covers use a full PDF page, or a complete embedded illustration, without cropping.
for slug,xref,mask in [('iqiyi-vision',28,0),('free-in-the-wind',174,0),('gentle-monster',610,611),('cool-penguin',1115,1114)]:
    # Obtain actual mask from page metadata instead of relying on manually noted IDs.
    entry=next(e for page in doc for e in page.get_images(full=True) if e[0]==xref)
    raster(xref,entry[1]).save(out/slug/'cover.webp',quality=94)
shutil.copyfile(source,out/'lv-bao-er-portfolio.pdf')
(out/'manifest.json').write_text(json.dumps({'pages':manifest,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'pageCount':54},ensure_ascii=False,indent=2))
print('All original pages, embedded images, identity assets and source PDF imported.')

# Matched thumbnails use the same composition as each cover.
covers={'iqiyi-vision':'cover.webp','free-in-the-wind':'cover.webp','red-bull':'page-30.webp','hermes-scarf':'page-36.webp','vision-reconstructed':'page-37.webp','gentle-monster':'cover.webp','cool-penguin':'page-45.webp','other-works':'page-51.webp'}
for slug,file in covers.items():
    im=Image.open(out/slug/file); im.thumbnail((960,1600)); im.save(out/slug/'cover-small.webp',quality=90)
