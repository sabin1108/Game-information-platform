import { NextResponse, type NextRequest } from "next/server";
import { getPublicAiInsights } from "@/lib/ai-insights";
import { withApiMonitoring } from "@/lib/monitoring/api";

export const dynamic = "force-dynamic";

async function insightsHandler(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "3");
  const result = await getPublicAiInsights(Number.isFinite(limit) ? limit : 3);

  return NextResponse.json(
    {
      data: result.data,
      warning: result.warning
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Insights-Cache": "miss"
      }
    }
  );
}

export const GET = withApiMonitoring({ route: "/api/insights" }, insightsHandler);
