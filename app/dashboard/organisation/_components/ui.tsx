/**
 * Organisation dashboard UI primitives — self-contained on the Lovable design system.
 *
 * Previously this barrel re-exported the admin `_components/ui` foundation. The organisation
 * dashboard no longer carries that admin DNA: the page header is the Lovable `PageHeader`
 * (teal accent bar) and the section/detail/status primitives below are Lovable-styled
 * (rounded-lg cards, semantic tokens) and owned here — no dependency on the admin module.
 */
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export { PageHeader as AdminPageHeader } from '@/components/dashboard';

/** Lovable page shell — org pages wrap content in `adminTheme.page` + `adminTheme.pageStack`. */
export const adminTheme = {
  page: 'mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]',
  pageStack: 'flex w-full flex-col gap-6',
  card: 'rounded-lg border bg-card shadow-sm',
  cardMuted: 'rounded-lg border bg-muted/30',
  cardPadded: 'rounded-lg border bg-card p-5 shadow-sm',
  control: 'rounded-md bg-background shadow-sm',
  sectionLabel: 'text-xs font-medium uppercase tracking-wide text-muted-foreground',
} as const;

// ─── Status pill ──────────────────────────────────────────────────────────────
export type StatusTone = 'success' | 'warning' | 'destructive' | 'info' | 'neutral';

export const statusToneClass: Record<StatusTone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-primary/30 bg-primary/10 text-primary',
  neutral: 'border-border bg-muted/40 text-muted-foreground',
};

/** Resolve an arbitrary backend status string to a tone + human label. */
export function resolveStatusTone(status?: string | null): { tone: StatusTone; label: string } {
  const raw = (status ?? '').toString().trim();
  if (!raw) return { tone: 'neutral', label: 'Unknown' };

  const key = raw.toLowerCase().replace(/[\s-]+/g, '_');
  const label = raw.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

  const success = ['verified', 'active', 'published', 'approved', 'completed', 'paid', 'true'];
  const warning = ['pending', 'in_review', 'pending_review', 'draft', 'processing', 'submitted'];
  const destructive = ['rejected', 'inactive', 'archived', 'dismissed', 'failed', 'suspended', 'false'];

  if (success.includes(key)) return { tone: 'success', label };
  if (warning.includes(key)) return { tone: 'warning', label };
  if (destructive.includes(key)) return { tone: 'destructive', label };
  return { tone: 'neutral', label };
}

interface StatusBadgeProps {
  status?: string | null;
  tone?: StatusTone;
  label?: string;
  className?: string;
}

/** Semantic status pill — pass a raw backend status (any case) or override tone/label. */
export function StatusBadge({ status, tone, label, className }: StatusBadgeProps) {
  const resolved = resolveStatusTone(status);
  const finalTone = tone ?? resolved.tone;
  const finalLabel = label ?? resolved.label;
  return (
    <Badge
      variant="outline"
      className={cn('rounded-md px-2.5 py-0.5 text-xs font-medium', statusToneClass[finalTone], className)}
    >
      {finalLabel}
    </Badge>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  bare?: boolean;
}

/** A titled content section with Lovable card chrome (rounded-lg border, bg-card). */
export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  bare = false,
}: SectionCardProps) {
  return (
    <section className={cn(bare ? '' : 'rounded-lg border bg-card shadow-sm', className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
          <div className="space-y-1">
            {title ? <h2 className="text-base font-semibold text-foreground">{title}</h2> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn(bare ? '' : 'p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Skeleton matching the SectionCard layout — use as a `<Suspense>` fallback. */
export function SectionCardSkeleton({
  rows = 4,
  withHeader = true,
  className,
}: {
  rows?: number;
  withHeader?: boolean;
  className?: string;
}) {
  return (
    <section className={cn('rounded-lg border bg-card shadow-sm', className)}>
      {withHeader ? (
        <div className="space-y-2 border-b px-5 py-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
      ) : null}
      <div className="space-y-3 p-5">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" style={{ width: `${90 - index * 8}%` }} />
        ))}
      </div>
    </section>
  );
}

// ─── Detail grid ──────────────────────────────────────────────────────────────
export function DetailRow({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border bg-muted/20 px-3 py-2.5', className)}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{value ?? '—'}</div>
    </div>
  );
}

/** Responsive grid of DetailRows. */
export function DetailGrid({
  items,
  columns = 2,
  className,
}: {
  items: Array<{ label: ReactNode; value: ReactNode }>;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const cols = columns === 1 ? 'sm:grid-cols-1' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
  return (
    <div className={cn('grid gap-3', cols, className)}>
      {items.map((item, index) => (
        <DetailRow key={index} label={item.label} value={item.value} />
      ))}
    </div>
  );
}
