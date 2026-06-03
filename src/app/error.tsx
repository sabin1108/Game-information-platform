"use client";

import { useEffect } from "react";
import { captureClientMonitoringEvent } from "@/lib/monitoring/client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    void captureClientMonitoringEvent({
      type: "client_error",
      message: error.message,
      stack: error.stack,
      route: window.location.pathname,
      source: error.digest ? "app-error-boundary-server" : "app-error-boundary-client"
    });
  }, [error]);

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>문제가 발생했습니다</h1>
        <p>화면을 다시 불러오거나 잠시 뒤에 다시 시도하세요.</p>
        <button className="button button--primary" onClick={reset} type="button">
          다시 시도
        </button>
      </section>
    </main>
  );
}
