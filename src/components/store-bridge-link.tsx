"use client";

import React from "react";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { captureClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { createStoreOpenEvent, STORE_OPEN_EVENT_TYPE, type StoreOpenBridgePayload } from "@/lib/webview-bridge";

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    GameDealWatchBridge?: {
      postMessage?: (message: string) => void;
      openStore?: (payload: StoreOpenBridgePayload) => void;
    };
  }
}

type StoreBridgeLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  children: ReactNode;
  payload: StoreOpenBridgePayload;
};

export function StoreBridgeLink({ children, payload, ...props }: StoreBridgeLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const bridgeEvent = createStoreOpenEvent(payload);
    const message = JSON.stringify(bridgeEvent);

    window.dispatchEvent(new CustomEvent(STORE_OPEN_EVENT_TYPE, { detail: bridgeEvent }));
    if (payload.experimentKey) {
      void captureClientEvent({
        event: ANALYTICS_EVENTS.popularCardClicked,
        distinctId: payload.distinctId ?? "anonymous",
        properties: {
          experiment_key: payload.experimentKey,
          variant: payload.variant,
          game_id: payload.gameId,
          game_title: payload.gameTitle,
          store: payload.store,
          store_name: payload.storeName,
          source: payload.source
        }
      });
    }

    void captureClientEvent({
      event: ANALYTICS_EVENTS.dealClick,
      distinctId: payload.distinctId ?? "anonymous",
      properties: {
        experiment_key: payload.experimentKey,
        variant: payload.variant,
        game_id: payload.gameId,
        game_title: payload.gameTitle,
        store: payload.store,
        store_name: payload.storeName,
        url: payload.url,
        source: payload.source
      }
    });

    if (window.ReactNativeWebView?.postMessage) {
      event.preventDefault();
      window.ReactNativeWebView.postMessage(message);
      return;
    }

    if (window.GameDealWatchBridge?.openStore) {
      event.preventDefault();
      window.GameDealWatchBridge.openStore(payload);
      return;
    }

    if (window.GameDealWatchBridge?.postMessage) {
      event.preventDefault();
      window.GameDealWatchBridge.postMessage(message);
    }
  }

  return (
    <a {...props} data-bridge-event={STORE_OPEN_EVENT_TYPE} href={payload.url} onClick={handleClick}>
      {children}
    </a>
  );
}
