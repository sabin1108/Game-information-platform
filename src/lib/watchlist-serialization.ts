import type { GameSummary, StoreCode, StorePrice } from "@/types/game";

const allowedStores = new Set<StoreCode>(["steam", "epic", "itad"]);
const allowedReleaseStatuses = new Set(["released", "upcoming", "unknown"]);

function asString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required.`);
  }

  return value;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asNumber(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number.`);
  }

  return value;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
}

function parseStorePrice(value: unknown): StorePrice {
  if (!value || typeof value !== "object") {
    throw new Error("price must be an object.");
  }

  const price = value as Partial<StorePrice>;
  const store = asString(price.store, "store") as StoreCode;

  if (!allowedStores.has(store)) {
    throw new Error("store is not supported.");
  }

  return {
    store,
    storeName: asString(price.storeName, "storeName"),
    regularPriceCents: asNumber(price.regularPriceCents, "regularPriceCents"),
    currentPriceCents: asNumber(price.currentPriceCents, "currentPriceCents"),
    currency: asString(price.currency, "currency"),
    discountPercent: asNumber(price.discountPercent, "discountPercent"),
    url: asString(price.url, "url"),
    isHistoricalLow: Boolean(price.isHistoricalLow),
    endsAt: asOptionalString(price.endsAt)
  };
}

export function serializeGameForWatchlist(game: GameSummary) {
  return JSON.stringify(game);
}

export function parseGameForWatchlist(value: FormDataEntryValue | null): GameSummary {
  if (typeof value !== "string") {
    throw new Error("game is required.");
  }

  const parsed = JSON.parse(value) as Partial<GameSummary>;
  const releaseStatus = parsed.releaseStatus ?? "unknown";

  if (!allowedReleaseStatuses.has(releaseStatus)) {
    throw new Error("releaseStatus is not supported.");
  }

  return {
    id: asString(parsed.id, "id"),
    title: asString(parsed.title, "title"),
    slug: asString(parsed.slug, "slug"),
    imageUrl: typeof parsed.imageUrl === "string" ? parsed.imageUrl : "",
    releaseDate: asOptionalString(parsed.releaseDate),
    releaseStatus,
    tags: asStringArray(parsed.tags),
    steamReviewCount: typeof parsed.steamReviewCount === "number" ? parsed.steamReviewCount : undefined,
    steamPositiveRatio: typeof parsed.steamPositiveRatio === "number" ? parsed.steamPositiveRatio : undefined,
    rankScore: typeof parsed.rankScore === "number" ? parsed.rankScore : undefined,
    prices: Array.isArray(parsed.prices) ? parsed.prices.map(parseStorePrice) : []
  };
}
