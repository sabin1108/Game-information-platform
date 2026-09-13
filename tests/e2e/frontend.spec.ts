import { expect, test } from "@playwright/test";

test("search submits with a visible button and preserves query after navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "게임 검색", exact: true }).fill("hades");
  await page.getByRole("button", { name: "게임 검색 실행" }).click();
  await expect(page).toHaveURL(/q=hades/);
  await expect(page.getByRole("searchbox", { name: "게임 검색", exact: true })).toHaveValue("hades");
  await expect(page.getByRole("heading", { name: /hades.*검색 결과/ })).toBeVisible();
});

test("empty search offers recovery and clears filters", async ({ page }) => {
  await page.goto("/search?q=zzzz-no-such-game-918272&store=steam");
  await expect(page.getByRole("heading", { name: "검색 결과가 없어요" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("link", { name: "초기화", exact: true }).click();
  await expect(page).toHaveURL(/\/search$/);
});

test("password visibility toggle preserves the entered value", async ({ page }) => {
  await page.goto("/signup");
  const password = page.getByLabel("비밀번호", { exact: true });
  await password.fill("Test-password-123");
  await page.getByRole("button", { name: "비밀번호 표시", exact: true }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("Test-password-123");
  await page.getByRole("button", { name: "비밀번호 숨기기", exact: true }).click();
  await expect(password).toHaveAttribute("type", "password");
});

test("keyboard skip link moves focus into main content", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#main-content")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "본문으로 바로가기" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("primary routes fit narrow screens and show active navigation", async ({ page }) => {
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/deals", "/search?q=hades", "/login"]) {
      await page.goto(path);
      await expect(page.locator("#main-content")).toBeVisible();
      if (width <= 900 && path !== "/login") {
        await expect(page.locator(".bottom-tabs [aria-current=page]")).toHaveCount(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
  }
});

test("404 gives a working route back home", async ({ page }) => {
  await page.goto("/this-page-does-not-exist-ux");
  await expect(page.getByRole("heading", { name: "이 페이지를 찾을 수 없어요" })).toBeVisible();
  await page.getByRole("link", { name: "홈으로", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});


test("auth screens omit discovery navigation and preserve the return destination", async ({ page }) => {
  const next = "/search?q=hades&store=steam";
  await page.goto("/login?next=" + encodeURIComponent(next));
  await expect(page.getByRole("heading", { name: "로그인", exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "모바일 하단 메뉴" })).toHaveCount(0);
  await expect(page.locator('input[name="redirectTo"]')).toHaveValue(next);
  const signup = page.getByRole("link", { name: "이메일로 회원가입" });
  expect((await signup.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await signup.click();
  await expect(page.getByRole("heading", { name: "회원가입", exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("next")).toBe(next);
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "모바일 하단 메뉴" })).toHaveCount(0);
  await expect(page.locator('input[name="redirectTo"]')).toHaveValue(next);
  await page.getByRole("link", { name: "로그인으로 돌아가기" }).click();
  await expect(page.getByRole("heading", { name: "로그인", exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("next")).toBe(next);
  await page.getByRole("link", { name: "홈으로", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  // Home streams its loading state while live game data is fetched.
  await expect(page.getByRole("searchbox", { name: "게임 검색", exact: true })).toBeVisible({ timeout: 15000 });
});
