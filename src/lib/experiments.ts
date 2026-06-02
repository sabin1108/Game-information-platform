import "server-only";

import { cookies } from "next/headers";
import { assignPopularCardVariant } from "@/lib/experiment-assignment";
import { isSupabaseConfigured } from "@/lib/env";
import { ANONYMOUS_ID_COOKIE, POPULAR_CARD_EXPERIMENT_KEY } from "@/lib/experiment-constants";
import { createClient } from "@/lib/supabase/server";
import type { PopularCardVariant } from "./analytics/events";

export type ExperimentAssignment = {
  experimentKey: typeof POPULAR_CARD_EXPERIMENT_KEY;
  variant: PopularCardVariant;
  distinctId: string;
  subjectType: "user" | "anonymous";
};

async function getUserId() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Experiment auth timed out.")), 1500))
    ]);

    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function getPopularCardExperiment(): Promise<ExperimentAssignment> {
  const [cookieStore, userId] = await Promise.all([cookies(), getUserId()]);
  const anonymousId = cookieStore.get(ANONYMOUS_ID_COOKIE)?.value ?? "anonymous";
  const subjectId = userId ?? anonymousId;

  return {
    experimentKey: POPULAR_CARD_EXPERIMENT_KEY,
    variant: assignPopularCardVariant(`${POPULAR_CARD_EXPERIMENT_KEY}:${subjectId}`),
    distinctId: subjectId,
    subjectType: userId ? "user" : "anonymous"
  };
}
