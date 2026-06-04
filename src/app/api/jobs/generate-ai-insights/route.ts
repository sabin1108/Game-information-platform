import { NextResponse } from "next/server";
import { authorizeJobRequest } from "@/lib/jobs/auth";
import { runGenerateAiInsightsJob } from "@/lib/jobs/ai-insights";
import { withApiMonitoring } from "@/lib/monitoring/api";

export const dynamic = "force-dynamic";

async function generateAiInsightsHandler(request: Request) {
  if (!authorizeJobRequest(request)) {
    return NextResponse.json({ error: "Unauthorized job request." }, { status: 401 });
  }

  const result = await runGenerateAiInsightsJob();

  return NextResponse.json(
    {
      job: result
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Job-Status": result.status
      }
    }
  );
}

export const POST = withApiMonitoring(
  {
    route: "/api/jobs/generate-ai-insights",
    getCacheStatus: () => "none"
  },
  generateAiInsightsHandler
);
