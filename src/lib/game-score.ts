import type { GameSummary, StorePrice, WatchlistItem } from "@/types/game";

export function getBestPrice(game: GameSummary) {
  const pricedOffers = game.prices.filter((price) => price.currentPriceCents > 0);

  return pricedOffers.reduce<StorePrice | undefined>((best, price) => {
    if (!best) {
      return price;
    }

    return price.currentPriceCents < best.currentPriceCents ? price : best;
  }, undefined);
}

export function getTargetMatchState(item: WatchlistItem) {
  const bestPrice = getBestPrice(item.game);

  if (!bestPrice) {
    return {
      bestPrice,
      matched: false,
      priceMatched: false,
      discountMatched: false
    };
  }

  const priceMatched =
    typeof item.targetPriceCents === "number" &&
    bestPrice.currentPriceCents <= item.targetPriceCents;

  const discountMatched =
    typeof item.targetDiscountPercent === "number" &&
    bestPrice.discountPercent >= item.targetDiscountPercent;

  return {
    bestPrice,
    matched: priceMatched || discountMatched,
    priceMatched,
    discountMatched
  };
}

export function isTargetMatched(item: WatchlistItem) {
  return getTargetMatchState(item).matched;
}

export function sortWatchlistByTargetStatus(items: WatchlistItem[]) {
  return [...items].sort((a, b) => {
    const aState = getTargetMatchState(a);
    const bState = getTargetMatchState(b);

    if (aState.matched !== bState.matched) {
      return aState.matched ? -1 : 1;
    }

    const aDiscount = aState.bestPrice?.discountPercent ?? 0;
    const bDiscount = bState.bestPrice?.discountPercent ?? 0;

    if (aDiscount !== bDiscount) {
      return bDiscount - aDiscount;
    }

    return a.game.title.localeCompare(b.game.title);
  });
}

export function calculatePopularScore(game: GameSummary) {
  const reviewCount = game.steamReviewCount ?? 0;
  const positiveRatio = game.steamPositiveRatio ?? 0;
  const bestDiscount = Math.max(0, ...game.prices.map((price) => price.discountPercent));
  const recentReleaseBonus = game.releaseStatus === "released" && game.releaseDate ? 6 : 0;

  return Math.round(
    Math.log10(reviewCount + 1) * 22 +
      positiveRatio * 0.4 +
      bestDiscount * 0.25 +
      recentReleaseBonus
  );
}
