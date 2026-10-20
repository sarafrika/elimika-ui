'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { EvaluationRubricPreview } from './evaluation-rubric-preview';

export function previewResponseFailed(response?: { success?: boolean; error?: unknown }) {
  return response?.success === false || Boolean(response?.error);
}

export function assessmentLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

export function PreviewSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('min-w-0 space-y-3', className)}>
      <h3 className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function PreviewStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className='border-border bg-muted/40 rounded-lg border px-3 py-2'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='text-foreground mt-0.5 text-sm font-semibold'>{value}</p>
    </div>
  );
}

export function PreviewLoading() {
  return (
    <div role='status' className='space-y-3'>
      <span className='sr-only'>Loading preview</span>
      <Skeleton className='h-16 w-full' />
      <Skeleton className='h-32 w-full' />
    </div>
  );
}

export function PreviewError({ title, retry }: { title: string; retry: () => void }) {
  return (
    <EmptyState
      title={title}
      description='Please try again.'
      variant='compact'
      action={
        <Button variant='outline' onClick={retry}>
          Retry
        </Button>
      }
    />
  );
}

// Mount only when a rubric UUID is available so no placeholder URL is requested.
export function PreviewRubric({ uuid }: { uuid: string }) {
  if (!uuid.trim()) return null;
  return (
    <PreviewSection title='Rubric'>
      <EvaluationRubricPreview rubricUuid={uuid} />
    </PreviewSection>
  );
}
