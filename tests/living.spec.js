import { test, expect } from '@playwright/test';

test('IQIYI animates only wing interiors, fish eyes and water using the original image', async ({ page }) => {
  await page.goto('/work/iqiyi-vision');
  const art = page.locator('.living-artwork').first();
  await art.scrollIntoViewIfNeeded();
  await expect(art).toHaveAttribute('data-living', 'active');
  await expect(art.locator('img')).toHaveAttribute('src', /projects\/iqiyi-vision\/cover.webp$/);
  const result = await art.locator('canvas').evaluate(canvas => {
    const gl = canvas.getContext('webgl');
    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    const clock = gl.getUniformLocation(program, 'time');
    const w = canvas.width, h = canvas.height;
    const frame = t => {
      gl.uniform1f(clock, t); gl.drawArrays(gl.TRIANGLES, 0, 6);
      const pixels = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return pixels;
    };
    const a = frame(0), b = frame(2.5);
    const boxes = {
      fox: [.61,.05,.99,.53], title: [.34,.04,.59,.19],
      flowers: [.24,.07,.35,.33], petal: [.44,.51,.47,.61],
      foreground: [.02,.92,.98,.98], fishBody: [.08,.79,.14,.84],
      wing: [.01,.22,.08,.33], eye: [.105,.73,.12,.78],
      water: [.40,.68,.46,.71],
    };
    return Object.fromEntries(Object.entries(boxes).map(([name,[x1,y1,x2,y2]]) => {
      let changed = 0;
      for(let y=Math.ceil(y1*h); y<y2*h; y++) for(let x=Math.ceil(x1*w); x<x2*w; x++) {
        const i=((h-1-y)*w+x)*4;
        if(a[i]!==b[i] || a[i+1]!==b[i+1] || a[i+2]!==b[i+2]) changed++;
      }
      return [name, changed];
    }));
  });
  for (const region of ['fox','title','flowers','petal','foreground','fishBody']) expect(result[region], region).toBe(0);
  for (const region of ['wing','eye','water']) expect(result[region], region).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/iqiyi-desktop.png', fullPage: true });
});

test('IQIYI preserves static original on mobile with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/work/iqiyi-vision');
  const art = page.locator('.living-artwork').first();
  await art.scrollIntoViewIfNeeded();
  await expect(art).toHaveAttribute('data-living', 'static');
  await expect(art.locator('canvas')).toBeHidden();
  expect(await art.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: 'test-results/iqiyi-mobile.png', fullPage: true });
});
