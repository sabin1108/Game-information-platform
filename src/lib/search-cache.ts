import type { GameSummary } from "@/types/game";
import { getFreshCacheEntry, getStaleCacheEntry, trimOldestCacheEntries } from "@/lib/stale-cache";

const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const SEARCH_CACHE_STALE_TTL_MS = 6 * 60 * 60 * 1000;
const SEARCH_CACHE_MAX_ENTRIES = 100;

export type SearchSource = "itad" | "mock";
export type SearchCacheStatus = "hit" | "miss" | "stale";

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
  staleUntil: number;
};

const searchCache = new Map<string, SearchCacheEntry>();

function toSearchCachePayload(entry: SearchCacheEntry, ttlSeconds: number) {
  return {
    source: entry.source,
    query: entry.query,
    normalized: entry.normalized,
    games: entry.games,
    warning: entry.warning,
    ttlSeconds
  };
}

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
  const cached = getFreshCacheEntry(searchCache, key, now);

  return cached ? toSearchCachePayload(cached.entry, cached.ttlSeconds) : null;
}

export function getStaleSearchCache(key: string, now = Date.now()) {
  const cached = getStaleCacheEntry(searchCache, key, now);

  return cached ? toSearchCachePayload(cached.entry, cached.ttlSeconds) : null;
}

export function setSearchCache(key: string, payload: SearchCachePayload, now = Date.now()) {
  searchCache.set(key, {
    ...payload,
    expiresAt: now + SEARCH_CACHE_TTL_MS,
    staleUntil: now + SEARCH_CACHE_STALE_TTL_MS
  });

  trimOldestCacheEntries(searchCache, SEARCH_CACHE_MAX_ENTRIES);
}

export function clearSearchCacheForTests() {
  searchCache.clear();
}

export const searchCacheConfig = {
  ttlSeconds: SEARCH_CACHE_TTL_MS / 1000,
  staleTtlSeconds: SEARCH_CACHE_STALE_TTL_MS / 1000,
  maxEntries: SEARCH_CACHE_MAX_ENTRIES
};
