# Performance Baseline — 2026-06-11

Branch point: `main` @ `c559fa2d`. Next.js 16.2.7 (Turbopack), production build (`pnpm build`, 56s compile, 183 routes).

This is the reference point for the performance remediation effort. Each phase re-measures and appends a column/section. Re-measure with:

```bash
npx next experimental-analyze -o          # writes .next/diagnostics/route-bundle-stats.json
node scripts/perf/route-sizes.mjs --top 25
node scripts/perf/route-sizes.mjs --json > docs/perf/route-sizes-<phase>.json
node scripts/perf/route-sizes.mjs --compare docs/perf/route-sizes-baseline.json
```

Note: `@next/bundle-analyzer` is **webpack-only and does not work** with this project's Turbopack builds — use `next experimental-analyze` (interactive UI) or the script above.

## 1. Bundle / First-Load JS

- **Shared root JS**: 447 KB uncompressed (all routes pay this).
- **Median route**: **1.44 MB** uncompressed First-Load JS. Smallest route: 0.56 MB (`/_not-found`).
- Full table: [route-sizes-baseline.md](./route-sizes-baseline.md); machine-readable: `route-sizes-baseline.json`.

Worst routes:

| Route | Raw JS | Gzip |
|---|---|---|
| `/dashboard/old-assessment{,/assignments,/quiz,/exams}` (**dead code**) | 2.72 MB | 752 KB |
| `/dashboard/course-management/create-new-course` | 2.69 MB | 750 KB |
| `/dashboard/profile/general` | 2.36 MB | 615 KB |
| `/dashboard/training-hub` | 2.34 MB | 629 KB |
| `/dashboard/assessment` | 2.30 MB | 616 KB |
| `/dashboard/overview` | 2.30 MB | 578 KB |
| `/dashboard/classes/class-training/[id]` | 2.26 MB | 606 KB |
| Landing `/` | 0.91 MB | 242 KB |

Context: 2.3–2.7 MB of JS must be downloaded, parsed, and executed before a dashboard page is interactive. On mid-range hardware parse/execute alone is multiple seconds. Known contributors (verified by import-site audit, zero `next/dynamic`/`React.lazy` usage in the codebase): pdfjs-dist, pdfmake, docx-preview, mapbox-gl, recharts, react-big-calendar, tiptap (8 packages) **and** slate (two rich-text editors), moment **and** dayjs **and** date-fns (three date libraries), React Query Devtools in the production bundle.

## 2. Runtime — public pages (Lighthouse, local prod server)

| Page | Mode | Perf score | FCP | LCP | TBT | TTI | JS transferred |
|---|---|---|---|---|---|---|---|
| `/` landing | desktop | 0.99 | 0.4s | 0.9s | 60ms | 1.1s | 279 KB |
| `/` landing | mobile (throttled) | 0.89 | 1.1s | 3.3s | 180ms | 3.8s | 279 KB |

**Finding:** the public landing page is fine. The slowness complaints are about the **authenticated dashboard**, which combines the 1.4–2.7 MB bundles above with the request storms below.

Raw reports: `lh-landing-desktop.json`, `lh-landing-mobile.json` (gitignored if large; regenerate with `npx lighthouse http://localhost:<port>/ --preset=desktop --output=json --chrome-flags="--headless=new"`).

## 3. Runtime — authenticated dashboard (request counts)

Request counts are derived from the verified query structure of each page's hooks (code-level audit; line refs in the post-mortem). N = classes, S = students, M/K = unique waitlist students/users.

| Page | Requests fired | Source |
|---|---|---|
| Training hub | **6 + 3N + 2M + 2K** (~70+ for 10 classes / 20 students) | `app/dashboard/@instructor/training-hub/_components/useInstructorTrainingHubData.ts` |
| Students | **1 per student**, each `size: 1000` (+4 map fetches of 1000 rows) | `app/dashboard/@instructor/students/data.ts:155-167` |
| Classes list | ~2 + 2N + courses + programs (~35 for 15 classes) | `hooks/use-instructor-classes-with-schedules.tsx:159-202` |
| Class details | 9 queries, waterfall depth 3 (class → instructor → user) | `hooks/use-class-details.tsx:56-135` |
| Any page using map hooks | +1000-row fetches per map (courses/students/users), 5000-row schedules | `hooks/use-{courses,student,users,class-schedule}-map.ts` |

Every request additionally pays an `auth()` JWT decode in `app/api/proxy/[...path]/route.ts` plus the proxy hop itself.

**Gap (requires one manual login):** wall-clock time-to-data and in-browser network traces for authed pages could not be captured autonomously — no browser-automation tooling in this session and no test credentials in the repo (`AUTH_URL` is pinned to `localhost:3000`, so run `pnpm start` on port 3000 when capturing). After one manual Keycloak login the network panel counts can be recorded to validate the formulas above. The formulas are exact from code, so phase gating proceeds on request-count reduction verified at code level + bundle diffs.

**Gap:** React Profiler keystroke traces (profile education/experience forms, courses search) also require the manual session; the causal defects (`form.watch()` in render, unmemoized filtering) are verified at code level.

## 4. Build health

- `pnpm exec tsc --noEmit`: **838 errors** (build passes only because `typescript.ignoreBuildErrors: true`). Phase 4 burn-down baseline.
- 527 files with `'use client'`; 0 uses of `next/dynamic` or `React.lazy`.
- Dead `old-*` route directories ship as live routes (`/dashboard/old-assessment/*` = 4 of the 5 heaviest routes; `/dashboard/calendar-old`, `/dashboard/classes/old-class-creation`, `/dashboard/workspace/[domain]/courses/instructor-old`).

## 5. Phase targets

| Metric | Baseline | P1 target | P3 target | P4 target |
|---|---|---|---|---|
| Median route First-Load JS | 1.44 MB | ↓ ≥ 25% | — | ≤ ~0.8 MB |
| Worst dashboard route | 2.72 MB | ≤ 2.0 MB | — | ≤ 1.2 MB |
| Training-hub requests | ~70+ | — | ≤ ~12 | — |
| Students page requests | S + 4 | — | ≤ 3 | — |
| Class-details waterfall depth | 3 | — | ≤ 2 | — |
| tsc errors | 838 | no increase | no increase | 0 |
