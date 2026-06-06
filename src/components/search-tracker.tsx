"use client";

import { useEffect } from "react";
import { captureClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

type SearchTrackerProps = {
  query?: string;
  tag?: string;
};

export function SearchTracker({ query = "", tag = "" }: SearchTrackerProps) {
  useEffect(() => {
    if (!query.trim() && !tag.trim()) {
      return;
    }

    void fetch("/api/search-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query, tag })
    }).catch(() => undefined);

    void captureClientEvent({
      event: ANALYTICS_EVENTS.searchSubmitted,
      distinctId: "anonymous",
      properties: {
        query: query.trim() || undefined,
        tag: tag.trim() || undefined,
        source: "search-page"
      }
    });
  }, [query, tag]);

  return null;
}
