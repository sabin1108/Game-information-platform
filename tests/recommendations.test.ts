import { describe, expect, it } from "vitest";
import { mockGames, mockWatchlist } from "@/lib/mock-data";
import { getRecommendationSeed, recommendGames } from "@/lib/recommendations";

describe("recommendations", () => {
  it("weights watchlist tags and excludes already watched games", () => {
    const watchlist = mockWatchlist.filter((item) => item.game.tags.includes("RPG"));
    const seed = getRecommendationSeed(watchlist);
    const recommendations = recommendGames(mockGames, watchlist, [], 6);

    expect(seed.tags).toContain("rpg");
    expect(recommendations.some((game) => game.tags.includes("RPG"))).toBe(true);
    expect(recommendations.some((game) => watchlist.some((item) => item.game.id === game.id))).toBe(false);
  });

  it("does not fall back to unrelated deals when only generic tags are available", () => {
    const watchlist = [{
      id: "watch-generic",
      game: {
        ...mockGames[0],
        id: "generic-game",
        slug: "generic-game",
        tags: ["Game", "Action", "Singleplayer"]
      }
    }];

    const seed = getRecommendationSeed(watchlist);
    const recommendations = recommendGames(mockGames, watchlist, [], 6);

    expect(seed.tags).toEqual([]);
    expect(recommendations).toEqual([]);
  });
});
