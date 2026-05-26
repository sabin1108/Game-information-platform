import "server-only";

import { requireItadEnv } from "@/lib/env";
import type { GameSummary, StoreCode, StorePrice } from "@/types/game";

const ITAD_BASE_URL = "https://api.isthereanydeal.com";
const ITAD_WEB_URL = "https://isthereanydeal.com";

type ItadAssetMap = {
  boxart?: string;
  banner145?: string;
  banner300?: string;
  banner400?: string;
  banner600?: string;
};

type ItadGame = {
  id: string;
  slug?: string;
  title: string;
  type?: string | null;
  mature?: boolean;
  assets?: ItadAssetMap;
  position?: number;
  count?: number;
};

type ItadMoney = {
  amount?: number;
  amountInt?: number;
  currency?: string;
};

type ItadDeal = ItadGame & {
  deal?: {
    shop?: {
      id?: number;
      name?: string;
    };
    price?: ItadMoney;
    regular?: ItadMoney;
    cut?: number;
    historyLow?: ItadMoney;
    expiry?: string | null;
    url?: string;
  };
};

type ItadDealsResponse = {
  list?: ItadDeal[];
  nextOffset?: number;
  hasMore?: boolean;
};

type FetchItadOptions = {
  search?: Record<string, string | number | boolean | undefined>;
  init?: RequestInit;
  timeoutMs?: number;
};

function getGameUrl(game: Pick<ItadGame, "slug" | "id">) {
  return game.slug ? `${ITAD_WEB_URL}/game/${game.slug}/` : `${ITAD_WEB_URL}/game/${game.id}/`;
}

function getImageUrl(assets: ItadAssetMap | undefined) {
  return assets?.banner600 ?? assets?.banner400 ?? assets?.banner300 ?? assets?.boxart ?? "";
}

function toStoreCode(storeName: string | undefined): StoreCode {
  const normalized = storeName?.toLowerCase() ?? "";

  if (normalized.includes("steam")) {
    return "steam";
  }

  if (normalized.includes("epic")) {
    return "epic";
  }

  return "itad";
}

function toUnknownPrice(game: ItadGame): StorePrice {
  return {
    store: "itad",
    storeName: "IsThereAnyDeal",
    regularPriceCents: 0,
    currentPriceCents: 0,
    currency: "USD",
    discountPercent: 0,
    url: getGameUrl(game)
  };
}

function toDealPrice(game: ItadDeal): StorePrice {
  const storeName = game.deal?.shop?.name ?? "IsThereAnyDeal";
  const currentPriceCents = game.deal?.price?.amountInt ?? 0;
  const regularPriceCents = game.deal?.regular?.amountInt ?? currentPriceCents;
  const historyLowCents = game.deal?.historyLow?.amountInt;

  return {
    store: toStoreCode(storeName),
    storeName,
    regularPriceCents,
    currentPriceCents,
    currency: game.deal?.price?.currency ?? game.deal?.regular?.currency ?? "USD",
    discountPercent: game.deal?.cut ?? 0,
    url: game.deal?.url ?? getGameUrl(game),
    isHistoricalLow: Boolean(historyLowCents && currentPriceCents && currentPriceCents <= historyLowCents),
    endsAt: game.deal?.expiry ?? undefined
  };
}

function toGameSummary(game: ItadGame, prices: StorePrice[]): GameSummary {
  return {
    id: game.id,
    title: game.title,
    slug: game.slug ?? game.id,
    imageUrl: getImageUrl(game.assets),
    releaseStatus: "unknown",
    tags: game.type ? [game.type] : ["Game"],
    steamReviewCount: game.count,
    prices
  };
}

async function fetchItadJson<T>(path: string, options: FetchItadOptions = {}) {
  const { apiKey } = requireItadEnv();
  const url = new URL(path, ITAD_BASE_URL);

  Object.entries(options.search ?? {}).forEach(([key, value]) => {
    if (typeof value !== "undefined") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    ...options.init,
    headers: {
      Accept: "application/json",
      "ITAD-API-Key": apiKey,
      ...options.init?.headers
    },
    cache: "no-store",
    signal: options.init?.signal ?? AbortSignal.timeout(options.timeoutMs ?? 6000)
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(`ITAD returned ${response.status} ${contentType || "unknown content-type"} instead of JSON.`);
  }

  let data: unknown;

  try {
    data = JSON.parse(body);
  } catch {
    throw new Error("ITAD returned invalid JSON.");
  }

  if (!response.ok) {
    throw new Error(`ITAD request failed with ${response.status}.`);
  }

  return data as T;
}

export async function searchItadGames(query: string, results = 20) {
  const data = await fetchItadJson<ItadGame[]>("/games/search/v1", {
    search: {
      title: query,
      results
    }
  });

  return data.map((game) => toGameSummary(game, [toUnknownPrice(game)]));
}

export async function getItadDeals(options: {
  country?: string;
  limit?: number;
  minDiscount?: number;
} = {}) {
  const data = await fetchItadJson<ItadDealsResponse>("/deals/v2", {
    search: {
      country: options.country ?? "KR",
      limit: options.limit ?? 20,
      sort: "-cut",
      filter: typeof options.minDiscount === "number"
        ? JSON.stringify({ cut: { min: options.minDiscount, max: null } })
        : undefined
    }
  });

  return (data.list ?? []).map((game) => toGameSummary(game, [toDealPrice(game)]));
}

export async function getItadPopular(limit = 12) {
  const data = await fetchItadJson<ItadGame[]>("/stats/most-popular/v1", {
    search: {
      limit
    }
  });

  return data.map((game) => toGameSummary(game, [toUnknownPrice(game)]));
}
