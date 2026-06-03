import { NextResponse, type NextRequest } from "next/server";
import { withApiMonitoring } from "@/lib/monitoring/api";
import { searchGames } from "@/lib/search";

export const dynamic = "force-dynamic";

async function searchHandler(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const country = request.nextUrl.searchParams.get("country") ?? "KR";
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "40");
  const tag = request.nextUrl.searchParams.get("tag") ?? undefined;
  const store = request.nextUrl.searchParams.get("store") ?? undefined;
  const result = await searchGames(query, { country, limit, tag, store });

  return NextResponse.json(
    {
      source: result.source,
      query: result.query,
      normalized: result.normalized,
      filters: {
        tag: tag ?? "",
        store: store ?? ""
      },
      cache: result.cache,
      warning: result.warning,
      data: result.games
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Search-Cache": result.cache.status
      }
    }
  );
}

export const GET = withApiMonitoring({ route: "/api/search" }, searchHandler);
