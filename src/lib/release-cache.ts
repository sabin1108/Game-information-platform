import type { GameFeed } from "@/lib/game-feeds";
import type { StoreCode } from "@/types/game";

const RELEASE_CACHE_TTL_MS = 5 * 60 * 1000;
const RELEASE_CACHE_MAX_ENTRIES = 60;
const RELEASE_CACHE_SCHEMA_VERSION = "v2";

export type ReleaseCacheStatus = "hit" | "miss";

export type ReleaseFilterState = {
  country: string;
  limit: number;
  tag?: string;
  store?: StoreCode;
};

type ReleaseCacheEntry = GameFeed & {
  expiresAt: number;
};

const releaseCache = new Map<string, ReleaseCacheEntry>();

export function getReleaseCacheKey(provider: GameFeed["source"], filters: ReleaseFilterState) {
  return [
    RELEASE_CACHE_SCHEMA_VERSION,
    provider,
    filters.country,
    String(filters.limit),
    filters.tag?.toLowerCase() ?? "all-tags",
    filters.store ?? "all-stores"
  ].join(":");
}

export function getReleaseCache(key: string, now = Date.now()) {
  const entry = releaseCache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= now) {
    releaseCache.delete(key);
    return null;
  }

  releaseCache.delete(key);
  releaseCache.set(key, entry);

  return {
    source: entry.source,
    games: entry.games,
    warning: entry.warning,
    ttlSeconds: Math.max(0, Math.ceil((entry.expiresAt - now) / 1000))
  };
}

export function setReleaseCache(key: string, payload: GameFeed, now = Date.now()) {
  releaseCache.set(key, {
    ...payload,
    expiresAt: now + RELEASE_CACHE_TTL_MS
  });

  while (releaseCache.size > RELEASE_CACHE_MAX_ENTRIES) {
    const oldestKey = releaseCache.keys().next().value;

    if (!oldestKey) {
      break;
    }

    releaseCache.delete(oldestKey);
  }
}

export function clearReleaseCacheForTests() {
  releaseCache.clear();
}

export const releaseCacheConfig = {
  ttlSeconds: RELEASE_CACHE_TTL_MS / 1000,
  maxEntries: RELEASE_CACHE_MAX_ENTRIES
};
