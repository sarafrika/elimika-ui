# Browser verification scripts

What `pnpm build` and the `scripts/check-*.mjs` guards cannot see. Both take the
base URL as the first argument (default `http://localhost:3000`), print
`PASS`/`FAIL` per assertion, and exit non-zero on any failure. An expired session
is reported as a Keycloak bounce and exits 2 instead of hanging. Refresh the
cookies in `.perf/` first — they expire, and each role needs its own file:

```
PERF_USER=<email> PERF_PASS=<password> node scripts/perf/login.mjs
cp .perf/auth.json .perf/auth-instructor.json   # repeat for auth-organisation.json
```

**calendar-smoke.mjs** — the grid opens scrolled off midnight; no event card
shows the old fabricated `ST`/`EN` initials or a bare `+10` roster badge; every
card's printed clock lands on the hour row it is drawn against; no app-origin
console errors. Writes `.perf/calendar-smoke.png`. Fails when the current week
has no sessions, since nothing can then be position-checked. Also reads
`CALENDAR_DOMAIN` (default `instructor`).

```
CALENDAR_STORAGE_STATE=.perf/auth-instructor.json node scripts/verify/calendar-smoke.mjs http://localhost:3000
```

**approval-freshness.mjs** — reloading the organisation's applications page still
issues a `training-applications/search` request instead of replaying the
persisted cache. Prints the request count and the tracked row's status before and
after. Also reads `APPROVAL_DOMAIN` (default `organisation`) and
`APPROVAL_APPLICATION` (row to track by course name; defaults to the first row).

```
APPROVAL_STORAGE_STATE=.perf/auth-organisation.json node scripts/verify/approval-freshness.mjs http://localhost:3000
```
