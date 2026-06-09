import "server-only";

import { withTimeout } from "@/lib/async-utils";
import type { GameSummary, StorePrice } from "@/types/game";

const STEAM_APPDETAILS_URL = "https://store.steampowered.com/api/appdetails";
const STEAM_STORE_SEARCH_URL = "https://store.steampowered.com/api/storesearch";
const STEAMSPY_APPDETAILS_URL = "https://steamspy.com/api.php";
const STEAM_METADATA_LOOKUP_LIMIT = 80;

type SteamPriceOverview = {
  currency?: string;
  initial?: number;
  final?: number;
  discount_percent?: number;
};

type SteamAppDetails = {
  success?: boolean;
  data?: {
    price_overview?: SteamPriceOverview;
    header_image?: string;
    genres?: Array<{ description?: string }>;
    categories?: Array<{ description?: string }>;
    release_date?: {
      coming_soon?: boolean;
      date?: string;
    };
  };
};

type SteamStoreSearchResponse = {
  items?: Array<{
    id?: number;
    name?: string;
  }>;
};

type SteamSpyAppDetails = {
  tags?: Record<string, number>;
};

const steamAppIdByTitleCache = new Map<string, number | undefined>();

function toUnknownPrice(price: StorePrice): StorePrice {
  return {
    ...price,
    regularPriceCents: 0,
    currentPriceCents: 0,
    discountPercent: 0,
    isHistoricalLow: false
  };
}

function applySteamPrice(game: GameSummary, overview: SteamPriceOverview | undefined) {
  return {
    ...game,
    prices: game.prices.map((price) => {
      if (price.store !== "steam") {
        return toUnknownPrice(price);
      }

      if (!overview || typeof overview.final !== "number") {
        return toUnknownPrice(price);
      }

      const currentPriceCents = overview.final;
      const regularPriceCents = typeof overview.initial === "number" && overview.initial > 0
        ? overview.initial
        : currentPriceCents;
      const discountPercent = overview.discount_percent ?? 0;

      return {
        ...price,
        regularPriceCents,
        currentPriceCents,
        currency: overview.currency ?? price.currency,
        discountPercent,
        isHistoricalLow: false
      };
    })
  };
}

function normalizeSteamTags(details: SteamAppDetails | undefined) {
  const data = details?.data;
  const rawTags = [
    ...(data?.genres ?? []).map((genre) => genre.description)
  ];

  return rawTags
    .filter((tag): tag is string => Boolean(tag && tag.trim()))
    .map((tag) => tag.trim())
    .filter((tag) => ![
      "Steam Achievements",
      "Steam Cloud",
      "Full controller support",
      "Partial Controller Support",
      "Remote Play Together",
      "Steam Trading Cards",
      "Steam Workshop",
      "Steam Leaderboards"
    ].includes(tag));
}

function filterSourceTags(tags: string[]) {
  return tags.filter((tag) => !["game", "package", "dlc"].includes(tag.toLowerCase()));
}

function getSteamReleaseMetadata(details: SteamAppDetails | undefined) {
  const releaseDate = details?.data?.release_date;

  if (!releaseDate) {
    return {};
  }

  return {
    releaseDate: releaseDate.date || undefined,
    releaseStatus: releaseDate.coming_soon ? "upcoming" as const : "released" as const
  };
}

function normalizeSteamTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\da-z]+/g, " ")
    .trim();
}

async function fetchSteamAppIdByTitle(title: string, country: string) {
  const cacheKey = `${country}:${normalizeSteamTitle(title)}`;

  if (steamAppIdByTitleCache.has(cacheKey)) {
    return steamAppIdByTitleCache.get(cacheKey);
  }

  const url = new URL(STEAM_STORE_SEARCH_URL);
  url.searchParams.set("term", title);
  url.searchParams.set("cc", country.toLowerCase());
  url.searchParams.set("l", "en");

  const response = await withTimeout(
    fetch(url, {
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    }),
    2500,
    "Steam app search timed out."
  );

  if (!response.ok) {
    throw new Error(`Steam app search failed with ${response.status}.`);
  }

  const data = (await response.json()) as SteamStoreSearchResponse;
  const normalizedTitle = normalizeSteamTitle(title);
  const exactMatch = data.items?.find((item) => item.id && normalizeSteamTitle(item.name ?? "") === normalizedTitle);
  const appId = exactMatch?.id ?? data.items?.find((item) => item.id)?.id;

  steamAppIdByTitleCache.set(cacheKey, appId);

  return appId;
}

