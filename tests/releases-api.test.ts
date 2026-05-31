import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

async function loadReleasesRoute() {
  vi.resetModules();
  const cache = await import("@/lib/release-cache");
  cache.clearReleaseCacheForTests();

  return import("@/app/api/releases/route");
}

describe("releases API route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("serves release discovery through the server cache", async () => {
    const { GET } = await loadReleasesRoute();
    const url = "http://localhost:3000/api/releases?limit=5";
    const first = await GET(new NextRequest(url));
    const second = await GET(new NextRequest(url));
    const body = await second.json();

    expect(first.headers.get("X-Releases-Cache")).toBe("miss");
    expect(second.headers.get("X-Releases-Cache")).toBe("hit");
    expect(body.cache.status).toBe("hit");
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((game: { releaseStatus: string }) =>
      ["released", "upcoming", "unknown"].includes(game.releaseStatus)
    )).toBe(true);
  });

  it("filters releases by store and tag without hiding unknown status", async () => {
    const { GET } = await loadReleasesRoute();
    const response = await GET(new NextRequest("http://localhost:3000/api/releases?store=epic&tag=Action"));
    const body = await response.json();

    expect(body.filters).toMatchObject({
      store: "epic",
      tag: "Action"
    });
    expect(body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Control 2",
          releaseStatus: "unknown"
        })
      ])
    );
    expect(body.data.every((game: { tags: string[]; prices: Array<{ store: string }> }) =>
      game.tags.some((tag) => tag.toLowerCase().includes("action")) &&
      game.prices.some((price) => price.store === "epic")
    )).toBe(true);
  });
});
