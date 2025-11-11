# Repository Guidelines

## Project Structure & Module Organization
- Next.js routes and server components live in `app/`; shared UI primitives sit in `components/` with registry metadata in `components.json`.
- Domain logic stays in `services/` and `lib/`; global state goes to `store/`, React contexts to `context/`, and Tailwind layers to `styles/`.
- Static assets go in `public/`, richer brand imagery in `assets/`, and Docker resources in `docker/`; copy env templates from `env.example`.

## Build, Test, and Development Commands
- `pnpm install` syncs dependencies (project standardizes on `pnpm@10.15.0`).
- `pnpm dev` launches the Turbopack Next server; supply secrets via `.env.local`.
- `pnpm build` produces the production bundle; pair with `pnpm start` to verify the output.
- `pnpm lint` runs ESLint and `pnpm format` applies Prettier with Tailwind sorting; use both before committing.
- `pnpm openapi-ts` regenerates the typed API client defined in `openapi-ts.config.ts`; run after schema changes land.

## Coding Style & Naming Conventions
- TypeScript is the default; favor small composable components and hooks scoped to their feature directories.
- Prettier enforces two-space indentation, single quotes, and Tailwind class sorting (`prettier-plugin-tailwindcss`).
- ESLint blocks `console.*`; component files use `PascalCase`, hooks use `useCamelCase.ts`, and utilities live in `lib/foo.ts`.

## Testing Guidelines
- Automated browser testing is currently unconfigured; coordinate with the team before introducing new suites or tooling.

## Commit & Pull Request Guidelines
- Follow the short `type: summary` convention from history (e.g., `ft: availability calendar fixes`); keep subjects under 72 characters.
- Pair every commit with a detailed body describing what changed and why; avoid single-line commits without context.
- Reference related issues or product requirements, summarize user impact, and include screenshots or recordings for UI changes.
- Confirm `pnpm lint`, `pnpm format`, and `pnpm openapi-ts` (when API contracts shift) succeed before requesting review.

## Security & Configuration Tips
- Never commit `.env.local`; derive new env vars from `env.example` and document defaults or secrets in the PR.
- Validate auth changes under `app/(auth)/` against the staging NextAuth provider before merging.
- Docker compose profiles in `docker/` assume local SSL; flag port or domain deviations in your PR notes.
