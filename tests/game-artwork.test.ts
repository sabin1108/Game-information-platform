import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockGames } from "@/lib/mock-data";
vi.mock("server-only", () => ({}));
const firstId = "018d937f-6144-7057-ad1c-0e99a3a71797";
const secondId = "018d937f-170a-71f4-a450-f24a065714de";
const missing = (id = firstId) => ({ ...mockGames[0], id, imageUrl: "", steamAppId: undefined });
beforeEach(() => { vi.resetModules(); vi.stubEnv("ITAD_API_KEY", "private-test-key"); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("exact game artwork", () => {
  it("loads artwork by UUID and shares cached requests without changing price data", async () => {
    const fetchMock = vi.fn(async (input: URL, init: RequestInit) => {
      expect(String(input)).toContain("/games/info/v2?id=" + firstId);
      expect(init.headers).toMatchObject({ "ITAD-API-Key": "private-test-key" });
      return Response.json({ id: firstId, assets: { banner600: "https://assets.isthereanydeal.com/cover.jpg" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { enrichGameArtwork } = await import("@/lib/game-artwork");
    const game = missing();
    const [first, second] = await Promise.all([enrichGameArtwork([game]), enrichGameArtwork([game])]);
    expect(first[0].imageUrl).toBe("https://assets.isthereanydeal.com/cover.jpg");
    expect(first[0].prices).toEqual(game.prices);
    expect(second).toEqual(first);
    await enrichGameArtwork([game]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("uses the exact Steam app ID from game info when the provider has no art", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ id: firstId, appid: 233130, assets: [] })));
    const { enrichGameArtwork } = await import("@/lib/game-artwork");
    const result = await enrichGameArtwork([missing()]);
    expect(result[0].imageUrl).toBe("https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/233130/header.jpg");
  });
  it("leaves existing artwork and non-provider IDs alone", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const { enrichGameArtwork } = await import("@/lib/game-artwork");
    const games = [{ ...missing(), imageUrl: "https://example.com/existing.jpg" }, missing("mock-local")];
    expect(await enrichGameArtwork(games)).toEqual(games);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("never substitutes an image returned for a different game", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ id: secondId, assets: { banner600: "https://example.com/wrong.jpg" } })));
    const { enrichGameArtwork } = await import("@/lib/game-artwork");
    expect((await enrichGameArtwork([missing()]))[0].imageUrl).toBe("");
  });
  it("isolates lookup failures so other game covers still load", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: URL) => String(input).includes(firstId)
      ? Response.json({}, { status: 503 })
      : Response.json({ id: secondId, assets: { banner400: "https://example.com/second.jpg" } })));
    const { enrichGameArtwork } = await import("@/lib/game-artwork");
    const result = await enrichGameArtwork([missing(), missing(secondId)]);
    expect(result[0].imageUrl).toBe("");
    expect(result[1].imageUrl).toBe("https://example.com/second.jpg");
  });
  it("does not cache a failed lookup forever", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({}, { status: 503 }))
      .mockImplementation(async () => Response.json({ id: firstId, assets: { banner600: "https://example.com/recovered.jpg" } }));
    vi.stubGlobal("fetch", fetchMock);
    const { enrichGameArtwork } = await import("@/lib/game-artwork");
    await enrichGameArtwork([missing()]);
    await enrichGameArtwork([missing()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 61_000);
    expect((await enrichGameArtwork([missing()]))[0].imageUrl).toContain("recovered");
  });
});

describe("exact search metadata", () => {
  it("shares a detail request between artwork and tags, and preserves an existing cover", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: firstId, tags: ["Action", "Roguelike"], assets: { banner600: "https://example.com/official.jpg" } }));
    vi.stubGlobal("fetch", fetchMock);
    const { enrichGameArtwork, enrichGameSearchMetadata } = await import("@/lib/game-artwork");
    const game = { ...missing(), tags: ["game"] };
    await enrichGameArtwork([game]);
    const result = await enrichGameSearchMetadata([{ ...game, imageUrl: "https://example.com/existing.jpg" }]);
    expect(result[0].tags).toEqual(["Action", "Roguelike"]);
    expect(result[0].imageUrl).toBe("https://example.com/existing.jpg");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("does not attach another game's tags", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ id: secondId, tags: ["Puzzle"] })));
    const { enrichGameSearchMetadata } = await import("@/lib/game-artwork");
    const result = await enrichGameSearchMetadata([{ ...missing(), tags: ["game"] }]);
    expect(result[0].tags).toEqual([]);
  });
});
