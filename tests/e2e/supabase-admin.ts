import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { expect } from "@playwright/test";
import type { Database } from "@/lib/supabase/types";

export type TestUser = {
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

export function createAdminClient() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin env is required for E2E tests.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function findUserByEmail(email: string): Promise<TestUser | null> {
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

export async function deleteUserByEmail(email: string) {
  const admin = createAdminClient();
  const user = await findUserByEmail(email);

  if (user) {
    await admin.auth.admin.deleteUser(user.id);
  }
}

export async function createConfirmedUser(email: string, password: string) {
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

export async function expectProfileForUser(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();

  expect(error).toBeNull();
  expect(data?.id).toBe(userId);
}

export async function expectSingleWatchlistRow(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("watchlist_items")
    .select("id,user_id,game_id,target_price_cents,target_discount_percent", { count: "exact" })
    .eq("user_id", userId);

  expect(error).toBeNull();
  expect(data).toHaveLength(1);

  return data![0];
}
