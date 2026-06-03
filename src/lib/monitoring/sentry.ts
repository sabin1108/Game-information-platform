import "server-only";

import { env, isSentryConfigured } from "@/lib/env";
import type { MonitoringEvent } from "./events";

function parseDsn(dsn: string) {
  const url = new URL(dsn);
  const projectId = url.pathname.replace("/", "");
  const publicKey = url.username;

  if (!projectId || !publicKey) {
    throw new Error("Invalid Sentry DSN.");
  }

  return {
    storeUrl: `${url.protocol}//${url.host}/api/${projectId}/store/?sentry_key=${publicKey}`
  };
}

function eventToSentryPayload(event: MonitoringEvent) {
  const timestamp = Date.now() / 1000;

  if (event.type === "client_error" || event.type === "server_error") {
    return {
      timestamp,
      level: "error",
      logger: "game-deal-watch",
      message: event.message,
      platform: "javascript",
      tags: {
        route: event.route ?? "unknown",
        source: event.source ?? event.type
      },
      extra: {
        stack: event.stack
      }
    };
  }

  if (event.type === "api_request") {
    return {
      timestamp,
      level: "info",
      logger: "game-deal-watch",
      message: event.type,
      platform: "javascript",
      tags: {
        route: event.route,
        method: event.method,
        status: String(event.status),
        cache_status: event.cacheStatus
      },
      extra: event
    };
  }

  return {
    timestamp,
    level: "info",
    logger: "game-deal-watch",
    message: event.type,
    platform: "javascript",
    tags: {
      metric: event.name,
      rating: event.rating,
      route: event.route,
      device_class: event.deviceClass
    },
    extra: event
  };
}

export async function captureMonitoringEvent(event: MonitoringEvent) {
  if (!isSentryConfigured()) {
    return;
  }

  try {
    const { storeUrl } = parseDsn(env.sentryDsn!);
    const response = await fetch(storeUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(eventToSentryPayload(event)),
      signal: AbortSignal.timeout(1500)
    });

    if (!response.ok) {
      console.warn(`Sentry capture failed: ${response.status}`);
    }
  } catch (error) {
    console.warn("Sentry capture skipped.", error);
  }
}
