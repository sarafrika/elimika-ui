'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { getAssessmentRubricByUuidOptions } from '@/services/client/@tanstack/react-query.gen';

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
    <section className={cn('space-y-3', className)}>
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
  const query = useQuery({
    ...getAssessmentRubricByUuidOptions({ path: { uuid } }),
    enabled: Boolean(uuid),
    staleTime: STALE_TIMES.entity,
  });
  const failed = query.isError || previewResponseFailed(query.data);
  const rubric = failed ? undefined : query.data?.data;
  return (
    <PreviewSection title='Rubric'>
      {query.isPending ? (
        <PreviewLoading />
      ) : failed || !rubric ? (
        <PreviewError
          title='Unable to load rubric'
          retry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <Card>
          <CardContent>
            <p className='text-sm font-medium'>{rubric.title}</p>
            {rubric.description && (
              <p className='text-muted-foreground mt-1 text-sm whitespace-pre-wrap'>
                {rubric.description}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </PreviewSection>
  );
}
