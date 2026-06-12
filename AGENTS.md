# Repository Guidelines

## Project Structure & Module Organization
`app/` contains the Next.js App Router pages, API routes, and dashboard role slots such as `app/dashboard/@student` and `app/dashboard/@admin`. Put reusable primitives in `components/ui/`; feature-specific UI belongs in nearby folders under `components/`. Keep shared logic in `lib/`, global state in `store/`, React providers in `context/`, and API access in `services/`, with generated clients under `services/client/`. Static files live in `public/`, branded assets in `assets/`, and theme styles in `styles/`.

## Build, Test, and Development Commands
- `pnpm install`: install dependencies with the repo’s pinned pnpm version.
- `pnpm dev`: start the local Next.js development server.
- `pnpm build`: produce a production build; pair with `pnpm start` for a local production smoke test.
- `pnpm lint`: run Biome linting plus `scripts/check-brand-colors.mjs`.
- `pnpm format`: run Prettier across TS/JS/CSS/JSON/YAML files.
- `pnpm openapi-ts`: regenerate the HeyAPI client after schema changes.

## Coding Style & Naming Conventions
Use TypeScript throughout. Name components `PascalCase.tsx`, hooks `useThing.ts`, and utilities with descriptive lowercase filenames in `lib/`. Prefer existing `shadcn/ui` primitives and shared helpers before adding new variants. In `app/**`, `components/**`, and `src/**`, use token-based classes such as `bg-card`, `text-foreground`, `bg-primary`, `bg-success`, `bg-warning`, `bg-destructive`; avoid hardcoded hex values and raw Tailwind palette classes. `console.*` is blocked by Biome, so use the project logger. For data fetching, use generated query helpers instead of raw `fetch`.

## Design system primitives
- Buttons: `<Button variant=…>` from `components/ui/button.tsx`. Don't roll a `buttonPrimaryClasses`-style string constant.
- Inputs: `<Input>` from `components/ui/input.tsx`. Wrap exotic types (`datetime-local`, `file`) rather than re-implementing styling.
- Empty / error / loading: `<EmptyState>` (`components/ui/empty-state.tsx`), `<Skeleton>`, `<Spinner>`. Every dashboard route should have a `loading.tsx`; mutations should use the AddToCartModal pattern (Spinner inside Button on `isPending`).
- Cards: `components/ui/card.tsx`. The tiptap parallel `Card` is editor-internal — do not import it elsewhere.

## Data fetching invariants
- Generated `*Options` and `*QueryKey` helpers from `services/client/@tanstack/react-query.gen.ts` are canonical. Never hand-roll keys for these endpoints.
- HeyAPI returns `{ data, error }` — branch on `error` before reading `data`. Avoid `as` casts of the response shape; use type guards.
- The default query serializer rejects nested arrays inside objects. Don't pass `pageable: { sort: [] }` — omit empty arrays; if a real sort is needed, configure a custom `querySerializer` at the call site.
- Path templates with `{cartId}`-style placeholders: only build the options object when the id is truthy. Empty-string fallbacks can leak literal placeholders into URLs.

## Performance guardrails
These came out of the June 2026 performance post-mortem (`docs/perf/post-mortem.md`, `docs/perf/hardening-round-2026-06-12.md`). Each rule maps to a real production slowdown — do not regress them:
- **Request budget**: a page should issue ≤ ~12 API requests for a typical user. Never fire a query per row/entity. Look up entities by id through `hooks/use-batched-lookups.ts` (`useUsersByIds`, `useStudentsByIds`, `useCoursesByIds`, `useInstructorsByIds`) — the API's `*_in` search filters (e.g. `uuid_in=a,b,c`) are verified working. If composing hooks multiplies requests by N, restructure before shipping.
- **Never fetch unbounded pages to read a few rows** — no `pageable: { size: 1000 }` map hooks. Scope requests to the ids actually on screen.
- **Gate every query whose path/query params can be undefined** with a React Query `enabled:` option. An undefined path param sends a literal `{uuid}` placeholder to the API. `enabled` must be a top-level query option — nested inside the API `query: {}` object it is silently sent as a query-string param and does nothing (Biome blocks this pattern).
- **`LocalDate` API params** (timetable `start`/`end` etc.): pass `localDate(...)` from `lib/date.ts`, never a raw `Date` — the serializer turns `Date` into a full ISO datetime, which the backend rejects.
- **No `form.watch()` in render** — it re-renders the entire form per keystroke. Use `useWatch({ control, name })` inside a small subscriber component (`components/form/watched-value.tsx` has `WatchedText`/`WatchedValue`). Biome warns on `form.watch(...)`.
- **Memoize context provider values**; `useMemo` derived lists; defer/debounce search-driven filtering (`useDeferredValue`).
- **Heavy libraries load lazily**: pdfjs via `lib/pdfjs.ts`, the tiptap editor via `simple-editor-lazy`, charts/viewers via `next/dynamic`. Biome's `noRestrictedImports` enforces the known ones; extend it when you wrap a new heavy library.
- **staleTime is deliberate**: pick a tier from `lib/query-client.ts` (`STALE_TIMES.reference/entity/live`). Shell data (wallet, profile) must not refetch on every navigation; polls (notifications) are ≥ 60s and dropdown content fetches on open, not on page load.
- **Media URLs from the API** (`profile_image_url`, thumbnails) must go through `toAuthenticatedMediaUrl` (`src/lib/media-url.ts`) — direct hits on the API host are unauthenticated.
- **Measure before/after**: `npx next experimental-analyze -o` + `node scripts/perf/route-sizes.mjs --compare docs/perf/route-sizes-phase4.json` for bundles (`@next/bundle-analyzer` does not work with Turbopack); `scripts/perf/login.mjs` + `scripts/perf/page-audit.mjs --domain <role>` for authenticated request counts/time-to-data. `scripts/perf/ts-error-ratchet.mjs` must pass (`--update` to lock in reductions).

## Brand-color guard
`scripts/check-brand-colors.mjs` runs as part of `pnpm lint`. It enforces two tiers:
- **Blocking** — legacy palette classes (`*-blue-…`, `*-red-…`, `*-gray-…` etc.) and raw hex outside an allowlist. Fix before merging.
- **Warning** — extended palette (`*-green-…`, `*-amber-…` etc.) and hardcoded `text-white` / `bg-white` / `bg-black` without a paired `dark:` variant. Surfaced for incremental cleanup.
Promote a warning rule to blocking once its codebase debt is paid down.

## Testing Guidelines
There is no dedicated unit or E2E test runner configured yet. Before opening a PR, run `pnpm lint`, verify `pnpm build`, and manually check light/dark themes, mobile and desktop layouts, loading states, and role-based navigation.

## Commit & Pull Request Guidelines
Recent history uses short prefixes such as `ft:`, `fix:`, and `chore:`. Keep subjects under 72 characters, for example `fix: correct dashboard breadcrumb state`. PRs should summarize the user-facing change, note config or API impacts, link related issues, and include screenshots or video for UI updates.

## Security & Configuration
Never commit `.env.local`. Add new variables to `env.example`, and regenerate the OpenAPI client when backend contracts change.
