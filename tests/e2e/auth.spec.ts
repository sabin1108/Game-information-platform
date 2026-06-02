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
    throw new Error("Supabase admin env is required for auth E2E tests.");
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

async function expectProfileForUser(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();

  expect(error).toBeNull();
  expect(data?.id).toBe(userId);
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

test("signup creates Supabase auth user and profile row", async ({ page }) => {
  const email = `e2e-signup-${randomUUID()}@example.com`;
  const password = "Passw0rd!2345";

  await deleteUserByEmail(email);

  await page.goto("/signup");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "회원가입" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "관심 게임" })).toBeVisible();

  const user = await findUserByEmail(email);
  expect(user).not.toBeNull();
  await expectProfileForUser(user!.id);

  await deleteUserByEmail(email);
});

test("protected app requires login, allows login, and blocks access after logout", async ({ page }) => {
  const email = `e2e-login-${randomUUID()}@example.com`;
  const password = "Passw0rd!2345";

  await deleteUserByEmail(email);
  const user = await createConfirmedUser(email, password);

  await page.goto("/app");
  await expect(page).toHaveURL(/\/login\?next=\/app$/);
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();

  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "관심 게임" })).toBeVisible();
  await expectProfileForUser(user.id);

  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/login\?message=/);
  await expect(page.getByRole("status")).toContainText("로그아웃했습니다");

  await page.goto("/app");
  await expect(page).toHaveURL(/\/login\?next=\/app$/);
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();

  await deleteUserByEmail(email);
});

test("direct login returns home with authenticated nav actions", async ({ page }) => {
  const email = `e2e-home-nav-${randomUUID()}@example.com`;
  const password = "Passw0rd!2345";

  await deleteUserByEmail(email);
  await createConfirmedUser(email, password);

  await page.goto("/login");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: /프로필/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
  await expect(page.getByRole("link", { name: "로그인" })).toHaveCount(0);
  await page.getByRole("button", { name: "관심 목록에 추가" }).first().click();

  await expect(page).toHaveURL(/\/app\?message=/);
  await expect(page.getByRole("status")).toContainText("관심 목록에 추가");

  await page.goto("/deals");
  await expect(page.getByRole("link", { name: /프로필/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
  await expect(page.getByRole("link", { name: "로그인 후 찜하기" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "관심 목록에 추가" }).first()).toBeVisible();

  await deleteUserByEmail(email);
});

test("failed login shows clear auth error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("이메일").fill(`missing-${randomUUID()}@example.com`);
  await page.getByLabel("비밀번호").fill("wrong-password");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/login\?error=/);
  await expect(page.locator(".auth-card [role='alert']")).toBeVisible();
});
