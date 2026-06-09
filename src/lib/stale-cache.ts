export type TimedCacheEntry = {
  expiresAt: number;
  staleUntil: number;
};

type CacheHit<T> = {
  entry: T;
  ttlSeconds: number;
};

function touchCacheEntry<T extends TimedCacheEntry>(
  cache: Map<string, T>,
  key: string,
  entry: T,
  expiresAt: number,
  now: number
): CacheHit<T> {
  cache.delete(key);
  cache.set(key, entry);

  return {
    entry,
    ttlSeconds: Math.max(0, Math.ceil((expiresAt - now) / 1000))
  };
}

export function getFreshCacheEntry<T extends TimedCacheEntry>(
  cache: Map<string, T>,
  key: string,
  now = Date.now()
) {
  const entry = cache.get(key);

  if (!entry || entry.expiresAt <= now) {
    return null;
  }

  return touchCacheEntry(cache, key, entry, entry.expiresAt, now);
}

export function getStaleCacheEntry<T extends TimedCacheEntry>(
  cache: Map<string, T>,
  key: string,
  now = Date.now()
) {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.staleUntil <= now) {
    cache.delete(key);
    return null;
  }

  return touchCacheEntry(cache, key, entry, entry.staleUntil, now);
}

export function trimOldestCacheEntries<T>(cache: Map<string, T>, maxEntries: number) {
  while (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value;

    if (!oldestKey) {
      break;
    }

    cache.delete(oldestKey);
  }
}
