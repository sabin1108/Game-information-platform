import type { GameSummary, StorePrice, WatchlistItem } from "@/types/game";
import { calculatePopularScore } from "./game-score";

type MockGameInput = Omit<GameSummary, "id" | "prices"> & {
  steamAppId?: number;
  prices: StorePrice[];
};

function steamUrl(appId: number, slug: string) {
  return `https://store.steampowered.com/app/${appId}/${slug}/`;
}

function steamImage(appId: number) {
  return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
}

function steamPrice(appId: number, slug: string, regular: number, current: number, discount: number): StorePrice {
  return {
    store: "steam",
    storeName: "Steam",
    regularPriceCents: regular * 100,
    currentPriceCents: current * 100,
    currency: "KRW",
    discountPercent: discount,
    url: steamUrl(appId, slug),
    isHistoricalLow: discount >= 60
  };
}

function epicPrice(regular: number, current: number, discount: number): StorePrice {
  return {
    store: "epic",
    storeName: "Epic Games",
    regularPriceCents: regular * 100,
    currentPriceCents: current * 100,
    currency: "KRW",
    discountPercent: discount,
    url: "https://store.epicgames.com/",
    isHistoricalLow: discount >= 60
  };
}

function game(input: MockGameInput): GameSummary {
  return {
    ...input,
    id: `game-${input.slug}`,
    imageUrl: input.imageUrl || (input.steamAppId ? steamImage(input.steamAppId) : "")
  };
}

