# Full UI Performance Test — 2026-06-12

Authenticated, browser-driven audit of **154 dashboard pages across all four role dashboards** (instructor, student, admin, course_creator) against a local production build talking to the staging API. Method: Playwright harness (`scripts/perf/page-audit.mjs`) with a real Keycloak session, measuring per page: API request count, failed requests, time-to-data, JS transferred, long tasks, console errors. Raw data: `audit-<domain>-2026-06-12.json`, post-fix snapshots `after-*.json`.

> Caveat: in the initial 154-page sweep, a bug in the app (finding F5) forced most shared-URL pages to render the course_creator dashboard regardless of the audit's role cookie, so cross-domain attribution for shared routes is approximate. The findings below were each individually verified afterwards with the corrected harness.

## Headline: where the slowness actually comes from

Ranked by user impact. "Fixed" = fixed in this branch and verified live.

| # | Finding | Impact | Status |
|---|---|---|---|
| F1 | **Backend 500**: `GET /api/v1/instructors/{uuid}/class-definitions` fails consistently (~0.4–3s per attempt). It is the entry query for instructor overview/classes/students/training-hub; React Query retries 3× → **10–18s of spinner then broken pages** | Instructor dashboard effectively down | **Backend — critical** |
| F2 | **Staging API latency**: healthy endpoints take 1.3–4.5s server-side (network RTT is only ~0.25s). `students/search` 4.5s, `users/search` 3.4s, `wallets` 3.7s, `courses` 2.4s | Multiplies every other problem; with ~9 calls/page the floor is 3–5s | **Backend — critical** |
| F3 | **Catalogue per-item storm**: `CatalogueWorkspace` (mounted on course_creator/instructor overviews via `PurchasableCatalogue`, plus `/dashboard/catalogue` everywhere) fetched 1 class + 1 course **per catalogue item**: 32+7 requests | Overview 55 reqs/8–11s; catalogue 52 reqs/17s | **Fixed** (batched: overview 55→18, catalogue 52→12) |
| F4 | **Sequential profile gate**: every page waited for user→student→instructor→course-creator searches run **sequentially** (~4×1.3s+) before any page data loaded | +3–5s on every page | **Fixed** (parallelized; 2 round trips) |
| F5 | **Dashboard role not sticky**: profile context reported `isLoading=false` while the session was still resolving (disabled query), so domain hydration ran with zero domains and overwrote the user's saved choice with the default (course_creator) **on every full page load** | Users land on the wrong dashboard; also broke per-role testing | **Fixed** (`isPending` + session status gate) |
| F6 | **Avatar 404 on every page**: `profile_image_url` was fetched directly from the staging API unauthenticated; after routing through the auth proxy the file is still 404 — the stored URL points at a missing object | Console error + broken avatar everywhere | Frontend fixed; **backend: stored file missing** |
| F7 | `GET /api/v1/instructors/{uuid}/bookings` returns 500 | Training-hub bookings panel broken | **Backend** |
| F8 | **Shell floor: ~9 requests before any page content** (profile×4, avatar, notifications×2 + counts, wallet) — at staging latency that's a 3–5s floor for every page; plus duplicate fetches (`users/search` ×3, `notifications` ×2–3) from overlapping components | Every page | Partially fixed (F4); consider a consolidated bootstrap endpoint (**backend**) and deduped client keys (frontend follow-up) |
| F9 | `/dashboard/all-courses/instructor` fires **58 requests** (per-instructor `users/{id}` + timetable + reviews per card via `instructor-directory`/`instructor-profile-modal`) | 8–12s page | Frontend follow-up (batch via `use-batched-lookups`) |
| F10 | `/dashboard/notifications` 12.3s, notifications endpoint itself ~2s and polled frequently | Slow + chatty | Backend latency + frontend poll tuning |

## The numbers (pre-fix sweep, 154 pages)

| Domain | Pages | Median time-to-data | Median API reqs | Pages > 5s | Pages w/ failed reqs |
|---|---|---|---|---|---|
| instructor | 47 | 3.9s | 9 | 14 | 25 |
| student | 39 | 4.3s | 9 | 9 | 23 |
| admin | 31 | 4.8s | 9 | 10 | 26 |
| course_creator | 37 | 4.2s | 4 | 13 | 18 |

Worst pages: catalogue 17.1s/52 reqs · course-management/lesson 13.6s · instructors 13.7s · notifications 12.3s · all-courses/instructor 12.0s/58 reqs · overview 8–11s/55 reqs. **No page had main-thread long tasks and JS transfer was 380–620 KB** — confirming the earlier bundle phases worked and the remaining slowness is **network/API-shaped, not JavaScript-shaped**.

## Before → after (fixes in this branch, verified live)

| Page | Before | After |
|---|---|---|
| course_creator overview | 55 reqs | **18 reqs** |
| `/dashboard/catalogue` | 52 reqs / 17.1s | **12–15 reqs / 5–8s** |
| Any page: profile gate | 4 sequential calls (~5s) | 1 + 3 parallel (~2.6s) |
| Any page: avatar | unauthenticated 404 | proxied (file itself still 404 — backend) |
| Dashboard role choice | reset to default on every load | sticky |
| Instructor training-hub shape | 6+3N+2M+2K pattern (theoretical ~70) | 1 timetable + 1 waitlist search + batched lookups (~22 incl. retries on F1 500s) |

## What to send to the backend team

1. **Fix `GET /api/v1/instructors/{uuid}/class-definitions` (500)** — single highest-impact item; instructor dashboard is unusable until then.
2. Fix `GET /api/v1/instructors/{uuid}/bookings` (500).
3. **Endpoint latency**: p50 1.3–4.5s on basic searches points at missing indexes / N+1 in the API itself. Target <300ms for searches.
4. Batch endpoints: enrollment-overview for N students; `uuid_in` works on searches (verified) — document it as the official batch mechanism.
5. Profile-image cleanup: stored `profile_image_url`s point at missing files (404).
6. Consider a consolidated `GET /me/bootstrap` (user + domain profiles + notification counts + wallet) to collapse the per-page shell floor.

## Reproducing

```bash
pnpm build && NODE_OPTIONS="--require $PWD/scripts/perf/force-ipv4.cjs" pnpm start   # port 3000
PERF_USER=… PERF_PASS=… node scripts/perf/login.mjs                                  # once
node scripts/perf/page-audit.mjs --domain instructor --pages .perf/pages-instructor.txt --json out.json
node scripts/perf/audit-report.mjs out.json                                          # ranked report
node scripts/perf/trace-initiator.mjs /dashboard/overview "/api/v1/classes/"         # attribute a request
```

(`force-ipv4.cjs` is only needed on DNS64/NAT64 networks where Node's IPv6 path blackholes.)
