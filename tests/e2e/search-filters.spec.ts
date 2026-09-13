import { expect, test } from "@playwright/test";

test("one title field submits all filters and filter removal preserves the title", async ({ page }) => {
  await page.goto("/search?q=hades");
  await expect(page.getByRole("searchbox")).toHaveCount(1);
  await page.getByLabel("태그·장르").selectOption("Action");
  await page.getByRole("combobox", { name: "스토어", exact: true }).selectOption("steam");
  await page.getByLabel("최대 가격 (원)").fill("30000");
  await page.getByRole("combobox", { name: "정렬", exact: true }).selectOption("price");
  await page.getByLabel("할인 중만 보기").check();
  await page.getByRole("button", { name: "게임 검색 실행" }).click();
  await expect(page.getByRole("link", { name: "스토어: Steam 제거" })).toBeVisible();
  const params = new URL(page.url()).searchParams;
  expect(Object.fromEntries(params)).toMatchObject({ q: "hades", tag: "Action", store: "steam", maxPrice: "30000", sort: "price", discounted: "1" });
  await page.getByRole("link", { name: "스토어: Steam 제거" }).click();
  await expect(page.getByRole("combobox", { name: "스토어", exact: true })).toHaveValue("");
  await expect(page.getByLabel("태그·장르")).toHaveValue("Action");
  await expect(page.getByLabel("최대 가격 (원)")).toHaveValue("30000");
  await page.goBack();
  await expect(page.getByRole("combobox", { name: "스토어", exact: true })).toHaveValue("steam");
  await page.getByRole("link", { name: "필터만 지우기", exact: true }).click();
  await expect(page).toHaveURL(/\/search\?q=hades$/);
  await expect(page.getByRole("searchbox")).toHaveValue("hades");
});

test("typing a title does not fetch or replace the result list", async ({ page }) => {
  await page.goto("/search?q=hades");
  await expect(page.locator('[data-search-results="true"]')).toBeVisible({ timeout: 15000 });
  const list = page.getByRole("region", { name: "검색 결과", exact: true });
  const before = await list.locator(".game-card").count();
  const searches: string[] = [];
  page.on("request", request => {
    const path = new URL(request.url()).pathname;
    if (path === "/search" || path === "/api/search") searches.push(request.url());
  });
  await page.getByRole("searchbox").fill("");
  await page.getByRole("searchbox").pressSequentially("different game title", { delay: 10 });
  expect(searches).toEqual([]);
  await expect(list.locator(".game-card")).toHaveCount(before);
  await expect(page).toHaveURL(/q=hades/);
});

test("tag-only browsing preserves canonical Korean aliases on native form submission", async ({ page }) => {
  await page.goto("/search?tag=" + encodeURIComponent("로그라이크"));
  await expect(page.getByLabel("태그·장르")).toHaveValue("Roguelike");
  await expect(page.getByRole("searchbox")).toHaveCount(1);
  await page.getByRole("searchbox").fill("hades");
  await page.getByRole("button", { name: "게임 검색 실행" }).click();
  await expect(page.getByRole("heading", { name: /hades.*검색 결과/ })).toBeVisible();
  await expect(page.getByLabel("태그·장르")).toHaveValue("Roguelike");

});