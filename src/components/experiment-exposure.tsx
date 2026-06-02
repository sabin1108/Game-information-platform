"use client";

import { useEffect } from "react";
import { captureClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS, type PopularCardVariant } from "@/lib/analytics/events";

type ExperimentExposureProps = {
  distinctId: string;
  experimentKey: string;
  subjectType: "user" | "anonymous";
  variant: PopularCardVariant;
};

export function ExperimentExposure({
  distinctId,
  experimentKey,
  subjectType,
  variant
}: ExperimentExposureProps) {
  useEffect(() => {
    void captureClientEvent({
      event: ANALYTICS_EVENTS.experimentExposure,
      distinctId,
      properties: {
        experiment_key: experimentKey,
        variant,
        subject_type: subjectType,
        primary_metric: "deal_click",
        guardrail_metric: "watchlist_add"
      }
    });
  }, [distinctId, experimentKey, subjectType, variant]);

  return null;
}