async function resolveSteamAppIds(games: GameSummary[], country: string) {
  const lookups = games
    .filter((game) => !game.steamAppId)
    .slice(0, STEAM_METADATA_LOOKUP_LIMIT)
    .map(async (game) => {
      try {
        return [game.id, await fetchSteamAppIdByTitle(game.title, country)] as const;
      } catch {
        return [game.id, undefined] as const;
      }
    });

  const resolved = await Promise.all(lookups);

  return new Map(resolved.filter((entry): entry is readonly [string, number] => typeof entry[1] === "number"));
}

async function fetchSteamDetails(appId: number, country: string) {
  const url = new URL(STEAM_APPDETAILS_URL);
  url.searchParams.set("appids", String(appId));
  url.searchParams.set("cc", country.toLowerCase());
  url.searchParams.set("filters", "price_overview,basic,genres,categories");

  const response = await withTimeout(
    fetch(url, {
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    }),
    4500,
    "Steam price request timed out."
  );

  if (!response.ok) {
    throw new Error(`Steam price request failed with ${response.status}.`);
  }

  const data = (await response.json()) as Record<string, SteamAppDetails>;

  return data[String(appId)];
}

async function fetchSteamSpyTags(appId: number) {
  const url = new URL(STEAMSPY_APPDETAILS_URL);
  url.searchParams.set("request", "appdetails");
  url.searchParams.set("appid", String(appId));

  const response = await withTimeout(
    fetch(url, {
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    }),
    2500,
    "Steam tag request timed out."
  );

  if (!response.ok) {
    throw new Error(`Steam tag request failed with ${response.status}.`);
  }

  const data = (await response.json()) as SteamSpyAppDetails;

  return Object.entries(data.tags ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);
}

async function fetchSteamSpyTagMap(appIds: number[]) {
  const results = await Promise.allSettled(appIds.map(async (appId) => [appId, await fetchSteamSpyTags(appId)] as const));

  return new Map(
    results
      .filter((result): result is PromiseFulfilledResult<readonly [number, string[]]> => result.status === "fulfilled")
      .map((result) => result.value)
  );
}

async function fetchSteamPrices(appIds: number[], country: string) {
  if (!appIds.length) {
    return new Map<number, SteamAppDetails>();
  }

  const results = await Promise.allSettled(appIds.map(async (appId) => [appId, await fetchSteamDetails(appId, country)] as const));

  return new Map(
    results
      .filter((result): result is PromiseFulfilledResult<readonly [number, SteamAppDetails]> => result.status === "fulfilled")
      .map((result) => result.value)
  );
}

export async function refreshSteamPrices(games: GameSummary[], country = "KR") {
  if (process.env.NODE_ENV === "test") {
    return games;
  }

  const appIds = [...new Set(games.map((game) => game.steamAppId).filter((id): id is number => typeof id === "number"))];

  try {
    const pricesByAppId = await fetchSteamPrices(appIds, country);

    return games.map((game) => {
      if (!game.steamAppId) {
        return {
          ...game,
          prices: game.prices.map(toUnknownPrice)
        };
      }

      const details = pricesByAppId.get(game.steamAppId);

      return applySteamPrice(game, details?.data?.price_overview);
    });
  } catch {
    return games.map((game) => ({
      ...game,
      prices: game.prices.map(toUnknownPrice)
    }));
  }
}

export async function enrichSteamMetadata(games: GameSummary[], country = "KR") {
  if (process.env.NODE_ENV === "test") {
    return games;
  }

  try {
    const resolvedAppIds = await resolveSteamAppIds(games, country);
    const gamesWithSteamIds = games.map((game) => ({
      ...game,
      steamAppId: game.steamAppId ?? resolvedAppIds.get(game.id)
    }));
    const appIds = [
      ...new Set(gamesWithSteamIds.map((game) => game.steamAppId).filter((id): id is number => typeof id === "number"))
    ];
    const detailsByAppId = await fetchSteamPrices(appIds, country);
    const steamSpyTagsByAppId = await fetchSteamSpyTagMap(appIds);

    return gamesWithSteamIds.map((game) => {
      const details = game.steamAppId ? detailsByAppId.get(game.steamAppId) : undefined;
      const releaseMetadata = getSteamReleaseMetadata(details);
      const steamTags = [
        ...(game.steamAppId ? steamSpyTagsByAppId.get(game.steamAppId) ?? [] : []),
        ...normalizeSteamTags(details)
      ];

      return {
        ...game,
        ...releaseMetadata,
        imageUrl: details?.data?.header_image || game.imageUrl || "",
        tags: [
          ...new Set([
            ...filterSourceTags(game.tags),
            ...steamTags
          ])
        ]
      };
    });
  } catch {
    return games.map((game) => ({
      ...game,
      tags: filterSourceTags(game.tags)
    }));
  }
}
