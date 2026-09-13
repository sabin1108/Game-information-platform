import { describe, expect, it } from "vitest";
import { normalizeItadGame } from "@/lib/itad-normalizers";

describe("game cover normalization", () => {
  it("uses a smaller supplied banner when the large asset is empty", () => {
    const game = normalizeItadGame({ id: "cover", title: "Cover", assets: { banner600: "", banner145: "https://example.com/cover.jpg" } });
    expect(game.imageUrl).toBe("https://example.com/cover.jpg");
  });
  it("keeps the Steam identity even when that offer has no announced price", () => {
    const game = normalizeItadGame({ id: "upcoming", title: "Upcoming" }, { id: "upcoming", deals: [{ shop: { name: "Steam" }, url: "https://store.steampowered.com/app/123456/", price: { amount: 0 } }] });
    expect(game.steamAppId).toBe(123456);
    expect(game.imageUrl).toContain("/123456/header.jpg");
  });
});
