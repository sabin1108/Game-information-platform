import { NextResponse } from "next/server";
import { captureAnalyticsEvent } from "@/lib/analytics/server";
import { ANALYTICS_EVENTS, type AnalyticsCaptureInput } from "@/lib/analytics/events";
import { withApiMonitoring } from "@/lib/monitoring/api";

const allowedEvents = new Set<string>(Object.values(ANALYTICS_EVENTS));

async function analyticsEventsHandler(request: Request) {
  try {
    const payload = (await request.json()) as Partial<AnalyticsCaptureInput>;

    if (!payload.event || !allowedEvents.has(payload.event) || !payload.distinctId) {
      return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
    }

    await captureAnalyticsEvent({
      event: payload.event,
      distinctId: payload.distinctId,
      properties: payload.properties ?? {}
    });
  } catch {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}

export const POST = withApiMonitoring({ route: "/api/analytics/events" }, analyticsEventsHandler);
