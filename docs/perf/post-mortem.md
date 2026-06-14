# Performance Post-Mortem — Elimika UI

**Date:** 2026-06-11 · **Branch:** `perf/post-mortem-remediation` · **Baseline:** `main` @ `c559fa2d`

## 1. The claims, and the verdict

Users reported the app "takes forever to load" and responds slowly to interactions and form submissions. **The claims were valid and measurable.** The public landing page was fine (Lighthouse 0.99 desktop); the pain was entirely in the authenticated dashboard:

- Every dashboard route shipped **1.4–2.7 MB of JavaScript** (median 1.44 MB uncompressed) — multiple seconds of download + parse + execute before anything was interactive.
- Key pages fired **request storms**: training-hub ~70+ API calls, students page one call per student (each asking for 1,000 rows), class details a 3-level sequential waterfall.
- **Every API request paid an extra hidden HTTP round trip** — the browser called a `getAuthToken` server action before each call, even though the proxy injects the token anyway.
- Typing in the large profile forms re-rendered the entire ~2,000-line form component **on every keystroke** (`form.watch()` in render).

## 2. Root causes (how we got here)

These are process failures, not individual mistakes — each pattern was copy-pasted because nothing flagged it:

1. **No code-splitting culture.** Zero uses of `next/dynamic`/`React.lazy` in 500+ client files. Heavy libraries (pdfjs ~2.5 MB, editors, charts, maps) rode along in routes that never used them.
2. **Copy-paste forks left as live routes.** `old-assessment/`, `calendar-old/`, `old-class-creation/`, `old-ClassTrainingPage.tsx` (3,219 lines)… ~14k lines of dead code, four of which were the **heaviest routes in the app**.
3. **Dependency accumulation without removal.** Three date libraries (moment + dayjs + date-fns), two rich-text editors (tiptap + slate/plate, the latter 100% unused), two HTTP clients (openapi-fetch + zodios/axios, the latter unused but its 8,670-line generated module sat in the shared bundle), framer-motion/react-color/jwt-decode/etc. installed and never imported. **~22 packages removed in this effort.**
4. **Per-entity hooks composed into N+1 storms.** Innocent hooks (`useStudentMap` = fetch 1,000 students; `useClassDetails` = chain 9 queries) were composed by pages into 35–70-request loads. Nobody measured request counts per page.
5. **No measurement.** No bundle analyzer, no budgets, `ignoreBuildErrors: true` (838 type errors at baseline), no per-page network-count expectations.

## 3. What was fixed (by phase) and measured results

Measurement method: `npx next experimental-analyze -o` + `node scripts/perf/route-sizes.mjs` (per-route First-Load JS); baselines in [baseline-2026-06.md](./baseline-2026-06.md).

| Metric | Baseline | After remediation |
|---|---|---|
| Worst dashboard route | 2.72 MB | **1.66 MB (−39%)** |
| Median dashboard route | ~1.44 MB | **~1.18 MB (−18%)** |
| Shared dashboard shell | 1.36 MB | **1.10 MB** |
| Create-new-course route | 2.69 MB | 1.56 MB (−42%) |
| Training-hub route JS | 2.34 MB | ~1.4 MB (−40%) |
| Training-hub API requests | 6 + 3N + 2M + 2K (~70+) | ~10 + N + P (~20 for N=10) |
| Students page lookups | 2×1,000-row fetches + S×1,000-row overviews | id-scoped batches + S×50-row overviews |
| Class-details waterfall | depth 3 across render cycles | 2 clean steps (`Promise.all`) |
| Per-request auth overhead | +1 server-action round trip on **every** API call | removed (proxy injects token) |
| Keystroke cost in profile forms | whole ~2k-line form re-render | single small subscriber component |
| tsc errors | 838 | 765 (+ ratchet preventing increase) |

Phase details are in the git history (`perf(phase1)` … `perf(phase4)` commits).

## 4. What remains (prioritized follow-ups)