const baseGames: GameSummary[] = [
  game({
    title: "Hades II",
    slug: "hades-ii",
    steamAppId: 1145350,
    imageUrl: "",
    releaseDate: "2024-05-06",
    releaseStatus: "released",
    tags: ["Roguelike", "Action", "Mythology"],
    steamReviewCount: 64320,
    steamPositiveRatio: 94,
    prices: [steamPrice(1145350, "Hades_II", 32000, 25600, 20), epicPrice(32000, 32000, 0)]
  }),
  game({
    title: "Cyberpunk 2077",
    slug: "cyberpunk-2077",
    steamAppId: 1091500,
    imageUrl: "",
    releaseDate: "2020-12-10",
    releaseStatus: "released",
    tags: ["RPG", "Open World", "Sci-Fi"],
    steamReviewCount: 782400,
    steamPositiveRatio: 83,
    prices: [steamPrice(1091500, "Cyberpunk_2077", 66000, 33000, 50), epicPrice(66000, 39600, 40)]
  }),
  game({
    title: "Baldur's Gate 3",
    slug: "baldurs-gate-3",
    steamAppId: 1086940,
    imageUrl: "",
    releaseDate: "2023-08-03",
    releaseStatus: "released",
    tags: ["CRPG", "Fantasy", "Co-op"],
    steamReviewCount: 670000,
    steamPositiveRatio: 96,
    prices: [steamPrice(1086940, "Baldurs_Gate_3", 66000, 59400, 10)]
  }),
  game({
    title: "Elden Ring",
    slug: "elden-ring",
    steamAppId: 1245620,
    imageUrl: "",
    releaseDate: "2022-02-25",
    releaseStatus: "released",
    tags: ["Soulslike", "Open World", "Action"],
    steamReviewCount: 725000,
    steamPositiveRatio: 92,
    prices: [steamPrice(1245620, "ELDEN_RING", 64800, 38880, 40)]
  }),
  game({
    title: "Helldivers 2",
    slug: "helldivers-2",
    steamAppId: 553850,
    imageUrl: "",
    releaseDate: "2024-02-08",
    releaseStatus: "released",
    tags: ["Co-op", "Shooter", "Action"],
    steamReviewCount: 540000,
    steamPositiveRatio: 78,
    prices: [steamPrice(553850, "HELLDIVERS_2", 44800, 35840, 20)]
  }),
  game({
    title: "Stardew Valley",
    slug: "stardew-valley",
    steamAppId: 413150,
    imageUrl: "",
    releaseDate: "2016-02-26",
    releaseStatus: "released",
    tags: ["Farming", "Cozy", "RPG"],
    steamReviewCount: 730000,
    steamPositiveRatio: 98,
    prices: [steamPrice(413150, "Stardew_Valley", 16000, 9600, 40)]
  }),
  game({
    title: "Balatro",
    slug: "balatro",
    steamAppId: 2379780,
    imageUrl: "",
    releaseDate: "2024-02-20",
    releaseStatus: "released",
    tags: ["Deckbuilder", "Roguelike", "Card Game"],
    steamReviewCount: 125000,
    steamPositiveRatio: 97,
    prices: [steamPrice(2379780, "Balatro", 16500, 13200, 20)]
  }),
  game({
    title: "Manor Lords",
    slug: "manor-lords",
    steamAppId: 1363080,
    imageUrl: "",
    releaseDate: "2024-04-26",
    releaseStatus: "released",
    tags: ["City Builder", "Strategy", "Medieval"],
    steamReviewCount: 52300,
    steamPositiveRatio: 87,
    prices: [steamPrice(1363080, "Manor_Lords", 44000, 35200, 20)]
  }),
  game({
    title: "Alan Wake 2",
    slug: "alan-wake-2",
    imageUrl: "https://cdn2.unrealengine.com/egs-alanwake2-remedyentertainment-s1-2560x1440-3f7f2d492f8e.jpg",
    releaseDate: "2023-10-27",
    releaseStatus: "released",
    tags: ["Horror", "Narrative", "Action"],
    steamReviewCount: 0,
    steamPositiveRatio: undefined,
    prices: [epicPrice(58000, 29000, 50)]
  }),
  game({
    title: "Dave the Diver",
    slug: "dave-the-diver",
    steamAppId: 1868140,
    imageUrl: "",
    releaseDate: "2023-06-28",
    releaseStatus: "released",
    tags: ["Adventure", "Management", "Fishing"],
    steamReviewCount: 110000,
    steamPositiveRatio: 97,
    prices: [steamPrice(1868140, "DAVE_THE_DIVER", 24000, 16800, 30)]
  }),
  game({
    title: "Disco Elysium",
    slug: "disco-elysium",
    steamAppId: 632470,
    imageUrl: "",
    releaseDate: "2019-10-15",
    releaseStatus: "released",
    tags: ["RPG", "Narrative", "Detective"],
    steamReviewCount: 105000,
    steamPositiveRatio: 92,
    prices: [steamPrice(632470, "Disco_Elysium__The_Final_Cut", 41000, 10250, 75)]
  }),
  game({
    title: "Dead Cells",
    slug: "dead-cells",
    steamAppId: 588650,
    imageUrl: "",
    releaseDate: "2018-08-06",
    releaseStatus: "released",
    tags: ["Roguelike", "Metroidvania", "Action"],
    steamReviewCount: 140000,
    steamPositiveRatio: 97,
    prices: [steamPrice(588650, "Dead_Cells", 27000, 13500, 50)]
  }),
  game({
    title: "No Man's Sky",
    slug: "no-mans-sky",
    steamAppId: 275850,
    imageUrl: "",
    releaseDate: "2016-08-12",
    releaseStatus: "released",
    tags: ["Survival", "Space", "Exploration"],
    steamReviewCount: 255000,
    steamPositiveRatio: 80,
    prices: [steamPrice(275850, "No_Mans_Sky", 64800, 32400, 50)]
  }),
  game({
    title: "Palworld",
    slug: "palworld",
    steamAppId: 1623730,
    imageUrl: "",
    releaseDate: "2024-01-19",
    releaseStatus: "released",
    tags: ["Survival", "Creature Collector", "Co-op"],
    steamReviewCount: 340000,
    steamPositiveRatio: 93,
    prices: [steamPrice(1623730, "Palworld", 32000, 25600, 20)]
  }),
  game({
    title: "RimWorld",
    slug: "rimworld",
    steamAppId: 294100,
    imageUrl: "",
    releaseDate: "2018-10-17",
    releaseStatus: "released",
    tags: ["Colony Sim", "Strategy", "Story Rich"],
    steamReviewCount: 175000,
    steamPositiveRatio: 98,
    prices: [steamPrice(294100, "RimWorld", 36000, 32400, 10)]
  }),
  game({
    title: "Slay the Spire",
    slug: "slay-the-spire",
    steamAppId: 646570,
    imageUrl: "",
    releaseDate: "2019-01-23",
    releaseStatus: "released",
    tags: ["Deckbuilder", "Roguelike", "Strategy"],
    steamReviewCount: 160000,
    steamPositiveRatio: 97,
    prices: [steamPrice(646570, "Slay_the_Spire", 26000, 6500, 75)]
  }),
  game({
    title: "Forza Horizon 5",
    slug: "forza-horizon-5",
    steamAppId: 1551360,
    imageUrl: "",
    releaseDate: "2021-11-09",
    releaseStatus: "released",
    tags: ["Racing", "Open World", "Driving"],
    steamReviewCount: 185000,
    steamPositiveRatio: 88,
    prices: [steamPrice(1551360, "Forza_Horizon_5", 59900, 29950, 50)]
  }),
  game({
    title: "Sea of Stars",
    slug: "sea-of-stars",
    steamAppId: 1244090,
    imageUrl: "",
    releaseDate: "2023-08-29",
    releaseStatus: "released",
    tags: ["JRPG", "Pixel Art", "Adventure"],
    steamReviewCount: 16000,
    steamPositiveRatio: 90,
    prices: [steamPrice(1244090, "Sea_of_Stars", 37500, 26250, 30)]
  }),
  game({
    title: "Lethal Company",
    slug: "lethal-company",
    steamAppId: 1966720,
    imageUrl: "",
    releaseDate: "2023-10-23",
    releaseStatus: "released",
    tags: ["Co-op", "Horror", "Comedy"],
    steamReviewCount: 420000,
    steamPositiveRatio: 97,
    prices: [steamPrice(1966720, "Lethal_Company", 11000, 8800, 20)]
  }),
  game({
    title: "Satisfactory",
    slug: "satisfactory",
    steamAppId: 526870,
    imageUrl: "",
    releaseDate: "2024-09-10",
    releaseStatus: "released",
    tags: ["Automation", "Factory", "Open World"],
    steamReviewCount: 190000,
    steamPositiveRatio: 96,
    prices: [steamPrice(526870, "Satisfactory", 33000, 19800, 40), epicPrice(33000, 23100, 30)]
  }),
  game({
    title: "Factorio",
    slug: "factorio",
    steamAppId: 427520,
    imageUrl: "",
    releaseDate: "2020-08-14",
    releaseStatus: "released",
    tags: ["Automation", "Factory", "Strategy"],
    steamReviewCount: 190000,
    steamPositiveRatio: 97,
    prices: [steamPrice(427520, "Factorio", 35000, 35000, 0)]
  }),
  game({
    title: "Frostpunk 2",
    slug: "frostpunk-2",
    steamAppId: 1601580,
    imageUrl: "",
    releaseDate: "2024-09-20",
    releaseStatus: "released",
    tags: ["Survival", "City Builder", "Strategy"],
    steamReviewCount: 21000,
    steamPositiveRatio: 72,
    prices: [steamPrice(1601580, "Frostpunk_2", 49000, 34300, 30)]
  }),
  game({
    title: "Hollow Knight: Silksong",
    slug: "hollow-knight-silksong",
    steamAppId: 1030300,
    imageUrl: "",
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
        url: steamUrl(1030300, "Hollow_Knight_Silksong")
      }
    ]
  }),
  game({
    title: "Monster Hunter Wilds",
    slug: "monster-hunter-wilds",
    steamAppId: 2246340,
    imageUrl: "",
    releaseDate: "2025-02-28",
    releaseStatus: "upcoming",
    tags: ["Action", "RPG", "Co-op"],
    steamReviewCount: 0,
    prices: [
      {
        store: "steam",
        storeName: "Steam",
        regularPriceCents: 0,
        currentPriceCents: 0,
        currency: "KRW",
        discountPercent: 0,
        url: steamUrl(2246340, "Monster_Hunter_Wilds")
      }
    ]
  })
];

