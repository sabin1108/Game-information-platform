import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type NavAuthState = {
  isAuthenticated: boolean;
  demoMode: boolean;
};

export async function getNavAuthState(): Promise<NavAuthState> {
  if (!isSupabaseConfigured()) {
    return {
      isAuthenticated: false,
      demoMode: true
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Nav auth timed out.")), 1500))
    ]);

    return {
      isAuthenticated: Boolean(user),
      demoMode: false
    };
  } catch {
    return {
      isAuthenticated: false,
      demoMode: false
    };
  }
}
