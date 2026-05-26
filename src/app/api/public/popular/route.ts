import { NextResponse } from "next/server";
import { isItadConfigured } from "@/lib/env";
import { getItadPopular } from "@/lib/itad";
import { mockGames } from "@/lib/mock-data";

export async function GET() {
  if (isItadConfigured()) {
    try {
      const data = await getItadPopular(12);

      return NextResponse.json({
        source: "itad",
        data
      });
    } catch (error) {
      return NextResponse.json({
        source: "mock",
        warning: error instanceof Error ? error.message : "ITAD request failed.",
        data: mockGames.slice(0, 12)
      });
    }
  }

  return NextResponse.json({
    source: "mock",
    data: mockGames.slice(0, 12)
  });
}
