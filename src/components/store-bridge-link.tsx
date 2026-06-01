"use client";

import React from "react";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
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