1. **Authenticated runtime verification (do first).** This effort could not log in (no test credentials; `AUTH_URL` pinned to port 3000). After one manual Keycloak login: verify the dashboard pages render correctly, network counts match the predictions above, and the `uuid_in`/`class_definition_uuid_in` search filters are honored by the staging API (the batched lookups in `hooks/use-batched-lookups.ts` filter client-side as a safety net, but server-side support must be confirmed).
2. **Backend batch endpoints** (flagged `TODO(backend)` in code):
   - Batch enrollment-overview for N students (kills the remaining S requests on the students page).
   - Instructor-scoped enrollments-with-class endpoint (enrollments carry no `class_definition_uuid`, forcing client-side joins via schedule instances).
3. **Dashboard shell diet (biggest remaining lever).** 1.10 MB is still common to all 159 dashboard routes — the parallel-slot architecture (`@admin/@instructor/@student/@course_creator/@organization`) bundles every role's layout for every user. Options: per-role route groups instead of parallel slots, or aggressive lazy mounting inside `DashboardClientLayout`. Needs design discussion; this is the path to the ≤0.8 MB median target.
4. **Server-component push-down.** Page shells under `app/dashboard/` are client components; data-only pages can fetch server-side (skipping the proxy hop) with `HydrationBoundary`. Do incrementally, page by page, with runtime verification.
5. **Split remaining monoliths** when next touched: `ClassTrainingPage.tsx` (3,664 lines), `lesson-management-form.tsx` (2,412), the two ~1,950-line profile tabs.
6. **TS error burn-down.** Ratchet ceiling is 765; lower it opportunistically (`node scripts/perf/ts-error-ratchet.mjs --update`) and flip `typescript.ignoreBuildErrors` to `false` at 0.
7. **Mutation polish.** Invalidations are keyed but broad; add `setQueryData` + optimistic updates to high-frequency interactions (enrollment toggles, lesson reorder).

## 5. Development practices going forward

### PR checklist (copy into the PR template)

- [ ] New dependency? Attach a route-size diff (`node scripts/perf/route-sizes.mjs --compare docs/perf/route-sizes-phase4.json`). Heavy/leaf-only libraries must be dynamic-imported.
- [ ] New list/dashboard page? State the expected **request count** for a typical user in the PR description. One request per row is a defect.
- [ ] No `form.watch()` in render — use `useWatch` in a small subscriber component (`components/form/watched-value.tsx`).
- [ ] Context provider values memoized (`useMemo`/`useCallback`).
- [ ] Lists derived from state are `useMemo`'d; search inputs deferred/debounced.
- [ ] Page-size requests bounded (≤ a few hundred rows) and justified.
- [ ] Replacing a page? Delete the old one in the same PR — no `old-*` copies.
- [ ] `node scripts/perf/ts-error-ratchet.mjs` passes.

### Enforced by tooling

- **Biome `noRestrictedImports`** bans: `moment`, static `pdfjs-dist`/`pdfmake`, devtools outside root-providers, non-lazy editor imports. Extend this list whenever a new heavy library gets a lazy wrapper.
- **TS ratchet** (`scripts/perf/ts-error-ratchet.mjs`) fails when type-error count rises.
- Recommended CI additions: run the ratchet + `pnpm build` + `route-sizes.mjs --compare` (fails on >5% First-Load JS regression) on every PR.

### Release-time measurement

Before each release: `pnpm build && npx next experimental-analyze -o && node scripts/perf/route-sizes.mjs --compare docs/perf/route-sizes-phase4.json`, plus Lighthouse on `/`. Append results to `baseline-2026-06.md`. Note: `@next/bundle-analyzer` does **not** work with Turbopack builds — use `next experimental-analyze` (interactive UI when run without `-o`).

### Standing conventions

- One date library: **dayjs** via `@/lib/date` (date-fns remains only where `react-day-picker` requires it). One editor: **tiptap** via the lazy wrapper. One HTTP layer: the generated `services/client` + `fetchClient`.
- Entity lookups by id go through `hooks/use-batched-lookups.ts` — never fetch a 1,000-row page to read 20 rows, never loop `useQuery` per id.
- staleTime tiers from `lib/query-client.ts` (`STALE_TIMES.reference/entity/live`) — pick deliberately.
- A page's data hook owns its request budget. If composing hooks multiplies requests by N, restructure before shipping.
