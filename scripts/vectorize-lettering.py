"""Derive scalable outlines from the original PDF lettering's transparency mask.
Keeps the original asset untouched; requires Pillow, numpy, scipy and contourpy.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, label, find_objects
import contourpy

root = Path(__file__).resolve().parents[1]
source = root / 'public/projects/identity/portfolio-lettering.webp'
im = np.asarray(Image.open(source).convert('RGBA'))
alpha = gaussian_filter(im[:, :, 3].astype(float) / 255, sigma=0.65)
# Trace the actual ink boundary, including the counters and hand-drawn stars.
contours = contourpy.contour_generator(z=np.pad(alpha, 1)).lines(0.5)
paths = []
# Each letter is a complete connected ink outline, rather than a rectangular crop.
labels, _ = label(alpha > 0.5)
letter_starts = [(283,82),(691,295),(870,290),(1046,215),(967,163),
                 (1260,287),(1457,154),(1528,284),(1209,281)]
component_group = {}
for component, region in enumerate(find_objects(labels), 1):
    if region is None:
        continue
    start = (region[1].start, region[0].start)
    closest = min(range(9), key=lambda i: abs(start[0]-letter_starts[i][0])+abs(start[1]-letter_starts[i][1]))
    distance = sum(abs(a-b) for a,b in zip(start, letter_starts[closest]))
    component_group[component] = closest if distance < 8 else 9
    if abs(start[0]-1639) < 8 and abs(start[1]-193) < 8:
        component_group[component] = 7  # dot above i
letter_paths = [[] for _ in range(10)]
for contour in contours:
    if len(contour) < 5:
        continue
    pts = contour - 1
    area = abs(np.sum(pts[:-1, 0]*pts[1:, 1]-pts[1:, 0]*pts[:-1, 1]))/2
    if area < 1:
        continue
    path = 'M' + 'L'.join(f'{x:.2f},{y:.2f}' for x,y in pts) + 'Z'
    paths.append(path)
    # Sample both sides of the contour to identify its connected ink region.
    xy = np.rint(pts).astype(int)
    hits = []
    for dx,dy in [(0,0),(1,0),(-1,0),(0,1),(0,-1)]:
        hits.extend(labels[np.clip(xy[:,1]+dy,0,labels.shape[0]-1),
                           np.clip(xy[:,0]+dx,0,labels.shape[1]-1)])
    votes = np.bincount(hits)
    votes[0] = 0
    group = component_group.get(int(votes.argmax()), 9)
    letter_paths[group].append(path)
color = np.median(im[im[:,:,3] > 240, :3], axis=0).astype(int)
ink = '#' + ''.join(f'{c:02x}' for c in color)
h,w = im.shape[:2]
out = root / 'public/identity/portfolio-lettering-vector.svg'
out.parent.mkdir(exist_ok=True)
out.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"><title>Original PDF Portfolio lettering — scalable ink outline</title><path fill="{ink}" fill-rule="evenodd" d="{"".join(paths)}"/></svg>')
print(out, out.stat().st_size, 'bytes; original ink:', ink)

for index, outlines in enumerate(letter_paths):
    target = out.with_name(f'portfolio-letter-{index}.svg')
    target.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"><path fill="{ink}" fill-rule="evenodd" d="{"".join(outlines)}"/></svg>')
    print(index, len(outlines), 'outlines')
