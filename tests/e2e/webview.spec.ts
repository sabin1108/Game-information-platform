import { expect, test } from "@playwright/test";

test.describe("mobile webview", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile webview project only");

  test("safe area tabs and primary screens fit mobile viewport", async ({ page }) => {
    for (const path of ["/search?webview=1&q=ring", "/deals?webview=1", "/app?webview=1"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const tabs = page.getByLabel("모바일 하단 메뉴");
      await expect(tabs).toBeVisible();

      const tabsBox = await tabs.boundingBox();
      const viewport = page.viewportSize();
      expect(tabsBox).not.toBeNull();
      expect(viewport).not.toBeNull();
      expect(tabsBox!.x).toBeGreaterThanOrEqual(0);
      expect(tabsBox!.y + tabsBox!.height).toBeLessThanOrEqual(viewport!.height + 1);

      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(horizontalOverflow).toBeLessThanOrEqual(1);

      const firstCard = page.getByRole("article").first();
      if ((await firstCard.count()) > 0) {
        await expect(firstCard).toBeVisible();
        const cardBox = await firstCard.boundingBox();
        expect(cardBox!.x).toBeGreaterThanOrEqual(0);
        expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(viewport!.width + 1);
      }
    }
  });

  test("store link sends bridge payload and keeps href fallback", async ({ page }) => {
    await page.goto("/deals?webview=1");
    await page.waitForLoadState("networkidle");

    const storeLink = page.locator("[data-bridge-event='gdw.store.open']").first();
    await expect(storeLink).toBeVisible();
    const href = await storeLink.getAttribute("href");
    expect(href).toBeTruthy();

    await page.addInitScript(() => {
      window.ReactNativeWebView = {
        postMessage(message: string) {
          window.localStorage.setItem("lastBridgeMessage", message);
        }
      };
    });

    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator("[data-bridge-event='gdw.store.open']").first().click();

    const message = await page.evaluate(() => window.localStorage.getItem("lastBridgeMessage"));
    expect(message).toBeTruthy();

    const parsed = JSON.parse(message!);
    expect(parsed.type).toBe("gdw.store.open");
    expect(parsed.payload.url).toBeTruthy();
    expect(["steam", "epic", "itad"]).toContain(parsed.payload.store);
  });
});
