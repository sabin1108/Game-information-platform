import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { env, isSupabaseConfigured } from "@/lib/env";

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
};

type RunPatch = {
  status: AiInsightJobStatus;
  completed_at: string;
  error_message: string | null;
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
      message: "AI insight job route is reachable. Supabase admin env is not configured, so no run row was written."
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
  const completedAt = nowIso();
  const result: AiInsightJobResult = {
    runId,
    jobType: "generate_ai_insights",
    status: "succeeded",
    startedAt,
    completedAt,
    durationMs: durationSince(startedAtMs),
    candidateCount: 0,
    insightCount: 0,
    dryRun: false,
    message: "AI insight job route executed. Candidate detection and AI summarization are intentionally empty until the next slices."
  };

  try {
    await updateRun(runId, {
      status: "succeeded",
      completed_at: completedAt,
      error_message: null
    });
  } catch (error) {
    const failureMessage = error instanceof Error ? error.message : "Unknown AI insight job update error";

    await updateRun(runId, {
      status: "failed",
      completed_at: nowIso(),
      error_message: failureMessage
    });

    throw error;
  }

  return result;
}
