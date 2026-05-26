export type StoreCode = "steam" | "epic" | "itad";

export type ReleaseStatus = "released" | "upcoming" | "unknown";

export type StorePrice = {
  store: StoreCode;
  storeName: string;
  regularPriceCents: number;
  currentPriceCents: number;
  currency: string;
  discountPercent: number;
  url: string;
  isHistoricalLow?: boolean;
  endsAt?: string;
};

export type StoreProduct = StorePrice;

export type GameSummary = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  releaseDate?: string;
  releaseStatus: ReleaseStatus;
  tags: string[];
  steamReviewCount?: number;
  steamPositiveRatio?: number;
  rankScore?: number;
  prices: StorePrice[];
};

export type WatchlistItem = {
  id: string;
  game: GameSummary;
  targetPriceCents?: number;
  targetDiscountPercent?: number;
  note?: string;
};
