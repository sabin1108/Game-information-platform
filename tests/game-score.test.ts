import { describe, expect, it } from "vitest";
import {
  calculatePopularScore,
  getBestPrice,
  getTargetMatchState,
  isTargetMatched,
  sortWatchlistByTargetStatus
} from "@/lib/game-score";
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

  it("marks a watchlist item as matched when price target is reached", () => {
    const game = mockGames.find((item) => item.slug === "cyberpunk-2077");

    expect(game).toBeTruthy();
    expect(
      getTargetMatchState({
        id: "test",
        game: game!,
        targetPriceCents: 34000 * 100
      })
    ).toMatchObject({
      matched: true,
      priceMatched: true,
      discountMatched: false
    });
  });

  it("does not treat games without a current price as target matches", () => {
    const game = mockGames.find((item) => item.slug === "hollow-knight-silksong");

    expect(game).toBeTruthy();
    expect(getBestPrice(game!)).toBeUndefined();
    expect(
      isTargetMatched({
        id: "test",
        game: game!,
        targetPriceCents: 1000 * 100,
        targetDiscountPercent: 1
      })
    ).toBe(false);
  });

  it("sorts target-matched watchlist items first", () => {
    const cyberpunk = mockGames.find((item) => item.slug === "cyberpunk-2077");
    const hades = mockGames.find((item) => item.slug === "hades-ii");

    expect(cyberpunk).toBeTruthy();
    expect(hades).toBeTruthy();

    const sorted = sortWatchlistByTargetStatus([
      {
        id: "waiting",
        game: hades!,
        targetDiscountPercent: 80
      },
      {
        id: "matched",
        game: cyberpunk!,
        targetDiscountPercent: 50
      }
    ]);

    expect(sorted[0].id).toBe("matched");
  });

  it("assigns a higher score to games with stronger review signals", () => {
    const cyberpunk = mockGames.find((item) => item.slug === "cyberpunk-2077");
    const upcoming = mockGames.find((item) => item.slug === "hollow-knight-silksong");

    expect(cyberpunk).toBeTruthy();
    expect(upcoming).toBeTruthy();
    expect(calculatePopularScore(cyberpunk!)).toBeGreaterThan(calculatePopularScore(upcoming!));
  });
});
