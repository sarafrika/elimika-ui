# System Rules UI Generator Prompt

Use this prompt for the AI UI generator. It is tuned to the Sarafrika Elimika System Rules backend and current admin aesthetic.

```text
Design a modern admin UI screen for managing System Rules in the Sarafrika Elimika console.

Purpose
- CRUD for system rules that govern platform policies.
- Two primary views: (1) paginated list with filters, (2) create/edit drawer with validation and JSON editing.

API contract (Spring Boot)
- List: GET /api/v1/system-rules?category&status&page&size
- Get: GET /api/v1/system-rules/{uuid}
- Create: POST /api/v1/system-rules
- Update: PUT /api/v1/system-rules/{uuid}
- Payload fields (snake_case): category (PLATFORM_FEE | AGE_GATE | ENROLLMENT_GUARD | CUSTOM), key, scope (GLOBAL | TENANT | REGION | DEMOGRAPHIC | SEGMENT), scope_reference, priority (int), status (DRAFT | ACTIVE | INACTIVE), value_type (JSON | DECIMAL | INTEGER | BOOLEAN | STRING), value_payload (JSON), conditions (JSON, optional), effective_from (ISO datetime), effective_to (ISO datetime, optional).

Layout & style
- Keep the existing admin look: neutral light background, bold accent color for primary actions, rounded cards, tidy spacing, no overly glossy gradients.
- Left content: rules table; right side opens a slide-over drawer for create/edit.
- Use a readable, professional font (e.g., “Satoshi”, “Space Grotesk” or “Inter” if available). Clear hierarchy with 16/18/24 px text sizes.
- Primary CTA is a top-right “New rule” button; secondary actions are subtle outlined buttons.

List view
- Table columns: Key, Category (pill), Scope (pill + scope_reference if present), Status (pill), Priority (numeric), Effective window (from → to), Last updated (timestamp, user).
- Filters above the table: category dropdown, status dropdown, search box for key, optional scope dropdown, “Reset” link. Show active filter chips.
- Pagination footer with total count and page size selector.
- Empty state with a concise CTA to create the first rule.
- Row click opens edit drawer; overflow menu per row with “Edit” and “View details”.

Create/Edit drawer
- Two-column form on desktop, single column on mobile.
- Fields with labels, help text, and inline validation for required fields and max lengths (key ≤128 chars, scope_reference ≤128).
- Status as segmented control (Draft/Active/Inactive); Priority as numeric stepper; Effective dates with date-time pickers and a mini timeline preview.
- Category and scope as dropdowns; show scope_reference only when scope ≠ GLOBAL with placeholder examples (tenant UUID, ISO country code).
- Value section:
  - Value type dropdown.
  - JSON code editor area for value_payload (monospaced, brace highlighting, pretty-print button).
- Conditions section (optional) with collapsible JSON editor and helper text (“Leave empty for unconditional rule”).
- Sticky footer in the drawer with “Save” (primary) and “Cancel” (secondary). Disable Save while invalid; show error toasts on API failures.
- Display a live summary card in the drawer (“Rule summary”) reflecting category, key, scope, status, effective window.

Detail peek (optional)
- A right-panel preview that shows rendered JSON payload, conditions, audit info (created/updated by, timestamps).

Interactions & UX
- Autosave not required; show unsaved-changes prompt when closing the drawer.
- On save, refresh table data and show a success toast.
- On validation errors, scroll to first error and highlight fields.
- Handle 409/400 API errors with inline banners.

Accessibility & responsiveness
- Keyboard navigable, focus outlines, sensible tab order.
- Responsive: table collapses to cards on narrow screens; drawer becomes full-height sheet on mobile.

Tone
- Clean, minimal, no AI slop. Consistent spacing (8/16/24 grid), restrained shadows, clear contrast for tags and CTAs.
```
