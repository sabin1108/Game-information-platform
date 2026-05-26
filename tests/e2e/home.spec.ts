import { expect, test } from "@playwright/test";

test("public home shows popular game feed", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "리뷰가 검증한 할인 게임" })).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
});

test("mobile webview viewport can open dashboard demo", async ({ page }) => {
  await page.goto("/app?webview=1");
  await expect(page.getByRole("heading", { name: "내 관심 게임" })).toBeVisible();

  const bottomTabs = page.getByLabel("모바일 하단 메뉴");
  const viewport = page.viewportSize();

  if ((viewport?.width ?? 0) <= 900) {
    await expect(bottomTabs).toBeVisible();
  } else {
    await expect(bottomTabs).toBeHidden();
  }
});
