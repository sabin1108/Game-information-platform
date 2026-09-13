"use client";

import { useEffect } from "react";

const STORAGE_KEY = "gdw_webview_mode";

export function WebviewMode() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryValue = params.get("webview");
    let stored = false;
    try { stored = window.localStorage.getItem(STORAGE_KEY) === "1"; } catch { /* Query mode still works without storage. */ }
    const enabled = queryValue === "1" || (queryValue !== "0" && stored);

    document.documentElement.dataset.webviewMode = enabled ? "true" : "false";

    try {
    if (queryValue === "1") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } else if (queryValue === "0") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    } catch { /* Keep the current page usable when storage is unavailable. */ }
  }, []);

  return null;
}
