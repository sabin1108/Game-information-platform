import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DealFeed } from "@/components/deal-feed";
import { mockGames } from "@/lib/mock-data";

vi.mock("@/components/use-intersection-loader", () => ({ useIntersectionLoader: vi.fn() }));
vi.mock("@/components/game-card", () => ({ GameCard: ({ game }: { game: { title: string } }) => <article>{game.title}</article> }));
vi.mock("@/components/game-card-watchlist-action", () => ({ GameCardWatchlistAction: () => null }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const filters = { country: "KR", offset: 0, limit: 1, minDiscount: 1, sort: "reviews" as const };

describe("deal feed recovery", () => {
  it("keeps cards and retries the same cursor after an HTTP failure", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "unavailable" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [mockGames[1]], nextOffset: 301, hasMore: false }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<DealFeed initialGames={[mockGames[0]]} initialTagOptions={[]} filters={filters} isAuthenticated={false} initialNextOffset={300} initialHasMore />);
    fireEvent.click(screen.getByRole("button", { name: "더 보기" }));
    await screen.findByRole("alert");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    expect(fetchMock.mock.calls[0][0]).toContain("offset=300");
    expect(fetchMock.mock.calls[1][0]).toContain("offset=300");
  });

  it("respects server hasMore=false even when the first page is full", () => {
    render(<DealFeed initialGames={[mockGames[0]]} initialTagOptions={[]} filters={filters} isAuthenticated={false} initialHasMore={false} />);
    expect(screen.queryByRole("button", { name: "더 보기" })).toBeNull();
    expect(screen.getByText(/모두 확인/)).toBeTruthy();
  });
});
