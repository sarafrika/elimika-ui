# Slow-Response Hardening Round — 2026-06-12

Scope: eliminate every remaining frontend-attributable slow point found by the
full-system audit (PR #350, on top of #349). Method: authenticated Playwright
audit of all 154 dashboard pages per role (`scripts/perf/page-audit.mjs`),
fix, re-audit.

## Important correction to the earlier numbers

The first 154-page sweep ran while a bug (since fixed) forced most shared
URLs to render the course_creator dashboard regardless of role. That made
role-specific pages look artificially fast (they rendered a "not found" card
with only shell requests). **This round's numbers are the first true
per-role measurements** — several pages show *more* requests than the first
sweep because they are now actually loading their data. Compare shapes, not
raw deltas.

## Fixed in this round (all verified by re-audit)

| Fix | Effect |
|---|---|
| Instructor directory (`use-search-training-instructors`): was 5 requests **per instructor** (profile, reviews, rating, experience, skills ≈ 100+ for a 20-instructor page) | 1 instructor page + 1 batched user lookup + 1 experience search + 1 skills search + N tiny rating summaries (~24 total). `/all-courses/instructor`: 58 → 34 requests, 8.5s → 5.0s |
| Student class data (`use-student-class-definition`): 7 requests per enrolled class | Class definitions from one paged list, courses from one batched search; also fixed a latent bug where quizzes/assignments were parsed from the wrong response shape and always came back empty |
| Course-creator dashboard (`course-creator-data`): re-searched user + creator profile already held by the profile context, and double-fetched when mounted in both layout and page | Both redundant searches removed; courses list now a shared React Query (deduped across mounts). Course-creator `/dashboard`: 55 → 11 requests, 7.4s → 2.6s |
| Notifications in the top bar: 3 fetches on every page + 3 re-polls every 30s | Recent list deferred until the dropdown opens; polls relaxed to 60s |
| Wallet balance refetched on every navigation | 5-minute staleTime |
| Credential card PDF previews all downloaded eagerly | Lazy-loaded via IntersectionObserver (200px rootMargin) |
| Catalogue per-item class/course fetches (32+7) on overviews + `/dashboard/catalogue` | Batched: catalogue 52 → 13 requests, 17.1s → 5.1s |

Carried over from the contract-bug round (verified live here): timetable
calls now succeed in one attempt (`localDate` params), no more literal
`{uuid}`/`{courseUuid}` placeholder requests, dashboard role choice is
sticky across reloads.

## What remains, and why it is not frontend code

With the request storms gone, pages converge on a profile of
**8–20 requests and a 3–5s time-to-data floor**, dominated by:

1. **Per-endpoint latency of ~1–2s on staging** (network RTT is 0.25s). The
   hit-list below is from the instructor re-audit — nothing is pathological
   in isolation; the whole API is uniformly slow on the shared droplet that
   also runs Postgres, Keycloak, the UI and other services.

   | Endpoint | Worst | Median |
   |---|---|---|
   | `/instructors/{id}/memberships` | 2.3s | 2.3s |
   | `/students/search` | 2.1s | 1.0s |
   | `/notifications` | 2.1s | 0.4s |
   | `/courses/{id}/enrollments` | 2.0s | 1.9s |
   | `/timetable/student/{id}` | 2.0s | 1.8s |
   | `/instructors/{id}/documents` | 2.0s | 1.0s |
   | `/timetable/instructor/{id}` | 1.5s | 1.3s |
   | `/wallets/{id}` | 1.4s | 1.0s |

2. **Dead stored media** (404s on every page): user avatars and course
   thumbnails reference files that no longer exist on the API host
   (`/users/profile-image/*.png`, `/courses/media/*.{png,jpeg}`).

3. **The shell floor**: ~7 requests before any page content (profile + 3
   parallel domain lookups, notification counts + popup feed, wallet).
   Already parallelized and cached; collapsing further needs a backend
   `GET /me/bootstrap` aggregate.

### Backend asks (in priority order)

1. Move staging off the shared droplet or size it up; profile the API —
   basic searches at 1–2s p50 point at missing indexes/N+1 in the service
   layer. Target <300ms.
2. Clean up dead media references (avatars, course thumbnails) — they cost a
   request + console error on nearly every page.
3. `GET /me/bootstrap` (user + domain profiles + notification counts +
   wallet) to collapse the per-page shell floor.
4. Batch endpoints: enrollment-overview for N students; rating summaries for
   N instructors. (`uuid_in` search filters are confirmed working and are
   already used by the frontend.)
5. Already merged this round: 404/400 instead of 500 for unknown routes and
   parameter type mismatches (elimika PR #255).

## Final verification audit (all 154 pages, post-fix build)

| Domain | Pages | Median time-to-data | Median API reqs | Pages > 5s | Pages > 20 reqs |
|---|---|---|---|---|---|
| instructor | 47 | 3.9s | 12 | 15 | 8 |
| student | 39 | 3.3s | 9 | 9 | 6 |
| admin | 31 | 4.0s | 11 | 11 | 6 |
| course_creator | 37 | 3.3s | 10 | 3 | 1 |

Medians sit on the staging latency floor (~3–4s for 9–12 requests at 1–2s
per call). The "failed requests" on most pages are the dead-media 404s
(avatars, course thumbnails) — backend data cleanup.

### Newly exposed storms (previously masked by the role-switching bug)

Now that every page renders its true role content, four more per-entity
storms surfaced.

All four were then fixed frontend-side as far as the existing API allows
(verified live):

| Page | Before | After | What was done | Still needs backend |
|---|---|---|---|---|
| admin `/dashboard/verifications` | 91 reqs, 15 failed | **25 reqs, 1 failed** | Per-entity documents/education/memberships/experience replaced with batched `*_in` searches; PDF card previews lazy-load on scroll; creator documents fetch only on their tab | Creator-documents search endpoint; dead media cleanup |
| admin `/dashboard/calendar` | 86 reqs | **44 reqs** | Schedules via one timetable call per distinct instructor (29→4); instructors/users/students batched | Enrollment batch (20× per-class remains); global timetable endpoint would simplify |
| admin `/dashboard/classes` | 47 reqs | **15 reqs** | Same `use-admin-classes` rewrite (shared hook) | — |
| student `/dashboard/courses` | 60 reqs (huge payloads) | 60 reqs, tiny payloads | Enrollment counts now read from page metadata (size-1 requests instead of 10,000-row pages); ratings cached 30 min; duplicate review queries deduped by key | Course rating summary (or rating fields on Course) to remove the 15 per-course review fetches |

## Re-audit data

- `docs/perf/audit2-instructor.json` (47 pages, post-fix build)
- `docs/perf/audit2-student.json`, `audit2-admin.json`,
  `audit2-course_creator.json` (final run)
- Regenerate the ranked report: `node scripts/perf/audit-report.mjs docs/perf/audit2-*.json`
