import "server-only";

import type { User } from "@supabase/supabase-js";
import { getDefaultDisplayName } from "@/lib/profile";
import { createAdminClient } from "./admin";
import type { createClient } from "./server";
import type { Database } from "./types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getOrCreateProfile(supabase: SupabaseServerClient, user: User) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (profile) {
    return profile;
  }

  const { data: createdProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: getDefaultDisplayName(user.email),
      preferred_country: "KR",
      preferred_currency: "KRW"
    })
    .select("*")
    .single();

  if (insertError) {
    const admin = createAdminClient();
    const { data: adminCreatedProfile, error: adminError } = await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          display_name: getDefaultDisplayName(user.email),
          preferred_country: "KR",
          preferred_currency: "KRW"
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (adminError) {
      throw new Error(adminError.message);
    }

    return adminCreatedProfile;
  }

  return createdProfile;
}
