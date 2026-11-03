import { test, expect } from '@playwright/test';

// Nested SVG bounding boxes include clipped source content; measure its visible viewport.
const viewportSize=locator=>locator.evaluate(node=>{
  const matrix=node.ownerSVGElement.getScreenCTM();
  return {width:node.width.baseVal.value*Math.hypot(matrix.a,matrix.b),height:node.height.baseVal.value*Math.hypot(matrix.c,matrix.d)};
});

test('moving right promotes Freedom to the unchanged central image dimensions and original colors', async ({page})=>{
  await page.goto('/work/free-in-the-wind');
  const gallery=page.locator('.extended-gallery');await gallery.scrollIntoViewIfNeeded();
  await expect(gallery).toHaveAttribute('data-active','sand');
  const center=gallery.locator('[data-slot="center"] .extended-panel');
  const originalSize=await viewportSize(center);
  await gallery.getByRole('button',{name:'画面向右移',exact:true}).click();
  await expect(gallery).toHaveAttribute('data-active','freedom');
  const freedom=gallery.locator('[data-design="freedom"]');
  await expect(freedom).toHaveAttribute('data-slot','center');
  await expect.poll(async()=>Math.abs((await viewportSize(freedom.locator('.extended-panel'))).width-originalSize.width)).toBeLessThan(1);
  await expect.poll(async()=>Math.abs((await viewportSize(freedom.locator('.extended-panel'))).height-originalSize.height)).toBeLessThan(1);
  const sources=await gallery.locator('image').evaluateAll(nodes=>nodes.map(n=>n.href.baseVal));
  expect(sources.every(src=>src==='/projects/free-in-the-wind/page-16.webp')).toBe(true);
  for(const image of await gallery.locator('image').all())await expect(image).toHaveCSS('filter','none');
  await expect(freedom.locator('.extended-panel')).toHaveCSS('opacity','1');
  await gallery.getByRole('button',{name:'画面向左移',exact:true}).click();
  await expect(gallery).toHaveAttribute('data-active','sand');
  await gallery.getByRole('button',{name:'将 Breeze 移到中间',exact:true}).focus();
  await page.keyboard.press('Enter');await expect(gallery).toHaveAttribute('data-active','breeze');
  await gallery.screenshot({path:'test-results/extended-gallery-breeze.png'});
  await gallery.getByRole('button',{name:'查看原稿 ↗'}).click();
  await expect(page.locator('.lightbox-view img')).toHaveAttribute('src',/page-16.webp$/);
});

test('mouse dragging right moves the left image into the center',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/work/free-in-the-wind');
  const gallery=page.locator('.extended-gallery');await gallery.scrollIntoViewIfNeeded();
  const stage=await gallery.locator('.extended-stage').boundingBox();
  const x=stage.x+1024*stage.width/2048,y=stage.y+570*stage.height/1152;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+150,y,{steps:10});await page.mouse.up();
  await expect(gallery).toHaveAttribute('data-active','freedom');
  await expect(gallery.locator('[data-design="freedom"]')).toHaveAttribute('data-slot','center');
});

test('mobile swipe right promotes the left panel without horizontal page overflow',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const page=await context.newPage();await page.goto('http://127.0.0.1:5180/work/free-in-the-wind');
  const gallery=page.locator('.extended-gallery');await gallery.scrollIntoViewIfNeeded();
  const r=await gallery.locator('.extended-stage').boundingBox();
  const client=await context.newCDPSession(page),x=r.x+r.width*.4,y=r.y+r.height*.45;
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+75,y,id:1}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(gallery).toHaveAttribute('data-active','freedom');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await gallery.screenshot({path:'test-results/extended-gallery-mobile.png'});await context.close();
});
