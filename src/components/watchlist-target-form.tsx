import React from "react";
import { Save, Trash2 } from "lucide-react";
import { removeWatchlistItemAction, updateWatchlistTargetAction } from "@/app/app/actions";
import { formatPrice } from "@/lib/format";
import { getTargetMatchState } from "@/lib/game-score";
import type { WatchlistItem } from "@/types/game";

type WatchlistTargetFormProps = {
  item: WatchlistItem;
  disabled?: boolean;
};

export function WatchlistTargetForm({ item, disabled = false }: WatchlistTargetFormProps) {
  const matchState = getTargetMatchState(item);
  const targetPrice = item.targetPriceCents ? item.targetPriceCents / 100 : "";
  const bestPrice = matchState.bestPrice;

  return (
    <form
      className={matchState.matched ? "target-form target-form--matched" : "target-form"}
      action={updateWatchlistTargetAction}
    >
      <input type="hidden" name="itemId" value={item.id} />
      <div className="target-form__summary">
        <div>
          <h3>{item.game.title}</h3>
          <div className="tag-row">
            {bestPrice ? (
              <span className="tag">
                현재 {formatPrice(bestPrice.currentPriceCents, bestPrice.currency)}
              </span>
            ) : (
              <span className="tag">가격 미정</span>
            )}
            {bestPrice?.discountPercent ? (
              <span className="discount">-{bestPrice.discountPercent}%</span>
            ) : null}
          </div>
        </div>
        <span className={matchState.matched ? "match" : "tag"}>
          {matchState.matched ? "조건 충족" : "관찰 중"}
        </span>
      </div>

      <div className="target-form__fields">
        <label className="field">
          <span>목표가(원)</span>
          <input
            aria-label={`${item.game.title} 목표가`}
            defaultValue={targetPrice}
            disabled={disabled}
            min="0"
            name="targetPrice"
            placeholder="35000"
            step="100"
            type="number"
          />
        </label>
        <label className="field">
          <span>목표 할인율</span>
          <input
            aria-label={`${item.game.title} 목표 할인율`}
            defaultValue={item.targetDiscountPercent ?? ""}
            disabled={disabled}
            max="100"
            min="0"
            name="targetDiscount"
            placeholder="50"
            type="number"
          />
        </label>
      </div>

      <label className="field">
        <span>메모</span>
        <input
          aria-label={`${item.game.title} 메모`}
          defaultValue={item.note ?? ""}
          disabled={disabled}
          name="note"
          placeholder="선택 입력"
        />
      </label>

      <div className="form-actions">
        <button className="button button--primary" disabled={disabled} type="submit">
          <Save size={17} aria-hidden="true" />
          목표 저장
        </button>
        <button
          className="button button--danger"
          disabled={disabled}
          formAction={removeWatchlistItemAction}
          type="submit"
        >
          <Trash2 size={17} aria-hidden="true" />
          삭제
        </button>
      </div>
    </form>
  );
}
