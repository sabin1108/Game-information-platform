import { describe, expect, it } from "vitest";
import { mockGames } from "@/lib/mock-data";
import { collectSearchTagOptions, filterSearchGames, getSearchHref, matchesSearchTag, normalizeSearchCriteria, titleMatchesQuery } from "@/lib/search-filters";
import type { StorePrice } from "@/types/game";
const offer = (store: "steam" | "epic", price: number, extra: Partial<StorePrice> = {}): StorePrice => ({ store, storeName: store, regularPriceCents: 5000000, currentPriceCents: price * 100, currency: "KRW", discountPercent: 50, url: "https://example.com", ...extra });
const game = { ...mockGames[0], title: "Hades", tags: ["Action Roguelike"], prices: [offer("steam", 30000), offer("epic", 10000)] };
describe("search filter contract", () => {
  it("uses the same matching rule for Korean and English aliases, without substring matches", () => {
    expect(matchesSearchTag(game.tags, "로그라이크")).toBe(true);
    expect(matchesSearchTag(game.tags, "rogue-like")).toBe(true);
    expect(matchesSearchTag(["Action"], "act")).toBe(false);
    expect(matchesSearchTag(["JRPG"], "RPG")).toBe(true);
  });
  it("never combines one store's price with another store's availability", () => {
    const criteria = normalizeSearchCriteria({ store: "steam", maxPrice: "20000" });
    expect(filterSearchGames([game], criteria)).toEqual([]);
    const result = filterSearchGames([game], { ...criteria, maxPrice: 40000 });
    expect(result[0].prices).toHaveLength(1);
    expect(result[0].prices[0].store).toBe("steam");
    expect(game.prices).toHaveLength(2);
  });
  it("does not treat unknown zero prices or foreign currency as a free KRW offer", () => {
    const variants = [
      { ...game, id: "unknown", prices: [offer("steam", 0, { discountPercent: 0, regularPriceCents: 0 })] },
      { ...game, id: "usd", prices: [offer("steam", 1, { currency: "USD" })] },
      { ...game, id: "free", prices: [offer("steam", 0, { discountPercent: 100 })] }
    ];
    expect(filterSearchGames(variants, normalizeSearchCriteria({ maxPrice: "0" })).map(item => item.id)).toEqual(["free"]);
  });
  it("ranks exact titles first and price sort uses the selected store", () => {
    const variants = [{ ...game, id: "sequel", title: "Hades II" }, game];
    expect(filterSearchGames(variants, normalizeSearchCriteria({ q: "hades" }))[0].title).toBe("Hades");
    const cheaperSteam = { ...game, id: "second", prices: [offer("steam", 20000), offer("epic", 40000)] };
    expect(filterSearchGames([game, cheaperSteam], normalizeSearchCriteria({ store: "steam", sort: "price" }))[0].id).toBe("second");
  });
  it("normalizes full-width titles, rejects malformed criteria and preserves free-only URLs", () => {
    expect(titleMatchesQuery("Portal 2", "Ｐｏｒｔａｌ  ２")).toBe(true);
    expect(titleMatchesQuery("Hades II", "Action")).toBe(false);
    const criteria = normalizeSearchCriteria({ q: "  Portal   2 ", store: "UNKNOWN", maxPrice: "-5", sort: "oops" });
    expect(criteria).toMatchObject({ q: "Portal 2", store: "", maxPrice: undefined, sort: "relevance" });
    expect(getSearchHref({ ...criteria, maxPrice: 0 })).toContain("maxPrice=0");
  });
  it("counts each game once per tag family and never offers product type as a genre", () => {
    const options = collectSearchTagOptions([{ ...game, tags: ["game", "Roguelike", "Rogue-lite"] }]);
    expect(options).toEqual([{ value: "Roguelike", label: "로그라이크 · Roguelike", count: 1 }]);
  });
});