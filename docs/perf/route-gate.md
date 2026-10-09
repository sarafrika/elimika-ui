# Route performance gate (`pnpm perf:gate`)

`scripts/perf/route-gate.mjs` is the CI performance gate from the October 2026 speed programme.
It loads each route in a fresh headless Chromium context (cold React Query cache) with a signed-in
session and exits 1 when any route breaks a rule:

| Rule | Fails when | Why |
| --- | --- | --- |
| Request budget | a route issues more API requests than its budget (default **12**) | per-row fan-out multiplies latency and backend load |
| No 4xx retries | the same method + URL starts again after a 4xx response arrived | React Query's default 3 retries turn one 403 into ~7 s of waiting |
| Real page | the document returns HTTP 4xx/5xx, lands on another path (unless `allowRedirect`), or makes 0 API requests | a 404 or renamed route would otherwise pass with a tiny request count |
| No placeholders | any API URL contains `%7B` / `%7D` (or a raw `{` / `}`) | an ungated generated `*Options` sent `{uuid}` to the API |
| Time-to-data P95 | a route's P95 (or the overall P95) is more than **15%** above the baseline | catches regressions before they reach P95/P99 users |

Time-to-data is the moment the last API response settled before the network went quiet for 2.5 s
(`GATE_QUIET_MS`), measured from navigation start, the same definition as `page-audit.mjs`.

## Running it

```bash
pnpm build && pnpm start                                         # production server
PERF_USER=… PERF_PASS=… node scripts/perf/login.mjs http://localhost:3000   # saves .perf/auth.json
pnpm perf:gate -- http://localhost:3000 --domain instructor
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `<baseUrl>` | `http://localhost:3000` | app under test |
| `--routes <file\|a,b>` | `scripts/perf/route-gate.routes.json` | JSON `{ "<domain>": [...] }` map or array of paths / `{ "path", "budget", "allowRedirect" }`, a text file (one path per line, `#` comments), or a comma list. Bare paths (`overview`) become `/dashboard/<role segment>/overview`; paths starting with `/` are used as-is |
| `--budget <n>` | `12` | request budget for routes without their own |
| `--runs <n>` | `5` | cold loads per route; P95 is taken over these |
| `--domain <role>` | `instructor` routes | picks the route list and role segment, and pins the `elimika-active-dashboard` cookie (student, instructor, course_creator, organisation, admin) |
| `--storage-state <file>` | `.perf/auth.json` | session saved by `login.mjs` |
| `--baseline <file>` | `docs/perf/route-gate-baseline-<domain>.json` (no `--domain`: `route-gate-baseline.json`) | stored P95s to compare against; missing means no P95 check |
| `--max-regression <r>` | `0.15` | allowed P95 growth as a fraction |
| `--min-delta-ms <ms>` | `250` | ignore regressions smaller than this many ms (noise floor on fast routes) |
| `--update-baseline` | off | write this run's P95s as the new baseline (skips the P95 check) |
| `--json <file>` | — | write the full report, including every failure |

## Baseline workflow

1. On a known-good commit run `pnpm perf:gate -- <url> --domain <role> --update-baseline` and
   commit the `docs/perf/route-gate-baseline-<role>.json` it writes.
2. CI and pre-merge checks run the same command without `--update-baseline`.
3. When a change makes routes faster, refresh the baseline so the gate ratchets down.

Use one baseline per domain, and the same machine class and API environment for baseline and
check runs; time-to-data includes backend latency.

## Lint guardrails that back the gate

The Biome GritQL plugins in `.biome-plugins/` catch the same defects statically (all `warn` while
existing debt is paid down; promote to `error` once a rule reaches zero). Counts on 2026-10-08:
143 unbounded `useQueries`, 16 ungated path options, 11 oversized page sizes, 14 `unoptimized`
images (190 Biome warnings in total, no errors):

- `no-unbounded-use-queries.grit`: `useQueries({ queries: list.map(...) })` without `.slice(...)`.
  Batch via `hooks/use-batched-lookups.ts` instead.
- `require-enabled-for-path-options.grit`: `useQuery` over a generated `*Options({ path })` with no
  top-level `enabled`.
- `no-oversized-page-size.grit`: `size:` literals of 500 or more inside a `pageable` or `query` object.
- `no-unoptimized-image.grit`: the `unoptimized` prop on images.
