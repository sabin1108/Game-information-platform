"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type LoginRedirectPath = "/" | "/app" | "/app/profile" | "/deals" | "/releases" | "/search";

function getSafeRedirectPath(value: FormDataEntryValue | null): LoginRedirectPath {
  const path = String(value ?? "").trim();

  if (
    path === "/app" ||
    path === "/app/profile" ||
    path === "/deals" ||
    path === "/releases" ||
    path === "/search"
  ) {
    return path;
  }

  return "/";
}

export async function login(formData: FormData) {
  const redirectTo = getSafeRedirectPath(formData.get("redirectTo"));

  if (!isSupabaseConfigured()) {
    redirect(redirectTo === "/" ? "/app" : redirectTo);
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=%EC%9D%B4%EB%A9%94%EC%9D%BC%EA%B3%BC%20%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8%EB%A5%BC%20%EC%9E%85%EB%A0%A5%ED%95%98%EC%84%B8%EC%9A%94.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(redirectTo);
}
