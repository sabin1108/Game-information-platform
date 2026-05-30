import "server-only";

import type { GameSummary, StorePrice } from "@/types/game";

const STEAM_APPDETAILS_URL = "https://store.steampowered.com/api/appdetails";

type SteamPriceOverview = {
  currency?: string;
  initial?: number;
  final?: number;
  discount_percent?: number;
};

type SteamAppDetails = {
  success?: boolean;
  data?: {
    price_overview?: SteamPriceOverview;
    header_image?: string;
  };
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    promise.finally(() => {
      if (timeout) {
        clearTimeout(timeout);
      }
    }),
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}

function toUnknownPrice(price: StorePrice): StorePrice {
  return {
    ...price,
    regularPriceCents: 0,
    currentPriceCents: 0,
    discountPercent: 0,
    isHistoricalLow: false
  };
}

function applySteamPrice(game: GameSummary, overview: SteamPriceOverview | undefined) {
  return {
    ...game,
    prices: game.prices.map((price) => {
      if (price.store !== "steam") {
        return toUnknownPrice(price);
      }

      if (!overview || typeof overview.final !== "number") {
        return toUnknownPrice(price);
      }

      const currentPriceCents = overview.final;
      const regularPriceCents = typeof overview.initial === "number" && overview.initial > 0
        ? overview.initial
        : currentPriceCents;
      const discountPercent = overview.discount_percent ?? 0;

      return {
        ...price,
        regularPriceCents,
        currentPriceCents,
        currency: overview.currency ?? price.currency,
        discountPercent,
        isHistoricalLow: false
      };
    })
  };
}

async function fetchSteamPrices(appIds: number[], country: string) {
  if (!appIds.length) {
    return new Map<number, SteamAppDetails>();
  }

  const url = new URL(STEAM_APPDETAILS_URL);
  url.searchParams.set("appids", appIds.join(","));
  url.searchParams.set("cc", country.toLowerCase());
  url.searchParams.set("filters", "price_overview");

  const response = await withTimeout(
    fetch(url, {
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    }),
    4500,
    "Steam price request timed out."
  );

  if (!response.ok) {
    throw new Error(`Steam price request failed with ${response.status}.`);
  }

  const data = (await response.json()) as Record<string, SteamAppDetails>;

  return new Map(
    Object.entries(data)
      .map(([appId, details]) => [Number(appId), details] as const)
      .filter(([appId]) => Number.isFinite(appId))
  );
}

export async function refreshSteamPrices(games: GameSummary[], country = "KR") {
  if (process.env.NODE_ENV === "test") {
    return games;
  }

  const appIds = [...new Set(games.map((game) => game.steamAppId).filter((id): id is number => typeof id === "number"))];

  try {
    const pricesByAppId = await fetchSteamPrices(appIds, country);

    return games.map((game) => {
      if (!game.steamAppId) {
        return {
          ...game,
          prices: game.prices.map(toUnknownPrice)
        };
      }

      const details = pricesByAppId.get(game.steamAppId);

      return applySteamPrice(game, details?.data?.price_overview);
    });
  } catch {
    return games.map((game) => ({
      ...game,
      prices: game.prices.map(toUnknownPrice)
    }));
  }
}
