# Elimika Colour Tokens

> Use these — not raw Tailwind palettes.
>
> **Source of truth:** `app/globals.css` · **Guard:** `scripts/check-brand-colors.mjs` (`pnpm` lint)

---

## Light mode (`:root`)

| Token         | Hex       | Usage                    |
| ------------- | --------- | ------------------------ |
| `background`  | `#ffffff` | Page background          |
| `foreground`  | `#1c1f2b` | Body text                |
| `card`        | `#ffffff` | Surfaces                 |
| `muted`       | `#eff2f8` | De-emphasised background |
| `border`      | `#dde3ee` | Hairlines                |
| `primary`     | `#0a63f5` | Brand action             |
| `secondary`   | `#f7f9fc` | Quiet button             |
| `accent`      | `#0a63f5` | Highlight                |
| `success`     | `#10c180` | Confirmations            |
| `warning`     | `#f97316` | Heads-up                 |
| `destructive` | `#ef2f4b` | Danger / delete          |
| `info`        | `#3b82f6` | Neutral notice           |

---

## Dark mode (`.dark`)

| Token         | Hex       | Usage                    |
| ------------- | --------- | ------------------------ |
| `background`  | `#0d1019` | Page background          |
| `foreground`  | `#f7f9fc` | Body text                |
| `card`        | `#181b25` | Surfaces                 |
| `muted`       | `#1d212b` | De-emphasised background |
| `border`      | `#1f2330` | Hairlines                |
| `primary`     | `#5a92ff` | Brand action             |
| `secondary`   | `#0a1a3d` | Quiet button             |
| `accent`      | `#816bff` | Highlight                |
| `success`     | `#0c9b66` | Confirmations            |
| `warning`     | `#c75c11` | Heads-up                 |
| `destructive` | `#bf2638` | Danger / delete          |
| `info`        | `#326fce` | Neutral notice           |

---

## Rules of thumb

- ✅ Use `bg-primary`, `bg-success`, `bg-warning`, `bg-destructive`, `bg-card`, `bg-muted` — **never** `bg-blue-600`, `bg-green-100`, etc.
- ✅ Pair text/bg tokens: `bg-primary` needs `text-primary-foreground`; `bg-success` needs `text-success-foreground`.
- ❌ Never hardcode hex outside `app/globals.css` and `styles/_variables.scss`.
- ❌ Don't use `text-white` / `bg-white` / `bg-black` without a paired dark variant — it breaks dark mode.
- ⚠️ Raw `<button>`, `<input>`: use `components/ui/button.tsx`, `input.tsx` instead.