export const mockGames = baseGames
  .map((item) => ({
    ...item,
    rankScore: calculatePopularScore(item)
  }))
  .sort((a, b) => (b.rankScore ?? 0) - (a.rankScore ?? 0));

export const mockWatchlist: WatchlistItem[] = [
  {
    id: "watch-cyberpunk",
    game: mockGames.find((item) => item.slug === "cyberpunk-2077") ?? mockGames[0],
    targetDiscountPercent: 50,
    targetPriceCents: 35000 * 100
  },
  {
    id: "watch-hades",
    game: mockGames.find((item) => item.slug === "hades-ii") ?? mockGames[0],
    targetDiscountPercent: 35,
    targetPriceCents: 22000 * 100
  },
  {
    id: "watch-slay-the-spire",
    game: mockGames.find((item) => item.slug === "slay-the-spire") ?? mockGames[0],
    targetDiscountPercent: 70,
    targetPriceCents: 8000 * 100
  },
  {
    id: "watch-baldurs-gate-3",
    game: mockGames.find((item) => item.slug === "baldurs-gate-3") ?? mockGames[0],
    targetDiscountPercent: 25,
    targetPriceCents: 45000 * 100
  },
  {
    id: "watch-silksong",
    game: mockGames.find((item) => item.slug === "hollow-knight-silksong") ?? mockGames[0],
    targetDiscountPercent: 10
  }
];

export function searchMockGames(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return mockGames;
  }

  return mockGames.filter((item) => {
    return (
      item.title.toLowerCase().includes(normalized) ||
      item.tags.some((tag) => tag.toLowerCase().includes(normalized))
    );
  });
}
