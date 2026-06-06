import "./styles.css";

export type LabStorePrice = {
  storeName: string;
  currentPrice: string;
  regularPrice?: string;
  discountPercent?: number;
};

export type LabGameCard = {
  title: string;
  imageUrl?: string;
  reviewSummary: string;
  tags: string[];
  prices: LabStorePrice[];
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderGameCardPreview(game: LabGameCard) {
  const tags = game.tags
    .slice(0, 3)
    .map((tag) => `<span class="gcl-tag">${escapeHtml(tag)}</span>`)
    .join("");
  const prices = game.prices
    .map((price) => {
      const discount = price.discountPercent
        ? `<span class="gcl-discount">-${price.discountPercent}%</span>`
        : "";
      const regular = price.regularPrice ? `<span>${escapeHtml(price.regularPrice)}</span>` : "";

      return `<li><b>${escapeHtml(price.storeName)}</b><strong>${escapeHtml(
        price.currentPrice
      )}</strong>${regular}${discount}</li>`;
    })
    .join("");
  const image = game.imageUrl
    ? `<img src="${escapeHtml(game.imageUrl)}" alt="" loading="lazy">`
    : `<div class="gcl-fallback">${escapeHtml(game.title.slice(0, 2).toUpperCase())}</div>`;

  return `<article class="gcl-card">
    <div class="gcl-art">${image}</div>
    <div class="gcl-body">
      <p>${escapeHtml(game.reviewSummary)}</p>
      <h2>${escapeHtml(game.title)}</h2>
      <div class="gcl-tags">${tags}</div>
      <ul>${prices}</ul>
    </div>
  </article>`;
}

export const sampleGame: LabGameCard = {
  title: "Hades II",
  reviewSummary: "64k reviews / 94% positive",
  tags: ["Roguelike", "Action", "Mythology"],
  prices: [
    {
      storeName: "Steam",
      currentPrice: "KRW 25,600",
      regularPrice: "KRW 32,000",
      discountPercent: 20
    },
    {
      storeName: "Epic Games",
      currentPrice: "KRW 32,000"
    }
  ]
};
