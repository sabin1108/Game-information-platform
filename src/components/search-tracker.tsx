"use client";

import { useEffect } from "react";

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
  }, [query, tag]);

  return null;
}
