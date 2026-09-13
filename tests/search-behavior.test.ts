import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockGames } from "@/lib/mock-data";
vi.mock("server-only", () => ({}));
const upstream = vi.hoisted(() => ({ search: vi.fn(), deals: vi.fn(), metadata: vi.fn() }));
vi.mock("@/lib/env", () => ({ isItadConfigured: () => true }));
vi.mock("@/lib/itad", () => ({ searchItadGames: upstream.search, getItadDeals: upstream.deals }));
vi.mock("@/lib/game-artwork", () => ({ enrichGameArtwork: async (games: unknown) => games, enrichGameSearchMetadata: upstream.metadata }));
import { searchGames } from "@/lib/search";
import { clearSearchCacheForTests } from "@/lib/search-cache";
const game = { ...mockGames[0], title: "Hades", tags: ["game"] };
beforeEach(() => {
  clearSearchCacheForTests(); vi.clearAllMocks();
  upstream.search.mockResolvedValue([game]);
  upstream.deals.mockResolvedValue({ games: [game], hasMore: false });
  upstream.metadata.mockImplementation(async (games) => games.map((item: typeof game) => ({ ...item, tags: ["Action Roguelike", "Action"] })));
});
describe("search candidate flow", () => {
  it("uses real discounted games for tag-only discovery", async () => {
    const result = await searchGames("", { tag: "roguelike" });
    expect(result.source).toBe("itad");
    expect(result.games).toHaveLength(1);
    expect(upstream.deals).toHaveBeenCalledWith(expect.objectContaining({ tags: expect.arrayContaining(["Roguelike"]) }));
    expect(upstream.search).not.toHaveBeenCalled();
  });
  it("loads real tags before filtering title matches", async () => {
    const result = await searchGames("hades", { tag: "로그라이크" });
    expect(result.games.map(item => item.title)).toEqual(["Hades"]);
    expect(upstream.metadata).toHaveBeenCalled();
  });
  it("reuses title candidates when only local filters change", async () => {
    await searchGames("hades");
    await searchGames("HADES", { tag: "Action", store: "steam" });
    expect(upstream.search).toHaveBeenCalledTimes(1);
  });
});

describe("search request budget", () => {
  it("coalesces concurrent filters into one upstream title request", async () => {
    await Promise.all([
      searchGames("hades"),
      searchGames("hades", { store: "steam" }),
      searchGames("hades", { tag: "Action", sort: "title" }),
      searchGames("hades", { maxPrice: 30000 })
    ]);
    expect(upstream.search).toHaveBeenCalledTimes(1);
    expect(upstream.metadata).toHaveBeenCalledTimes(1);
  });
  it("keeps all returned candidates until after filtering, even past the display limit", async () => {
    upstream.search.mockResolvedValue(Array.from({ length: 60 }, (_, index) => ({ ...game, id: String(index), tags: [index === 59 ? "Puzzle" : "Action"] })));
    upstream.metadata.mockImplementation(async games => games);
    const result = await searchGames("hades", { tag: "Puzzle", limit: 10 });
    expect(result.games.map(item => item.id)).toEqual(["59"]);
    expect(result.candidateCount).toBe(60);
  });
});
