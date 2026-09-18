'use client';

import { useMemo } from 'react';
import { surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { InboxList } from '../components/inbox-list';
import { InboxRecordPreview } from '../components/inbox-record-preview';
import { SectionBoundary } from '../components/section-boundary';
import { useQueueCounts, useReviewQueue } from '../hooks/use-review-queue';
import type { InboxType } from '../lib/admin-routes';
import { enumParam, stringParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';

const TYPES: { id: InboxType; label: string }[] = [
  { id: 'documents', label: 'Documents' },
  { id: 'instructors', label: 'Instructors' },
  { id: 'creators', label: 'Course creators' },
  { id: 'organisations', label: 'Organisations' },
  { id: 'courses', label: 'Courses' },
  { id: 'edits', label: 'Course edits' },
  { id: 'programs', label: 'Programs' },
];

const TYPE_IDS = TYPES.map(type => type.id) as InboxType[];
const typeParam = enumParam<InboxType>(TYPE_IDS, 'documents');
const itemParam = stringParam();

export function InboxPage() {
  const [type, setType] = useSearchState<InboxType>('type', typeParam);
  const [itemId, setItemId] = useSearchState('item', itemParam);

  const { counts, waiting, query: countsQuery } = useQueueCounts();
  const queue = useReviewQueue(type);

  // Nothing is opened for you: the preview costs its own calls, so it waits for a click.
  const selected = useMemo(
    () => (itemId ? queue.items.find(item => item.id === itemId) : undefined),
    [queue.items, itemId]
  );

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Review inbox'
          title={waiting ? `${waiting} waiting for a decision` : 'Review inbox'}
          description='Everything waiting sits here. Open a record to decide — the inbox only routes.'
        />

        <div className='grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_380px]'>
          <nav aria-label='Queues' className={cn(surfaceTheme.card, 'h-fit p-2')}>
            <ul className='space-y-1'>
              {TYPES.map(entry => {
                const count = counts[entry.id];
                const isActive = entry.id === type;
                return (
                  <li key={entry.id}>
                    <button
                      type='button'
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => {
                        setItemId('');
                        setType(entry.id);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground hover:bg-muted/50 font-medium'
                      )}
                    >
                      <span className='flex-1'>{entry.label}</span>
                      {countsQuery.isLoading && count === undefined ? (
                        <Skeleton className='h-4 w-6' />
                      ) : typeof count === 'number' ? (
                        <span className='text-muted-foreground font-mono text-xs'>{count}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className='text-muted-foreground px-3 py-2 text-xs'>
              Course edits and programs have no platform count yet.
            </p>
          </nav>

          <section className={cn(surfaceTheme.card, 'overflow-hidden')}>
            <SectionBoundary
              label='this queue'
              loading={queue.isLoading}
              error={queue.error}
              empty={queue.items.length === 0}
              onRetry={queue.refetch}
              emptyTitle='Inbox zero'
              emptyDescription='Nothing is waiting in this queue. New submissions appear here within a minute.'
              skeleton={
                <div className='space-y-3 p-4'>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className='h-12 w-full' />
                  ))}
                </div>
              }
            >
              <InboxList
                items={queue.items}
                selectedId={selected?.id ?? ''}
                onSelect={item => setItemId(item.id)}
              />
            </SectionBoundary>
          </section>

          <aside className={cn(surfaceTheme.card, 'h-fit p-4')}>
            {selected ? (
              <InboxRecordPreview key={selected.id} item={selected} />
            ) : (
              <p className='text-muted-foreground text-sm'>
                Select an item to see whose record it belongs to.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
