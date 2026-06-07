import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddToWatchlistForm } from "@/components/add-to-watchlist-form";
import { mockGames } from "@/lib/mock-data";

describe("AddToWatchlistForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("adds a game without navigating and hides the success message after 3 seconds", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "관심 목록에 추가되었습니다." })
    });

    vi.stubGlobal("fetch", fetchMock);
    render(<AddToWatchlistForm game={mockGames[0]} />);

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "관심 목록에 추가" }).closest("form")!);
      await Promise.resolve();
    });

    expect(screen.getByRole("status")).toHaveTextContent("관심 목록에 추가되었습니다.");
    expect(fetchMock).toHaveBeenCalledWith("/api/watchlist", expect.objectContaining({ method: "POST" }));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByRole("status")).toBeNull();
  });
});
