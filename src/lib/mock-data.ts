import type { GameSummary, WatchlistItem } from "@/types/game";
import { calculatePopularScore } from "./game-score";

const baseGames: GameSummary[] = [
  {
    id: "game-hades-2",
    title: "Hades II",
    slug: "hades-ii",
    imageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145350/header.jpg",
    releaseDate: "2024-05-06",
    releaseStatus: "released",
    tags: ["Roguelike", "Action", "Mythology"],
    steamReviewCount: 64320,
    steamPositiveRatio: 94,
    prices: [
      {
        store: "steam",
        storeName: "Steam",
        regularPriceCents: 3200000,
        currentPriceCents: 2560000,
        currency: "KRW",
        discountPercent: 20,
        url: "https://store.steampowered.com/app/1145350/Hades_II/"
      },
      {
        store: "epic",
        storeName: "Epic Games",
        regularPriceCents: 3200000,
        currentPriceCents: 3200000,
        currency: "KRW",
        discountPercent: 0,
        url: "https://store.epicgames.com/"
      }
    ]
  },
  {
    id: "game-cyberpunk-2077",
    title: "Cyberpunk 2077",
    slug: "cyberpunk-2077",
    imageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg",
    releaseDate: "2020-12-10",
    releaseStatus: "released",
    tags: ["RPG", "Open World", "Sci-Fi"],
    steamReviewCount: 782400,
    steamPositiveRatio: 83,
    prices: [
      {
        store: "steam",
        storeName: "Steam",
        regularPriceCents: 6600000,
        currentPriceCents: 3300000,
        currency: "KRW",
        discountPercent: 50,
        url: "https://store.steampowered.com/app/1091500/Cyberpunk_2077/",
        isHistoricalLow: true
      },
      {
        store: "epic",
        storeName: "Epic Games",
        regularPriceCents: 6600000,
        currentPriceCents: 3960000,
        currency: "KRW",
        discountPercent: 40,
        url: "https://store.epicgames.com/"
      }
    ]
  },
  {
    id: "game-manor-lords",
    title: "Manor Lords",
    slug: "manor-lords",
    imageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1363080/header.jpg",
    releaseDate: "2024-04-26",
    releaseStatus: "released",
    tags: ["City Builder", "Strategy", "Medieval"],
    steamReviewCount: 52300,
    steamPositiveRatio: 87,
    prices: [
      {
        store: "steam",
        storeName: "Steam",
        regularPriceCents: 4400000,
        currentPriceCents: 3520000,
        currency: "KRW",
        discountPercent: 20,
        url: "https://store.steampowered.com/app/1363080/Manor_Lords/"
      }
    ]
  },
  {
    id: "game-alan-wake-2",
    title: "Alan Wake 2",
    slug: "alan-wake-2",
    imageUrl: "https://cdn2.unrealengine.com/egs-alanwake2-remedyentertainment-s1-2560x1440-3f7f2d492f8e.jpg",
    releaseDate: "2023-10-27",
    releaseStatus: "released",
    tags: ["Horror", "Narrative", "Action"],
    steamReviewCount: 0,
    steamPositiveRatio: undefined,
    prices: [
      {
        store: "epic",
        storeName: "Epic Games",
        regularPriceCents: 5800000,
        currentPriceCents: 2900000,
        currency: "KRW",
        discountPercent: 50,
        url: "https://store.epicgames.com/"
      }
    ]
  },
  {
    id: "game-silk-song",
    title: "Hollow Knight: Silksong",
    slug: "hollow-knight-silksong",
    imageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1030300/header.jpg",
    releaseStatus: "upcoming",
    tags: ["Metroidvania", "Action", "Indie"],
    steamReviewCount: 0,
    prices: [
      {
        store: "steam",
        storeName: "Steam",
        regularPriceCents: 0,
        currentPriceCents: 0,
        currency: "KRW",
        discountPercent: 0,
        url: "https://store.steampowered.com/app/1030300/Hollow_Knight_Silksong/"
      }
    ]
  }
];

export const mockGames = baseGames
  .map((game) => ({
    ...game,
    rankScore: calculatePopularScore(game)
  }))
  .sort((a, b) => (b.rankScore ?? 0) - (a.rankScore ?? 0));

export const mockWatchlist: WatchlistItem[] = [
  {
    id: "watch-cyberpunk",
    game: mockGames.find((game) => game.slug === "cyberpunk-2077") ?? mockGames[0],
    targetDiscountPercent: 50,
    targetPriceCents: 3500000
  },
  {
    id: "watch-hades",
    game: mockGames.find((game) => game.slug === "hades-ii") ?? mockGames[0],
    targetDiscountPercent: 35,
    targetPriceCents: 2200000
  }
];

export function searchMockGames(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return mockGames;
  }

  return mockGames.filter((game) => {
    return (
      game.title.toLowerCase().includes(normalized) ||
      game.tags.some((tag) => tag.toLowerCase().includes(normalized))
    );
  });
}
