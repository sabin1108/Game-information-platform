import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { captureAnalyticsEvent } from "@/lib/analytics/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { addGameToWatchlist } from "@/lib/watchlist";
import { parseGameForWatchlist } from "@/lib/watchlist-serialization";

function getResultMessage(status: Awaited<ReturnType<typeof addGameToWatchlist>>["status"]) {
  if (status === "exists") {
    return "이미 관심 목록에 있는 게임입니다.";
  }

  if (status === "restored") {
    return "관심 목록에 다시 추가했습니다.";
  }

  return "관심 목록에 추가되었습니다.";
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { message: "관심 목록은 Supabase 설정 후 사용할 수 있습니다." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "관심 목록에 추가하려면 로그인하세요." }, { status: 401 });
  }

  let game;

  try {
    const formData = await request.formData();
    game = parseGameForWatchlist(formData.get("game"));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "잘못된 관심 목록 요청입니다." },
      { status: 400 }
    );
  }

  const result = await addGameToWatchlist(supabase, user.id, game);

  await captureAnalyticsEvent({
    event: ANALYTICS_EVENTS.watchlistAdd,
    distinctId: user.id,
    properties: {
      game_id: game.id,
      game_title: game.title,
      status: result.status === "exists" ? "exists" : result.status === "restored" ? "restored" : "added"
    }
  });

  revalidatePath("/app");

  return NextResponse.json({
    status: result.status,
    message: getResultMessage(result.status)
  });
}
