import React from "react";
import type { ReactNode } from "react";
import { BadgeCheck, BellPlus, CalendarClock, ExternalLink, Star } from "lucide-react";
import { formatCompactNumber, formatPrice } from "@/lib/format";
import { getBestPrice } from "@/lib/game-score";
import type { GameSummary } from "@/types/game";

type GameCardProps = {
  game: GameSummary;
  actionLabel?: string;
  action?: ReactNode;
};

const releaseStatusLabels = {
  released: "출시됨",
  upcoming: "출시 예정",
  unknown: "출시일 미정"
};

export function GameCard({ game, actionLabel = "관심 목록에 추가", action }: GameCardProps) {
  const bestPrice = getBestPrice(game);
  const isUpcoming = game.releaseStatus === "upcoming";
  const hasImage = Boolean(game.imageUrl);

  return (
    <article className="game-card">
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
          {game.prices.map((price) => (
            <a className="store-price" href={price.url} key={`${game.id}-${price.store}`}>
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
            </a>
          ))}
        </div>

        {action ?? (
          <button className="button button--primary" type="button">
            <BellPlus size={17} aria-hidden="true" />
            {actionLabel}
          </button>
        )}

        <a className="button" href={bestPrice?.url ?? "#"}>
          <ExternalLink size={17} aria-hidden="true" />
          스토어 열기
        </a>
      </div>
    </article>
  );
}
