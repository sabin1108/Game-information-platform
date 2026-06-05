import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

async function loadPopularRoute() {
  vi.resetModules();
  const cache = await import("@/lib/popular-cache");
  const rateLimit = await import("@/lib/rate-limit");
  cache.clearPopularCacheForTests();
  rateLimit.clearPublicApiRateLimitForTests();

  return import("@/app/api/public/popular/route");
}

describe("popular API route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("serves public popular data through observable cache metadata", async () => {
    vi.stubEnv("ITAD_API_KEY", "");

    const { GET } = await loadPopularRoute();
    const url = "http://localhost:3000/api/public/popular?offset=0&limit=5&tag=RPG&store=steam";
    const first = await GET(new NextRequest(url));
    const second = await GET(new NextRequest(url));
    const body = await second.json();

    expect(first.headers.get("X-Cache")).toBe("miss");
    expect(second.headers.get("X-Cache")).toBe("hit");
    expect(body.cache.status).toBe("hit");
    expect(body.data.every((game: { tags: string[]; prices: Array<{ store: string }> }) =>
      game.tags.some((tag) => tag.toLowerCase().includes("rpg")) &&
      game.prices.some((price) => price.store === "steam")
    )).toBe(true);
  });
});
