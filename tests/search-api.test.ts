import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

async function loadSearchRoute() {
  vi.resetModules();
  const cache = await import("@/lib/search-cache");
  cache.clearSearchCacheForTests();

  return import("@/app/api/search/route");
}

describe("search API route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses a server-side ITAD request, normalizes prices, and does not expose the API key", async () => {
    vi.stubEnv("ITAD_API_KEY", "server-only-secret");

    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/games/search/v1")) {
        return Response.json(
          [
            {
              id: "018d937f-portal",
              slug: "portal-2",
              title: "Portal 2",
              type: "game",
              assets: {
                banner600: "https://assets.isthereanydeal.com/portal/banner600.jpg"
              }
            }
          ],
          {
            headers: {
              "content-type": "application/json"
            }
          }
        );
      }

      if (url.includes("/games/prices/v3")) {
        expect(init?.method).toBe("POST");
        expect(init?.headers).toMatchObject({
          "ITAD-API-Key": "server-only-secret",
          "Content-Type": "application/json"
        });

        return Response.json(
          [
            {
              id: "018d937f-portal",
              deals: [
                {
                  shop: {
                    id: 61,
                    name: "Steam"
                  },
                  price: {
                    amount: 9.99,
                    amountInt: 999,
                    currency: "USD"
                  },
                  regular: {
                    amount: 19.99,
                    amountInt: 1999,
                    currency: "USD"
                  },
                  cut: 50,
                  url: "https://store.steampowered.com/app/620/"
                }
              ]
            }
          ],
          {
            headers: {
              "content-type": "application/json"
            }
          }
        );
      }

      throw new Error(`Unexpected ITAD URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await loadSearchRoute();
    const response = await GET(new NextRequest("http://localhost:3000/api/search?q=portal&country=US"));
    const body = await response.json();

    expect(response.headers.get("X-Search-Cache")).toBe("miss");
    expect(body).toMatchObject({
      source: "itad",
      query: "portal",
      normalized: true,
      cache: {
        status: "miss"
      }
    });
    expect(body.data[0].prices[0]).toMatchObject({
      store: "steam",
      storeName: "Steam",
      currentPriceCents: 999,
      regularPriceCents: 1999,
      discountPercent: 50
    });
    expect(JSON.stringify(body)).not.toContain("server-only-secret");
  });

  it("returns cache hit for the same normalized search criteria", async () => {
    vi.stubEnv("ITAD_API_KEY", "");

    const { GET } = await loadSearchRoute();
    const first = await GET(new NextRequest("http://localhost:3000/api/search?q=Hades%20%20II&country=KR"));
    const second = await GET(new NextRequest("http://localhost:3000/api/search?q=hades%20ii&country=kr"));
    const body = await second.json();

    expect(first.headers.get("X-Search-Cache")).toBe("miss");
    expect(second.headers.get("X-Search-Cache")).toBe("hit");
    expect(body.cache.status).toBe("hit");
    expect(body.data[0]).toMatchObject({
      title: "Hades II"
    });
    expect(body.data[0].prices.length).toBeGreaterThan(0);
  });

  it("filters fallback search by tag and store", async () => {
    vi.stubEnv("ITAD_API_KEY", "");

    const { GET } = await loadSearchRoute();
    const response = await GET(new NextRequest("http://localhost:3000/api/search?q=&tag=RPG&store=steam"));
    const body = await response.json();

    expect(body.filters).toEqual({
      tag: "RPG",
      store: "steam"
    });
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((game: { tags: string[] }) =>
      game.tags.some((tag) => tag.toLowerCase().includes("rpg"))
    )).toBe(true);
    expect(
      body.data.every((game: { prices: Array<{ store: string }> }) =>
        game.prices.some((price) => price.store === "steam")
      )
    ).toBe(true);
  });
});
