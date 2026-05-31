import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GameCard } from "@/components/game-card";
import { mockGames } from "@/lib/mock-data";

describe("GameCard", () => {
  it("shows Steam and Epic store prices for search results", () => {
    const game = mockGames.find((item) => item.slug === "hades-ii");

    if (!game) {
      throw new Error("Expected Hades II mock game.");
    }

    render(<GameCard game={game} />);

    expect(screen.getByText("Steam")).toBeTruthy();
    expect(screen.getByText("Epic Games")).toBeTruthy();
    expect(screen.getByText("25,600원")).toBeTruthy();
    expect(screen.getAllByText("32,000원").length).toBeGreaterThan(0);
  });

  it("shows the release status on each card", () => {
    const upcoming = mockGames.find((item) => item.releaseStatus === "upcoming");
    const unknown = mockGames.find((item) => item.releaseStatus === "unknown");

    if (!upcoming || !unknown) {
      throw new Error("Expected upcoming and unknown mock games.");
    }

    const { rerender } = render(<GameCard game={upcoming} />);

    expect(screen.getAllByText(/출시 예정/).length).toBeGreaterThan(0);

    rerender(<GameCard game={unknown} />);

    expect(screen.getByText("출시일 미정")).toBeTruthy();
  });
});
