import {test,expect} from '@playwright/test';

test('hover enlarges only the original QR and mouse leave restores it',async({page})=>{
  await page.goto('/work/red-bull');
  const art=page.locator('.qr-artwork');await art.scrollIntoViewIfNeeded();
  const image=art.locator('.qr-artwork-original > img');
  await expect.poll(()=>image.evaluate(i=>i.complete && i.naturalWidth>0)).toBe(true);
  const qr=art.locator('.qr-hotspot');await expect(qr).toHaveAttribute('aria-expanded','false');
  const initial=await qr.boundingBox(),frame=await image.boundingBox();
  await qr.hover();await expect(qr).toHaveAttribute('aria-expanded','true');
  await expect.poll(async()=>(await qr.boundingBox()).width).toBeGreaterThan(initial.width*2.5);
  await expect.poll(async()=>(await qr.boundingBox()).width).toBeGreaterThan(195);
  expect((await image.boundingBox()).width).toBe(frame.width);
  await expect(qr.locator('image')).toHaveAttribute('href','/enhanced/red-bull/page-33.svg');
  await expect(image).toHaveAttribute('src','/enhanced/red-bull/page-33.svg');
  await art.screenshot({path:'test-results/red-bull-qr-hover.png'});
  await page.mouse.move(0,0);await expect(qr).toHaveAttribute('aria-expanded','false');
  await expect.poll(async()=>Math.abs((await qr.boundingBox()).width-initial.width)).toBeLessThan(.5);
  await qr.focus();await page.keyboard.press('Enter');await expect(qr).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Escape');await expect(qr).toHaveAttribute('aria-expanded','false');
  await art.locator('.qr-artwork-original').click({position:{x:20,y:20}});
  await expect(page.locator('.lightbox-view img')).toHaveAttribute('src','/enhanced/red-bull/page-33.svg');
});

test('touch visitors can tap the original QR to enlarge and tap again to restore',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const page=await context.newPage();await page.goto('http://127.0.0.1:5180/work/red-bull');
  const art=page.locator('.qr-artwork');await art.scrollIntoViewIfNeeded();const qr=art.locator('.qr-hotspot');
  await qr.tap();await expect(qr).toHaveAttribute('aria-expanded','true');
  expect((await qr.boundingBox()).width).toBeGreaterThan(195);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await qr.tap();await expect(qr).toHaveAttribute('aria-expanded','false');await context.close();
});
