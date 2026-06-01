"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { parseProfileFormData } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?next=/app/profile");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?next=/app/profile");
  }

  let profileInput;

  try {
    profileInput = parseProfileFormData(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "프로필 값을 확인하세요.";
    redirect(`/app/profile?error=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: profileInput.displayName,
      preferred_country: profileInput.preferredCountry,
      preferred_currency: profileInput.preferredCurrency
    },
    { onConflict: "id" }
  );

  if (error) {
    redirect(`/app/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app");
  revalidatePath("/app/profile");
  redirect("/app/profile?message=%ED%94%84%EB%A1%9C%ED%95%84%EC%9D%84%20%EC%A0%80%EC%9E%A5%ED%96%88%EC%8A%B5%EB%8B%88%EB%8B%A4.");
}
