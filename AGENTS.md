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
Use TypeScript throughout. Name components `PascalCase.tsx`, hooks `useThing.ts`, and utilities with descriptive lowercase filenames in `lib/`. Prefer existing `shadcn/ui` primitives and shared helpers before adding new variants. In `app/**` and `components/**`, use token-based classes such as `bg-card` and `text-foreground`; avoid hardcoded hex values and raw Tailwind palette classes. `console.*` is blocked by Biome, so use the project logger. For data fetching, use generated query helpers instead of raw `fetch`.

## Testing Guidelines
There is no dedicated unit or E2E test runner configured yet. Before opening a PR, run `pnpm lint`, verify `pnpm build`, and manually check light/dark themes, mobile and desktop layouts, loading states, and role-based navigation.

## Commit & Pull Request Guidelines
Recent history uses short prefixes such as `ft:`, `fix:`, and `chore:`. Keep subjects under 72 characters, for example `fix: correct dashboard breadcrumb state`. PRs should summarize the user-facing change, note config or API impacts, link related issues, and include screenshots or video for UI updates.

## Security & Configuration
Never commit `.env.local`. Add new variables to `env.example`, and regenerate the OpenAPI client when backend contracts change.
