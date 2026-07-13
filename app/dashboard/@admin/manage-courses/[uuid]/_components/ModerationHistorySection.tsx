'use client';

import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ContentModerationHistory } from '@/services/client';
import { getCourseModerationHistoryOptions } from '@/services/client/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';
import { type StatusTone, statusToneClass } from '../../../_components/ui/admin-theme';
import { SectionCard } from '../../../_components/ui/SectionCard';
import { StatusBadge } from '../../../_components/ui/StatusBadge';

const ACTION_TONE: Record<string, StatusTone> = {
  approved: 'success',
  rejected: 'destructive',
  revoked: 'warning',
};

function formatDateTime(value?: Date | string | null): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

export function ModerationHistorySection({ courseUuid }: { courseUuid: string }) {
  const { data, isLoading } = useQuery({
    ...getCourseModerationHistoryOptions({
      path: { uuid: courseUuid },
      query: { pageable: { page: 0, size: 50 } },
    }),
    enabled: !!courseUuid,
  });
  const entries: ContentModerationHistory[] = data?.data?.content ?? [];

  return (
    <SectionCard
      title='Moderation history'
      description='Every approval decision recorded for this course.'
    >
      {isLoading ? (
        <div className='space-y-2'>
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className='h-12 w-full rounded-md' />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/70 p-8 text-center'>
          <History className='size-8 text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>No moderation activity yet.</p>
        </div>
      ) : (
        <ol className='relative space-y-4 border-l border-border/70 pl-5'>
          {entries.map(entry => {
            const tone = ACTION_TONE[(entry.action ?? '').toLowerCase()] ?? 'neutral';
            return (
              <li key={entry.uuid} className='relative'>
                <span
                  className={cn(
                    'absolute -left-[27px] top-1 flex size-3 rounded-full border-2 border-card',
                    statusToneClass[tone],
                    'bg-current'
                  )}
                />
                <div className='flex flex-wrap items-center gap-2'>
                  <StatusBadge status={entry.action} />
                  <span className='text-xs text-muted-foreground'>
                    {formatDateTime(entry.created_date)}
                  </span>
                  {entry.created_by ? (
                    <span className='text-xs text-muted-foreground'>by {entry.created_by}</span>
                  ) : null}
                </div>
                {entry.reason ? (
                  <p className='mt-1.5 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm leading-relaxed text-foreground'>
                    {entry.reason}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}
