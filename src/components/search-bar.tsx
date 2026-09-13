"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";

export function SearchBar() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  useEffect(() => { setQuery(new URLSearchParams(window.location.search).get("q") ?? ""); }, [pathname]);
  return (
    <form className="search-form" role="search" action="/search">
      <Search size={18} aria-hidden="true" />
      <input aria-label="게임 검색" name="q" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="어떤 게임을 찾고 있나요?" autoComplete="off" />
      <button className="search-submit" type="submit" aria-label="게임 검색 실행">검색</button>
    </form>
  );
}
