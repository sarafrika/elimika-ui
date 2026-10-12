# Route JS budget (phase 5, 2026-10-11)

Every dashboard route ships the shared shell plus its own page code. On the phase-5 base the shell
is **1.54 MB of a 1.60 MB median route**, so shell bytes are paid on every first visit and set the
floor for P50, while a few page-level imports (react-pdf, recharts) set P95/P99.

Sizes are uncompressed first-load JS from `.next/diagnostics/route-bundle-stats.json`.
On Next 16.2 that file comes from **`next build`**; `next experimental-analyze -o` only writes the
treemap under `.next/diagnostics/analyze/`, and its counts include lazy chunks.

## Budget

Machine-readable: [`route-js-budget.json`](./route-js-budget.json). The first group that matches a
route applies. A route over its **budget** fails the check; the **target** is where the next round aims.

| Scope | Budget | Target | Phase-5 base |
| --- | --- | --- | --- |
| Shared shell (chunks on ≥ 90% of routes) | 1.50 MB | 1.25 MB | 1.54 MB |
| Dashboard route (default) | 2.00 MB | 1.50 MB | median 1.60, p95 2.14 |
| Heavy-form route (profile, settings, add-profile, onboarding, jobs/classes new, branches, create-course) | 2.40 MB | 2.00 MB | max 2.37 |
| Public route (outside `/dashboard`) | 1.80 MB | 1.30 MB | `/` 1.17, `/courses` 1.72 |

Run the check after a production build:

```bash
pnpm build
node scripts/perf/route-sizes.mjs --budget docs/perf/route-js-budget.json
node scripts/perf/route-sizes.mjs --compare docs/perf/route-sizes-phase5-base.json
```

## Phase-5 base (before this round)

Measured on the p4-integration build, whose tree is identical to `origin/perf/phase-5`
(snapshot: [`route-sizes-phase5-base.json`](./route-sizes-phase5-base.json), 321 routes).

| Quantile | First-load JS |
| --- | --- |
| P50 | 1.60 MB |
| P95 | 2.14 MB |
| P99 | 2.37 MB |
| Max | 2.98 MB (`award-certificates`) |

The base fails the budget on five items: the shell (1.54 MB), the three certificate routes
(2.94 to 2.98 MB) and `/dashboard/instructor/opportunities` (2.02 MB).

## What this round changed

| Change | Where it came from | Expected effect |
| --- | --- | --- |
| Top bar no longer imports the student wallet **page** (wallet account helpers moved to `src/features/wallet/wallet-accounts.ts`) | `dashboard-top-bar.tsx` | wallet page, `@tanstack/table-core` and the pdfjs loader leave the shell |
| Global search palette (cmdk) loads on first open (`global-search-sheet-lazy.tsx`) | shell | cmdk + palette leave the shell |
| Notification dropdown body loads when the bell opens (`dashboard-notifications-panel.tsx`) | shell | rows, scroll area and date formatting leave the shell |
| Domain picker loads lazily | `DashboardClientLayout.tsx` | picker leaves the shell |
| Certificate preview split behind `next/dynamic` (`CertificatePage` → `CertificateViewer`) | 3 certificate routes | 1.35 MB react-pdf chunk leaves first load, routes go from ~2.95 MB to ~1.6 MB |
| `@/components/dashboard` barrel stops re-exporting recharts charts; org overview uses `charts-lazy.tsx` | 11 `PageHeader` importers + org overview | ~190 KB recharts leaves routes that only wanted `PageHeader`/`KpiCard` |

Biome `noRestrictedImports` now blocks static `@react-pdf/renderer` and `recharts` imports outside
their wrappers, alongside the existing pdfjs, pdfmake and tiptap rules.

In the analyze treemap (eager + lazy), `/dashboard/student` dropped from 2.05 MB to 1.46 MB of
client JS once the wallet page left the top bar, and `/dashboard/instructor/opportunities`
(2.53 → 2.19 MB) and `/dashboard/student/settings` (2.69 → 2.33 MB) no longer contain recharts. The first-load numbers for this round need a
`pnpm build` by the gate agent; run the commands above and update this table.

## Next candidates (not done here)

- `services/client/sdk.gen.ts` + `react-query.gen.ts` + `transformers.gen.ts` (~330 KB) sit in a
  shared chunk on every route; the generated modules are not tree-shaken per route.
- `services/client/zod.gen.ts` (~525 KB) is pulled whole into the profile forms; hand-pick schemas
  or split the generated file to bring profile routes under the 2.0 MB target.
