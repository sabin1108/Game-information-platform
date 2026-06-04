import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

const TAG_FILE = "steam_popular_tags.md";

const fallbackTags = [
  "Action",
  "Adventure",
  "Casual",
  "Indie",
  "RPG",
  "Simulation",
  "Strategy",
  "Puzzle",
  "Horror",
  "Platformer",
  "Shooter",
  "Sandbox",
  "Story Rich",
  "Survival",
  "Open World",
  "Turn-Based",
  "Roguelike",
  "Roguelite",
  "Card Game",
  "City Builder",
  "Management",
  "Sci-Fi",
  "Fantasy",
  "Base Building",
  "Resource Management",
  "Crafting",
  "Deckbuilding",
  "Automation",
  "Co-op",
  "Singleplayer"
];

let cachedTags: string[] | undefined;

export function normalizeSteamPopularTagKey(tag: string) {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function parseTags(markdown: string) {
  const tags: string[] = [];
  const tagPattern = /\*\*([^*]+)\*\*/g;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(markdown)) !== null) {
    const tag = match[1]?.trim();

    if (tag && /^[\w\s&'.:-]+$/.test(tag)) {
      tags.push(tag);
    }
  }

  return tags;
}

export function getSteamPopularTags() {
  if (cachedTags) {
    return cachedTags;
  }

  try {
    const markdown = readFileSync(join(process.cwd(), TAG_FILE), "utf8");
    const parsedTags = parseTags(markdown);
    const seen = new Set<string>();
    cachedTags = parsedTags.filter((tag) => {
      const key = normalizeSteamPopularTagKey(tag);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  } catch {
    cachedTags = fallbackTags;
  }

  return cachedTags.length ? cachedTags : fallbackTags;
}
