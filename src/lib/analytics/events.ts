import type { StoreCode } from "@/types/game";

export const ANALYTICS_EVENTS = {
  experimentExposure: "experiment_exposure",
  dealClick: "deal_click",
  watchlistAdd: "watchlist_add",
  popularCardClicked: "popular_card_clicked",
  searchSubmitted: "search_submitted",
  signupCompleted: "signup_completed",
  webVitalReported: "web_vital_reported"
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type PopularCardVariant = "control" | "variant_a";

export type AnalyticsEventProperties = {
  experiment_key?: string;
  variant?: PopularCardVariant;
  subject_type?: "user" | "anonymous";
  game_id?: string;
  game_title?: string;
  store?: StoreCode;
  store_name?: string;
  url?: string;
  source?: string;
  status?: "added" | "exists";
  query?: string;
  tag?: string;
  result_count?: number;
  method?: "email_password";
  metric_name?: string;
  metric_value?: number;
  primary_metric?: string;
  guardrail_metric?: string;
};

export type AnalyticsCaptureInput = {
  event: AnalyticsEventName;
  distinctId: string;
  properties?: AnalyticsEventProperties;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && Object.values(ANALYTICS_EVENTS).includes(value as AnalyticsEventName);
}

export function isAnalyticsCaptureInput(value: unknown): value is AnalyticsCaptureInput {
  if (!isRecord(value) || !isAnalyticsEventName(value.event)) {
    return false;
  }

  if (typeof value.distinctId !== "string" || !value.distinctId.trim()) {
    return false;
  }

  if (value.properties !== undefined && !isRecord(value.properties)) {
    return false;
  }

  return true;
}
