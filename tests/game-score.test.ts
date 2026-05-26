import { describe, expect, it } from "vitest";
import { calculatePopularScore, isTargetMatched } from "@/lib/game-score";
import { mockGames } from "@/lib/mock-data";

describe("game scoring", () => {
  it("marks a watchlist item as matched when discount target is reached", () => {
    const game = mockGames.find((item) => item.slug === "cyberpunk-2077");

    expect(game).toBeTruthy();
    expect(
      isTargetMatched({
        id: "test",
        game: game!,
        targetDiscountPercent: 50
      })
    ).toBe(true);
  });

  it("assigns a higher score to games with stronger review signals", () => {
    const cyberpunk = mockGames.find((item) => item.slug === "cyberpunk-2077");
    const upcoming = mockGames.find((item) => item.slug === "hollow-knight-silksong");

    expect(cyberpunk).toBeTruthy();
    expect(upcoming).toBeTruthy();
    expect(calculatePopularScore(cyberpunk!)).toBeGreaterThan(calculatePopularScore(upcoming!));
  });
});
