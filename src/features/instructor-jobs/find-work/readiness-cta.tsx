'use client';

import { Info } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';

import { readinessCtaHref } from '../job-links';
import type { JobReadiness } from '../job-readiness';

const NOTE_TONES: Partial<Record<JobReadiness['state'], string>> = {
  clash: 'border-destructive/30 bg-destructive/5 text-destructive',
  rate: 'border-warning/40 bg-warning/10 text-foreground',
};

/** The sentence explaining what blocks an application, toned like its readiness chip. */
export function ReadinessFixNote({
  readiness,
  className,
}: {
  readiness: JobReadiness;
  className?: string;
}) {
  if (!readiness.fix || readiness.state === 'closed') return null;
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm',
        NOTE_TONES[readiness.state] ?? 'border-primary/20 bg-primary/5 text-foreground',
        className
      )}
    >
      <Info aria-hidden className='mt-0.5 size-4 shrink-0' />
      <span>{readiness.fix}</span>
    </p>
  );
}

/**
 * The readiness action: Apply opens the dialog through `onApply`, every other kind links to
 * where the fix happens. Renders nothing for `view`, which the card's own link already covers.
 */
export function ReadinessCta({
  job,
  readiness,
  applicationUuid,
  onApply,
  size = 'sm',
  className,
}: {
  job: ClassMarketplaceJob;
  readiness: JobReadiness | null;
  applicationUuid?: string | null;
  onApply: (job: ClassMarketplaceJob) => void;
  size?: 'sm' | 'default';
  className?: string;
}) {
  if (!readiness) return <Skeleton className={cn('h-8 w-24 rounded-md', className)} />;
  const { cta } = readiness;
  if (cta.kind === 'view') return null;
  if (cta.kind === 'apply') {
    return (
      <Button size={size} className={className} onClick={() => onApply(job)}>
        {cta.label}
      </Button>
    );
  }
  const href = readinessCtaHref(cta.kind, job, applicationUuid);
  if (!href) return null;
  return (
    <Button asChild size={size} variant='outline' className={className}>
      <Link href={href}>{cta.label}</Link>
    </Button>
  );
}
