import { test, expect } from '@playwright/test';

test('original accessories can be dragged out of the basket, dropped, adjusted and reset', async ({ page }) => {
  await page.goto('/work/free-in-the-wind');
  const board=page.locator('.accessory-board');
  await board.scrollIntoViewIfNeeded();
  await expect(board.locator('[data-piece]')).toHaveCount(6);
  const stage=board.locator('.accessory-canvas');
  const rect=await stage.boundingBox();
  const at=(x,y)=>({x:rect.x+x*rect.width/2048,y:rect.y+y*rect.height/1152});
  const piece=board.getByRole('button',{name:'拖动粉色海螺',exact:true});
  const before=await piece.getAttribute('transform');
  const start=at(425,255),end=at(1500,700);
  await page.mouse.move(start.x,start.y);await page.mouse.down();
  await expect(board).toHaveAttribute('data-dragging','conch');
  await page.mouse.move(end.x,end.y,{steps:14});await page.mouse.up();
  await expect(board).toHaveAttribute('data-dragging','');
  await expect(board.getByRole('status')).toContainText('已放下粉色海螺');
  expect(await piece.getAttribute('transform')).not.toBe(before);
  const moved=await piece.getAttribute('transform');
  await page.waitForTimeout(250);expect(await piece.getAttribute('transform')).toBe(moved);
  await piece.focus();await piece.press('ArrowRight');expect(await piece.getAttribute('transform')).not.toBe(moved);
  await piece.press('Home');await expect(piece).toHaveAttribute('transform',before);
  await board.getByRole('button',{name:'拖动黄色贝壳',exact:true}).focus();
  await page.keyboard.press('ArrowDown');
  await board.getByRole('button',{name:'全部复位 ↺'}).click();
  await expect(board.getByRole('status')).toContainText('所有配件已复位');
  await expect(board.locator('[data-piece="shell"]')).toHaveAttribute('transform','translate(748 441)');
  await board.screenshot({path:'test-results/accessories-desktop.png'});
  await board.getByRole('button',{name:'查看原稿 ↗'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.lightbox-view img')).toHaveAttribute('src',/page-19.webp$/);
});

test('touch dragging works on a narrow screen with reduced motion', async ({ browser }) => {
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:5180/work/free-in-the-wind');
  const board=page.locator('.accessory-board');await board.scrollIntoViewIfNeeded();
  const rect=await board.locator('.accessory-canvas').boundingBox();
  const x=rect.x+425*rect.width/2048,y=rect.y+255*rect.height/1152;
  const client=await context.newCDPSession(page);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  await expect(board).toHaveAttribute('data-dragging','conch');
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+145,y:y+75,id:1}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(board.getByRole('status')).toContainText('已放下粉色海螺');
  await expect(board.locator('[data-piece="conch"]')).not.toHaveAttribute('transform','translate(235 153)');
  await board.getByRole('button',{name:'全部复位 ↺'}).click();
  await expect(board.locator('[data-piece="conch"]')).toHaveAttribute('transform','translate(235 153)');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await context.close();
});

test('all six accessories lift independently and can be placed across the entire artwork', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/work/free-in-the-wind');
  const board=page.locator('.accessory-board');await board.scrollIntoViewIfNeeded();
  const r=await board.locator('.accessory-canvas').boundingBox();
  const samples=[['clip',139,200],['conch',425,255],['tag',600,420],['fish',760,205],['blue-shell',313,590],['shell',940,560]];
  for(const [id,x,y] of samples){
    const piece=board.locator(`[data-piece="${id}"]`),before=await piece.getAttribute('transform');
    await page.mouse.move(r.x+x*r.width/2048,r.y+y*r.height/1152);await page.mouse.down();
    await expect(board).toHaveAttribute('data-dragging',id);
    await page.mouse.move(r.x+(1450+samples.findIndex(p=>p[0]===id)*65)*r.width/2048,r.y+800*r.height/1152,{steps:8});
    await page.mouse.up();await expect(board).toHaveAttribute('data-dragging','');
    expect(await piece.getAttribute('transform')).not.toBe(before);
  }
  await board.screenshot({path:'test-results/accessories-all-dragged.png'});
  await board.getByRole('button',{name:'全部复位 ↺'}).click();
  await expect(board.getByRole('status')).toContainText('所有配件已复位');
});
