"use server";

import { redirect } from "next/navigation";
import { env, isSupabaseConfigured, shouldSkipEmailConfirmationInDev } from "@/lib/env";
import { getDefaultDisplayName } from "@/lib/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function redirectWithSignupError(message: string): never {
  redirect(`/signup?error=${encodeURIComponent(message)}`);
}

function getAuthErrorMessage(message: string) {
  if (message.toLowerCase().includes("email rate limit")) {
    return "Supabase 이메일 발송 한도에 걸렸습니다. 잠시 기다리거나 개발 모드 이메일 확인 우회를 사용하세요.";
  }

  return message;
}

export async function signup(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/app");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = getDefaultDisplayName(email);

  if (!email || password.length < 8) {
    redirect("/signup?error=%EC%9D%B4%EB%A9%94%EC%9D%BC%EA%B3%BC%208%EC%9E%90%20%EC%9D%B4%EC%83%81%20%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8%EB%A5%BC%20%EC%9E%85%EB%A0%A5%ED%95%98%EC%84%B8%EC%9A%94.");
  }

  const supabase = await createClient();

  if (shouldSkipEmailConfirmationInDev()) {
    const admin = createAdminClient();
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName
      }
    });

    if (createError && !createError.message.toLowerCase().includes("already")) {
      redirectWithSignupError(createError.message);
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      redirectWithSignupError(getAuthErrorMessage(loginError.message));
    }

    redirect("/app");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.appUrl}/auth/callback`,
      data: {
        display_name: displayName
      }
    }
  });

  if (error) {
    redirectWithSignupError(getAuthErrorMessage(error.message));
  }

  if (!data.session) {
    redirect("/login?message=%EC%9D%B4%EB%A9%94%EC%9D%BC%20%ED%99%95%EC%9D%B8%20%EB%A7%81%ED%81%AC%EB%A5%BC%20%EB%88%8C%EB%9F%AC%20%EA%B0%80%EC%9E%85%EC%9D%84%20%EC%99%84%EB%A3%8C%ED%95%98%EC%84%B8%EC%9A%94.");
  }

  redirect("/app");
}
