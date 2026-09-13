import type { Route } from "next";

const allowedPaths = new Set(["/", "/app", "/app/profile", "/deals", "/search"]);

export function getSafeAuthRedirect(value: unknown, fallback: "/" | "/app" = "/"): Route {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || /[\\\x00-\x1f\x7f]/.test(path)) return fallback;
  try {
    const url = new URL(path, "https://auth.local");
    if (url.origin !== "https://auth.local" || !allowedPaths.has(url.pathname)) return fallback;
    return (url.pathname + url.search + url.hash) as Route;
  } catch {
    return fallback;
  }
}

export function getAuthPageHref(page: "/login" | "/signup", next: string, feedback?: { error?: string; message?: string }): Route {
  const params = new URLSearchParams({ next: getSafeAuthRedirect(next) });
  if (feedback?.error) params.set("error", feedback.error);
  if (feedback?.message) params.set("message", feedback.message);
  return `${page}?${params.toString()}`;
}
