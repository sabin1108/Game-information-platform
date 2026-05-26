import { NextResponse } from "next/server";
import { mockGames } from "@/lib/mock-data";

export async function GET() {
  const releases = mockGames.filter(
    (game) => game.releaseStatus === "upcoming" || game.releaseDate?.startsWith("2024")
  );

  return NextResponse.json({
    source: "mock",
    data: releases
  });
}
