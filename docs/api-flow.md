# API Flow

Last updated: 2026-05-26

## 1. API Principles

- Browser never calls IsThereAnyDeal directly.
- External API keys stay in server-only environment variables.
- Server routes normalize responses before returning them to the client.
- Expensive public requests use cache first.
- Authenticated requests enforce user ownership through Supabase RLS and server-side checks.
- Every important user action emits analytics events for A/B testing and product improvement.

## 2. Environment Variables

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ITAD_API_KEY
NEXT_PUBLIC_POSTHOG_TOKEN
NEXT_PUBLIC_POSTHOG_HOST
SENTRY_DSN
VERCEL_ENV
```

Only `NEXT_PUBLIC_*` values may be used in client components.

## 3. Route Overview

### Public Routes

```txt
GET /api/public/popular
GET /api/search?q=:query&stores=steam,epic&country=KR
GET /api/deals?stores=steam,epic&country=KR&minDiscount=50
GET /api/releases?stores=steam,epic&country=KR&status=upcoming
POST /api/events
GET /api/experiments/bootstrap
```

### Authenticated Routes

```txt
GET /api/watchlist
POST /api/watchlist
PATCH /api/watchlist/:id
DELETE /api/watchlist/:id
POST /api/watchlist/refresh
```

### Job Routes

```txt
POST /api/jobs/refresh-popular
POST /api/jobs/refresh-watchlist-prices
POST /api/jobs/cleanup-cache
POST /api/jobs/generate-ai-insights
```

Job routes require a server-side secret or platform scheduler authentication.

## 4. Public Home Flow

```txt
User opens /
  -> Next.js server component requests /api/public/popular
  -> API checks popular_rankings cache
  -> If fresh, return games + latest prices
  -> If stale, return stale data and trigger background refresh when possible
  -> Client renders popular cards
  -> PostHog captures card impression and click events
```

Displayed fields:

- Game title
- Cover image
- Steam review count
- Steam positive ratio
- Best current price among Steam/Epic
- Store badges
- Discount percent

## 5. Search Flow

```txt
User enters query
  -> GET /api/search
  -> Check search_cache by query, stores, country
  -> If cache miss, call IsThereAnyDeal search/deals endpoint
  -> Normalize games and products
  -> Upsert games and game_store_products
  -> Store response in search_cache
  -> Return normalized results
```

When a logged-in user clicks add:

```txt
POST /api/watchlist { gameId, targetPrice, targetDiscount }
  -> Verify session
  -> Insert watchlist_items row
  -> Emit watchlist_add event
  -> Return updated watchlist item with latest prices
```

## 6. Watchlist Dashboard Flow

```txt
User opens /app
  -> Server verifies Supabase session
  -> Load watchlist_items where user_id = auth.uid()
  -> Join games and game_store_products
  -> Load latest price_snapshots per product
  -> If snapshots are stale, call /api/watchlist/refresh
  -> Render dashboard with stale-safe data
```

Target condition logic:

```txt
condition_met =
  current_price_cents <= target_price_cents
  OR discount_percent >= target_discount_percent
```

The UI should show a strong state for condition-matched games, but MVP does not send email or push notifications.

## 7. Deals Explore Flow

```txt
User opens /deals
  -> GET /api/deals with filters
  -> Server checks cache
  -> On miss, fetch IsThereAnyDeal deals
  -> Normalize and store latest snapshots
  -> Return paginated deal cards
```

Recommended filters:

- Store: Steam, Epic
- Minimum discount
- Maximum price
- Review count minimum
- Tags
- Released recently

## 8. New And Upcoming Flow

```txt
User opens /releases
  -> GET /api/releases
  -> Server fetches or reads cached release feed
  -> Filter by store, release status, tags
  -> Return games with store product links
```

MVP note: release feeds may be less complete than deal feeds. Treat unknown release dates as `unknown` instead of hiding them silently.

## 9. A/B Testing Flow

```txt
User opens app
  -> GET /api/experiments/bootstrap
  -> Server resolves active experiments and variants
  -> Store exposure in experiment_exposures
  -> Client receives stable variants
  -> UI renders variant-specific component
  -> Client/server emit outcome events
