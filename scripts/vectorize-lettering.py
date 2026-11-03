"""Derive scalable outlines from the original PDF lettering's transparency mask.
Keeps the original asset untouched; requires Pillow, numpy, scipy and contourpy.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
import contourpy

root = Path(__file__).resolve().parents[1]
source = root / 'public/projects/identity/portfolio-lettering.webp'
im = np.asarray(Image.open(source).convert('RGBA'))
alpha = gaussian_filter(im[:, :, 3].astype(float) / 255, sigma=0.65)
# Trace the actual ink boundary, including the counters and hand-drawn stars.
contours = contourpy.contour_generator(z=np.pad(alpha, 1)).lines(0.5)
paths = []
for contour in contours:
    if len(contour) < 5:
        continue
    pts = contour - 1
    area = abs(np.sum(pts[:-1, 0]*pts[1:, 1]-pts[1:, 0]*pts[:-1, 1]))/2
    if area < 1:
        continue
    paths.append('M' + 'L'.join(f'{x:.2f},{y:.2f}' for x,y in pts) + 'Z')
color = np.median(im[im[:,:,3] > 240, :3], axis=0).astype(int)
ink = '#' + ''.join(f'{c:02x}' for c in color)
h,w = im.shape[:2]
out = root / 'public/identity/portfolio-lettering-vector.svg'
out.parent.mkdir(exist_ok=True)
out.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"><title>Original PDF Portfolio lettering — scalable ink outline</title><path fill="{ink}" fill-rule="evenodd" d="{"".join(paths)}"/></svg>')
print(out, out.stat().st_size, 'bytes; original ink:', ink)
