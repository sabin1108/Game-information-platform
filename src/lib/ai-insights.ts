import "server-only";

import { env, isSupabaseConfigured } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/types";

const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

type InsightRow = Database["public"]["Tables"]["ai_game_insights"]["Row"] & {
  games?: {
    title: string;
  } | null;
  ai_insight_runs?: {
    status: string;
    completed_at: string | null;
  } | null;
};

export type PublicAiInsightEvidence = {
  title?: string;
  store?: string;
  country?: string;
  currency?: string;
  regularPriceCents?: number | null;
  currentPriceCents?: number | null;
  discountPercent?: number | null;
  isHistoricalLow?: boolean;
  observedAt?: string;
  steamReviewCount?: number | null;
  steamPositiveRatio?: number | null;
  reason?: string;
};

export type PublicAiInsight = {
  id: string;
  gameId: string;
  gameTitle: string;
  insightType: string;
  title: string;
  summary: string;
  confidence: number | null;
  createdAt: string;
  generatedAt: string | null;
  isStale: boolean;
  staleReason: string | null;
  evidence: PublicAiInsightEvidence;
  evidenceLabel: string;
};

export type PublicAiInsightFeed = {
  data: PublicAiInsight[];
  warning?: string;
};

function isRecord(value: Json | undefined): value is Record<string, Json | undefined> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function numberOrNull(value: Json | undefined) {
  return typeof value === "number" ? value : null;
}

function stringOrUndefined(value: Json | undefined) {
  return typeof value === "string" ? value : undefined;
}

function booleanOrUndefined(value: Json | undefined) {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeEvidence(value: Json): PublicAiInsightEvidence {
  const evidence = isRecord(value) ? value : {};

  return {
    title: stringOrUndefined(evidence.title),
    store: stringOrUndefined(evidence.store),
    country: stringOrUndefined(evidence.country),
    currency: stringOrUndefined(evidence.currency),
    regularPriceCents: numberOrNull(evidence.regularPriceCents),
    currentPriceCents: numberOrNull(evidence.currentPriceCents),
    discountPercent: numberOrNull(evidence.discountPercent),
    isHistoricalLow: booleanOrUndefined(evidence.isHistoricalLow),
    observedAt: stringOrUndefined(evidence.observedAt),
    steamReviewCount: numberOrNull(evidence.steamReviewCount),
    steamPositiveRatio: numberOrNull(evidence.steamPositiveRatio),
    reason: stringOrUndefined(evidence.reason)
  };
}

function getStaleReason(evidence: PublicAiInsightEvidence, now: Date) {
  if (!evidence.observedAt) {
    return "근거 가격 snapshot 시간이 없어 현재가처럼 표시하지 않습니다.";
  }

  const observedAt = new Date(evidence.observedAt);

  if (!Number.isFinite(observedAt.getTime())) {
    return "근거 가격 snapshot 시간이 유효하지 않습니다.";
  }

  if (now.getTime() - observedAt.getTime() > STALE_AFTER_MS) {
    return "근거 가격 snapshot이 7일보다 오래되었습니다.";
  }

  return null;
}

function formatEvidenceLabel(evidence: PublicAiInsightEvidence, isStale: boolean) {
  const parts = [];

  if (evidence.store) {
    parts.push(evidence.store.toUpperCase());
  }

  if (!isStale && evidence.currentPriceCents && evidence.currency) {
    parts.push(formatPrice(evidence.currentPriceCents, evidence.currency));
  }

  if (typeof evidence.discountPercent === "number" && evidence.discountPercent > 0) {
    parts.push(`-${evidence.discountPercent}%`);
  }

  if (evidence.steamReviewCount && evidence.steamPositiveRatio) {
    parts.push(`리뷰 ${evidence.steamReviewCount.toLocaleString("ko-KR")}개/${evidence.steamPositiveRatio}%`);
  }

  return parts.join(" · ") || "저장된 근거 데이터";
}

function normalizeInsight(row: InsightRow, now: Date): PublicAiInsight {
  const evidence = normalizeEvidence(row.evidence);
  const staleReason = getStaleReason(evidence, now);
  const isStale = Boolean(staleReason);

  return {
    id: row.id,
    gameId: row.game_id,
    gameTitle: row.games?.title ?? evidence.title ?? "게임",
    insightType: row.insight_type,
    title: row.title,
    summary: row.summary,
    confidence: row.confidence,
    createdAt: row.created_at,
    generatedAt: row.ai_insight_runs?.completed_at ?? row.created_at,
    isStale,
    staleReason,
    evidence,
    evidenceLabel: formatEvidenceLabel(evidence, isStale)
  };
}

export async function getPublicAiInsights(limit = 3, now = new Date()): Promise<PublicAiInsightFeed> {
  if (!isSupabaseConfigured() || !env.supabaseServiceRoleKey) {
    return { data: [] };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_game_insights")
    .select(`
      id,
      run_id,
      game_id,
      insight_type,
      title,
      summary,
      evidence,
      confidence,
      created_at,
      games(
        title
      ),
      ai_insight_runs(
        status,
        completed_at
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      data: [],
      warning: `AI 인사이트를 불러오지 못했습니다: ${error.message}`
    };
  }

  const rows = ((data ?? []) as unknown as InsightRow[])
    .filter((row) => row.ai_insight_runs?.status !== "failed");

  return {
    data: rows.map((row) => normalizeInsight(row, now))
  };
}

export const aiInsightConfig = {
  staleAfterMs: STALE_AFTER_MS
};
