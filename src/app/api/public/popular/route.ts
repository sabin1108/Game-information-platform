import { NextResponse } from "next/server";
import { mockGames } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    source: "mock",
    data: mockGames.slice(0, 12)
  });
}
