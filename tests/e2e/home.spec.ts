import { expect, test } from "@playwright/test";

test("public home shows a larger popular game feed @smoke", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "지금 살만한 게임 할인" })).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
  expect(await page.getByRole("article").count()).toBeGreaterThan(5);
});

test("mobile webview viewport can open dashboard demo @smoke", async ({ page }) => {
  await page.goto("/app?webview=1");
  await expect(page.getByRole("heading", { name: /로그인|관심 게임/ })).toBeVisible();

  const bottomTabs = page.getByLabel("모바일 하단 메뉴");
  const viewport = page.viewportSize();

  if ((viewport?.width ?? 0) <= 900) {
    await expect(bottomTabs).toBeVisible();
  } else {
    await expect(bottomTabs).toBeHidden();
  }
});
