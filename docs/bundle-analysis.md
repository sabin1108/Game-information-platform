# Bundle Analysis And Vite Playground

Last updated: 2026-06-06

## Next Bundle Analyzer

Run:

```sh
npm run analyze
```

The script sets `ANALYZE=true` through `scripts/run-next-analyze.mjs`, so it works from PowerShell,
cmd, bash, and CI shells. Next bundle analyzer writes HTML reports under `.next/analyze/` during the
production build.

Result record:

```txt
Date: 2026-06-06
Command: npm run analyze
Status: passed
Report paths:
- .next/analyze/client.html
- .next/analyze/nodejs.html
- .next/analyze/edge.html
Build summary:
- Home route: 1.9 kB route size, 108 kB first load JS
- Deals route: 2.32 kB route size, 108 kB first load JS
- Search route: 471 B route size, 107 kB first load JS
- Shared first load JS: 102 kB
```

Improvement candidate from current app structure:

- `AiInsightSection` is only needed after the first public feed content. If analyzer shows it inside
  the initial app chunk with meaningful weight, move it behind a dynamic import or stream it below the
  feed shell.

## Vite Playground

Run:

```sh
npm run build:game-card-lab
```

The playground lives in `packages/game-card-lab`. It is a small Vite library build that mirrors the
public game card data contract used by `src/components/game-card.tsx`: title, review summary, tags,
and store prices. This gives a separate Vite build artifact without coupling the main Next app to a
second component runtime.

Expected output:

```txt
packages/game-card-lab/dist/game-card-lab.js
packages/game-card-lab/dist/game-card-lab.css
```

Local output from 2026-06-06:

```txt
game-card-lab.js   1.35 kB, gzip 0.66 kB
game-card-lab.css  1.06 kB, gzip 0.50 kB
```

Portfolio resume bullet, only after both commands have been run and committed:

- Used Next bundle analyzer and a Vite game-card lab build to compare app bundle shape with an
  isolated component artifact and document optimization candidates.
