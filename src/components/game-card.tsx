"use client";

import React from "react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BadgeCheck, BellPlus, CalendarClock, ExternalLink, Star } from "lucide-react";
import { formatCompactNumber, formatKoreanDateTime, formatPrice } from "@/lib/format";
import { getBestPrice } from "@/lib/game-score";
import type { PopularCardVariant } from "@/lib/analytics/events";
import type { GameSummary, StorePrice } from "@/types/game";
import { StoreBridgeLink } from "./store-bridge-link";

type GameCardProps = {
  game: GameSummary;
  actionLabel?: string;
  action?: ReactNode;
  cardVariant?: PopularCardVariant;
  experimentKey?: string;
  analyticsDistinctId?: string;
  compactMeta?: boolean;
};

type GameCardAnalytics = Pick<GameCardProps, "cardVariant" | "experimentKey" | "analyticsDistinctId">;

const releaseStatusLabels = {
  released: "출시됨",
  upcoming: "출시 예정",
  unknown: "출시일 미정"
};

function formatDealEndsAt(value: string) {
  return formatKoreanDateTime(value);
}

function getReviewBadgeLabel(game: GameSummary, isUpcoming: boolean) {
  if (game.steamReviewCount && game.steamPositiveRatio) {
    return `${formatCompactNumber(game.steamReviewCount)} / ${game.steamPositiveRatio}%`;
  }

  if (game.steamReviewCount) {
    return `인기 ${formatCompactNumber(game.steamReviewCount)}`;
  }

  return isUpcoming ? "출시 예정" : "리뷰 수집 중";
}

function GameCardImage({ game, compactMeta }: Pick<GameCardProps, "game" | "compactMeta">) {
  const isUpcoming = game.releaseStatus === "upcoming";
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageUrl = game.imageUrl?.trim() ?? "";
  const hasImage = Boolean(imageUrl && failedImageUrl !== imageUrl);
  const showReviewBadge = Boolean(game.steamReviewCount || isUpcoming || !compactMeta);

  useEffect(() => {
    setFailedImageUrl(null);
  }, [game.id, game.imageUrl]);

  return (
    <div className="game-card__image">
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" loading="lazy" onError={() => setFailedImageUrl(imageUrl)} />
      ) : (
        <div className="game-card__image-fallback" aria-hidden="true">
          {game.title.slice(0, 2).toUpperCase()}
        </div>
      )}
      {showReviewBadge ? (
        <span className="game-card__badge">
          <Star size={14} aria-hidden="true" />
          {getReviewBadgeLabel(game, isUpcoming)}
        </span>
      ) : null}
    </div>
  );
}

function GameTitleMeta({ game, dealEndsAt }: {
  game: GameSummary;
  dealEndsAt?: string;
}) {
  const showDealEndsAt = Boolean(dealEndsAt);
  const showReleaseStatus = Boolean(!showDealEndsAt && (game.releaseStatus !== "unknown" || game.releaseDate));

  return (
    <div className="game-card__title-row">
      <div>
        <h3>{game.title}</h3>
        {showReleaseStatus ? (
          <span className={`release-status release-status--${game.releaseStatus}`}>
            <CalendarClock size={13} aria-hidden="true" />
            {releaseStatusLabels[game.releaseStatus]}
            {game.releaseDate ? ` · ${game.releaseDate}` : ""}
          </span>
        ) : null}
        {dealEndsAt ? (
          <span className="release-status release-status--released">
            <CalendarClock size={13} aria-hidden="true" />
            할인 종료 {formatDealEndsAt(dealEndsAt)}
          </span>
        ) : null}
        <div className="tag-row" aria-label="태그">
          {game.tags.slice(0, 3).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      {getBestPrice(game)?.isHistoricalLow ? (
        <span className="discount discount--hot">
          <BadgeCheck size={13} aria-hidden="true" /> 최저가
        </span>
      ) : null}
    </div>
  );
}

function StorePriceLink({ game, price, index, analytics }: {
  game: GameSummary;
  price: StorePrice;
  index: number;
  analytics: GameCardAnalytics;
}) {
  return (
    <StoreBridgeLink
      className="store-price"
      key={`${game.id}-${price.store}-${price.storeName}-${price.url}-${index}`}
      payload={{
        gameId: game.id,
        gameTitle: game.title,
        store: price.store,
        storeName: price.storeName,
        url: price.url,
        source: "store-price",
        experimentKey: analytics.experimentKey,
        variant: analytics.cardVariant,
        distinctId: analytics.analyticsDistinctId
      }}
    >
      <span className="store-price__store">{price.storeName}</span>
      <span className="store-price__value">
        <strong>
          {price.currentPriceCents === 0
            ? "가격 미정"
            : formatPrice(price.currentPriceCents, price.currency)}
        </strong>
        {price.discountPercent > 0 ? (
          <span>{formatPrice(price.regularPriceCents, price.currency)}</span>
        ) : null}
      </span>
      {price.discountPercent > 0 ? (
        <span className={price.discountPercent >= 50 ? "discount discount--hot" : "discount"}>
          -{price.discountPercent}%
        </span>
      ) : null}
    </StoreBridgeLink>
  );
}

function GameCardAction({ action, actionLabel }: Pick<GameCardProps, "action" | "actionLabel">) {
  return (
    <div className="game-card__action">
      {action ?? (
        <button className="button button--primary" type="button">
          <BellPlus size={17} aria-hidden="true" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function OpenStoreButton({ game, analytics }: {
  game: GameSummary;
  analytics: GameCardAnalytics;
}) {
  const bestPrice = getBestPrice(game);

  return (
    <StoreBridgeLink
      className="button"
      payload={{
        gameId: game.id,
        gameTitle: game.title,
        store: bestPrice?.store ?? "itad",
        storeName: bestPrice?.storeName ?? "Store",
        url: bestPrice?.url ?? "#",
        source: "game-card",
        experimentKey: analytics.experimentKey,
        variant: analytics.cardVariant,
        distinctId: analytics.analyticsDistinctId
      }}
    >
      <ExternalLink size={17} aria-hidden="true" />
      스토어 열기
    </StoreBridgeLink>
  );
}

export function GameCard({
  game,
  actionLabel = "관심 목록에 추가",
  action,
  cardVariant,
  experimentKey,
  analyticsDistinctId,
  compactMeta = false
}: GameCardProps) {
  const bestPrice = getBestPrice(game);
  const dealEndsAt = compactMeta ? bestPrice?.endsAt : undefined;
  const analytics = { cardVariant, experimentKey, analyticsDistinctId };

  return (
    <article className={[
      "game-card",
      cardVariant === "variant_a" ? "game-card--dense" : ""
    ].filter(Boolean).join(" ")}>
      <GameCardImage game={game} compactMeta={compactMeta} />

      <div className="game-card__body">
        <GameTitleMeta game={game} dealEndsAt={dealEndsAt} />

        <div className="store-list">
          {game.prices.map((price, index) => (
            <StorePriceLink analytics={analytics} game={game} index={index} key={`${game.id}-${price.store}-${price.storeName}-${price.url}-${index}`} price={price} />
          ))}
        </div>

        <GameCardAction action={action} actionLabel={actionLabel} />
        <OpenStoreButton analytics={analytics} game={game} />
      </div>
    </article>
  );
}
