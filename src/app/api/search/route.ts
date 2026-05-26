import { NextResponse, type NextRequest } from "next/server";
import { searchGames } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const country = request.nextUrl.searchParams.get("country") ?? "KR";
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const result = await searchGames(query, { country, limit });

  return NextResponse.json(
    {
      source: result.source,
      query: result.query,
      normalized: result.normalized,
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
