import { NextResponse } from "next/server";
import { captureMonitoringEvent } from "@/lib/monitoring/sentry";

type ApiHandler<TRequest extends Request> = (request: TRequest) => Promise<Response>;

type ApiMonitoringOptions = {
  route: string;
  getCacheStatus?: (response: Response) => string;
};

function defaultCacheStatus(response: Response) {
  return (
    response.headers.get("X-Search-Cache") ??
    response.headers.get("X-Deals-Cache") ??
    response.headers.get("X-Releases-Cache") ??
    response.headers.get("X-Cache") ??
    "none"
  );
}

export function withApiMonitoring<TRequest extends Request>(
  { route, getCacheStatus = defaultCacheStatus }: ApiMonitoringOptions,
  handler: ApiHandler<TRequest>
) {
  return async function monitoredApiHandler(request: TRequest) {
    const start = performance.now();
    let response: Response;

    try {
      response = await handler(request);
    } catch (error) {
      const durationMs = Math.round(performance.now() - start);

      await captureMonitoringEvent({
        type: "server_error",
        message: error instanceof Error ? error.message : "Unhandled API error",
        stack: error instanceof Error ? error.stack : undefined,
        route,
        source: "api"
      });

      response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
      response.headers.set("X-API-Duration-Ms", String(durationMs));
      response.headers.set("X-API-Status", "500");
      response.headers.set("X-API-Cache", "none");
      return response;
    }

    const durationMs = Math.round(performance.now() - start);
    const cacheStatus = getCacheStatus(response);

    response.headers.set("X-API-Duration-Ms", String(durationMs));
    response.headers.set("X-API-Status", String(response.status));
    response.headers.set("X-API-Cache", cacheStatus);

    console.info("api_request", {
      route,
      method: request.method,
      status: response.status,
      durationMs,
      cacheStatus
    });

    return response;
  };
}
