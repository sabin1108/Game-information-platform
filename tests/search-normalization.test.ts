import { describe, expect, it } from "vitest";
import { normalizeItadGame } from "@/lib/itad-normalizers";

describe("ITAD search normalization", () => {
  it("normalizes a game and store products into the internal shape", () => {
    const game = normalizeItadGame(
      {
        id: "018d937f-portal",
        slug: "portal-2",
        title: "Portal 2",
        type: "game",
        assets: {
          banner600: "https://assets.isthereanydeal.com/portal/banner600.jpg"
        }
      },
      {
        id: "018d937f-portal",
        historyLow: {
          all: {
            amount: 0.99,
            amountInt: 99,
            currency: "USD"
          }
        },
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
          },
          {
            shop: {
              id: 16,
              name: "Epic Games Store"
            },
            price: {
              amount: 12.99,
              amountInt: 1299,
              currency: "USD"
            },
            regular: {
              amount: 19.99,
              amountInt: 1999,
              currency: "USD"
            },
            cut: 35,
            url: "https://store.epicgames.com/"
          }
        ]
      }
    );

    expect(game).toMatchObject({
      id: "018d937f-portal",
      title: "Portal 2",
      slug: "portal-2",
      imageUrl: "https://assets.isthereanydeal.com/portal/banner600.jpg",
      releaseStatus: "unknown",
      tags: ["game"]
    });
    expect(game.prices).toEqual([
      expect.objectContaining({
        store: "steam",
        storeName: "Steam",
        currentPriceCents: 999,
        regularPriceCents: 1999,
        currency: "USD",
        discountPercent: 50
      }),
      expect.objectContaining({
        store: "epic",
        storeName: "Epic Games Store",
        currentPriceCents: 1299,
        regularPriceCents: 1999,
        currency: "USD",
        discountPercent: 35
      })
    ]);
  });

  it("drops zero-current deals and falls back to Steam header thumbnails", () => {
    const game = normalizeItadGame(
      {
        id: "018d937f-free-weekend",
        slug: "free-weekend-game",
        title: "Free Weekend Game",
        type: "game",
        assets: {}
      },
      {
        id: "018d937f-free-weekend",
        deals: [
          {
            shop: {
              id: 61,
              name: "Steam"
            },
            price: {
              amount: 0,
              amountInt: 0,
              currency: "USD"
            },
            regular: {
              amount: 19.99,
              amountInt: 1999,
              currency: "USD"
            },
            cut: 100,
            url: "https://store.steampowered.com/app/12345/"
          },
          {
            shop: {
              id: 35,
              name: "Humble Store"
            },
            price: {
              amount: 1.99,
              amountInt: 199,
              currency: "USD"
            },
            regular: {
              amount: 19.99,
              amountInt: 1999,
              currency: "USD"
            },
            cut: 90,
            url: "https://store.steampowered.com/app/12345/"
          }
        ]
      }
    );

    expect(game.imageUrl).toBe("https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/12345/header.jpg");
    expect(game.prices).toHaveLength(1);
    expect(game.prices[0]).toMatchObject({
      storeName: "Humble Store",
      currentPriceCents: 199,
      discountPercent: 90
    });
  });
});
