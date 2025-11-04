# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Elimika is a Next.js-based learning management system with role-based dashboards for students, instructors, course creators, organizations, and admins. It uses Keycloak for authentication, TanStack Query for data fetching, and a type-safe API client generated from OpenAPI specs.

## Essential Commands

### Development
```bash
pnpm dev              # Start development server (uses Turbopack)
pnpm build            # Build for production
pnpm start            # Start production server
```

### Code Quality
```bash
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
```

### Testing
Automated browser tests are currently unconfigured; coordinate with the team before introducing new tooling.

### API Type Generation
```bash
pnpm openapi-ts       # Generate types from OpenAPI spec at https://api.elimika.sarafrika.com/v3/api-docs
```

**Important**: When the backend API changes, run `pnpm openapi-ts` to regenerate types in `services/client/`.

## Architecture

### Parallel Routing & Multi-Role Dashboard

The app uses Next.js App Router's **parallel routes** to support multi-role users:

- Each user role has its own dashboard segment: `app/dashboard/@student/`, `app/dashboard/@instructor/`, `app/dashboard/@course_creator/`, `app/dashboard/@organization/`, `app/dashboard/@admin/`
- The dashboard layout (`app/dashboard/layout.tsx`) renders the appropriate parallel route(s) based on the user's `user_domain` array
- Users can switch between roles without re-authentication if they have multiple domains
- Navigation menus are filtered by active domain (see `lib/menu.ts`)

### Authentication Flow

1. **Provider**: NextAuth v5 (Auth v5) with Keycloak OIDC
2. **Session**: JWT-based, stored client-side
3. **Middleware**: `middleware.ts` protects `/dashboard` and `/onboarding` routes
4. **Token retrieval**: `services/auth/get-token.ts` provides server-side access token for API calls
5. **Session data**: Includes `realm_access`, `resource_access`, `organisation`, and `organisation-slug` from decoded JWT

### Data Fetching

- **Client-side**: TanStack Query hooks with `openapi-react-query` (see `services/client/@tanstack/react-query.gen.ts`)
- **Server-side**: Direct calls using `openapi-fetch` client (see `services/client/sdk.gen.ts`)
- **Configuration**: `hey-api.ts` configures auth and query serialization
- **Persistence**: Query client persists to localStorage (24h cache, 5min stale time)

### State Management

- **Global state**: Zustand stores in `store/` (e.g., `app-store.ts`, `use-user-store.ts`)
- **User context**: `context/profile-context.tsx` wraps the app and provides user profile data
- **Domain-specific contexts**: `instructor-context.tsx`, `student-context.tsx`, `course-creator-context.tsx`, `training-center-provide.tsx`

### Onboarding

The onboarding flow is at `app/onboarding/page.tsx` and branches by role:
- **Student**: `app/onboarding/student/`
- **Instructor**: `app/onboarding/instructor/`
- **Organisation**: `app/onboarding/organisation/`

After onboarding, users are redirected to `/dashboard` where the layout checks their `user_domain` and renders the correct parallel route.

## Key Files & Patterns

### API Integration

- `services/client/` — Auto-generated OpenAPI client (DO NOT EDIT manually)
- `services/auth/get-token.ts` — Server action to retrieve user access token
- `hey-api.ts` — Client config with auth middleware and query serialization

### Navigation & Menus

- `lib/menu.ts` — Menu definitions for all user roles. Each role has its own menu array (e.g., `student`, `instructor`, `admin`).
- `components/app-sidebar.tsx` — Renders role-specific sidebar
- `components/nav-main.tsx`, `components/nav-user.tsx` — Navigation components

### Form Handling

- Uses `react-hook-form` with `@hookform/resolvers` and `zod` for validation
- Form components typically in `_components/` directories
- Example: `app/onboarding/_components/` for onboarding forms

### Image Handling

- External images from `api.elimika.sarafrika.com` and `cdn.sarafrika.com` are allowed (see `next.config.ts`)
- Custom hook: `hooks/use-secure-image.tsx` for handling authenticated image requests

### Rich Text Editing

- TipTap editor components in `components/tiptap-*` directories
- Custom hook: `hooks/use-tiptap-editor.ts`
- Utilities: `lib/tiptap-utils.ts`

## Common Development Tasks

### Adding a New API Endpoint

1. Backend team updates OpenAPI spec
2. Run `pnpm openapi-ts` to regenerate client types
3. Import and use the new endpoint from `services/client/sdk.gen.ts` or TanStack Query hooks from `services/client/@tanstack/react-query.gen.ts`

### Adding a New User Role

1. Update `lib/types.ts` to include new `UserDomain` value
2. Create new parallel route in `app/dashboard/@new_role/`
3. Add menu items in `lib/menu.ts` for the new role
4. Update `app/dashboard/layout.tsx` to include the new role in the dashboard props type
5. Update authentication logic if needed (realm/resource access in `services/auth/index.ts`)

### Adding a New Menu Item

1. Edit `lib/menu.ts` and add item to the appropriate role array
2. Menu items are automatically filtered by active domain in the sidebar

### Debugging Authentication Issues

- Check `middleware.ts` for protected routes
- Verify Keycloak config in `.env` (`KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER`)
- Check `services/auth/index.ts` JWT callback for token decoding
- Use `getAuthToken()` server action to inspect access tokens

### Working with Forms

- Use `zod` schemas for validation (typically defined near form components)
- Forms use `react-hook-form` with `zodResolver`
- File uploads are handled via `FormData` (see onboarding forms for examples)

 ## Design System

The Elimika UI design system is defined in `lib/design-system.ts` and is inspired by the Elimika logo:

- **Primary Color**: Elimika blue (#0061ED) from the logo
- **Design Principles**: Layered gradients, confident geometry (rounded corners), clean whitespace
- **Logo**: Three horizontal layered lines representing structured learning experiences

### Using the Design System

```typescript
import { elimikaDesignSystem, getCardClasses } from '@/lib/design-system'

// Use predefined component classes
<div className={getCardClasses()}>...</div>

// Or access specific design tokens
<div className={elimikaDesignSystem.components.header.base}>...</div>
```

**Important**: Always use the design system classes instead of hardcoded Tailwind colors. Replace:
- `purple-*` colors with `blue-*` (Elimika blue)
- Generic `border-border` with `border-blue-200/40`
- Generic `bg-muted` with `bg-blue-50` or design system equivalents

## Important Notes

- TypeScript build errors are ignored in production builds (`typescript.ignoreBuildErrors: true` in `next.config.ts`). Fix type errors during development.
- Server actions have a 100MB body size limit (`experimental.serverActions.bodySizeLimit` in `next.config.ts`)
- The app uses `pnpm` as package manager (see `packageManager` in `package.json`)
- Read the comprehensive `ONBOARDING.md` for detailed onboarding flow documentation

## CI/CD

Workflows in `.github/workflows/`:
- `build-push.yaml` — Builds and pushes Docker images to GHCR
- `setup-server.yaml` — Transfers config files to deployment server
- `deploy.yml` — Deploys to self-hosted server via SSH

## Testing

- Browser-based E2E coverage is currently not configured; align with the team before adding suites or tooling.
