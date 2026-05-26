import "server-only";

import { requireItadEnv } from "@/lib/env";
import {
  getItadGameUrl,
  normalizeItadGame,
  type ItadGame,
  type ItadPriceRow,
  type ItadStoreOffer
} from "@/lib/itad-normalizers";

const ITAD_BASE_URL = "https://api.isthereanydeal.com";

type ItadDeal = ItadGame & {
  deal?: ItadStoreOffer;
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

function toDealOffer(game: ItadDeal): ItadStoreOffer {
  const storeName = game.deal?.shop?.name ?? "IsThereAnyDeal";

  return {
    ...game.deal,
    shop: {
      ...game.deal?.shop,
      name: storeName
    },
    url: game.deal?.url ?? getItadGameUrl(game)
  };
}

function toDealPriceRow(game: ItadDeal): ItadPriceRow {
  return {
    id: game.id,
    historyLow: {
      all: game.deal?.historyLow
    },
    deals: [toDealOffer(game)]
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

async function getItadPrices(gameIds: string[], country: string) {
  if (!gameIds.length) {
    return new Map<string, ItadPriceRow>();
  }

  const rows = await fetchItadJson<ItadPriceRow[]>("/games/prices/v3", {
    search: {
      country,
      deals: false,
      vouchers: true,
      capacity: 20
    },
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(gameIds)
    }
  });

  return new Map(rows.map((row) => [row.id, row]));
}

export async function searchItadGames(query: string, options: {
  results?: number;
  country?: string;
} = {}) {
  const data = await fetchItadJson<ItadGame[]>("/games/search/v1", {
    search: {
      title: query,
      results: options.results ?? 20
    }
  });
  const pricesByGame = await getItadPrices(
    data.map((game) => game.id),
    options.country ?? "KR"
  );

  return data.map((game) => normalizeItadGame(game, pricesByGame.get(game.id)));
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

  return (data.list ?? []).map((game) => normalizeItadGame(game, toDealPriceRow(game)));
}

export async function getItadPopular(limit = 12) {
  const data = await fetchItadJson<ItadGame[]>("/stats/most-popular/v1", {
    search: {
      limit
    }
  });

  return data.map((game) => normalizeItadGame(game));
}
