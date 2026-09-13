import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockGames } from "@/lib/mock-data";
vi.mock("server-only", () => ({}));
const info = vi.hoisted(() => vi.fn());
const popular = vi.hoisted(() => vi.fn());
vi.mock("@/lib/env", () => ({ isItadConfigured: () => true }));
vi.mock("@/lib/itad", () => ({ getItadPopular: popular, getItadGameInfo: info, getItadDeals: vi.fn() }));
beforeEach(() => { vi.resetModules(); info.mockReset(); popular.mockReset(); });

describe("displayed deal artwork", () => {
  it("hydrates only filtered visible games and includes artwork in the feed cache", async () => {
    const id = "018d937f-6144-7057-ad1c-0e99a3a71797";
    const visible = { ...mockGames[0], id, title: "Hogwarts Legacy", imageUrl: "", tags: ["RPG"], prices: [{ ...mockGames[0].prices[0], currentPriceCents: 1000, regularPriceCents: 2000, discountPercent: 50 }] };
    popular.mockResolvedValue([visible, { ...visible, id: "018d937f-170a-71f4-a450-f24a065714de", prices: [{ ...visible.prices[0], discountPercent: 0 }] }]);
    info.mockResolvedValue({ id, assets: { banner600: "https://assets.isthereanydeal.com/real-cover.jpg" } });
    const { getDealFeed } = await import("@/lib/game-feeds");
    const result = await getDealFeed({ limit: 1, minDiscount: 50 });
    expect(result.games).toHaveLength(1);
    expect(result.games[0].imageUrl).toContain("real-cover");
    expect(info).toHaveBeenCalledTimes(1);
    const cached = await getDealFeed({ limit: 1, minDiscount: 50 });
    expect(cached.games).toEqual(result.games);
    expect(info).toHaveBeenCalledTimes(1);
  });
});
