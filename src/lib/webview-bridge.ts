import type { StoreCode } from "@/types/game";
import type { PopularCardVariant } from "./analytics/events";

export const STORE_OPEN_EVENT_TYPE = "gdw.store.open";

export type StoreOpenBridgePayload = {
  gameId: string;
  gameTitle: string;
  store: StoreCode;
  storeName: string;
  url: string;
  source: "game-card" | "store-price";
  experimentKey?: string;
  variant?: PopularCardVariant;
  distinctId?: string;
};

export type StoreOpenBridgeEvent = {
  type: typeof STORE_OPEN_EVENT_TYPE;
  payload: StoreOpenBridgePayload;
};

export function createStoreOpenEvent(payload: StoreOpenBridgePayload): StoreOpenBridgeEvent {
  return {
    type: STORE_OPEN_EVENT_TYPE,
    payload
  };
}
