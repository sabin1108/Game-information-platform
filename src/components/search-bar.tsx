"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();

    startTransition(() => {
      router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
    });
  }

  return (
    <form className="search-form" role="search" onSubmit={onSubmit}>
      <Search size={18} aria-hidden="true" />
      <input
        aria-label="게임 검색"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="게임명, 장르, 태그 검색"
        disabled={isPending}
      />
    </form>
  );
}
