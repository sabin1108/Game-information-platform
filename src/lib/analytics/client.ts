"use client";

import type { AnalyticsCaptureInput } from "./events";
import { ANONYMOUS_ID_COOKIE } from "@/lib/experiment-constants";

export function isClientAnalyticsConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST);
}

export async function captureClientEvent(input: AnalyticsCaptureInput) {
  if (!isClientAnalyticsConfigured()) {
    return;
  }

  try {
    const distinctId =
      input.distinctId === "anonymous"
        ? document.cookie
            .split("; ")
            .find((item) => item.startsWith(`${ANONYMOUS_ID_COOKIE}=`))
            ?.split("=")[1] ?? input.distinctId
        : input.distinctId;

    await fetch("/api/analytics/events", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ ...input, distinctId }),
      keepalive: true
    });
  } catch {
    // Analytics must never block core product flows.
  }
}
