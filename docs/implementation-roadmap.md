# Implementation Roadmap

Last updated: 2026-05-26

## 1. Strategy

Build the project in layers so each layer creates a portfolio proof point. Do not start with every advanced feature at once. First make the product usable, then add analytics, experiments, AI, monitoring, and scale work as visible engineering evidence.

## 2. Phase 0 - Repository And Architecture

Deliverables:

- Create Next.js TypeScript app.
- Add linting, formatting, test runner, Playwright.
- Add Supabase client split: browser client, server client, service client.
- Add `.env.example`.
- Add initial docs and architecture diagram.

Portfolio evidence:

- Clean project structure
- Typed environment config
- CI-ready scripts

## 3. Phase 1 - Auth And Database

Deliverables:

- Supabase project setup.
- SQL migrations for profiles, games, products, watchlist, price snapshots.
- RLS policies for user-owned tables.
- Email/password signup, login, logout.
- Protected `/app` route.

Portfolio evidence:

- Authenticated user flow
- User-specific DB access
- RLS policy documentation

## 4. Phase 2 - Core Product

Deliverables:

- Public home with search and popular feed.
- Game search using server route and IsThereAnyDeal API.
- Add/remove watchlist item.
- Watchlist dashboard with Steam/Epic prices.
- Target price/discount condition display.
- Deals tab.

Portfolio evidence:

- Real external API integration
- Server-side data normalization
- DB caching
- Practical dashboard UX

## 5. Phase 3 - Mobile Webview Readiness

Deliverables:

- `?webview=1` layout mode.
- Bottom tab navigation and safe-area spacing.
- External store link bridge contract.
- Webview debug panel in settings.
- Playwright mobile viewport tests.

Portfolio evidence:

- Mobile webview constraints handled explicitly
- Native bridge-compatible event design
- Mobile regression tests

## 6. Phase 4 - Analytics And A/B Testing

Deliverables:

- PostHog client/server integration.
- Event taxonomy.
- Experiment bootstrap endpoint.
- First A/B test: public popular card density.
- Exposure and conversion event validation.
- Short experiment analysis document after collecting sample data.

Portfolio evidence:

- A/B test hypothesis
- Variant assignment
- Primary and guardrail metrics
- Product improvement decision based on data

## 7. Phase 5 - Monitoring And Performance

Deliverables:

- Sentry setup for client and server errors.
- Next.js instrumentation.
- Web Vitals reporting.
- Vercel Speed Insights.
- API request latency logging.
- Bundle analyzer report.
- Performance budget in CI.

Portfolio evidence:

- Error monitoring
- Performance measurement
- Bundle optimization decisions
- Before/after performance notes

## 8. Phase 6 - AI Data Analysis And Automation

Deliverables:

- Scheduled job for price trend analysis.
- SQL-based candidate detection for unusually good deals.
- AI-generated weekly insight summaries.
- `ai_insight_runs` and `ai_game_insights` persistence.
- UI section for "이번 주 주목할 할인".

Portfolio evidence:

- AI is connected to real product data
- Automated analysis pipeline
- Stored evidence for generated summaries
- Clear guardrail against hallucinated prices

## 9. Phase 7 - Bundler And Build Tooling Depth

Deliverables:

- Next.js bundle analyzer setup.
- Dynamic import for heavy UI sections if needed.
- Vite-powered `packages/ui-playground` or `packages/game-card-lab`.
- Compare Vite library build output with app bundle usage.
- Document bundle decisions.

Portfolio evidence:

- Webpack-related analysis through Next build tooling
- Vite production build experience
- Bundle size reasoning instead of tool-name listing

## 10. Phase 8 - Traffic And Scale Simulation

Deliverables:

- Public API cache TTL policy.
- Stale-while-revalidate behavior.
- Search endpoint rate limiting.
- Load test script for public home and search.
- DB indexes and query explain notes.
- Precomputed popular ranking refresh job.

Portfolio evidence:

- Read-heavy traffic strategy
- External API protection
- Database query optimization
- Load test result summary

## 11. Resume Bullet Targets

Use these only after the work is actually implemented and measured.

- Built a Next.js and Supabase game deal tracker integrating Steam/Epic pricing through a server-side external API cache.
- Implemented email/password auth, user-specific watchlists, and Supabase RLS policies for protected user data.
- Designed mobile webview mode with safe-area layout, bridge event contract, and Playwright mobile regression tests.
- Added PostHog feature flags and A/B test instrumentation to compare popular game card variants by deal click and watchlist conversion.
- Integrated Sentry, Web Vitals, and Vercel Speed Insights to monitor client errors, API latency, and Core Web Vitals.
- Built an automated AI-assisted deal insight pipeline from cached price snapshots and review metrics.
- Used bundle analyzer and a Vite component build to document code splitting and bundle-size decisions.
- Added cache, rate limiting, indexed queries, and load tests for read-heavy public deal/search traffic.

## 12. Definition Of Done For Portfolio

The project is portfolio-ready when all of these are true:

- Production URL is deployed.
- Demo account exists.
- README explains architecture and tradeoffs.
- At least one A/B test is implemented with event names and analysis.
- Monitoring screenshots or exported metrics are documented.
- Webview mode can be demonstrated on mobile viewport.
- AI insight job can be run and inspected.
- Bundle report and performance budget are documented.
- Load test or traffic simulation result is included.

## 13. Recommended Build Order

1. Scaffold app and docs.
2. Auth and schema.
3. Search and watchlist.
4. Price cache and dashboard.
5. Public popular feed.
6. Deals tab.
7. Webview mode.
8. Analytics and A/B test.
9. Monitoring and performance.
10. AI insights.
11. Vite package and bundle analysis.
12. Load tests and scale documentation.
