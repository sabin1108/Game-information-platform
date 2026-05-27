"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { updateWatchlistTarget } from "@/lib/watchlist";

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export async function updateWatchlistTargetAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(`/login?message=${encodeURIComponent("목표 조건 저장은 Supabase 설정 후 사용할 수 있습니다.")}`);
  }

  const itemId = formData.get("itemId");

  if (typeof itemId !== "string" || !itemId) {
    redirect(`/app?error=${encodeURIComponent("관심 목록 항목을 찾을 수 없습니다.")}`);
  }

  const targetPrice = parseOptionalNumber(formData.get("targetPrice"));
  const targetDiscount = parseOptionalNumber(formData.get("targetDiscount"));
  const note = typeof formData.get("note") === "string" ? String(formData.get("note")) : null;

  if (targetPrice !== null && targetPrice < 0) {
    redirect(`/app?error=${encodeURIComponent("목표가는 0원 이상이어야 합니다.")}`);
  }

  if (targetDiscount !== null && (targetDiscount < 0 || targetDiscount > 100)) {
    redirect(`/app?error=${encodeURIComponent("목표 할인율은 0%부터 100%까지 입력할 수 있습니다.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?message=${encodeURIComponent("목표 조건을 저장하려면 로그인하세요.")}`);
  }

  await updateWatchlistTarget(supabase, user.id, itemId, {
    targetPriceCents: targetPrice === null ? null : Math.round(targetPrice * 100),
    targetDiscountPercent: targetDiscount === null ? null : Math.floor(targetDiscount),
    note
  });

  revalidatePath("/app");
  redirect(`/app?message=${encodeURIComponent("목표 조건을 저장했습니다.")}`);
}
