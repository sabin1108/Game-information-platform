# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-09-14
- Primary product surfaces: home, deals, search, watchlist, authentication, profile.
- Evidence reviewed: user-provided September 11 feedback; src/app/globals.css; src/app/page.tsx; src/components/game-card.tsx; src/components/deal-feed.tsx; tests/e2e.
- Feedback applied: consistent spacing and controls, usable discovery, trustworthy data, image treatment, readable hierarchy, and complete interaction states. Resume/PDF and other projects are outside this repository.

## Brand
- Calm, precise game-shopping companion. Warm neutral canvas, deep green actions, editorial headings, generous artwork.
- Trust signals: distinguish sample data and delayed updates; price and store stay together.
- Avoid: fabricated savings, technical cache terminology, decorative statistics, inert controls.

## Product goals
- Help visitors find a game, compare store prices, and save a target with minimal effort.
- Non-goals: new providers, authentication infrastructure, new dependencies.
- Success signals: working URL filters, recoverable feed errors, keyboard access, no mobile overflow.

## Personas and jobs
- Budget-conscious Korean PC players comparing Steam and Epic offers on desktop and mobile.
- Browse without login; authenticate only when saving personal preferences.

## Information architecture
- Navigation: home, deals, search, watchlist; account actions in header.
- Home: concise value statement, discovery shortcuts, actual deal feed, optional insights.
- Cards: artwork, title, tags, store prices, save and store actions.

## Design principles
- Price discovery comes before secondary insight content.
- Shared tokens and components keep all routes consistent.
- Preserve URL state and show a useful next action for every empty/error state.
- Tradeoff: explicit load-more remains available alongside automatic loading for keyboard and constrained browsers.

## Visual language
- Color: warm off-white background, white surfaces, evergreen primary, restrained orange discounts.
- Typography: local system Korean sans-serif stack; clear heading hierarchy; tabular price numerals.
- Spacing/layout rhythm: 4px base; 16–24px component gaps; 1200px maximum content width.
- Shape/radius/elevation: 12px controls, 16px panels/cards, light borders and subtle shadows.
- Motion: short hover/focus transitions; honor reduced-motion preference.
- Imagery/iconography: stable 16:9 game covers, title-initial fallback, existing Lucide icons.

## Components
- Reuse GameCard, DealFeed, SearchBar, TopNav, BottomTabs and existing forms.
- Changed: hero, feed source notice, loading skeleton, empty/error recovery.
- Variants/states: default/dense cards, pending/success/error controls, selected navigation.
- Ownership: globals.css owns tokens and shared styles; component files own behavior.

## Accessibility
- Target: WCAG 2.2 AA principles, without claiming a certified audit.
- Keyboard: visible focus, skip link, native controls, explicit submit/load buttons.
- Readability: dark text on light surfaces; visible labels and price units.
- Semantics: active-page navigation, meaningful headings, status/alert announcements.
- Reduced motion: disable animations and decorative transitions when requested.

## Responsive behavior
- Desktop >= 1100px, tablet 640–1099px, phone <640px.
- Three-card desktop/two-card tablet/one-card phone layouts; dense desktop four cards.
- Filters wrap into usable columns; bottom navigation has four equally sized destinations.
- Touch controls >=44px; hover supplements keyboard feedback.

## Interaction states
- Loading: geometry-preserving skeleton and announced feed progress.
- Empty: explain missing results and offer reset or discovery.
- Error: preserve loaded cards and cursor; explicit retry without automatic retry loops.
- Success: existing save feedback; announce updated result count.
- Disabled: visibly pending; prevent repeated requests.
- Slow/offline: recoverable request errors; label fallback data, never present it as live.

## Content voice
- Concise, helpful Korean. Explain actions and limitations in user terms.
- Use 관심 목록, 할인율 (%), 최대 가격 (원); avoid server/cache implementation prose.

## Implementation constraints
- Next.js 15, React 19, plain CSS, existing Lucide; no new dependencies.
- Extend current tokens/components. Keep external images lazy and dimensionally stable.
- Preserve webview bridge, safe areas, authentication and analytics contracts.
- Verify unit/component tests, typecheck, lint, build and desktop/mobile screenshots.

## Open questions
- [ ] OAuth requires provider configuration and backend work; keep existing authentication functional.
- [ ] Live price freshness depends on configured upstream services; do not claim live verification from fixture tests.

## Implementation and verification plan
1. Add regression coverage for feed retry/cursor, empty search, and card actions before behavioral edits.
2. Connect home to returned deal data and authoritative pagination metadata.
3. Improve shared visual hierarchy, mobile layouts, search/filter/auth details and recovery states.
4. Run checks and inspect responsive screenshots; record evidence in docs/frontend-improvements.md.

## Authentication navigation
- Login and signup use the shared header in auth mode: brand and home link only, without discovery search, duplicate login actions, or mobile discovery tabs.
- Keep the main submit action primary; put the full-width alternate auth link below a divider, with a minimum 44px target.
- Preserve the original supported internal path and query through auth page switches, validation errors, signup, and email confirmation. Use the same URL validation utility for each entry point.

## Search and filter redesign
- One visible title search per search page, within a single GET form containing all criteria. Header uses a search-page variant without a second search field.
- Separate title intent from tag intent: the title field searches game names; tags are explicit selectable choices with Korean labels where known. Do not show product type (game/DLC/package) as a genre.
- Empty title means browse current discounted games through the provider tag filter when configured. Describe that scope; never imply exhaustive catalogue coverage.
- Stream the search controls before slow results via a server Suspense boundary; keep input state outside the result list. Fetch/cache title candidates independently of local store/tag/price/sort changes. Enrich tags by exact provider identity before filtering; never infer tags from a loose title match.
- Support store, one tag, maximum KRW price, sale-only and ordering. Apply price and store restrictions to the same offer so the visible purchase action agrees with the filter.
- Display removable applied criteria, preserve the title when clearing only filters, and provide clear loading/empty recovery. URL is the applied-state source of truth.
- Verification: regression tests first for missing metadata and tag-only discovery; pure filter tests for aliases/title ranking/offer consistency; desktop/mobile browser checks for one search box, URL/back navigation and empty recovery.
