import { Check, Lock, Minus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CatalogueGrantTone } from '@/src/features/catalogue/prospect';

/**
 * The four surfaces every section of the public course record is built from.
 *
 * They carry the record view's measurements — the 18px card rhythm, the 15px
 * bold headings, the 12.5px rail type — so a prospect reading the public
 * catalogue and the same prospect reading a dashboard record see one design.
 * Every colour is a token, so both re-hue together.
 *
 * These are plain server components: no state, no effects, no `'use client'`.
 * The public detail page is server-rendered for crawlers and for its LCP, and
 * nothing in here may take that away.
 */

/** A body-column section: "About this course", "Course curriculum". */
export function SectionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('bg-card rounded-xl border px-5 py-[18px] shadow-sm', className)}>
      {children}
    </section>
  );
}

/** A rail card: the access card, "At a glance", the enrol panel. */
export function RailCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Card className={cn('gap-0 px-[18px] py-4', className)}>{children}</Card>;
}

export function SectionHeading({
  icon,
  children,
  className,
  tone = 'primary',
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: 'primary' | 'success';
}) {
  return (
    <h2 className={cn('flex items-center gap-2 text-[15px] font-bold', className)}>
      <span className={tone === 'success' ? 'text-success' : 'text-primary'} aria-hidden>
        {icon}
      </span>
      {children}
    </h2>
  );
}

/** The small outlined pill above the curriculum. */
export function RecordChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'text-muted-foreground inline-flex h-[26px] items-center gap-1.5 rounded-[10px] border px-2.5 text-xs',
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * The mark beside a grant line. Semantic tokens throughout — success, warning
 * and the muted step read the same in every theme, which is what a list saying
 * what you may and may not do needs.
 */
export function GrantIcon({
  tone,
  className,
}: {
  tone: CatalogueGrantTone;
  className?: string;
}) {
  const shared = cn('flex-none stroke-[1.9]', className);

  if (tone === 'granted') return <Check className={cn(shared, 'text-success')} aria-hidden />;
  if (tone === 'locked') return <Lock className={cn(shared, 'text-warning')} aria-hidden />;
  return <Minus className={cn(shared, 'text-muted-foreground/70')} aria-hidden />;
}

/** Only what you actually have reads at full strength. */
export function grantLabelClass(tone: CatalogueGrantTone): string {
  return tone === 'granted' ? 'text-foreground/80' : 'text-muted-foreground';
}
