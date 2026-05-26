import { NextResponse } from "next/server";
import { isItadConfigured } from "@/lib/env";
import { getItadDeals } from "@/lib/itad";
import { mockGames } from "@/lib/mock-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country") ?? "KR";
  const minDiscountValue = url.searchParams.get("minDiscount");
  const minDiscount = minDiscountValue ? Number(minDiscountValue) : undefined;

  if (isItadConfigured()) {
    try {
      const data = await getItadDeals({
        country,
        minDiscount: Number.isFinite(minDiscount) ? minDiscount : undefined
      });

      return NextResponse.json({
        source: "itad",
        data
      });
    } catch (error) {
      const deals = mockGames.filter((game) =>
        game.prices.some((price) => price.discountPercent > 0)
      );

      return NextResponse.json({
        source: "mock",
        warning: error instanceof Error ? error.message : "ITAD request failed.",
        data: deals
      });
    }
  }

  const deals = mockGames.filter((game) => game.prices.some((price) => price.discountPercent > 0));

  return NextResponse.json({
    source: "mock",
    data: deals
  });
}
