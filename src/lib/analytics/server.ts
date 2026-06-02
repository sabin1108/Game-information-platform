import "server-only";

import { env, isPostHogConfigured } from "@/lib/env";
import type { AnalyticsCaptureInput } from "./events";

export async function captureAnalyticsEvent(input: AnalyticsCaptureInput) {
  if (!isPostHogConfigured()) {
    return;
  }

  try {
    const response = await fetch(`${env.posthogHost!.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        api_key: env.posthogToken,
        event: input.event,
        distinct_id: input.distinctId,
        properties: input.properties ?? {}
      }),
      signal: AbortSignal.timeout(1500)
    });

    if (!response.ok) {
      console.warn(`PostHog capture failed: ${response.status}`);
    }
  } catch (error) {
    console.warn("PostHog capture skipped.", error);
  }
}
