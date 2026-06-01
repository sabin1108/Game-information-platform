import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import type { Database } from "@/lib/supabase/types";

type TestUser = {
  id: string;
  email: string;
};

function readEnvFile() {
  try {
    return readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  } catch {
    return "";
  }
}

function getEnv(name: string) {
  if (process.env[name]) {
    return process.env[name];
  }

  const match = readEnvFile().match(new RegExp(`^${name}=(.*)$`, "m"));

  return match?.[1]?.trim();
}

function createAdminClient() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin env is required for watchlist E2E tests.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function findUserByEmail(email: string): Promise<TestUser | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (error) {
    throw error;
  }

  const user = data.users.find((item) => item.email === email);

  return user?.email ? { id: user.id, email: user.email } : null;
}

async function deleteUserByEmail(email: string) {
  const admin = createAdminClient();
  const user = await findUserByEmail(email);

  if (user) {
    await admin.auth.admin.deleteUser(user.id);
  }
}

async function createConfirmedUser(email: string, password: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: email.split("@")[0]
    }
  });

  if (error) {
    throw error;
  }

  return data.user;
}

async function expectSingleWatchlistRow(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("watchlist_items")
    .select("id,user_id,game_id,target_price_cents,target_discount_percent", { count: "exact" })
    .eq("user_id", userId);

  expect(error).toBeNull();
  expect(data).toHaveLength(1);

  return data![0];
}

test("deal filters can be applied and a discounted game can be added once, targeted, and matched", async ({ page }) => {
  const email = `e2e-watchlist-${randomUUID()}@example.com`;
  const password = "Passw0rd!2345";

  await deleteUserByEmail(email);
  const user = await createConfirmedUser(email, password);

  await page.goto("/login?next=/app");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/deals");
  await page.getByLabel("스토어 필터").selectOption("steam");
  await page.getByLabel("최소 할인율").fill("20");
  await page.getByLabel("최대 가격").fill("30000");
  await page.getByLabel("할인 정렬").selectOption("reviews");
  await page.getByRole("button", { name: "필터 적용" }).click();

  await expect(page).toHaveURL(/\/deals\?store=steam&minDiscount=20&maxPrice=30000&sort=reviews/);

  const dealCard = page.getByRole("article").first();
  await expect(dealCard).toBeVisible();
  const dealTitle = await dealCard.getByRole("heading", { level: 3 }).innerText();
  await expect(dealCard.getByText("Steam").first()).toBeVisible();
  await dealCard.getByRole("button", { name: "관심 목록에 추가" }).click();

  await expect(page).toHaveURL(/\/app\?message=/);
  await expect(page.getByRole("status")).toContainText("관심 목록에 추가했습니다");
  await expect(page.getByRole("heading", { name: "관심 게임" })).toBeVisible();
  await expect(page.getByRole("article").filter({ hasText: dealTitle }).first()).toBeVisible();
  await expect(page.getByText("Steam").first()).toBeVisible();
  await expectSingleWatchlistRow(user.id);

  await page.getByLabel(`${dealTitle} 목표 할인율`).fill("20");
  await page.getByRole("button", { name: "목표 저장" }).click();

  await expect(page).toHaveURL(/\/app\?message=/);
  await expect(page.getByRole("status")).toContainText("목표 조건을 저장했습니다");
  await expect(page.getByText("조건 충족").first()).toBeVisible();

  const row = await expectSingleWatchlistRow(user.id);
  expect(row.target_discount_percent).toBe(20);

  await page.goto("/deals?store=steam&minDiscount=20&maxPrice=30000&sort=reviews");
  const duplicateDealCard = page.getByRole("article").filter({ hasText: dealTitle }).first();
  await expect(duplicateDealCard).toBeVisible();
  await duplicateDealCard.getByRole("button", { name: "관심 목록에 추가" }).click();

  await expect(page).toHaveURL(/\/app\?message=/);
  await expect(page.getByRole("status")).toContainText("이미 관심 목록");
  await expectSingleWatchlistRow(user.id);

  await deleteUserByEmail(email);
});
