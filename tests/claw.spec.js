import { test, expect } from '@playwright/test';
test('claw picks up a real source fragment, locks during movement, and resets', async ({page}) => {
  await page.goto('/work/vision-reconstructed');
  const experience = page.locator('.claw-experience');
  await experience.scrollIntoViewIfNeeded();
  await experience.getByRole('button', {name:'嘴唇拼贴',exact:true}).click();
  await expect(experience).toHaveAttribute('data-phase','grabbing');
  await expect(experience.getByRole('button',{name:'蓝色眼部',exact:true})).toBeDisabled();
  await expect(experience.locator('[data-held="mouth"]')).toHaveCount(1, {timeout:5000});
  await expect(experience.getByRole('status')).toContainText('已夹取嘴唇拼贴', {timeout:10000});
  await expect(experience.getByRole('status')).toContainText('(1 / 4)');
  await expect(experience.getByRole('button',{name:'嘴唇拼贴',exact:true})).toBeDisabled();
  await experience.getByRole('button',{name:'重新开始 ↻'}).click();
  await expect(experience.getByRole('status')).toContainText('(0 / 4)');
  await experience.getByRole('button',{name:'查看 PDF 原稿 ↗'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.lightbox-view img')).toHaveAttribute('src',/page-39.webp$/);
});
test('mobile reduced motion can collect all four original fragments and replay', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/work/vision-reconstructed');
  const experience=page.locator('.claw-experience');
  for(const name of ['嘴唇拼贴','蓝色眼部','耳部条纹','发型拼贴']) {
    await experience.getByRole('button',{name,exact:true}).click();
    await expect(experience).toHaveAttribute('data-phase','ready');
  }
  await expect(experience.getByRole('status')).toContainText('(4 / 4)');
  await expect(experience.getByRole('button',{name:'启动夹爪，随机抓取一块面部素材'})).toBeDisabled();
  await experience.getByRole('button',{name:'重新开始 ↻'}).click();
  await experience.getByRole('button',{name:'启动夹爪，随机抓取一块面部素材'}).press('Enter');
  await expect(experience.getByRole('status')).toContainText('(1 / 4)');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
