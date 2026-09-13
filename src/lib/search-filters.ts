import type { Route } from "next";
import type { GameSummary, StorePrice } from "@/types/game";

export type SearchCriteria = {
  q: string; tag: string; store: "" | "steam" | "epic";
  maxPrice?: number; discounted: boolean;
  sort: "relevance" | "price" | "discount" | "title";
};
export type SearchTagOption = { value: string; label: string; count?: number };
type SearchInput = { [K in keyof SearchCriteria]?: unknown };
const tagGroups = [
  { value: "Action", label: "액션", aliases: ["액션"] },
  { value: "Adventure", label: "어드벤처", aliases: ["어드벤처", "모험"] },
  { value: "RPG", label: "RPG", aliases: ["롤플레잉", "Role-Playing", "CRPG", "JRPG", "Action RPG"] },
  { value: "Roguelike", label: "로그라이크", aliases: ["로그라이크", "로그라이트", "Rogue-like", "Action Roguelike", "Roguelite", "Rogue-lite"] },
  { value: "Strategy", label: "전략", aliases: ["전략", "Turn-Based Strategy", "Grand Strategy", "4X", "Tactical"] },
  { value: "Puzzle", label: "퍼즐", aliases: ["퍼즐", "Logic", "Hidden Object"] },
  { value: "Co-op", label: "협동", aliases: ["협동", "협동게임", "Online Co-op", "Local Co-op"] },
  { value: "Open World", label: "오픈 월드", aliases: ["오픈월드"] },
  { value: "Simulation", label: "시뮬레이션", aliases: ["시뮬레이션"] },
  { value: "Survival", label: "생존", aliases: ["생존"] },
  { value: "Horror", label: "공포", aliases: ["공포"] },
  { value: "Automation", label: "자동화", aliases: ["자동화", "Base Building", "Resource Management"] },
  { value: "Indie", label: "인디", aliases: ["인디"] },
  { value: "Story Rich", label: "스토리 중심", aliases: ["스토리중심"] }
];
const nonTags = new Set(["game", "package", "dlc"]);
const text = (value: unknown) => typeof value === "string" ? value.normalize("NFKC").trim().replace(/\s+/g, " ").slice(0, 120) : "";
const tagKey = (value: string) => value.toLowerCase().replace(/[\s_-]+/g, "");
export function normalizeSearchTag(value: string): string {
  const tag = text(value);
  const key = tagKey(tag);
  const group = tagGroups.find(item => [item.value, ...item.aliases].some(alias => tagKey(alias) === key));
  return nonTags.has(key) ? "" : group?.value ?? tag;
}
export function getTagLabel(tag: string): string {
  const value = normalizeSearchTag(tag);
  const group = tagGroups.find(item => item.value === value);
  return group && group.label !== value ? group.label + " · " + value : value;
}
export function getSearchTagAliases(tag: string): string[] {
  const value = normalizeSearchTag(tag);
  const group = tagGroups.find(item => item.value === value);
  return group ? [group.value, ...group.aliases.filter(alias => /^[\x20-\x7e]+$/.test(alias))] : value ? [value] : [];
}
export function matchesSearchTag(tags: string[], tag: string): boolean {
  if (!tag) return true;
  const value = normalizeSearchTag(tag);
  return tags.some(item => tagKey(normalizeSearchTag(item)) === tagKey(value));
}
export function getMeaningfulTags(tags: string[]): string[] {
  return tags.filter(tag => tag.trim() && !nonTags.has(tagKey(tag)));
}
export function normalizeSearchCriteria(input: SearchInput = {}): SearchCriteria {
  const rawPrice = text(typeof input.maxPrice === "number" ? String(input.maxPrice) : input.maxPrice);
  const price = rawPrice && /^\d+$/.test(rawPrice) ? Number(rawPrice) : undefined;
  const store = text(input.store).toLowerCase();
  const sort = text(input.sort);
  return {
    q: text(input.q), tag: normalizeSearchTag(text(input.tag)),
    store: store === "steam" || store === "epic" ? store : "",
    maxPrice: typeof price === "number" && Number.isSafeInteger(price) && price <= 10000000 ? price : undefined,
    discounted: input.discounted === true || input.discounted === "1",
    sort: sort === "price" || sort === "discount" || sort === "title" ? sort : "relevance"
  };
}
export function getSearchHref(input: SearchCriteria): Route {
  const criteria = normalizeSearchCriteria(input);
  const params = new URLSearchParams();
  if (criteria.q) params.set("q", criteria.q);
  if (criteria.tag) params.set("tag", criteria.tag);
  if (criteria.store) params.set("store", criteria.store);
  if (criteria.maxPrice !== undefined) params.set("maxPrice", String(criteria.maxPrice));
  if (criteria.discounted) params.set("discounted", "1");
  if (criteria.sort !== "relevance") params.set("sort", criteria.sort);
  return params.size ? `/search?${params}` : "/search";
}
export function collectSearchTagOptions(games: GameSummary[]): SearchTagOption[] {
  const counts = new Map<string, number>();
  for (const game of games) {
    for (const value of new Set(getMeaningfulTags(game.tags).map(normalizeSearchTag))) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].map(([value, count]) => ({ value, count, label: getTagLabel(value) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko"));
}
export function getDiscoveryTagOptions(): SearchTagOption[] {
  return tagGroups.map(({ value }) => ({ value, label: getTagLabel(value) }));
}
function knownPrice(price: StorePrice) {
  return price.currentPriceCents > 0 || (price.currentPriceCents === 0 && price.discountPercent === 100 && price.regularPriceCents > 0);
}
function discountedPrice(price: StorePrice) {
  return knownPrice(price) && price.discountPercent > 0 && price.regularPriceCents > price.currentPriceCents;
}
function titleKey(title: string) {
  return title.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}
export function titleMatchesQuery(title: string, query: string): boolean {
  const words = query.normalize("NFKC").toLowerCase().trim().split(/\s+/).map(titleKey).filter(Boolean);
  return words.every(word => titleKey(title).includes(word));
}
export function filterSearchGames(games: GameSummary[], criteria: SearchCriteria, tagAlreadyFiltered = false): GameSummary[] {
  const seen = new Set<string>();
  const requiresOffer = Boolean(criteria.store || criteria.maxPrice !== undefined || criteria.discounted);
  const filtered = games.filter(game => {
    if (seen.has(game.id)) return false;
    seen.add(game.id);
    return tagAlreadyFiltered || matchesSearchTag(game.tags, criteria.tag);
  }).map(game => ({ ...game, prices: game.prices.filter(price =>
    (!criteria.store || price.store === criteria.store) &&
    (criteria.maxPrice === undefined || (price.currency === "KRW" && knownPrice(price) && price.currentPriceCents <= criteria.maxPrice * 100)) &&
    (!criteria.discounted || discountedPrice(price))
  ) })).filter(game => !requiresOffer || game.prices.length > 0);
  const lowest = (game: GameSummary) => Math.min(Infinity, ...game.prices.filter(price => price.currency === "KRW" && knownPrice(price)).map(price => price.currentPriceCents));
  const discount = (game: GameSummary) => Math.max(0, ...game.prices.filter(discountedPrice).map(price => price.discountPercent));
  const rank = (game: GameSummary) => titleKey(game.title) === titleKey(criteria.q) ? 0 : titleKey(game.title).startsWith(titleKey(criteria.q)) ? 1 : 2;
  return filtered.sort((a, b) => {
    if (criteria.sort === "title") return a.title.localeCompare(b.title, "ko");
    if (criteria.sort === "price") return lowest(a) - lowest(b) || a.title.localeCompare(b.title, "ko");
    if (criteria.sort === "discount") return discount(b) - discount(a) || a.title.localeCompare(b.title, "ko");
    return criteria.q ? rank(a) - rank(b) : 0;
  });
}