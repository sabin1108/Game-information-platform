import type { GameSummary, WatchlistItem } from "@/types/game";

export function getBestPrice(game: GameSummary) {
  return game.prices.reduce((best, price) => {
    if (!best) {
      return price;
    }

    return price.currentPriceCents < best.currentPriceCents ? price : best;
  }, game.prices[0]);
}

export function isTargetMatched(item: WatchlistItem) {
  const bestPrice = getBestPrice(item.game);

  if (!bestPrice) {
    return false;
  }

  const priceMatched =
    typeof item.targetPriceCents === "number" &&
    bestPrice.currentPriceCents <= item.targetPriceCents;

  const discountMatched =
    typeof item.targetDiscountPercent === "number" &&
    bestPrice.discountPercent >= item.targetDiscountPercent;

  return priceMatched || discountMatched;
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
