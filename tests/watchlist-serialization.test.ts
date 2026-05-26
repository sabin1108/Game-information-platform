import { describe, expect, it } from "vitest";
import { mockGames } from "@/lib/mock-data";
import { parseGameForWatchlist, serializeGameForWatchlist } from "@/lib/watchlist-serialization";

describe("watchlist game serialization", () => {
  it("round-trips a game summary from a form payload", () => {
    const game = mockGames.find((item) => item.slug === "hades-ii");

    if (!game) {
      throw new Error("Expected Hades II mock game.");
    }

    const formData = new FormData();
    formData.set("game", serializeGameForWatchlist(game));

    expect(parseGameForWatchlist(formData.get("game"))).toMatchObject({
      id: game.id,
      title: "Hades II",
      slug: "hades-ii",
      prices: expect.arrayContaining([
        expect.objectContaining({
          store: "steam",
          currentPriceCents: 2560000
        }),
        expect.objectContaining({
          store: "epic",
          currentPriceCents: 3200000
        })
      ])
    });
  });

  it("rejects unsupported store codes", () => {
    const formData = new FormData();
    formData.set(
      "game",
      JSON.stringify({
        id: "game",
        title: "Game",
        slug: "game",
        releaseStatus: "released",
        tags: [],
        prices: [
          {
            store: "unknown-store",
            storeName: "Unknown",
            regularPriceCents: 100,
            currentPriceCents: 100,
            currency: "USD",
            discountPercent: 0,
            url: "https://example.com"
          }
        ]
      })
    );

    expect(() => parseGameForWatchlist(formData.get("game"))).toThrow("store is not supported");
  });
});
