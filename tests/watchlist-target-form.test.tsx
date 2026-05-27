import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WatchlistTargetForm } from "@/components/watchlist-target-form";
import { mockWatchlist } from "@/lib/mock-data";

vi.mock("@/app/app/actions", () => ({
  updateWatchlistTargetAction: vi.fn()
}));

describe("WatchlistTargetForm", () => {
  it("renders target fields with the saved values and matched state", () => {
    const item = mockWatchlist.find((entry) => entry.id === "watch-cyberpunk");

    if (!item) {
      throw new Error("Expected Cyberpunk watchlist item.");
    }

    render(<WatchlistTargetForm item={item} />);

    expect(screen.getByRole("heading", { name: "Cyberpunk 2077" })).toBeTruthy();
    expect(screen.getByLabelText("Cyberpunk 2077 목표가")).toHaveValue(35000);
    expect(screen.getByLabelText("Cyberpunk 2077 목표 할인율")).toHaveValue(50);
    expect(screen.getByText("조건 충족")).toBeTruthy();
    expect(screen.getByRole("button", { name: "목표 저장" })).toBeTruthy();
  });
});
