import { NextResponse } from "next/server";
import { mockGames } from "@/lib/mock-data";

export async function GET() {
  const deals = mockGames.filter((game) => game.prices.some((price) => price.discountPercent > 0));

  return NextResponse.json({
    source: "mock",
    data: deals
  });
}
