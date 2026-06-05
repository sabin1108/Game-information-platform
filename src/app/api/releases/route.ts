import { NextResponse, type NextRequest } from "next/server";
import { getReleaseFeed } from "@/lib/game-feeds";
import { withApiMonitoring } from "@/lib/monitoring/api";
import { applyPublicApiRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

async function releasesHandler(request: NextRequest) {
  const rateLimited = applyPublicApiRateLimit(request, "/api/releases");

  if (rateLimited) {
    return rateLimited;
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "40");
  const tag = request.nextUrl.searchParams.get("tag") ?? undefined;
  const store = request.nextUrl.searchParams.get("store") ?? undefined;
  const country = request.nextUrl.searchParams.get("country") ?? "KR";

  const result = await getReleaseFeed({
    country,
    limit,
    tag,
    store
  });

  return NextResponse.json(
    {
      source: result.source,
      warning: result.warning,
      cache: {
        status: result.releaseCacheStatus,
        ttlSeconds: result.releaseCacheTtlSeconds
      },
      filters: result.releaseFilters,
      data: result.games
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Releases-Cache": result.releaseCacheStatus ?? "miss"
      }
    }
  );
}

export const GET = withApiMonitoring({ route: "/api/releases" }, releasesHandler);
