import type { StoreCode } from "@/types/game";

export const ANALYTICS_EVENTS = {
  experimentExposure: "experiment_exposure",
  dealClick: "deal_click",
  watchlistAdd: "watchlist_add"
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
  primary_metric?: string;
  guardrail_metric?: string;
};

export type AnalyticsCaptureInput = {
  event: AnalyticsEventName;
  distinctId: string;
  properties?: AnalyticsEventProperties;
};
