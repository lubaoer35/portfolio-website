import {test,expect} from '@playwright/test';

for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  test(`Red Bull pages 30–32 form one uninterrupted original-color H5 at ${viewport.width}px`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/work/red-bull');
    const artwork=page.locator('.h5-long-artwork');await artwork.scrollIntoViewIfNeeded();
    const images=artwork.locator('img');await expect(images).toHaveCount(3);
    await expect(artwork.locator('xpath=..').locator('figcaption')).toContainText('PDF P.30–32');
    await expect(page.locator('.case-gallery > figure')).toHaveCount(7);
    for(let i=0;i<3;i++){
      const image=images.nth(i);await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveAttribute('src',`/enhanced/red-bull/page-${30+i}.svg`);
      await expect.poll(()=>image.evaluate(n=>n.complete && n.naturalWidth>0)).toBe(true);
      await expect(image).toHaveCSS('filter','none');
    }
    const boxes=await images.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,bottom:r.bottom,width:r.width};}));
    expect(Math.abs(boxes[0].bottom-boxes[1].y)).toBeLessThan(.5);
    expect(Math.abs(boxes[1].bottom-boxes[2].y)).toBeLessThan(.5);
    expect(new Set(boxes.map(b=>b.x)).size).toBe(1);
    expect(new Set(boxes.map(b=>b.width)).size).toBe(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await artwork.screenshot({path:`test-results/red-bull-h5-${viewport.width}.png`});
    await artwork.click({position:{x:20,y:20}});
    await expect(page.locator('.lightbox-view img')).toHaveAttribute('src','/enhanced/red-bull/page-30.svg');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.lightbox-view img')).toHaveAttribute('src','/enhanced/red-bull/page-31.svg');
    await page.keyboard.press('Escape');
    await page.locator('.case-gallery > figure').last().getByRole('button').click();
    await expect(page.locator('.lightbox-view img')).toHaveAttribute('src','/enhanced/red-bull/page-33.svg');
  });
}
