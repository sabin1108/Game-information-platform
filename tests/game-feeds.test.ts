import { describe, expect, it, vi } from "vitest";
import { hasActiveDiscount } from "@/lib/game-feeds";
import { mockGames } from "@/lib/mock-data";

vi.mock("server-only", () => ({}));

describe("game feeds", () => {
  it("recognizes only currently priced discounted games for the home feed", () => {
    const discounted = mockGames.filter(hasActiveDiscount);

    expect(discounted.length).toBeGreaterThan(10);
    expect(discounted.some((game) => game.slug === "hollow-knight-silksong")).toBe(false);
    expect(discounted.some((game) => game.slug === "control-2")).toBe(false);
    expect(discounted.some((game) => game.slug === "factorio")).toBe(false);
    expect(discounted.every((game) =>
      game.prices.some((price) =>
        price.currentPriceCents > 0 &&
        price.regularPriceCents > price.currentPriceCents &&
        price.discountPercent > 0
      )
    )).toBe(true);
  });
});