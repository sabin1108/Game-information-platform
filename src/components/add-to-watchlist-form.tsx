"use client";

import { BellPlus, LoaderCircle } from "lucide-react";
import React from "react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { serializeGameForWatchlist } from "@/lib/watchlist-serialization";
import type { GameSummary } from "@/types/game";

type AddToWatchlistFormProps = {
  game: GameSummary;
};

type WatchlistResponse = {
  message?: string;
};

export function AddToWatchlistForm({ game }: AddToWatchlistFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<"success" | "error">("success");
  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  function showMessage(nextMessage: string, kind: "success" | "error") {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setMessage(nextMessage);
    setMessageKind(kind);
    timerRef.current = setTimeout(() => {
      setMessage(null);
      timerRef.current = null;
    }, 3000);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        body: new FormData(event.currentTarget)
      });
      const payload = (await response.json()) as WatchlistResponse;

      showMessage(
        payload.message ?? (response.ok ? "관심 목록에 추가되었습니다." : "관심 목록 추가에 실패했습니다."),
        response.ok ? "success" : "error"
      );
    } catch {
      showMessage("관심 목록 추가에 실패했습니다.", "error");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="game-card__action" onSubmit={handleSubmit}>
      <input type="hidden" name="game" value={serializeGameForWatchlist(game)} />
      <button className="button button--primary" disabled={isPending} type="submit">
        {isPending ? <LoaderCircle size={17} aria-hidden="true" /> : <BellPlus size={17} aria-hidden="true" />}
        {isPending ? "추가 중" : "관심 목록에 추가"}
      </button>
      {message ? (
        <span
          className={messageKind === "success" ? "watchlist-toast watchlist-toast--success" : "watchlist-toast"}
          role={messageKind === "success" ? "status" : "alert"}
        >
          {message}
        </span>
      ) : null}
    </form>
  );
}
