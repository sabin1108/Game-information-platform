"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Flame, House, Library, Search } from "lucide-react";

const tabs = [
  { href: "/", label: "홈", icon: House },
  { href: "/deals", label: "할인", icon: Flame },
  { href: "/search", label: "검색", icon: Search },
  { href: "/app", label: "관심", icon: Library }
] as const;

export function BottomTabs() {
  const pathname = usePathname();
  const [isWebviewMode, setIsWebviewMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let stored = false;
    try { stored = window.localStorage.getItem("gdw_webview_mode") === "1"; } catch { /* Storage may be blocked in embedded browsers. */ }
    setIsWebviewMode(params.get("webview") === "1" || (params.get("webview") !== "0" && stored));
  }, []);

  if (pathname === "/login" || pathname === "/signup") return null;

  return (
    <nav className="bottom-tabs" aria-label="모바일 하단 메뉴">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        const href = isWebviewMode ? `${tab.href}?webview=1` : tab.href;

        return (
          <a key={tab.href} href={href} data-active={isActive} aria-current={isActive ? "page" : undefined}>
            <Icon size={19} aria-hidden="true" />
            <span>{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
