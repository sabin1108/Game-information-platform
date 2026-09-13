import type { ReactNode } from "react";
import { TopNav } from "@/components/top-nav";
import { isSupabaseConfigured } from "@/lib/env";

type AuthPageShellProps = {
  title: string;
  description: string;
  error?: string;
  message?: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthPageShell({
  title,
  description,
  error,
  message,
  children,
  footer
}: AuthPageShellProps) {
  return (
    <>
      <TopNav variant="auth" />
      <main id="main-content" tabIndex={-1} className="auth-shell">
        <section className="auth-card">
          <h1>{title}</h1>
          <p>{description}</p>
          {!isSupabaseConfigured() ? (
            <div className="notice">체험 모드입니다. 로그인하면 예시 관심 목록을 둘러볼 수 있어요.</div>
          ) : null}
          {error ? (
            <div className="notice" role="alert">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="notice notice--success" role="status">
              {message}
            </div>
          ) : null}
          {children}
          <div className="auth-card__switch">{footer}</div>
        </section>
      </main>
    </>
  );
}
