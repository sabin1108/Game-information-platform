"use client";

import type { MonitoringEvent } from "./events";

export function isClientMonitoringConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export async function captureClientMonitoringEvent(event: MonitoringEvent) {
  if (!isClientMonitoringConfigured()) {
    return;
  }

  try {
    await fetch("/api/monitoring/events", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(event),
      keepalive: true
    });
  } catch {
    // Monitoring must not block product flows.
  }
}
