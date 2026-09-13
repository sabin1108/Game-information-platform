"use server";

import { redirect } from "next/navigation";
import { getAuthPageHref, getSafeAuthRedirect } from "@/lib/auth-navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const redirectTo = getSafeAuthRedirect(formData.get("redirectTo"));

  if (!isSupabaseConfigured()) {
    redirect(redirectTo === "/" ? "/app" : redirectTo);
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(getAuthPageHref("/login", redirectTo, { error: "이메일과 비밀번호를 입력하세요." }));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(getAuthPageHref("/login", redirectTo, { error: error.message }));
  }

  redirect(redirectTo);
}
