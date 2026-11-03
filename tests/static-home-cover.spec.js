import { test, expect } from '@playwright/test';

test('homepage IQIYI stays an original still image while the detail hero plays video', async ({ page }) => {
  await page.goto('/');
  const skip=page.getByRole('button',{name:/SKIP INTRO/});
  if(await skip.isVisible()) await skip.click();
  const card=page.locator('.curated-link.card-iqiyi-vision');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('canvas, video, .living-artwork, button')).toHaveCount(0);
  const image=card.locator('.project-media img');
  await expect(image).toHaveAttribute('srcset',/\/projects\/iqiyi-vision\/cover.webp/);
  await expect.poll(()=>image.evaluate(i=>i.complete && i.naturalWidth>0)).toBe(true);
  await card.hover();
  await expect(image).toHaveCSS('transform','none');
  await expect(card.locator('.project-media')).toHaveCSS('transform','none');
  await page.mouse.move(0,0);
  await page.waitForTimeout(500);
  const a=await image.screenshot();
  await page.waitForTimeout(650);
  expect((await image.screenshot()).equals(a)).toBe(true);
  await card.click();
  await expect(page).toHaveURL(/\/work\/iqiyi-vision$/);
  const video=page.locator('.detail-cover video');
  await video.scrollIntoViewIfNeeded();
  await expect.poll(()=>video.evaluate(v=>!v.paused && v.currentTime>0)).toBe(true);
});
