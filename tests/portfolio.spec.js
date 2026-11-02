import { test, expect } from "@playwright/test";
test("real projects, working filters and isolated public browsing", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/work");
  await expect(page.locator(".project-card")).toHaveCount(8);
  await page.getByRole("button", { name: /^UI \/ UX/ }).click();
  await expect(page.locator(".project-card")).toHaveCount(2);
  await page.getByRole("button", { name: /^OTHER/ }).click();
  await expect(page.locator(".project-card")).toHaveCount(1);
  await page.locator(".project-card").click();
  await expect(page.locator(".gallery-image")).toHaveCount(4);
  await page.locator(".gallery-image").first().click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await page.goto("/?editor=true");
  await expect(
    page.getByRole("button", { name: "打开管理员编辑台" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("mobile and reduced motion preserve content and navigation", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5180/");
  await expect(page.locator(".custom-cursor")).toHaveCount(0);
  await expect(page.locator(".lettering-slice")).toHaveCount(0);
  await expect(page.locator(".portfolio-title>img")).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "打开菜单" }).click();
  await page.getByRole("link", { name: /About/ }).click();
  await expect(page.locator(".timeline-section li")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await context.close();
});
test("administrator draft survives reload, cancels correctly and exports honestly", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:5181/");
  await page.getByRole("button", { name: "打开管理员编辑台" }).click();
  const panel = page.getByRole("complementary", { name: "管理员编辑台" });
  const name = panel.getByLabel("姓名", { exact: true });
  await name.fill("测试草稿");
  await name.press("Tab");
  await panel.getByRole("button", { name: "SAVE", exact: true }).click();
  await expect(panel.locator(".editor-status")).toContainText(/保存|SAVE/);
  await page.reload();
  await page.getByRole("button", { name: "打开管理员编辑台" }).click();
  await expect(name).toHaveValue("测试草稿");
  await name.fill("取消此修改");
  await name.press("Tab");
  await panel.getByRole("button", { name: "CANCEL", exact: true }).click();
  await expect(name).toHaveValue("测试草稿");
  await panel.getByRole("button", { name: "PUBLISH", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "导出发布包" });
  await expect(dialog).toContainText("不会自动发布到公网");
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "确认导出发布包" }).click();
  expect((await download).suggestedFilename()).toBe("lv-bao-er-release.json");
  await expect(dialog).toContainText("线上网站尚未更新");
});
