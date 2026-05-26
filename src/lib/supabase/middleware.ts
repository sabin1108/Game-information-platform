import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseFetch } from "./fetch";
import type { Database, TypedSupabaseClient } from "./types";

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient<Database>(env.supabaseUrl!, env.supabaseAnonKey!, {
    global: {
      fetch: createSupabaseFetch()
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  }) as unknown as TypedSupabaseClient;

  try {
    await supabase.auth.getUser();
  } catch {
    return response;
  }

  return response;
}
