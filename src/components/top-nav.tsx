import Link from "next/link";
import { Gamepad2, LogIn, UserCircle } from "lucide-react";
import { SearchBar } from "./search-bar";
import { isSupabaseConfigured } from "@/lib/env";

type TopNavProps = {
  isAuthenticated?: boolean;
};

export function TopNav({ isAuthenticated = false }: TopNavProps) {
  return (
    <header className="top-nav">
      <div className="container top-nav__inner">
        <Link className="brand" href="/">
          <span className="brand__mark">
            <Gamepad2 size={19} aria-hidden="true" />
          </span>
          <span>Game Deal Watch</span>
        </Link>

        <SearchBar />

        <nav className="nav-actions" aria-label="사용자 메뉴">
          <Link className="button button--ghost" href="/deals">
            할인
          </Link>
          {isAuthenticated ? (
            <Link className="button button--primary" href="/app">
              <UserCircle size={18} aria-hidden="true" />
              내 목록
            </Link>
          ) : (
            <Link className="button button--primary" href="/login">
              <LogIn size={18} aria-hidden="true" />
              로그인
            </Link>
          )}
          {!isSupabaseConfigured() ? (
            <Link className="button button--icon" href="/app" title="데모 대시보드">
              <UserCircle size={19} aria-hidden="true" />
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
