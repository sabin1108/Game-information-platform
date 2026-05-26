import { BellPlus } from "lucide-react";
import { addToWatchlist } from "@/app/search/actions";
import { serializeGameForWatchlist } from "@/lib/watchlist-serialization";
import type { GameSummary } from "@/types/game";

type AddToWatchlistFormProps = {
  game: GameSummary;
};

export function AddToWatchlistForm({ game }: AddToWatchlistFormProps) {
  return (
    <form className="game-card__action" action={addToWatchlist}>
      <input type="hidden" name="game" value={serializeGameForWatchlist(game)} />
      <button className="button button--primary" type="submit">
        <BellPlus size={17} aria-hidden="true" />
        관심 목록 추가
      </button>
    </form>
  );
}
