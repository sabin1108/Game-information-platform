import { Gamepad2, LogIn, LogOut, UserCircle } from "lucide-react";
import { logout } from "@/app/(auth)/logout/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { SearchBar } from "./search-bar";

type TopNavProps = {
  isAuthenticated?: boolean;
};

export function TopNav({ isAuthenticated = false }: TopNavProps) {
  return (
    <header className="top-nav">
      <div className="container top-nav__inner">
        <a className="brand" href="/">
          <span className="brand__mark">
            <Gamepad2 size={19} aria-hidden="true" />
          </span>
          <span>Game Deal Watch</span>
        </a>

        <SearchBar />

        <nav className="nav-actions" aria-label="사용자 메뉴">
          <a className="button button--ghost" href="/deals">
            할인
          </a>
          {isAuthenticated ? (
            <>
              <a className="button button--ghost" href="/app">
                관심 목록
              </a>
              <a className="button button--ghost" href="/app/profile">
                <UserCircle size={18} aria-hidden="true" />
                프로필
              </a>
              <form className="nav-form" action={logout}>
                <button className="button button--primary" type="submit">
                  <LogOut size={18} aria-hidden="true" />
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <a className="button button--primary" href="/login">
              <LogIn size={18} aria-hidden="true" />
              로그인
            </a>
          )}
          {!isSupabaseConfigured() ? (
            <a className="button button--icon" href="/app" title="데모 대시보드">
              <UserCircle size={19} aria-hidden="true" />
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
