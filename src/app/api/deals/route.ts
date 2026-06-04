import { NextResponse, type NextRequest } from "next/server";
import { getDealFeed } from "@/lib/game-feeds";
import { withApiMonitoring } from "@/lib/monitoring/api";

export const dynamic = "force-dynamic";

async function dealsHandler(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country") ?? "KR";
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? "0");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "40");
  const minDiscount = Number(request.nextUrl.searchParams.get("minDiscount") ?? "1");
  const maxPrice = Number(request.nextUrl.searchParams.get("maxPrice") ?? "");
  const store = request.nextUrl.searchParams.get("store") ?? undefined;
  const tag = request.nextUrl.searchParams.get("tag") ?? undefined;
  const sort = request.nextUrl.searchParams.get("sort") ?? undefined;

  const result = await getDealFeed({
    country,
    offset: Number.isFinite(offset) ? offset : 0,
    limit,
    minDiscount,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    store,
    tag,
    sort
  });

  return NextResponse.json(
    {
      source: result.source,
      warning: result.warning,
      cache: {
        status: result.dealCacheStatus,
        ttlSeconds: result.dealCacheTtlSeconds
      },
      filters: result.filters,
      data: result.games,
      nextOffset: result.nextOffset,
      hasMore: result.hasMore,
      tagOptions: result.tagOptions ?? []
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Deals-Cache": result.dealCacheStatus ?? "miss"
      }
    }
  );
}

export const GET = withApiMonitoring({ route: "/api/deals" }, dealsHandler);
