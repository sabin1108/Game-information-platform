import "server-only";

import {
  dealCacheConfig,
  getDealCache,
  getDealCacheKey,
  getStaleDealCache,
  setDealCache,
  type DealCacheStatus,
  type DealFilterState,
  type DealSort
} from "@/lib/deal-cache";
import {
  getReleaseCache,
  getReleaseCacheKey,
  getStaleReleaseCache,
  releaseCacheConfig,
  setReleaseCache,
  type ReleaseCacheStatus,
  type ReleaseFilterState
} from "@/lib/release-cache";
import { isItadConfigured } from "@/lib/env";
import { getItadDeals, getItadPopular } from "@/lib/itad";
import { mockGames } from "@/lib/mock-data";
import {
  getPopularCache,
  getPopularCacheKey,
  getStalePopularCache,
  popularCacheConfig,
  setPopularCache,
  type PopularCacheStatus
} from "@/lib/popular-cache";
import { normalizeGameReleaseStatuses } from "@/lib/release-status";
import { searchGames } from "@/lib/search";
import { enrichSteamMetadata, refreshSteamPrices } from "@/lib/steam-prices";
import {
  getSteamPopularTags,
  normalizeSteamPopularTagKey
} from "@/lib/steam-popular-tags";
import type { SearchCacheStatus } from "@/lib/search-cache";
import type { GameSummary, StoreCode, StorePrice } from "@/types/game";

export type GameFeed = {
  source: "itad" | "mock";
  games: GameSummary[];
  warning?: string;
  nextOffset?: number;
  hasMore?: boolean;
  tagOptions?: string[];
  cacheStatus?: SearchCacheStatus;
  popularCacheStatus?: PopularCacheStatus;
  popularCacheTtlSeconds?: number;
  dealCacheStatus?: DealCacheStatus;
  dealCacheTtlSeconds?: number;
  releaseCacheStatus?: ReleaseCacheStatus;
  releaseCacheTtlSeconds?: number;
  filters?: DealFilterState;
  releaseFilters?: ReleaseFilterState;
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
  if (value === "discount" || value === "price") {
    return value;
  }

  return "reviews";
}

function normalizeTag(value: string | undefined) {
  const tag = value?.trim();

  return tag ? tag : undefined;
}

const dealTagAliases: Record<string, string[]> = {
  roguelike: ["roguelike", "rogue-like", "action roguelike", "roguelite", "rogue-lite"],
  strategy: ["strategy", "turn-based strategy", "grand strategy", "4x", "tactical"],
  puzzle: ["puzzle", "logic", "hidden object"],
  automation: ["automation", "base building", "base-building", "resource management"]
};

function normalizeTagKey(tag: string) {
  return normalizeSteamPopularTagKey(tag);
}

function isLikelyBaseGame(game: GameSummary) {
  const title = game.title.toLowerCase();

  return ![
    "bundle",
    "pack",
    "dlc",
    "soundtrack",
    "edition upgrade",
    "deluxe content"
  ].some((blocked) => title.includes(blocked));
}

function normalizeDealFilters(options: {
  country?: string;
  offset?: number;
  limit?: number;
  minDiscount?: number;
  maxPrice?: number;
  maxPriceCents?: number;
  store?: string;
  tag?: string;
  sort?: string;
} = {}): DealFilterState {
  const maxPriceCents = typeof options.maxPriceCents === "number"
    ? options.maxPriceCents
    : typeof options.maxPrice === "number"
      ? Math.floor(options.maxPrice * 100)
      : undefined;

  return {
    country: (options.country ?? "KR").trim().toUpperCase(),
    offset: clampNumber(options.offset, 0, 0, 5_000),
    limit: clampNumber(options.limit, 40, 1, 200),
    minDiscount: clampNumber(options.minDiscount, 1, 0, 100),
    maxPriceCents: maxPriceCents && maxPriceCents > 0 ? maxPriceCents : undefined,
    store: normalizeStore(options.store),
    tag: normalizeTag(options.tag),
    sort: normalizeSort(options.sort)
  };
}

