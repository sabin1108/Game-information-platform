import type { GameSummary } from "@/types/game";

const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const SEARCH_CACHE_MAX_ENTRIES = 100;

export type SearchSource = "itad" | "mock";
export type SearchCacheStatus = "hit" | "miss";

export type SearchCacheKeyInput = {
  query: string;
  country: string;
  limit: number;
  provider: SearchSource;
  tag?: string;
  store?: string;
};

export type SearchCachePayload = {
  source: SearchSource;
  query: string;
  normalized: true;
  games: GameSummary[];
  warning?: string;
};

type SearchCacheEntry = SearchCachePayload & {
  expiresAt: number;
};

const searchCache = new Map<string, SearchCacheEntry>();

export function normalizeSearchQuery(query: string) {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

export function getSearchCacheKey(input: SearchCacheKeyInput) {
  return [
    input.provider,
    normalizeSearchQuery(input.query),
    input.country.trim().toUpperCase(),
    String(input.limit),
    normalizeSearchQuery(input.tag ?? ""),
    normalizeSearchQuery(input.store ?? "")
  ].join(":");
}

export function getSearchCache(key: string, now = Date.now()) {
  const entry = searchCache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= now) {
    searchCache.delete(key);
    return null;
  }

  searchCache.delete(key);
  searchCache.set(key, entry);

  return {
    source: entry.source,
    query: entry.query,
    normalized: entry.normalized,
    games: entry.games,
    warning: entry.warning,
    ttlSeconds: Math.max(0, Math.ceil((entry.expiresAt - now) / 1000))
  };
}

export function setSearchCache(key: string, payload: SearchCachePayload, now = Date.now()) {
  searchCache.set(key, {
    ...payload,
    expiresAt: now + SEARCH_CACHE_TTL_MS
  });

  while (searchCache.size > SEARCH_CACHE_MAX_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;

    if (!oldestKey) {
      break;
    }

    searchCache.delete(oldestKey);
  }
}

export function clearSearchCacheForTests() {
  searchCache.clear();
}

export const searchCacheConfig = {
  ttlSeconds: SEARCH_CACHE_TTL_MS / 1000,
  maxEntries: SEARCH_CACHE_MAX_ENTRIES
};
