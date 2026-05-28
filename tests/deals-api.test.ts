import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

async function loadDealsRoute() {
  vi.resetModules();
  const cache = await import("@/lib/deal-cache");
  cache.clearDealCacheForTests();

  return import("@/app/api/deals/route");
}

describe("deals API route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("fetches ITAD deals on the server, filters by store, discount, price, and caches the response", async () => {
    vi.stubEnv("ITAD_API_KEY", "server-only-secret");

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (!url.includes("/deals/v2")) {
        throw new Error(`Unexpected ITAD URL: ${url}`);
      }

      return Response.json(
        {
          list: [
            {
              id: "hades-ii",
              slug: "hades-ii",
              title: "Hades II",
              type: "game",
              count: 64320,
              assets: {
                banner600: "https://assets.isthereanydeal.com/hades/header.jpg"
              },
              deal: {
                shop: {
                  id: 61,
                  name: "Steam"
                },
                price: {
                  amount: 25.6,
                  amountInt: 2560,
                  currency: "USD"
                },
                regular: {
                  amount: 32,
                  amountInt: 3200,
                  currency: "USD"
                },
                cut: 20,
                url: "https://store.steampowered.com/app/1145350/"
              }
            },
            {
              id: "alan-wake-2",
              slug: "alan-wake-2",
              title: "Alan Wake 2",
              type: "game",
              assets: {},
              deal: {
                shop: {
                  id: 16,
                  name: "Epic Games Store"
                },
                price: {
                  amount: 29,
                  amountInt: 2900,
                  currency: "USD"
                },
                regular: {
                  amount: 58,
                  amountInt: 5800,
                  currency: "USD"
                },
                cut: 50,
                url: "https://store.epicgames.com/"
              }
            }
          ]
        },
        {
          headers: {
            "content-type": "application/json"
          }
        }
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await loadDealsRoute();
    const url = "http://localhost:3000/api/deals?store=steam&minDiscount=20&maxPrice=30&sort=reviews";
    const first = await GET(new NextRequest(url));
    const second = await GET(new NextRequest(url));
    const body = await second.json();

    expect(first.headers.get("X-Deals-Cache")).toBe("miss");
    expect(second.headers.get("X-Deals-Cache")).toBe("hit");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body).toMatchObject({
      source: "itad",
      cache: {
        status: "hit"
      },
      filters: {
        store: "steam",
        minDiscount: 20,
        maxPriceCents: 3000,
        sort: "reviews"
      }
    });
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      title: "Hades II",
      steamReviewCount: 64320,
      prices: [
        {
          store: "steam",
          discountPercent: 20,
          currentPriceCents: 2560
        }
      ]
    });
    expect(JSON.stringify(body)).not.toContain("server-only-secret");
  });

  it("filters mock deals with the same cache path when ITAD is not configured", async () => {
    vi.stubEnv("ITAD_API_KEY", "");

    const { GET } = await loadDealsRoute();
    const response = await GET(
      new NextRequest("http://localhost:3000/api/deals?store=steam&minDiscount=50&maxPrice=15000&sort=price")
    );
    const body = await response.json();

    expect(response.headers.get("X-Deals-Cache")).toBe("miss");
    expect(body.source).toBe("mock");
    expect(body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Slay the Spire"
        })
      ])
    );
    expect(body.data.every((game: { prices: Array<{ store: string; discountPercent: number; currentPriceCents: number }> }) =>
      game.prices.every((price) =>
        price.store === "steam" && price.discountPercent >= 50 && price.currentPriceCents <= 1500000
      )
    )).toBe(true);
  });
});
