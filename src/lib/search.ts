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

function getWarning(error: unknown) {
  return error instanceof Error ? error.message : "ITAD request failed.";
}

function clampLimit(value: number | undefined) {
  if (!value || Number.isNaN(value)) {
    return 20;
  }

  return Math.min(50, Math.max(1, Math.floor(value)));
}

export async function searchGames(query: string, options: {
  country?: string;
  limit?: number;
} = {}): Promise<SearchGamesResult> {
  const normalizedQuery = normalizeSearchQuery(query);
  const country = (options.country ?? "KR").trim().toUpperCase();
  const limit = clampLimit(options.limit);
  const provider: SearchSource = normalizedQuery && isItadConfigured() ? "itad" : "mock";
  const cacheKey = getSearchCacheKey({
    provider,
    query: normalizedQuery,
    country,
    limit
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
        games: await searchItadGames(normalizedQuery, { country, results: limit })
      };
    } catch (error) {
      payload = {
        source: "mock",
        query: normalizedQuery,
        normalized: true,
        warning: getWarning(error),
        games: searchMockGames(normalizedQuery).slice(0, limit)
      };
    }
  } else {
    payload = {
      source: "mock",
      query: normalizedQuery,
      normalized: true,
      games: searchMockGames(normalizedQuery).slice(0, limit)
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
