import { NextResponse, type NextRequest } from "next/server";
import { getPopularFeed } from "@/lib/game-feeds";
import { mockGames } from "@/lib/mock-data";
import { withApiMonitoring } from "@/lib/monitoring/api";
import { applyPublicApiRateLimit } from "@/lib/rate-limit";
import type { GameSummary } from "@/types/game";

function clamp(value: number, fallback: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(value)));
}

async function popularHandler(request: NextRequest) {
  const rateLimited = applyPublicApiRateLimit(request, "/api/public/popular");

  if (rateLimited) {
    return rateLimited;
  }

  const offset = clamp(Number(request.nextUrl.searchParams.get("offset") ?? "0"), 0, 0, 500);
  const limit = clamp(Number(request.nextUrl.searchParams.get("limit") ?? "24"), 24, 1, 48);
  const tag = request.nextUrl.searchParams.get("tag")?.trim().toLowerCase();
  const store = request.nextUrl.searchParams.get("store")?.trim().toLowerCase();
  const applyFilters = (games: GameSummary[]) =>
    games.filter((game) => {
      const tagMatches = !tag || game.tags.some((item) => item.toLowerCase().includes(tag));
      const storeMatches = !store || game.prices.some((price) => price.store === store);

      return tagMatches && storeMatches;
    });

  const feed = await getPopularFeed(offset + limit);
  const data = applyFilters(feed.games.length ? feed.games : mockGames);

  return NextResponse.json({
    source: feed.source,
    warning: feed.warning,
    cache: {
      status: feed.popularCacheStatus ?? "miss",
      ttlSeconds: feed.popularCacheTtlSeconds
    },
    data: data.slice(offset, offset + limit),
    nextOffset: offset + limit,
    hasMore: data.length > offset + limit
  }, {
    headers: {
      "X-Cache": feed.popularCacheStatus ?? "miss"
    }
  });
}

export const GET = withApiMonitoring({ route: "/api/public/popular" }, popularHandler);
