import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";
import type { GameSummary, StoreCode, StorePrice, WatchlistItem } from "@/types/game";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type GameRow = Database["public"]["Tables"]["games"]["Row"];
type ProductRow = Database["public"]["Tables"]["game_store_products"]["Row"];
type SnapshotRow = Database["public"]["Tables"]["price_snapshots"]["Row"];
type PersistableStoreCode = Extract<StoreCode, "steam" | "epic">;

export type AddWatchlistResult = {
  status: "created" | "exists";
};

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function toNullableDate(value: string | undefined) {
  return value ? value.slice(0, 10) : null;
}

function toDbStoreCode(store: StoreCode): PersistableStoreCode | null {
  if (store === "steam" || store === "epic") {
    return store;
  }

  return null;
}

function getExternalProductId(game: GameSummary, price: StorePrice) {
  return `${game.id}:${price.store}:${price.url}`;
}

function getStoreName(store: StoreCode) {
  if (store === "steam") {
    return "Steam";
  }

  if (store === "epic") {
    return "Epic Games";
  }

  return "IsThereAnyDeal";
}

async function upsertGameCatalog(game: GameSummary) {
  const admin = createAdminClient();
  const { data: gameRow, error: gameError } = await admin
    .from("games")
    .upsert(
      {
        itad_game_id: game.id,
        slug: game.slug,
        title: game.title,
        image_url: game.imageUrl || null,
        release_date: toNullableDate(game.releaseDate),
        release_status: game.releaseStatus,
        steam_review_count: game.steamReviewCount ?? null,
        steam_positive_ratio: game.steamPositiveRatio ?? null,
        tags: game.tags,
        raw: toJson(game)
      },
      { onConflict: "itad_game_id" }
    )
    .select("id")
    .single();

  if (gameError) {
    throw new Error(gameError.message);
  }

  for (const price of game.prices) {
    const store = toDbStoreCode(price.store);

    if (!store || price.currentPriceCents <= 0) {
      continue;
    }

    const { data: productRow, error: productError } = await admin
      .from("game_store_products")
      .upsert(
        {
          game_id: gameRow.id,
          store,
          external_id: getExternalProductId(game, price),
          store_url: price.url,
          title: price.storeName,
          country: "KR",
          is_active: true,
          raw: toJson(price)
        },
        { onConflict: "store,external_id" }
      )
      .select("id")
      .single();

    if (productError) {
      throw new Error(productError.message);
    }

    const { error: snapshotError } = await admin.from("price_snapshots").insert({
      product_id: productRow.id,
      country: "KR",
      currency: price.currency,
      regular_price_cents: price.regularPriceCents,
      current_price_cents: price.currentPriceCents,
      discount_percent: price.discountPercent,
      is_historical_low: Boolean(price.isHistoricalLow),
      ends_at: price.endsAt ?? null,
      raw: toJson(price)
    });

    if (snapshotError) {
      throw new Error(snapshotError.message);
    }
  }

  return gameRow.id;
}

export async function addGameToWatchlist(
  supabase: SupabaseServerClient,
  userId: string,
  game: GameSummary
): Promise<AddWatchlistResult> {
  const gameId = await upsertGameCatalog(game);
  const { error } = await supabase.from("watchlist_items").insert({
    user_id: userId,
    game_id: gameId
  });

  if (!error) {
    return { status: "created" };
  }

  if (error.code === "23505") {
    return { status: "exists" };
  }

  throw new Error(error.message);
}

function toGameSummary(game: GameRow, prices: StorePrice[]): GameSummary {
  return {
    id: game.itad_game_id ?? game.id,
    title: game.title,
    slug: game.slug ?? game.id,
    imageUrl: game.image_url ?? "",
    releaseDate: game.release_date ?? undefined,
    releaseStatus: game.release_status,
    tags: game.tags,
    steamReviewCount: game.steam_review_count ?? undefined,
    steamPositiveRatio: game.steam_positive_ratio ?? undefined,
    prices
  };
}

function toStorePrice(product: ProductRow, snapshot: SnapshotRow | undefined): StorePrice {
  return {
    store: product.store,
    storeName: getStoreName(product.store),
    regularPriceCents: snapshot?.regular_price_cents ?? 0,
    currentPriceCents: snapshot?.current_price_cents ?? 0,
    currency: snapshot?.currency ?? "KRW",
    discountPercent: snapshot?.discount_percent ?? 0,
    url: product.store_url,
    isHistoricalLow: snapshot?.is_historical_low ?? false,
    endsAt: snapshot?.ends_at ?? undefined
  };
}

export async function getUserWatchlist(
  userId: string
): Promise<WatchlistItem[]> {
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("watchlist_items")
    .select("*")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const watchlistRows = rows ?? [];
  const gameIds = watchlistRows.map((row) => row.game_id);

  if (!gameIds.length) {
    return [];
  }

  const [{ data: games, error: gamesError }, { data: products, error: productsError }] =
    await Promise.all([
      admin.from("games").select("*").in("id", gameIds),
      admin.from("game_store_products").select("*").in("game_id", gameIds).eq("is_active", true)
    ]);

  if (gamesError) {
    throw new Error(gamesError.message);
  }

  if (productsError) {
    throw new Error(productsError.message);
  }

  const productIds = (products ?? []).map((product) => product.id);
  const snapshotsByProduct = new Map<string, SnapshotRow>();

  if (productIds.length) {
    const { data: snapshots, error: snapshotsError } = await admin
      .from("price_snapshots")
      .select("*")
      .in("product_id", productIds)
      .order("observed_at", { ascending: false });

    if (snapshotsError) {
      throw new Error(snapshotsError.message);
    }

    for (const snapshot of snapshots ?? []) {
      if (!snapshotsByProduct.has(snapshot.product_id)) {
        snapshotsByProduct.set(snapshot.product_id, snapshot);
      }
    }
  }

  const gamesById = new Map((games ?? []).map((game) => [game.id, game]));
  const pricesByGame = new Map<string, StorePrice[]>();

  for (const product of products ?? []) {
    const price = toStorePrice(product, snapshotsByProduct.get(product.id));
    const list = pricesByGame.get(product.game_id) ?? [];
    list.push(price);
    pricesByGame.set(product.game_id, list);
  }

  const items: WatchlistItem[] = [];

  for (const row of watchlistRows) {
    const game = gamesById.get(row.game_id);

    if (!game) {
      continue;
    }

    items.push({
      id: row.id,
      game: toGameSummary(game, pricesByGame.get(row.game_id) ?? []),
      targetPriceCents: row.target_price_cents ?? undefined,
      targetDiscountPercent: row.target_discount_percent ?? undefined,
      note: row.note ?? undefined
    });
  }

  return items;
}
