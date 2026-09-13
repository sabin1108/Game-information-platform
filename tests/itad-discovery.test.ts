import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ requireItadEnv: () => ({ apiKey: "test-key" }) }));
import { getItadDeals } from "@/lib/itad";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("official tag discovery contract", () => {
  it("sends tagsUnion and fetches all store prices by the returned game IDs", async () => {
    vi.stubEnv("ITAD_API_KEY", "test-key");
    const fetchMock = vi.fn(async (input: URL, init: RequestInit) => {
      if (input.pathname === "/deals/v2") {
        expect(JSON.parse(input.searchParams.get("filter")!)).toEqual({ cut: { min: 1, max: null }, tagsUnion: ["Roguelike", "Roguelite"] });
        return Response.json({ list: [{ id: "test-game", title: "Test", type: "game" }], hasMore: false });
      }
      expect(input.pathname).toBe("/games/prices/v3");
      expect(init.method).toBe("POST");
      expect(JSON.parse(String(init.body))).toEqual(["test-game"]);
      return Response.json([{ id: "test-game", deals: [
        { shop: { id: 61, name: "Steam" }, price: { amountInt: 1000000, currency: "KRW" }, regular: { amountInt: 2000000, currency: "KRW" }, cut: 50, url: "https://store.steampowered.com/app/123/" },
        { shop: { id: 16, name: "Epic Games Store" }, price: { amountInt: 900000, currency: "KRW" }, regular: { amountInt: 2000000, currency: "KRW" }, cut: 55, url: "https://store.epicgames.com/test" }
      ] }]);
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await getItadDeals({ tags: ["Roguelike", "Roguelite"], minDiscount: 1, allPrices: true });
    expect(result.games[0].prices.map(price => price.store)).toEqual(["steam", "epic"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});