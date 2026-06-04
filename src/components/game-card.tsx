import React from "react";
import type { ReactNode } from "react";
import { BadgeCheck, BellPlus, CalendarClock, ExternalLink, Star } from "lucide-react";
import { formatCompactNumber, formatPrice } from "@/lib/format";
import { getBestPrice } from "@/lib/game-score";
import type { PopularCardVariant } from "@/lib/analytics/events";
import type { GameSummary } from "@/types/game";
import { StoreBridgeLink } from "./store-bridge-link";

type GameCardProps = {
  game: GameSummary;
  actionLabel?: string;
  action?: ReactNode;
  cardVariant?: PopularCardVariant;
  experimentKey?: string;
  analyticsDistinctId?: string;
};

const releaseStatusLabels = {
  released: "출시됨",
  upcoming: "출시 예정",
  unknown: "출시일 미정"
};

export function GameCard({
  game,
  actionLabel = "관심 목록에 추가",
  action,
  cardVariant,
  experimentKey,
  analyticsDistinctId
}: GameCardProps) {
  const bestPrice = getBestPrice(game);
  const isUpcoming = game.releaseStatus === "upcoming";
  const hasImage = Boolean(game.imageUrl);

  return (
    <article className={cardVariant === "variant_a" ? "game-card game-card--dense" : "game-card"}>
      <div className="game-card__image">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={game.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="game-card__image-fallback" aria-hidden="true">
            {game.title.slice(0, 2).toUpperCase()}
          </div>
        )}
        <span className="game-card__badge">
          <Star size={14} aria-hidden="true" />
          {game.steamReviewCount
            ? `${formatCompactNumber(game.steamReviewCount)} / ${game.steamPositiveRatio}%`
            : isUpcoming
              ? "출시 예정"
              : "리뷰 수집 중"}
        </span>
      </div>

      <div className="game-card__body">
        <div className="game-card__title-row">
          <div>
            <h3>{game.title}</h3>
            <span className={`release-status release-status--${game.releaseStatus}`}>
              <CalendarClock size={13} aria-hidden="true" />
              {releaseStatusLabels[game.releaseStatus]}
              {game.releaseDate ? ` · ${game.releaseDate}` : ""}
            </span>
            <div className="tag-row" aria-label="태그">
              {game.tags.slice(0, 3).map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {bestPrice?.isHistoricalLow ? (
            <span className="discount discount--hot">
              <BadgeCheck size={13} aria-hidden="true" /> 최저가
            </span>
          ) : null}
        </div>

        <div className="store-list">
          {game.prices.map((price, index) => (
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
                experimentKey,
                variant: cardVariant,
                distinctId: analyticsDistinctId
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
          ))}
        </div>

        {action ?? (
          <button className="button button--primary" type="button">
            <BellPlus size={17} aria-hidden="true" />
            {actionLabel}
          </button>
        )}

        <StoreBridgeLink
          className="button"
          payload={{
            gameId: game.id,
            gameTitle: game.title,
            store: bestPrice?.store ?? "itad",
            storeName: bestPrice?.storeName ?? "Store",
            url: bestPrice?.url ?? "#",
            source: "game-card",
            experimentKey,
            variant: cardVariant,
            distinctId: analyticsDistinctId
          }}
        >
          <ExternalLink size={17} aria-hidden="true" />
          스토어 열기
        </StoreBridgeLink>
      </div>
    </article>
  );
}
