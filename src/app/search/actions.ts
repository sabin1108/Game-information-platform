"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { addGameToWatchlist } from "@/lib/watchlist";
import { parseGameForWatchlist } from "@/lib/watchlist-serialization";

export async function addToWatchlist(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?message=Supabase%20설정%20후%20관심%20목록을%20사용할%20수%20있습니다.");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=로그인%20후%20관심%20목록에%20추가할%20수%20있습니다.");
  }

  const game = parseGameForWatchlist(formData.get("game"));
  const result = await addGameToWatchlist(supabase, user.id, game);
  const message =
    result.status === "exists"
      ? "이미 관심 목록에 있는 게임입니다."
      : "관심 목록에 추가했습니다.";

  revalidatePath("/app");
  revalidatePath("/search");
  redirect(`/app?message=${encodeURIComponent(message)}`);
}
