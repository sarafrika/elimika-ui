'use client';

import { StatusBadge } from '@/components/data-display';
import { absoluteDateTime, parseApiDate, relativeTimeFromNow } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { InboxItem } from '../hooks/use-review-queue';

/** Anything waiting longer than this is called out. */
const OVERDUE_DAYS = 2;

function waitingFor(submittedAt?: Date | string | null) {
  const parsed = parseApiDate(submittedAt);
  if (!parsed) return { label: '', overdue: false, title: '' };

  const days = (Date.now() - parsed.valueOf()) / 86_400_000;
  return {
    label: relativeTimeFromNow(submittedAt, ''),
    overdue: days >= OVERDUE_DAYS,
    title: absoluteDateTime(submittedAt, ''),
  };
}

const TYPE_LABEL: Record<InboxItem['type'], string> = {
  documents: 'Document',
  instructors: 'Instructor',
  creators: 'Course creator',
  organisations: 'Organisation',
  courses: 'Course',
  edits: 'Course edit',
  programs: 'Program',
};

export function InboxList({
  items,
  selectedId,
  onSelect,
}: {
  items: InboxItem[];
  selectedId: string;
  onSelect: (item: InboxItem) => void;
}) {
  return (
    <ul className='divide-border/60 divide-y'>
      {items.map(item => {
        const waiting = waitingFor(item.submittedAt);
        const isSelected = item.id === selectedId;

        return (
          <li key={item.id}>
            <button
              type='button'
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => onSelect(item)}
              className={cn(
                'hover:bg-muted/40 flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                isSelected && 'bg-primary/5'
              )}
            >
              <span className='min-w-0 flex-1 space-y-1'>
                <span className='flex flex-wrap items-center gap-2'>
                  <span className='bg-muted text-muted-foreground rounded-sm px-1.5 py-0.5 text-[11px] font-semibold'>
                    {TYPE_LABEL[item.type]}
                  </span>
                  <span className='text-foreground truncate text-sm font-semibold'>
                    {item.subject}
                  </span>
                </span>
                <span className='text-muted-foreground block truncate text-xs'>{item.who}</span>
              </span>

              {waiting.label ? (
                <span className='shrink-0' title={waiting.title}>
                  {waiting.overdue ? (
                    <StatusBadge tone='warning' label={waiting.label} />
                  ) : (
                    <span className='text-muted-foreground font-mono text-xs'>{waiting.label}</span>
                  )}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
