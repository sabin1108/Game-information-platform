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
      <TopNav />
      <main className="auth-shell">
        <section className="auth-card">
          <h1>{title}</h1>
          <p>{description}</p>
          {!isSupabaseConfigured() ? (
            <div className="notice">Supabase 설정이 없어 데모 대시보드로 이동합니다.</div>
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
          <p>{footer}</p>
        </section>
      </main>
    </>
  );
}
