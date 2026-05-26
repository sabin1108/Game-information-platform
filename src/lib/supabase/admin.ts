import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAdminEnv } from "@/lib/env";
import { createSupabaseFetch } from "./fetch";
import type { Database, TypedSupabaseClient } from "./types";

export function createAdminClient(): TypedSupabaseClient {
  const { url, serviceRoleKey } = requireSupabaseAdminEnv();

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: createSupabaseFetch()
    }
  }) as unknown as TypedSupabaseClient;
}
