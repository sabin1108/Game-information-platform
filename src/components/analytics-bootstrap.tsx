"use client";

import { useEffect } from "react";
import { isClientAnalyticsConfigured } from "@/lib/analytics/client";

declare global {
  interface Window {
    gdwAnalytics?: {
      initialized: boolean;
      provider: "posthog";
    };
  }
}

export function AnalyticsBootstrap() {
  useEffect(() => {
    if (!isClientAnalyticsConfigured()) {
      return;
    }

    window.gdwAnalytics = {
      initialized: true,
      provider: "posthog"
    };
  }, []);

  return null;
}
