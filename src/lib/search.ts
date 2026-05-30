import "server-only";

import { isItadConfigured } from "@/lib/env";
import { searchItadGames } from "@/lib/itad";
import { searchMockGames } from "@/lib/mock-data";
import {
  getSearchCache,
  getSearchCacheKey,
  normalizeSearchQuery,
  searchCacheConfig,
  setSearchCache,
  type SearchCacheStatus,
  type SearchSource
} from "@/lib/search-cache";
import type { GameSummary } from "@/types/game";

export type SearchGamesResult = {
  source: SearchSource;
  query: string;
  normalized: true;
  games: GameSummary[];
  warning?: string;
  cache: {
    status: SearchCacheStatus;
    key: string;
    ttlSeconds: number;
  };
};

export type SearchFilters = {
  country?: string;
  limit?: number;
  tag?: string;
  store?: string;
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

function clampLimit(value: number | undefined) {
  if (!value || Number.isNaN(value)) {
    return 40;
  }

  return Math.min(100, Math.max(1, Math.floor(value)));
}

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim().toLowerCase() ?? "";

  return trimmed || undefined;
}

function filterGames(games: GameSummary[], options: SearchFilters) {
  const tag = normalizeOptionalText(options.tag);
  const store = normalizeOptionalText(options.store);

  return games.filter((game) => {
    const matchesTag = !tag || game.tags.some((item) => item.toLowerCase().includes(tag));
    const matchesStore = !store || game.prices.some((price) => price.store === store);

    return matchesTag && matchesStore;
  });
}

export async function searchGames(query: string, options: SearchFilters = {}): Promise<SearchGamesResult> {
  const normalizedQuery = normalizeSearchQuery(query);
  const country = (options.country ?? "KR").trim().toUpperCase();
  const limit = clampLimit(options.limit);
  const provider: SearchSource = normalizedQuery && isItadConfigured() ? "itad" : "mock";
  const cacheKey = getSearchCacheKey({
    provider,
    query: normalizedQuery,
    country,
    limit,
    tag: options.tag,
    store: options.store
  });
  const cached = getSearchCache(cacheKey);

  if (cached) {
    return {
      ...cached,
      cache: {
        status: "hit",
        key: cacheKey,
        ttlSeconds: cached.ttlSeconds
      }
    };
  }

  let payload: Omit<SearchGamesResult, "cache">;

  if (provider === "itad") {
    try {
      payload = {
        source: "itad",
        query: normalizedQuery,
        normalized: true,
        games: filterGames(
          await withTimeout(
            searchItadGames(normalizedQuery, { country, results: limit }),
            5000,
            "ITAD search timed out."
          ),
          options
        )
      };
    } catch (error) {
      payload = {
        source: "mock",
        query: normalizedQuery,
        normalized: true,
        warning: getWarning(error),
        games: filterGames(searchMockGames(normalizedQuery), options).slice(0, limit)
      };
    }
  } else {
    payload = {
      source: "mock",
      query: normalizedQuery,
      normalized: true,
      games: filterGames(searchMockGames(normalizedQuery), options).slice(0, limit)
    };
  }

  setSearchCache(cacheKey, payload);

  return {
    ...payload,
    cache: {
      status: "miss",
      key: cacheKey,
      ttlSeconds: searchCacheConfig.ttlSeconds
    }
  };
}
