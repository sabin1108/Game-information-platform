import type { Json } from "@/lib/supabase/types";

export type AiInsightType =
  | "historical_low"
  | "deep_discount"
  | "high_review_discount";

export type StoredInsightSnapshot = {
  snapshotId: string;
  productId: string;
  gameId: string;
  title: string;
  store: "steam" | "epic" | "itad";
  country: string;
  currency: string;
  regularPriceCents: number | null;
  currentPriceCents: number | null;
  discountPercent: number | null;
  isHistoricalLow: boolean;
  observedAt: string;
  steamReviewCount: number | null;
  steamPositiveRatio: number | null;
};

export type AiInsightEvidence = StoredInsightSnapshot & {
  reason: string;
};

export type AiInsightCandidate = {
  gameId: string;
  insightType: AiInsightType;
  score: number;
  evidence: AiInsightEvidence;
};

const MIN_HISTORICAL_LOW_DISCOUNT = 10;
const MIN_DEEP_DISCOUNT = 50;
const MIN_HIGH_REVIEW_DISCOUNT = 20;
const MIN_HIGH_REVIEW_COUNT = 1_000;
const MIN_HIGH_REVIEW_POSITIVE_RATIO = 75;

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function reviewSignal(snapshot: StoredInsightSnapshot) {
  const reviewCount = snapshot.steamReviewCount ?? 0;
  const positiveRatio = snapshot.steamPositiveRatio ?? 0;

  return Math.log10(reviewCount + 1) * Math.max(0, positiveRatio);
}

function hasStoredPriceEvidence(snapshot: StoredInsightSnapshot) {
  return Boolean(
    snapshot.gameId &&
      snapshot.productId &&
      snapshot.snapshotId &&
      snapshot.currentPriceCents &&
      snapshot.currentPriceCents > 0 &&
      snapshot.regularPriceCents &&
      snapshot.regularPriceCents > 0 &&
      snapshot.discountPercent !== null &&
      snapshot.discountPercent >= 0
  );
}

function evidenceWithReason(snapshot: StoredInsightSnapshot, reason: string): AiInsightEvidence {
  return {
    ...snapshot,
    reason
  };
}

function buildHistoricalLowCandidate(snapshot: StoredInsightSnapshot): AiInsightCandidate | null {
  const discount = snapshot.discountPercent ?? 0;

  if (!snapshot.isHistoricalLow || discount < MIN_HISTORICAL_LOW_DISCOUNT) {
    return null;
  }

  return {
    gameId: snapshot.gameId,
    insightType: "historical_low",
    score: clampScore(72 + discount * 0.35 + reviewSignal(snapshot) / 80),
    evidence: evidenceWithReason(snapshot, "stored snapshot is marked as historical low")
  };
}

function buildDeepDiscountCandidate(snapshot: StoredInsightSnapshot): AiInsightCandidate | null {
  const discount = snapshot.discountPercent ?? 0;

  if (discount < MIN_DEEP_DISCOUNT) {
    return null;
  }

  return {
    gameId: snapshot.gameId,
    insightType: "deep_discount",
    score: clampScore(38 + discount * 0.85 + reviewSignal(snapshot) / 120),
    evidence: evidenceWithReason(snapshot, "stored snapshot discount crosses deep discount threshold")
  };
}

function buildHighReviewDiscountCandidate(snapshot: StoredInsightSnapshot): AiInsightCandidate | null {
  const discount = snapshot.discountPercent ?? 0;
  const reviewCount = snapshot.steamReviewCount ?? 0;
  const positiveRatio = snapshot.steamPositiveRatio ?? 0;

  if (
    discount < MIN_HIGH_REVIEW_DISCOUNT ||
    reviewCount < MIN_HIGH_REVIEW_COUNT ||
    positiveRatio < MIN_HIGH_REVIEW_POSITIVE_RATIO
  ) {
    return null;
  }

  return {
    gameId: snapshot.gameId,
    insightType: "high_review_discount",
    score: clampScore(34 + discount * 0.45 + reviewSignal(snapshot) / 45),
    evidence: evidenceWithReason(snapshot, "stored review metrics and discount both cross quality threshold")
  };
}

export function toInsightEvidenceJson(evidence: AiInsightEvidence): Json {
  return JSON.parse(JSON.stringify(evidence)) as Json;
}

export function buildDeterministicInsightCandidates(
  snapshots: StoredInsightSnapshot[],
  limit = 24
): AiInsightCandidate[] {
  const candidates = snapshots
    .filter(hasStoredPriceEvidence)
    .flatMap((snapshot) => [
      buildHistoricalLowCandidate(snapshot),
      buildDeepDiscountCandidate(snapshot),
      buildHighReviewDiscountCandidate(snapshot)
    ])
    .filter((candidate): candidate is AiInsightCandidate => Boolean(candidate))
    .sort((a, b) => b.score - a.score || a.gameId.localeCompare(b.gameId));

  return candidates.slice(0, limit);
}
