import { test, expect } from '@playwright/test';

test('uploaded IQIYI hero video plays, loops and pauses in the existing detail cover', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/work/iqiyi-vision');
  const cover = page.locator('.detail-cover');
  const video = cover.locator('video');
  await cover.scrollIntoViewIfNeeded();
  await expect(video).toHaveAttribute('src', /\/projects\/iqiyi-vision\/hero-video.mp4$/);
  await expect(cover.locator('canvas')).toHaveCount(0);
  await expect.poll(() => video.evaluate(v => v.readyState)).toBeGreaterThanOrEqual(2);
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(false);
  expect(await video.evaluate(v => ({ width:v.videoWidth, height:v.videoHeight, muted:v.muted, loop:v.loop, inline:v.playsInline })))
    .toEqual({width:1280,height:720,muted:true,loop:true,inline:true});
  const frame1 = await video.screenshot();
  await page.waitForTimeout(800);
  expect((await video.screenshot()).equals(frame1)).toBe(false);
  // Exercise the actual loop boundary instead of merely checking the loop attribute.
  await video.evaluate(v => { v.currentTime = v.duration - .2; });
  await expect.poll(() => video.evaluate(v => v.currentTime), { timeout: 5000 }).toBeLessThan(2);
  await cover.getByRole('button',{name:'暂停主视觉视频'}).click();
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(true);
  const stopped = await video.evaluate(v => v.currentTime);
  await page.waitForTimeout(200);
  expect(await video.evaluate(v => v.currentTime)).toBe(stopped);
  await cover.getByRole('button',{name:'播放主视觉视频'}).click();
  await expect.poll(() => video.evaluate(v => v.paused)).toBe(false);
  await page.screenshot({path:'test-results/iqiyi-video-desktop.png'});
  expect(errors).toEqual([]);
});

test('mobile reduced motion preserves the poster and allows inline video playback', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/work/iqiyi-vision');
  const cover=page.locator('.detail-cover'); const video=cover.locator('video');
  await cover.scrollIntoViewIfNeeded();
  await expect(video).toHaveAttribute('poster', /cover.webp$/);
  expect(await video.evaluate(v=>v.paused)).toBe(true);
  await cover.getByRole('button',{name:'播放主视觉视频'}).click();
  await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(false);
  const box=await video.boundingBox();
  expect(box.width).toBeLessThanOrEqual(390);
  expect(Math.abs(box.width/box.height-16/9)).toBeLessThan(.01);
  await page.screenshot({path:'test-results/iqiyi-video-mobile.png'});
});
