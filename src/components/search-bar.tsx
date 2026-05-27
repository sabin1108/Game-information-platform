import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <form className="search-form" role="search" action="/search">
      <Search size={18} aria-hidden="true" />
      <input aria-label="게임 검색" name="q" placeholder="게임명, 장르, 태그 검색" />
    </form>
  );
}
