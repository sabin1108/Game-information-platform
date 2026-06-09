import "server-only";

import { clampNumber, getErrorMessage, withTimeout } from "@/lib/async-utils";
import { isItadConfigured } from "@/lib/env";
import { searchItadGames } from "@/lib/itad";
import { searchMockGames } from "@/lib/mock-data";
import {
  getSearchCache,
  getSearchCacheKey,
  getStaleSearchCache,
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

function clampLimit(value: number | undefined) {
  return clampNumber(value, 40, 1, 100);
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
  const stale = getStaleSearchCache(cacheKey);

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
      if (stale) {
        return {
          ...stale,
          warning: getErrorMessage(error, "ITAD request failed."),
          cache: {
            status: "stale",
            key: cacheKey,
            ttlSeconds: stale.ttlSeconds
          }
        };
      }

      payload = {
        source: "mock",
        query: normalizedQuery,
        normalized: true,
        warning: getErrorMessage(error, "ITAD request failed."),
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
