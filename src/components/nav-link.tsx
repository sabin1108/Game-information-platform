"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = href === "/app" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return <a className="button button--ghost" href={href} aria-current={active ? "page" : undefined}>{children}</a>;
}
