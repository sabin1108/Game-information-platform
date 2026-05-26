import { NextResponse, type NextRequest } from "next/server";
import { searchMockGames } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  return NextResponse.json({
    source: "mock",
    query,
    data: searchMockGames(query)
  });
}
