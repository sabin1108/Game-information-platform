import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { env, isSupabaseConfigured } from "@/lib/env";
import {
  buildDeterministicInsightCandidates,
  toInsightEvidenceJson,
  type AiInsightCandidate,
  type StoredInsightSnapshot
} from "@/lib/jobs/ai-insight-candidates";
import {
  summarizeCandidateWithMock,
  type AiInsightSummary
} from "@/lib/jobs/ai-insight-summaries";
import type { Database } from "@/lib/supabase/types";

export type AiInsightJobStatus = "succeeded" | "failed";

export type AiInsightJobResult = {
  runId: string | null;
  jobType: "generate_ai_insights";
  status: AiInsightJobStatus;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  candidateCount: number;
  insightCount: number;
  dryRun: boolean;
  message: string;
  candidates: Array<{
    gameId: string;
    insightType: AiInsightCandidate["insightType"];
    score: number;
  }>;
};

type RunPatch = {
  status: AiInsightJobStatus;
  completed_at: string;
  error_message: string | null;
  model_name?: string | null;
};

type GameRow = Database["public"]["Tables"]["games"]["Row"];
type ProductRow = Database["public"]["Tables"]["game_store_products"]["Row"];
type SnapshotRow = Database["public"]["Tables"]["price_snapshots"]["Row"];
type SnapshotQueryRow = SnapshotRow & {
  game_store_products: Pick<ProductRow, "id" | "game_id" | "store"> & {
    games: Pick<GameRow, "id" | "title" | "steam_review_count" | "steam_positive_ratio">;
  };
};

function nowIso() {
  return new Date().toISOString();
}

function durationSince(startedAtMs: number) {
  return Math.max(0, Math.round(performance.now() - startedAtMs));
}

function canWriteJobRun() {
  return Boolean(isSupabaseConfigured() && env.supabaseServiceRoleKey);
}

async function updateRun(runId: string, patch: RunPatch) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("ai_insight_runs")
    .update(patch)
    .eq("id", runId);

  if (error) {
    throw new Error(`Failed to update AI insight job run: ${error.message}`);
  }
}

function toStoredInsightSnapshot(row: SnapshotQueryRow): StoredInsightSnapshot {
  const product = row.game_store_products;
  const game = product.games;

  return {
    snapshotId: row.id,
    productId: product.id,
    gameId: game.id,
    title: game.title,
    store: product.store,
    country: row.country,
    currency: row.currency,
    regularPriceCents: row.regular_price_cents,
    currentPriceCents: row.current_price_cents,
    discountPercent: row.discount_percent,
    isHistoricalLow: row.is_historical_low,
    observedAt: row.observed_at,
    steamReviewCount: game.steam_review_count,
    steamPositiveRatio: game.steam_positive_ratio
  };
}

async function loadLatestSnapshots(): Promise<StoredInsightSnapshot[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("price_snapshots")
    .select(`
      id,
      product_id,
      country,
      currency,
      regular_price_cents,
      current_price_cents,
      discount_percent,
      is_historical_low,
      observed_at,
      game_store_products!inner(
        id,
        game_id,
        store,
        games!inner(
          id,
          title,
          steam_review_count,
          steam_positive_ratio
        )
      )
    `)
    .order("observed_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Failed to load price snapshots for AI insights: ${error.message}`);
  }

  const latestByProduct = new Map<string, SnapshotQueryRow>();

  for (const row of (data ?? []) as unknown as SnapshotQueryRow[]) {
    if (!latestByProduct.has(row.product_id)) {
      latestByProduct.set(row.product_id, row);
    }
  }

  return Array.from(latestByProduct.values()).map(toStoredInsightSnapshot);
}

async function saveInsightSummaries(
  runId: string,
  candidates: AiInsightCandidate[]
): Promise<{ summaries: AiInsightSummary[]; modelName: string | null }> {
  if (!candidates.length) {
    return {
      summaries: [],
      modelName: null
    };
  }

  const summaries = candidates.map(summarizeCandidateWithMock);
  const supabase = createAdminClient();
  const { error } = await supabase.from("ai_game_insights").insert(
    candidates.map((candidate, index) => ({
      run_id: runId,
      game_id: candidate.gameId,
      insight_type: candidate.insightType,
      title: summaries[index].title,
      summary: summaries[index].summary,
      evidence: toInsightEvidenceJson(candidate.evidence),
      confidence: candidate.score / 100
    }))
  );

  if (error) {
    throw new Error(`Failed to save AI game insights: ${error.message}`);
  }

  return {
    summaries,
    modelName: summaries[0]?.modelName ?? null
  };
}

function candidatePreviews(candidates: AiInsightCandidate[]): AiInsightJobResult["candidates"] {
  return candidates.map((candidate) => ({
    gameId: candidate.gameId,
    insightType: candidate.insightType,
    score: candidate.score
  }));
}

export async function runGenerateAiInsightsJob(): Promise<AiInsightJobResult> {
  const startedAt = nowIso();
  const startedAtMs = performance.now();

  if (!canWriteJobRun()) {
    const completedAt = nowIso();

    return {
      runId: null,
      jobType: "generate_ai_insights",
      status: "succeeded",
      startedAt,
      completedAt,
      durationMs: durationSince(startedAtMs),
      candidateCount: 0,
      insightCount: 0,
      dryRun: true,
      message: "AI insight job route is reachable. Supabase admin env is not configured, so no run row was written.",
      candidates: []
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_insight_runs")
    .insert({
      job_type: "generate_ai_insights",
      status: "running",
      started_at: startedAt,
      input_window_start: null,
      input_window_end: null
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create AI insight job run: ${error.message}`);
  }

  const runId = data.id;
  try {
    const snapshots = await loadLatestSnapshots();
    const candidates = buildDeterministicInsightCandidates(snapshots);
    const { summaries, modelName } = await saveInsightSummaries(runId, candidates);
    const completedAt = nowIso();
    const result: AiInsightJobResult = {
      runId,
      jobType: "generate_ai_insights",
      status: "succeeded",
      startedAt,
      completedAt,
      durationMs: durationSince(startedAtMs),
      candidateCount: candidates.length,
      insightCount: summaries.length,
      dryRun: false,
      message: "AI insight job executed from stored price snapshots and saved evidence-backed summaries.",
      candidates: candidatePreviews(candidates)
    };

    await updateRun(runId, {
      status: "succeeded",
      completed_at: completedAt,
      error_message: null,
      model_name: modelName
    });

    return result;
  } catch (error) {
    const failureMessage = error instanceof Error ? error.message : "Unknown AI insight job update error";

    await updateRun(runId, {
      status: "failed",
      completed_at: nowIso(),
      error_message: failureMessage
    });

    throw error;
  }
}
