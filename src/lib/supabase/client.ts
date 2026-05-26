"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "@/lib/env";
import { createSupabaseFetch } from "./fetch";
import type { Database, TypedSupabaseClient } from "./types";

export function createClient(): TypedSupabaseClient {
  const { url, anonKey } = requireSupabaseEnv();

  return createBrowserClient<Database>(url, anonKey, {
    global: {
      fetch: createSupabaseFetch()
    }
  }) as unknown as TypedSupabaseClient;
}
