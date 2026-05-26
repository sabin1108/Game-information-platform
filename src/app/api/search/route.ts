import { NextResponse, type NextRequest } from "next/server";
import { isItadConfigured } from "@/lib/env";
import { searchItadGames } from "@/lib/itad";
import { searchMockGames } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  if (query.trim() && isItadConfigured()) {
    try {
      const data = await searchItadGames(query.trim());

      return NextResponse.json({
        source: "itad",
        query,
        data
      });
    } catch (error) {
      return NextResponse.json({
        source: "mock",
        query,
        warning: error instanceof Error ? error.message : "ITAD request failed.",
        data: searchMockGames(query)
      });
    }
  }

  return NextResponse.json({
    source: "mock",
    query,
    data: searchMockGames(query)
  });
}
