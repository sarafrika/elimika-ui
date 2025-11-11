## Repository Coding & UI Implementation Guidelines  
_Last updated: 2025-11-11_  
_Applies to: all frontend engineers, designers, and fullstack agents contributing to the platform_

---

## 🔧 Project Structure & Module Organization

- **Routing and Pages**:  
  Use the Next.js App Router (`/app/`) with layout-based structure per domain or user role. Group routes under `/(student)/`, `/(admin)/`, `/(instructor)/`, etc., to enable contextual layouts and navigation.

  Example:
  ```
  app/
    (student)/
      dashboard/
      courses/
    (admin)/
      dashboard/
      users/
  ```

- **UI Primitives**:  
  All base components (e.g., buttons, cards, forms) live in `/components/ui/`. Register them in `components.json` for project-wide consistency.

- **State & Logic**:
  - Global state: `/store/`
  - React contexts: `/context/`
  - Services (API logic): `/services/`
  - Utilities: `/lib/`

- **Assets & Config**:
  - Static assets: `/public/`
  - Branded illustrations/images: `/assets/`
  - Tailwind + Theme configs: `/styles/`
  - Docker files: `/docker/`
  - Environment templates: `/env.example`

---

## ⚙️ Build, Test, and Development

| Task                 | Command                        |
|----------------------|--------------------------------|
| Install deps         | `pnpm install` (requires `pnpm@10.15.0`) |
| Start dev server     | `pnpm dev`                     |
| Build prod bundle    | `pnpm build && pnpm start`     |
| Format & Lint        | `pnpm format` and `pnpm lint`  |
| Regenerate API client| `pnpm openapi-ts`              |

---

## 🎨 UI & Design System Conventions

### Themes

- Supports light, dark, and system preferences.
- Colors, typography, spacing defined in `design-system.ts` and Tailwind config.
- Primary color: **Elimika Blue `#0061ED`**, avoid default Tailwind purples or raw Tailwind palettes.
- Decorative gradients are **light-mode only**. Wrap gradient layers with `dark:hidden` (or equivalent) so dark/system themes fall back to solid surfaces that respect `bg-background`.

### Design Tokens

| Token            | Use                              |
|------------------|-----------------------------------|
| `--card-bg`      | Surface backgrounds               |
| `--accent`       | Primary brand accent              |
| `--radius`       | Corner rounding (e.g. `28px`)     |
| `--section-gap`  | Vertical spacing between sections |

Use only standardized utility generators like `getCardClasses()`, not custom values.

### Components

- Built on `shadcn/ui` primitives. Use these for buttons, forms, alerts, modals, tabs, etc.
- Extend existing components instead of creating new variants.
- Use `react-hook-form` + `zod` with consistent error display and layout.
- Shared UI helpers (e.g., `BrandPill`, `ProfileFormShell`, sidebar primitives) must be reused before creating bespoke markup.

---

## 🧭 Layout & Navigation Patterns

- **Sidebar + Topbar Layout**:
  - Sidebar shows role-specific items (configured in `lib/menu.ts`)
  - Topbar includes logo, breadcrumb, profile menu, and theme/role switcher

- **Role-based Dashboards**:
  - Student: enrolled courses, upcoming tasks, timetable
  - Instructor: teaching schedule, grading tools, lesson editor
  - Admin: user management, analytics, content moderation

- **Breadcrumbs**:
  - Set using `useBreadcrumb()` in all routes
  - Appears below topbar if page depth > 1

---

## 🧱 Component Styling Rules

- **Spacing**: Use Tailwind spacing utilities tied to token scale (`p-6`, `gap-4`)
- **Cards**: Apply `bg-card`, `rounded-xl`, `shadow-md` from shared utils
- **Icons**: Use Lucide icons only, sized consistently
- **Typography**: Scale ranges from `text-sm` to `text-3xl` based on design system
- **Badges**: Use `<Badge variant="success" />`, no manual styling
- **Loading states**: Prefer `<Skeleton>` (shadcn) or existing skeleton components. Avoid bespoke spinners/loaders unless a screen already uses them for a specific interaction.

---

## 🌙 Theme Modes & Color Rules

- Implemented via `next-themes` using Tailwind `dark:` variants and CSS vars
- Light and dark styles must match design system tokens
- **Never** use hardcoded hex values or Tailwind color utilities (`text-blue-600`, `bg-gray-50`, etc.) in `app/**` or `components/**`. Always derive colors from CSS tokens (`text-foreground`, `bg-card`, `text-primary`, etc.).
- `pnpm lint` runs `scripts/check-brand-colors.mjs` to enforce palette usage. Fix violations instead of disabling rules.

---

## 🔌 API Integration (HeyAPI + React Query)

- Use OpenAPI-generated query functions only:

  ```ts
  const { data } = useQuery({
    ...getClassOptions({ path: { id } }),
  });
  ```

- No raw fetch calls permitted
- After schema changes, run:
  ```bash
  pnpm openapi-ts
  ```

- Use `<Skeleton>` components for loading, `<ErrorMessage />` for failures
- API results are cached and revalidated with TanStack Query

---

## 📦 Coding Style & File Naming

- TypeScript required
- File naming conventions:
  - Components: `PascalCase.tsx`
  - Hooks: `useThing.ts`
  - Utils: `lib/thing.ts`
- ESLint blocks all `console.*`; use `logger.ts` if needed

---

## ✅ Commit & PR Protocol

- Use `type: short summary` format:
  ```
  ft: add student dashboard
  fix: patch broken auth redirect
  chore: update dependencies
  ```

- Subject <72 chars, body explains rationale, links issues
- Include screenshots or videos for UI changes
- Ensure the following pass before pushing:
  ```
  pnpm lint
  pnpm format
  pnpm openapi-ts
  ```

---

## 🧪 Testing

- No E2E/browser testing yet; coordinate before adding new tooling
- Manually test:
  - Both themes (light/dark)
  - Mobile breakpoints
  - Async loading and skeleton states
  - Navigation across roles

---

## 🔐 Security & Secrets

- Never commit `.env.local`  
- Derive all new env vars from `env.example`  
- Note new secrets and config requirements in PR descriptions  
- Test auth changes under `app/(auth)/` on staging before merge  

---

## 📚 References

- Design system: `design-system.ts`
- API SDK config: `openapi-ts.config.ts`
- Navigation: `lib/menu.ts`, `app/(role)/layout.tsx`
- Shared components: `components/ui/`
- Breadcrumbs: `context/breadcrumb.tsx`
- Loading UX: `components/skeleton/`
