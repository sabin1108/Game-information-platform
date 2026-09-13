"use server";

import { redirect } from "next/navigation";
import { getAuthPageHref, getSafeAuthRedirect } from "@/lib/auth-navigation";
import { env, isSupabaseConfigured, shouldSkipEmailConfirmationInDev } from "@/lib/env";
import { getDefaultDisplayName } from "@/lib/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function redirectWithSignupError(message: string, next: string): never {
  redirect(getAuthPageHref("/signup", next, { error: message }));
}

function getAuthErrorMessage(message: string) {
  if (message.toLowerCase().includes("email rate limit")) {
    return "이메일 발송 요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  }

  return message;
}

export async function signup(formData: FormData) {
  const redirectTo = getSafeAuthRedirect(formData.get("redirectTo"), "/app");
  if (!isSupabaseConfigured()) {
    redirect(redirectTo);
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = getDefaultDisplayName(email);

  if (!email || password.length < 8) {
    redirectWithSignupError("이메일과 8자 이상 비밀번호를 입력하세요.", redirectTo);
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
      redirectWithSignupError(createError.message, redirectTo);
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      redirectWithSignupError(getAuthErrorMessage(loginError.message), redirectTo);
    }

    redirect(redirectTo);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.appUrl}/auth/callback?${new URLSearchParams({ next: redirectTo })}`,
      data: {
        display_name: displayName
      }
    }
  });

  if (error) {
    redirectWithSignupError(getAuthErrorMessage(error.message), redirectTo);
  }

  if (!data.session) {
    redirect(getAuthPageHref("/login", redirectTo, { message: "이메일 확인 링크를 눌러 가입을 완료하세요." }));
  }

  redirect(redirectTo);
}
