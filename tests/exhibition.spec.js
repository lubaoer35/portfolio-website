import { test, expect } from "@playwright/test";
test("first opening can be skipped, selected works and ending match exhibition direction", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /SKIP INTRO/ }).click();
  await expect(page.locator(".opening-intro")).toHaveCount(0);
  await expect(page.locator(".portfolio-title>img").first()).toHaveCSS(
    "opacity",
    "1",
  );
  await page.reload();
  await expect(page.locator(".opening-intro")).toHaveCount(0);
  await expect(page.locator(".project-card").first()).toHaveAttribute(
    "href",
    "/work/vision-reconstructed",
  );
  await expect(page.locator(".project-card").nth(1)).toHaveAttribute(
    "href",
    "/work/iqiyi-vision",
  );
  await expect(page.locator("footer h2")).toContainText("SOMETHING NEW.");
  await expect(page.getByRole("link", { name: "CONTACT ME" })).toHaveAttribute(
    "href",
    "mailto:3334648895@qq.com",
  );
});
test("administrator module dragging snaps to eight pixels and can be undone", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:5181/");
  await page.getByRole("button", { name: "打开管理员编辑台" }).click();
  const handle = page.getByRole("button", {
    name: "拖动首屏信息模块（8px网格）",
  });
  await handle.scrollIntoViewIfNeeded();
  const box = await handle.boundingBox();
  await page.mouse.move(box.x + 20, box.y + 12);
  await page.mouse.down();
  await page.mouse.move(box.x + 103, box.y + 37, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(".draggable-module").first()).toHaveCSS(
    "translate",
    "80px 24px",
  );
  await page.getByRole("button", { name: /撤销最近操作/ }).click();
  await expect(page.locator(".draggable-module").first()).not.toHaveCSS(
    "translate",
    "80px 24px",
  );
});
test("authenticated backend persists drafts across independent browser sessions and separates queued deployment from verified publication", async ({
  browser,
}) => {
  const a = await browser.newContext();
  const page = await a.newPage();
  const login = async (p) => {
    await p.goto("http://127.0.0.1:5182/");
    await p.getByLabel("管理员账号").fill("test-admin");
    await p
      .getByLabel("密码", { exact: true })
      .fill("browser-test-password-only");
    await p.getByRole("button", { name: "登录后台", exact: true }).click();
    await p.getByRole("button", { name: "打开管理员编辑台" }).click();
  };
  await login(page);
  const panel = page.getByRole("complementary", { name: "管理员编辑台" });
  await panel.getByLabel("姓名", { exact: true }).fill("跨设备草稿");
  await panel.getByLabel("姓名", { exact: true }).press("Tab");
  await panel.getByRole("button", { name: "SAVE", exact: true }).click();
  await expect(panel.locator(".editor-status")).toContainText(/后台/);
  await page.waitForTimeout(800);
  const b = await browser.newContext();
  const other = await b.newPage();
  await other.goto("http://127.0.0.1:5182/");
  await expect(
    other.getByRole("button", { name: "打开管理员编辑台" }),
  ).toHaveCount(0);
  await login(other);
  const remotePanel = other.getByRole("complementary", {
    name: "管理员编辑台",
  });
  await expect(remotePanel.getByLabel("姓名", { exact: true })).toHaveValue(
    "跨设备草稿",
  );
  await remotePanel
    .getByRole("button", { name: "PUBLISH", exact: true })
    .click();
  await other.getByRole("button", { name: "确认提交并部署" }).click();
  await expect(other.getByRole("dialog")).toContainText("queued");
  await other.getByRole("button", { name: "检查部署结果" }).click();
  await expect(other.getByRole("dialog")).toContainText("running");
  await expect(
    other.getByRole("link", { name: "打开已验证的网站" }),
  ).toHaveCount(0);
  await a.close();
  await b.close();
});
