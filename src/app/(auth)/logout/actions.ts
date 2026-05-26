"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login?message=%EB%A1%9C%EA%B7%B8%EC%95%84%EC%9B%83%EB%90%98%EC%97%88%EC%8A%B5%EB%8B%88%EB%8B%A4.");
}
