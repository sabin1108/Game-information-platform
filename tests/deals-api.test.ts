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

  it("fetches popular ITAD games first, keeps only discounted base games, and caches the response", async () => {
    vi.stubEnv("ITAD_API_KEY", "server-only-secret");

    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/stats/most-popular/v1")) {
        return Response.json(
          [
            {
              id: "hades-ii",
              slug: "hades-ii",
              title: "Hades II",
              type: "game",
              count: 64320,
              assets: {
                banner600: "https://assets.isthereanydeal.com/hades/header.jpg"
              }
            },
            {
              id: "obscure-dlc",
              slug: "obscure-dlc",
              title: "Obscure Game DLC Pack",
              type: "dlc",
              count: 12,
              assets: {}
            },
            {
              id: "alan-wake-2",
              slug: "alan-wake-2",
              title: "Alan Wake 2",
              type: "game",
              count: 42000,
              assets: {}
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
        expect(url).toContain("deals=true");
        expect(init?.method).toBe("POST");

        return Response.json(
          [
            {
              id: "hades-ii",
              deals: [
                {
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
              ]
            },
            {
              id: "obscure-dlc",
              deals: [
                {
                  shop: {
                    id: 61,
                    name: "Steam"
                  },
                  price: {
                    amount: 1,
                    amountInt: 100,
                    currency: "USD"
                  },
                  regular: {
                    amount: 10,
                    amountInt: 1000,
                    currency: "USD"
                  },
                  cut: 90,
                  url: "https://store.steampowered.com/app/2/"
                }
              ]
            },
            {
              id: "alan-wake-2",
              deals: [
                {
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

    const { GET } = await loadDealsRoute();
    const url = "http://localhost:3000/api/deals?store=steam&minDiscount=20&maxPrice=30&sort=reviews";
    const first = await GET(new NextRequest(url));
    const second = await GET(new NextRequest(url));
    const body = await second.json();

    expect(first.headers.get("X-Deals-Cache")).toBe("miss");
    expect(second.headers.get("X-Deals-Cache")).toBe("hit");
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
    expect(JSON.stringify(body)).not.toContain("Obscure Game DLC Pack");
    expect(JSON.stringify(body)).not.toContain("server-only-secret");
  });

  it("keeps discount sorting on the direct ITAD deals endpoint", async () => {
    vi.stubEnv("ITAD_API_KEY", "server-only-secret");

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (!url.includes("/deals/v2")) {
        throw new Error(`Unexpected ITAD URL: ${url}`);
      }

      return Response.json({
        list: [
          {
            id: "discount-game",
            slug: "discount-game",
            title: "Discount Game",
            type: "game",
            deal: {
              shop: { id: 61, name: "Steam" },
              price: { amount: 10, amountInt: 1000, currency: "USD" },
              regular: { amount: 20, amountInt: 2000, currency: "USD" },
              cut: 50,
              url: "https://store.steampowered.com/app/10/"
            }
          }
        ]
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await loadDealsRoute();
    const response = await GET(new NextRequest("http://localhost:3000/api/deals?sort=discount&minDiscount=1"));
    const body = await response.json();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("Discount Game");
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

  it("dedupes repeated ITAD deals for the same game before rendering", async () => {
    vi.stubEnv("ITAD_API_KEY", "server-only-secret");

    const fetchMock = vi.fn(async () =>
      Response.json({
        list: [
          {
            id: "duplicate-game",
            slug: "duplicate-game",
            title: "Duplicate Game",
            type: "game",
            deal: {
              shop: { id: 61, name: "Steam" },
              price: { amount: 10, amountInt: 1000, currency: "USD" },
              regular: { amount: 20, amountInt: 2000, currency: "USD" },
              cut: 50,
              url: "https://store.steampowered.com/app/1/"
            }
          },
          {
            id: "duplicate-game",
            slug: "duplicate-game",
            title: "Duplicate Game",
            type: "game",
            deal: {
              shop: { id: 61, name: "Steam" },
              price: { amount: 9, amountInt: 900, currency: "USD" },
              regular: { amount: 20, amountInt: 2000, currency: "USD" },
              cut: 55,
              url: "https://store.steampowered.com/app/1/"
            }
          }
        ]
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await loadDealsRoute();
    const response = await GET(new NextRequest("http://localhost:3000/api/deals?sort=discount&minDiscount=1"));
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: "duplicate-game",
      prices: [
        {
          discountPercent: 55,
          currentPriceCents: 900
        }
      ]
    });
  });
});
