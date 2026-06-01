import { AddToWatchlistForm } from "@/components/add-to-watchlist-form";
import type { GameSummary } from "@/types/game";

type GameCardWatchlistActionProps = {
  game: GameSummary;
  isAuthenticated: boolean;
  loginPath?: string;
};

export function GameCardWatchlistAction({
  game,
  isAuthenticated,
  loginPath = "/login"
}: GameCardWatchlistActionProps) {
  if (isAuthenticated) {
    return <AddToWatchlistForm game={game} />;
  }

  return (
    <a className="button button--primary" href={loginPath}>
      로그인 후 찜하기
    </a>
  );
}
