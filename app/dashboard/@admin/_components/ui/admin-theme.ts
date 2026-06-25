/**
 * Admin design language — refined-neutral.
 *
 * One source of truth for the admin dashboard's canonical class strings and status
 * tone mapping. Uses semantic design tokens only (bg-card, muted, border/70, success/
 * warning/destructive). No hardcoded brand colors — keeps `scripts/check-brand-colors`
 * green and stays dark-mode native.
 */

export const adminTheme = {
  /** Centered page shell — every admin page wraps its content in this. */
  page: 'mx-auto w-full max-w-[1520px] px-3 py-4 sm:px-5 lg:px-7',
  pageStack: 'flex w-full flex-col gap-4',

  /** Card surfaces. */
  card: 'rounded-[18px] border border-border/70 bg-card shadow-sm',
  cardMuted: 'rounded-[18px] border border-border/60 bg-muted/30',
  cardPadded: 'rounded-[18px] border border-border/70 bg-card p-5 shadow-sm',

  /** Controls. */
  control: 'rounded-xl border-border/70 bg-background shadow-sm',

  /** Section heading inside a card. */
  sectionLabel: 'text-xs font-medium uppercase tracking-wide text-muted-foreground',
} as const;

/** Semantic status tones, mapped to the shared `Badge` variants and tint classes. */
export type StatusTone = 'success' | 'warning' | 'destructive' | 'info' | 'neutral';

export const statusToneClass: Record<StatusTone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-primary/30 bg-primary/10 text-primary',
  neutral: 'border-border/70 bg-muted/40 text-muted-foreground',
};

/**
 * Resolve an arbitrary status string (from any backend enum) to a tone + label.
 * Covers verification, account, content, and moderation states.
 */
export function resolveStatusTone(status?: string | null): { tone: StatusTone; label: string } {
  const raw = (status ?? '').toString().trim();
  if (!raw) return { tone: 'neutral', label: 'Unknown' };

  const key = raw.toLowerCase().replace(/[\s-]+/g, '_');
  const label = raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

  const success = ['verified', 'active', 'published', 'approved', 'completed', 'paid', 'true'];
  const warning = ['pending', 'in_review', 'pending_review', 'draft', 'processing', 'submitted'];
  const destructive = ['rejected', 'inactive', 'archived', 'dismissed', 'failed', 'suspended', 'false'];

  if (success.includes(key)) return { tone: 'success', label };
  if (warning.includes(key)) return { tone: 'warning', label };
  if (destructive.includes(key)) return { tone: 'destructive', label };
  return { tone: 'neutral', label };
}
