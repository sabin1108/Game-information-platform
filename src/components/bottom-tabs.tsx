"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Flame, House, Library, Sparkles } from "lucide-react";

const tabs = [
  { href: "/", label: "홈", icon: House },
  { href: "/deals", label: "할인", icon: Flame },
  { href: "/releases", label: "신작", icon: Sparkles },
  { href: "/app", label: "관심", icon: Library }
] as const;

export function BottomTabs() {
  const pathname = usePathname();
  const [isWebviewMode, setIsWebviewMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsWebviewMode(params.get("webview") === "1" || window.localStorage.getItem("gdw_webview_mode") === "1");
  }, []);

  return (
    <nav className="bottom-tabs" aria-label="모바일 하단 메뉴">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        const href = isWebviewMode ? `${tab.href}?webview=1` : tab.href;

        return (
          <a key={tab.href} href={href} data-active={isActive}>
            <Icon size={19} aria-hidden="true" />
            <span>{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