function normalizeReleaseFilters(options: {
  country?: string;
  limit?: number;
  tag?: string;
  store?: string;
} = {}): ReleaseFilterState {
  return {
    country: (options.country ?? "KR").trim().toUpperCase(),
    limit: clampNumber(options.limit, 40, 1, 100),
    tag: normalizeTag(options.tag),
    store: normalizeStore(options.store)
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

function gameMatchesTag(game: GameSummary, filters: DealFilterState) {
  const tag = filters.tag ? normalizeTagKey(filters.tag) : undefined;

  if (!tag) {
    return true;
  }

  const acceptedTags = new Set([tag, ...(dealTagAliases[tag] ?? []).map(normalizeTagKey)]);

  return game.tags.some((item) => acceptedTags.has(normalizeTagKey(item)));
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
    .filter((game) => gameMatchesTag(game, filters))
    .map((game) => ({
      ...game,
      prices: dedupePrices(game.prices.filter((price) => priceMatchesFilters(price, filters)))
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
  }).slice(0, filters.limit);
}

function collectTagOptions() {
  return getSteamPopularTags();
}

function getPopularityScore(game: GameSummary) {
  return game.steamReviewCount ?? 0;
}

async function getExpandedDealCandidates(filters: DealFilterState, sourceGames: GameSummary[]) {
  const dealPages = await Promise.all([0, 200, 400].map((offset) =>
    getItadDeals({
      country: filters.country,
      offset,
      limit: 200,
      minDiscount: filters.minDiscount
    })
  ));
  const dealGames = dealPages.flatMap((page) => page.games).filter(isLikelyBaseGame);

  return dedupeGames([
    ...sourceGames,
    ...await enrichSteamMetadata(dealGames, filters.country)
  ]).sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
}

function getPriceDedupKey(price: StorePrice) {
  return [price.store, price.storeName.toLowerCase(), price.url].join(":");
}

function dedupePrices(prices: StorePrice[]) {
  const byStore = new Map<string, StorePrice>();

  for (const price of prices) {
    const key = getPriceDedupKey(price);
    const existing = byStore.get(key);

    if (!existing || price.discountPercent > existing.discountPercent) {
      byStore.set(key, price);
    }
  }

  return [...byStore.values()];
}

function dedupeGames(games: GameSummary[]) {
  const byGame = new Map<string, GameSummary>();

  for (const game of games) {
    const existing = byGame.get(game.id);

    if (!existing) {
      byGame.set(game.id, {
        ...game,
        prices: dedupePrices(game.prices)
      });
      continue;
    }

    byGame.set(game.id, {
      ...existing,
      prices: dedupePrices([...existing.prices, ...game.prices])
    });
  }

  return [...byGame.values()];
}

function getReleaseTime(game: GameSummary) {
  if (!game.releaseDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  const time = new Date(game.releaseDate).getTime();

  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

function applyReleaseFilters(games: GameSummary[], filters: ReleaseFilterState) {
  const normalizedTag = filters.tag?.toLowerCase();

  return games
    .filter((game) => {
      const tagMatches = !normalizedTag || game.tags.some((tag) => tag.toLowerCase().includes(normalizedTag));
      const storeMatches = !filters.store || game.prices.some((price) => price.store === filters.store);

      return tagMatches && storeMatches;
    })
    .sort((a, b) => {
      const statusOrder = { upcoming: 0, unknown: 1, released: 2 };
      const statusDiff = statusOrder[a.releaseStatus] - statusOrder[b.releaseStatus];

      if (statusDiff !== 0) {
        return statusDiff;
      }

      const releaseDiff = getReleaseTime(a) - getReleaseTime(b);

      if (releaseDiff !== 0) {
        return releaseDiff;
      }

      return a.title.localeCompare(b.title);
    })
    .slice(0, filters.limit);
}

export async function getPopularFeed(limit = 24, country = "KR"): Promise<GameFeed> {
  const normalizedCountry = country.trim().toUpperCase();
  const provider = isItadConfigured() ? "itad" : "mock";
  const cacheKey = getPopularCacheKey(provider, {
    country: normalizedCountry,
    limit
  });
  const cached = getPopularCache(cacheKey);

  if (cached) {
    return {
      source: cached.source,
      warning: cached.warning,
      games: cached.games,
      popularCacheStatus: "hit",
      popularCacheTtlSeconds: cached.ttlSeconds
    };
  }

  if (!isItadConfigured()) {
    const payload: GameFeed = {
      source: "mock",
      games: normalizeGameReleaseStatuses(await refreshSteamPrices(mockGames.slice(0, limit), normalizedCountry))
    };

    setPopularCache(cacheKey, payload);

    return {
      ...payload,
      popularCacheStatus: "miss",
      popularCacheTtlSeconds: popularCacheConfig.ttlSeconds
    };
  }

  try {
    const games = await withTimeout(getItadPopular(limit), 5000, "ITAD popular feed timed out.");
    const payload: GameFeed = {
      source: "itad",
      games: normalizeGameReleaseStatuses(await enrichSteamMetadata(games, normalizedCountry))
    };

    setPopularCache(cacheKey, payload);

    return {
      ...payload,
      popularCacheStatus: "miss",
      popularCacheTtlSeconds: popularCacheConfig.ttlSeconds
    };
  } catch (error) {
    const stale = getStalePopularCache(cacheKey);

    if (stale) {
      return {
        source: stale.source,
        warning: getWarning(error),
        games: stale.games,
        popularCacheStatus: "stale",
        popularCacheTtlSeconds: stale.ttlSeconds
      };
    }

    return {
      source: "mock",
      warning: getWarning(error),
      games: normalizeGameReleaseStatuses(await refreshSteamPrices(mockGames.slice(0, limit), normalizedCountry)),
      popularCacheStatus: "miss",
      popularCacheTtlSeconds: popularCacheConfig.ttlSeconds
    };
  }
}

export async function getDealFeed(options: {
  country?: string;
  offset?: number;
  limit?: number;
  minDiscount?: number;
  maxPrice?: number;
  maxPriceCents?: number;
  store?: string;
  tag?: string;
  sort?: string;
} = {}): Promise<GameFeed> {
  const filters = normalizeDealFilters(options);
  const provider = isItadConfigured() ? "itad" : "mock";
  const cacheKey = getDealCacheKey(provider, filters);
  const cached = getDealCache(cacheKey);
  const stale = getStaleDealCache(cacheKey);

  if (cached) {
    return {
      source: cached.source,
      warning: cached.warning,
      games: cached.games,
      nextOffset: cached.nextOffset,
      hasMore: cached.hasMore,
      tagOptions: cached.tagOptions,
      filters,
      dealCacheStatus: "hit",
      dealCacheTtlSeconds: cached.ttlSeconds
    };
  }

  let payload: GameFeed;

  if (!isItadConfigured()) {
    const refreshedGames = await refreshSteamPrices(mockGames, filters.country);
    const sourceGames = dedupeGames(refreshedGames);

    payload = {
      source: "mock",
      games: normalizeGameReleaseStatuses(applyDealFilters(sourceGames, filters)),
      nextOffset: filters.offset + filters.limit,
      hasMore: false,
      tagOptions: collectTagOptions()
    };
  } else {
    try {
      const usesPopularityFeed = filters.sort === "reviews";
      const popularRequestLimit = Math.min(500, Math.max(filters.limit * 5, 300));
      const itadPage = usesPopularityFeed
        ? {
            games: await withTimeout(
              getItadPopular({
                country: filters.country,
                offset: filters.offset,
                limit: popularRequestLimit
              }),
              7000,
              "ITAD popular deals feed timed out."
            ),
            nextOffset: filters.offset + popularRequestLimit,
            hasMore: true
          }
        : await withTimeout(getItadDeals(filters), 5000, "ITAD deals feed timed out.");
      const popularCandidates = dedupeGames(itadPage.games)
        .filter(isLikelyBaseGame)
        .sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
      const metadataLimit = usesPopularityFeed
        ? Math.min(popularCandidates.length, popularRequestLimit)
        : popularCandidates.length;
      const sourceGames = dedupeGames(await enrichSteamMetadata(popularCandidates.slice(0, metadataLimit), filters.country))
        .sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
      const filterSourceGames = filters.tag && usesPopularityFeed
        ? await getExpandedDealCandidates(filters, sourceGames)
        : sourceGames;

      payload = {
        source: "itad",
        games: normalizeGameReleaseStatuses(applyDealFilters(filterSourceGames, filters)),
        nextOffset: itadPage.nextOffset ?? filters.offset + filters.limit,
        hasMore: itadPage.hasMore ?? sourceGames.length >= filters.limit,
        tagOptions: collectTagOptions()
      };
    } catch (error) {
      if (stale) {
        return {
          source: stale.source,
          warning: getWarning(error),
          games: stale.games,
          nextOffset: stale.nextOffset,
          hasMore: stale.hasMore,
          tagOptions: stale.tagOptions,
          filters,
          dealCacheStatus: "stale",
          dealCacheTtlSeconds: stale.ttlSeconds
        };
      }

      const sourceGames = dedupeGames(await refreshSteamPrices(mockGames, filters.country));

      payload = {
        source: "mock",
        warning: getWarning(error),
        games: normalizeGameReleaseStatuses(applyDealFilters(sourceGames, filters)),
        nextOffset: filters.offset + filters.limit,
        hasMore: false,
        tagOptions: collectTagOptions()
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

export async function getReleaseFeed(options: {
  country?: string;
  limit?: number;
  tag?: string;
  store?: string;
} = {}): Promise<GameFeed> {
  const filters = normalizeReleaseFilters(options);
  const provider = "mock";
  const cacheKey = getReleaseCacheKey(provider, filters);
  const cached = getReleaseCache(cacheKey);
  const stale = getStaleReleaseCache(cacheKey);

  if (cached) {
    return {
      source: cached.source,
      warning: cached.warning,
      games: cached.games,
      releaseFilters: filters,
      releaseCacheStatus: "hit",
      releaseCacheTtlSeconds: cached.ttlSeconds
    };
  }

  let payload: GameFeed;

  try {
    const refreshedGames = await refreshSteamPrices(mockGames, filters.country);
    payload = {
      source: provider,
      games: applyReleaseFilters(normalizeGameReleaseStatuses(refreshedGames), filters)
    };
  } catch (error) {
    if (stale) {
      return {
        source: stale.source,
        warning: getWarning(error),
        games: stale.games,
        releaseFilters: filters,
        releaseCacheStatus: "stale",
        releaseCacheTtlSeconds: stale.ttlSeconds
      };
    }

    throw error;
  }

  setReleaseCache(cacheKey, payload);

  return {
    ...payload,
    releaseFilters: filters,
    releaseCacheStatus: "miss",
    releaseCacheTtlSeconds: releaseCacheConfig.ttlSeconds
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
    games: normalizeGameReleaseStatuses(result.games),
    cacheStatus: result.cache.status
  };
}
