import type { GameSummary, StoreCode, StoreProduct } from "@/types/game";

const ITAD_WEB_URL = "https://isthereanydeal.com";

export type ItadAssetMap = {
  boxart?: string;
  banner145?: string;
  banner300?: string;
  banner400?: string;
  banner600?: string;
};

export type ItadGame = {
  id: string;
  slug?: string;
  title: string;
  type?: string | null;
  mature?: boolean;
  assets?: ItadAssetMap;
  position?: number;
  count?: number;
};

export type ItadMoney = {
  amount?: number;
  amountInt?: number;
  currency?: string;
};

export type ItadStoreOffer = {
  shop?: {
    id?: number;
    name?: string;
  };
  price?: ItadMoney;
  regular?: ItadMoney;
  cut?: number;
  historyLow?: ItadMoney;
  storeLow?: ItadMoney;
  expiry?: string | null;
  url?: string;
};

export type ItadPriceRow = {
  id: string;
  historyLow?: {
    all?: ItadMoney;
    y1?: ItadMoney;
    m3?: ItadMoney;
  };
  deals?: ItadStoreOffer[];
};

export function getItadGameUrl(game: Pick<ItadGame, "slug" | "id">) {
  return game.slug ? `${ITAD_WEB_URL}/game/${game.slug}/` : `${ITAD_WEB_URL}/game/${game.id}/`;
}

export function getItadImageUrl(assets: ItadAssetMap | undefined) {
  return assets?.banner600 ?? assets?.banner400 ?? assets?.banner300 ?? assets?.boxart ?? "";
}

export function toStoreCode(storeName: string | undefined): StoreCode {
  const normalized = storeName?.toLowerCase() ?? "";

  if (normalized.includes("steam")) {
    return "steam";
  }

  if (normalized.includes("epic")) {
    return "epic";
  }

  return "itad";
}

export function toUnknownStoreProduct(game: ItadGame): StoreProduct {
  return {
    store: "itad",
    storeName: "IsThereAnyDeal",
    regularPriceCents: 0,
    currentPriceCents: 0,
    currency: "USD",
    discountPercent: 0,
    url: getItadGameUrl(game)
  };
}

export function toStoreProduct(game: ItadGame, offer: ItadStoreOffer, historyLow?: ItadMoney): StoreProduct {
  const storeName = offer.shop?.name ?? "IsThereAnyDeal";
  const currentPriceCents = offer.price?.amountInt ?? 0;
  const regularPriceCents = offer.regular?.amountInt ?? currentPriceCents;
  const historyLowCents = offer.historyLow?.amountInt ?? offer.storeLow?.amountInt ?? historyLow?.amountInt;

  return {
    store: toStoreCode(storeName),
    storeName,
    regularPriceCents,
    currentPriceCents,
    currency: offer.price?.currency ?? offer.regular?.currency ?? historyLow?.currency ?? "USD",
    discountPercent: offer.cut ?? 0,
    url: offer.url ?? getItadGameUrl(game),
    isHistoricalLow: Boolean(historyLowCents && currentPriceCents && currentPriceCents <= historyLowCents),
    endsAt: offer.expiry ?? undefined
  };
}

function getStorePriority(price: StoreProduct) {
  if (price.store === "steam") {
    return 0;
  }

  if (price.store === "epic") {
    return 1;
  }

  return 2;
}

function selectStoreProducts(game: ItadGame, priceRow: ItadPriceRow | undefined) {
  const historyLow = priceRow?.historyLow?.all;
  const products = (priceRow?.deals ?? [])
    .map((offer) => toStoreProduct(game, offer, historyLow))
    .filter((product) => product.currentPriceCents > 0 || product.regularPriceCents > 0)
    .sort((a, b) => {
      const priorityDiff = getStorePriority(a) - getStorePriority(b);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const discountDiff = b.discountPercent - a.discountPercent;

      if (discountDiff !== 0) {
        return discountDiff;
      }

      return a.currentPriceCents - b.currentPriceCents;
    });

  const deduped = new Map<string, StoreProduct>();

  for (const product of products) {
    const key = product.storeName.toLowerCase();

    if (!deduped.has(key)) {
      deduped.set(key, product);
    }
  }

  const selected = [...deduped.values()].slice(0, 4);

  return selected.length ? selected : [toUnknownStoreProduct(game)];
}

export function normalizeItadGame(game: ItadGame, priceRow?: ItadPriceRow): GameSummary {
  return {
    id: game.id,
    title: game.title,
    slug: game.slug ?? game.id,
    imageUrl: getItadImageUrl(game.assets),
    releaseStatus: "unknown",
    tags: game.type ? [game.type] : ["Game"],
    steamReviewCount: game.count,
    prices: selectStoreProducts(game, priceRow)
  };
}
