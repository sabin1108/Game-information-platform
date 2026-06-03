import { NextResponse } from "next/server";
import { withApiMonitoring } from "@/lib/monitoring/api";
import { captureMonitoringEvent } from "@/lib/monitoring/sentry";
import type { MonitoringEvent } from "@/lib/monitoring/events";

const allowedTypes = new Set(["client_error", "server_error", "web_vital", "api_request"]);

async function monitoringEventsHandler(request: Request) {
  try {
    const payload = (await request.json()) as Partial<MonitoringEvent>;

    if (!payload.type || !allowedTypes.has(payload.type)) {
      return NextResponse.json({ error: "Invalid monitoring event." }, { status: 400 });
    }

    await captureMonitoringEvent(payload as MonitoringEvent);
  } catch {
    return NextResponse.json({ error: "Invalid monitoring payload." }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}

export const POST = withApiMonitoring({ route: "/api/monitoring/events" }, monitoringEventsHandler);
