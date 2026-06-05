# Public Route Load Smoke

Last updated: 2026-06-05

## Purpose

This document records a repeatable smoke load path for read-heavy public routes. It is not a full
capacity test. The goal is to prove that home, search, and deals routes can be exercised with cache
metadata visible, without directly hammering ITAD during local portfolio verification.

## Local Setup

Run the app with live ITAD disabled:

```bash
ITAD_ENABLE_LOCAL_DEV=false npm run dev
```

Then run the smoke script:

```bash
npm run load:public
```

Useful variants:

```bash
npm run load:public -- --scenario home --iterations 20 --concurrency 4
npm run load:public -- --scenario search --iterations 20 --concurrency 4
npm run load:public -- --scenario deals --iterations 20 --concurrency 4
npm run load:public -- --base-url https://your-vercel-domain.example --iterations 10 --concurrency 2
```

The script sends a stable `gdw_anonymous_id=load-smoke` cookie so rate-limit behavior is
reproducible. Keep request counts below the configured public API rate limit unless the goal is to
verify `429` behavior.

## Smoke Scenarios

- Home: `GET /api/public/popular?offset=0&limit=12&tag=RPG&store=steam`
- Search: `GET /api/search?q=hades&country=KR&tag=Action&store=steam`
- Deals: `GET /api/deals?country=KR&store=steam&minDiscount=20&sort=reviews&limit=12`

These paths use mock/cache-first behavior in local development when `ITAD_ENABLE_LOCAL_DEV=false`.
That keeps the smoke repeatable and avoids external API load. For production checks, run low
iterations and watch cache status.

## Result Template

```txt
Date:
Commit:
Environment:
Base URL:
ITAD_ENABLE_LOCAL_DEV:
PUBLIC_API_RATE_LIMIT_MAX_REQUESTS:
Iterations / concurrency:

Home:
- status counts:
- cache counts:
- p50 / p95 / max:

Search:
- status counts:
- cache counts:
- p50 / p95 / max:

Deals:
- status counts:
- cache counts:
- p50 / p95 / max:

Notes:
- 429 observed?
- stale observed?
- external API enabled?
- follow-up needed?
```

## Query And Index Notes

Public home, search, and deals smoke routes do not require authenticated user tables. In local mock
mode they use in-memory game data plus process-local caches. In ITAD mode they call external APIs
only on cache miss, then normalize and cache the response.

Current public-route hot paths:

- Popular feed: cache key uses provider, country, and limit. Filtering by tag/store happens after
  the feed payload is loaded.
- Search: cache key uses provider, normalized query, country, limit, tag, and store.
- Deals: cache key uses provider, country, offset, limit, min discount, max price, store, tag, and
  sort.

Database index risk is low for these three smoke routes today because they do not scan Supabase
tables in the request path. The higher-risk DB paths are watchlist dashboard and AI insight
inspection, where latest price snapshots and user-owned watchlist rows matter.

Existing schema constraints/indexes to preserve:

- `watchlist_items` is user-owned and should stay indexed by user ownership when dashboard load
  testing is added.
- `game_store_products` needs stable game/store lookup because watchlist and snapshots join through
  product rows.
- `price_snapshots` should be queried by product and latest observed time, not by loading all
  historical rows.
- `ai_game_insights` should be read by generated time and joined evidence only for visible insight
  cards.

Limitations:

- The smoke script reports client-observed latency, status counts, and cache headers. It does not
  produce DB `EXPLAIN` output.
- Process-local cache means multi-instance production traffic can show more misses than local smoke.
- A production-grade load test should use a controlled environment, realistic rate limits, and
  provider-safe cached fixtures.