```

Required events:

```txt
experiment_exposed
popular_card_clicked
search_submitted
watchlist_add
deal_click
signup_completed
web_vital_reported
```

Primary portfolio experiment:

```txt
popular-card-density
  control: compact price-first card
  variant_a: review-first card
  primary metric: deal_click
  guardrails: LCP, client_error_rate
```

## 10. AI Analysis Flow

```txt
Scheduler calls /api/jobs/generate-ai-insights
  -> Load recent price_snapshots, popular_rankings, watchlist aggregates
  -> Detect candidate insights with deterministic SQL first
  -> Optionally summarize insights with an AI model
  -> Store run in ai_insight_runs
  -> Store per-game output in ai_game_insights
  -> Surface insights on public home or watchlist dashboard
```

Good first AI tasks:

- "High review count plus unusually deep discount"
- "New historical low candidate"
- "Similar to your watchlist tags"
- "This week's best RPG deals"

The AI layer should never invent prices. All summaries must reference stored price snapshots and review metrics.

## 11. Webview Flow

```txt
Native app opens https://domain.com?webview=1
  -> App sets webview mode in UI state
  -> Layout uses safe-area spacing and bottom tabs
  -> External store click sends bridge event if available
  -> Fallback opens a normal browser tab on desktop
```

Bridge message shape:

```json
{
  "type": "deal_clicked",
  "payload": {
    "gameId": "uuid",
    "store": "steam",
    "url": "https://store.steampowered.com/..."
  }
}
```

The web app must work without the native bridge. The bridge is progressive enhancement.

## 12. Observability Flow

### Client

- Capture Web Vitals.
- Capture route changes, search, add to watchlist, deal click.
- Send user identity to analytics after login.
- Report client exceptions to Sentry.

### Server

- Add request ID per API request.
- Log route, status, duration, cache status.
- Report unhandled exceptions to Sentry through Next.js instrumentation.
- Track external API latency and rate-limit responses.

### Performance Targets

```txt
Public home LCP: under 2.5s on good 4G
Search API p95: under 800ms on cache hit
Watchlist API p95: under 1200ms for 100 items
Client JS initial route budget: measured with bundle analyzer
```

## 13. Traffic Strategy

### MVP

- Cache public API responses by query, store, country, and filter.
- Use pagination for deals and releases.
- Use latest price snapshot lookup instead of loading all historical snapshots.
- Use stale data if external API fails.

### Scale Extension

- Move scheduled refresh to queue or cron.
- Add Redis/KV cache for public feed.
- Precompute popular rankings.
- Add load tests for public home and search.
- Add DB explain plans for watchlist and latest price queries.
- Add rate limiting per IP and user for search endpoints.

## 14. Testing Strategy

- Unit test target condition logic.
- Unit test price normalization.
- Integration test watchlist CRUD with Supabase local or test database.
- Playwright desktop tests for search, signup, login, watchlist add.
- Playwright mobile tests for webview mode, bottom tabs, external link bridge fallback.
- Performance budget check in CI after production build.

## 15. References

- IsThereAnyDeal API: https://docs.isthereanydeal.com/
- Next.js App Router: https://nextjs.org/docs/app
- Next.js instrumentation: https://nextjs.org/docs/15/app/api-reference/file-conventions/instrumentation
- Next.js Web Vitals: https://nextjs.org/docs/14/app/building-your-application/optimizing/analytics
- Supabase Auth and RLS: https://supabase.com/docs/guides/auth/auth-deep-dive/auth-row-level-security
- PostHog Next.js integration: https://posthog.com/docs/libraries/next-js
- PostHog feature flags: https://posthog.com/docs/feature-flags
- Vercel Speed Insights: https://vercel.com/docs/speed-insights
- Playwright emulation: https://playwright.dev/docs/emulation
