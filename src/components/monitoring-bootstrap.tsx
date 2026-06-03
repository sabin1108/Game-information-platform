"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { captureClientMonitoringEvent, isClientMonitoringConfigured } from "@/lib/monitoring/client";
import { getDeviceClass } from "@/lib/monitoring/events";

export function MonitoringBootstrap() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isClientMonitoringConfigured()) {
      return;
    }

    function handleError(event: ErrorEvent) {
      void captureClientMonitoringEvent({
        type: "client_error",
        message: event.message,
        stack: event.error instanceof Error ? event.error.stack : undefined,
        route: window.location.pathname,
        source: "window.error"
      });
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      void captureClientMonitoringEvent({
        type: "client_error",
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        route: window.location.pathname,
        source: "unhandledrejection"
      });
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  useReportWebVitals((metric) => {
    void captureClientMonitoringEvent({
      type: "web_vital",
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      route: pathname,
      deviceClass: getDeviceClass(window.innerWidth)
    });
  });

  return null;
}
