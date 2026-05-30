import "server-only";

import {
  dealCacheConfig,
  getDealCache,
  getDealCacheKey,
  setDealCache,
  type DealCacheStatus,
  type DealFilterState,
  type DealSort
} from "@/lib/deal-cache";
import { isItadConfigured } from "@/lib/env";
import { getItadDeals, getItadPopular } from "@/lib/itad";
import { mockGames } from "@/lib/mock-data";
import { searchGames } from "@/lib/search";
import { refreshSteamPrices } from "@/lib/steam-prices";
import type { SearchCacheStatus } from "@/lib/search-cache";
import type { GameSummary, StoreCode, StorePrice } from "@/types/game";

export type GameFeed = {
  source: "itad" | "mock";
  games: GameSummary[];
  warning?: string;
  cacheStatus?: SearchCacheStatus;
  dealCacheStatus?: DealCacheStatus;
  dealCacheTtlSeconds?: number;
  filters?: DealFilterState;
};

function getWarning(error: unknown) {
  return error instanceof Error ? error.message : "ITAD request failed.";
}

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

function clampNumber(value: number | undefined, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(value)));
}

function normalizeStore(value: string | undefined): StoreCode | undefined {
  if (value === "steam" || value === "epic" || value === "itad") {
    return value;
  }

  return undefined;
}

function normalizeSort(value: string | undefined): DealSort {
  if (value === "price" || value === "reviews") {
    return value;
  }

  return "discount";
}

export function normalizeDealFilters(options: {
  country?: string;
  limit?: number;
  minDiscount?: number;
  maxPrice?: number;
  maxPriceCents?: number;
  store?: string;
  sort?: string;
} = {}): DealFilterState {
  const maxPriceCents = typeof options.maxPriceCents === "number"
    ? options.maxPriceCents
    : typeof options.maxPrice === "number"
      ? Math.floor(options.maxPrice * 100)
      : undefined;

  return {
    country: (options.country ?? "KR").trim().toUpperCase(),
    limit: clampNumber(options.limit, 40, 1, 100),
    minDiscount: clampNumber(options.minDiscount, 1, 0, 100),
    maxPriceCents: maxPriceCents && maxPriceCents > 0 ? maxPriceCents : undefined,
    store: normalizeStore(options.store),
    sort: normalizeSort(options.sort)
  };
}

function priceMatchesFilters(price: StorePrice, filters: DealFilterState) {
  if (filters.store && price.store !== filters.store) {
    return false;
  }

  if (price.discountPercent < filters.minDiscount) {
    return false;
  }

  if (filters.maxPriceCents && (price.currentPriceCents <= 0 || price.currentPriceCents > filters.maxPriceCents)) {
    return false;
  }

  return true;
}

function getBestDiscount(game: GameSummary) {
  return Math.max(0, ...game.prices.map((price) => price.discountPercent));
}

function getLowestCurrentPrice(game: GameSummary) {
  const prices = game.prices
    .map((price) => price.currentPriceCents)
    .filter((price) => price > 0);

  return prices.length ? Math.min(...prices) : Number.MAX_SAFE_INTEGER;
}

function getReviewSortScore(game: GameSummary) {
  const reviewCount = game.steamReviewCount ?? 0;
  const positiveRatio = game.steamPositiveRatio ?? 0;

  return Math.log10(reviewCount + 1) * positiveRatio;
}

function applyDealFilters(games: GameSummary[], filters: DealFilterState) {
  const filtered = games
    .map((game) => ({
      ...game,
      prices: game.prices.filter((price) => priceMatchesFilters(price, filters))
    }))
    .filter((game) => game.prices.length > 0);

  return filtered.sort((a, b) => {
    if (filters.sort === "price") {
      const priceDiff = getLowestCurrentPrice(a) - getLowestCurrentPrice(b);

      if (priceDiff !== 0) {
        return priceDiff;
      }
    }

    if (filters.sort === "reviews") {
      const reviewDiff = getReviewSortScore(b) - getReviewSortScore(a);

      if (reviewDiff !== 0) {
        return reviewDiff;
      }
    }

    const discountDiff = getBestDiscount(b) - getBestDiscount(a);

    if (discountDiff !== 0) {
      return discountDiff;
    }

    return a.title.localeCompare(b.title);
  });
}

export async function getPopularFeed(limit = 24): Promise<GameFeed> {
  if (!isItadConfigured()) {
    return { source: "mock", games: await refreshSteamPrices(mockGames.slice(0, limit)) };
  }

  try {
    return { source: "itad", games: await withTimeout(getItadPopular(limit), 5000, "ITAD popular feed timed out.") };
  } catch (error) {
    return {
      source: "mock",
      warning: getWarning(error),
      games: await refreshSteamPrices(mockGames.slice(0, limit))
    };
  }
}

export async function getDealFeed(options: {
  country?: string;
  limit?: number;
  minDiscount?: number;
  maxPrice?: number;
  maxPriceCents?: number;
  store?: string;
  sort?: string;
} = {}): Promise<GameFeed> {
  const filters = normalizeDealFilters(options);
  const provider = isItadConfigured() ? "itad" : "mock";
  const cacheKey = getDealCacheKey(provider, filters);
  const cached = getDealCache(cacheKey);

  if (cached) {
    return {
      source: cached.source,
      warning: cached.warning,
      games: cached.games,
      filters,
      dealCacheStatus: "hit",
      dealCacheTtlSeconds: cached.ttlSeconds
    };
  }

  let payload: GameFeed;

  if (!isItadConfigured()) {
    const refreshedGames = await refreshSteamPrices(mockGames, filters.country);

    payload = {
      source: "mock",
      games: applyDealFilters(refreshedGames, filters)
    };
  } else {
    try {
      payload = {
        source: "itad",
        games: applyDealFilters(
          await withTimeout(getItadDeals(filters), 5000, "ITAD deals feed timed out."),
          filters
        )
      };
    } catch (error) {
      payload = {
        source: "mock",
        warning: getWarning(error),
        games: applyDealFilters(await refreshSteamPrices(mockGames, filters.country), filters)
      };
    }
  }

  setDealCache(cacheKey, payload);

  return {
    ...payload,
    filters,
    dealCacheStatus: "miss",
    dealCacheTtlSeconds: dealCacheConfig.ttlSeconds
  };
}

export async function searchGameFeed(query: string, options: {
  tag?: string;
  store?: string;
} = {}): Promise<GameFeed> {
  const result = await searchGames(query, { limit: 40, tag: options.tag, store: options.store });

  return {
    source: result.source,
    warning: result.warning,
    games: result.games,
    cacheStatus: result.cache.status
  };
}
