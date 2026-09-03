'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { useInstructorAnalyticsData } from '../useInstructorAnalyticsData';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

interface ProgramBarProps {
  name: string;
  rate: number;
}

function ProgramBar({ name, rate }: ProgramBarProps) {
  const color = rate >= 90 ? 'bg-primary' : rate >= 75 ? 'bg-primary/70' : 'bg-primary/40';

  return (
    <div className='group flex items-center gap-2'>
      <span className='text-muted-foreground group-hover:text-foreground min-w-0 flex-1 truncate text-xs transition-colors'>
        {name}
      </span>
      <div className='bg-muted relative h-2 w-24 shrink-0 rounded-full sm:w-28'>
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className='text-foreground w-8 shrink-0 text-right text-xs font-semibold'>{rate}%</span>
    </div>
  );
}

export function CompletionByProgram({
  handeViewProgramReport,
}: {
  handeViewProgramReport?: () => void;
}) {
  const { programCompletion, isLoading } = useInstructorAnalyticsData();
  const [search, setSearch] = useState('');

  const filteredPrograms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return programCompletion;
    }

    return programCompletion.filter(program =>
      program.name.toLowerCase().includes(normalizedSearch)
    );
  }, [programCompletion, search]);

  if (isLoading) {
    return (
      <div className='bg-card border-border h-full animate-pulse rounded-xl border p-3 shadow-sm sm:p-4'>
        {/* Header skeleton */}
        <div className='mb-3 flex items-center justify-between'>
          <div className='bg-muted h-3 w-40 rounded' />
          <div className='bg-muted h-3 w-24 rounded' />
        </div>

        {/* Rows skeleton */}
        <div className='space-y-2.5'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center gap-2'>
              {/* name */}
              <div className='bg-muted h-3 flex-1 rounded' />

              {/* bar */}
              <div className='bg-muted h-2 w-24 shrink-0 rounded-full sm:w-28' />

              {/* percentage */}
              <div className='bg-muted h-3 w-8 shrink-0 rounded' />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (programCompletion.length === 0) {
    return (
      <EmptyState
        icon={() => null}
        title='No program completion data'
        description='Your completion rates will appear once sessions are scheduled and completed.'
        variant='card'
      />
    );
  }

  return (
    <div className='bg-card border-border h-full rounded-xl border p-3 shadow-sm sm:p-4'>
      <div className='mb-3 space-y-2'>
        <div className='flex items-center justify-between gap-2'>
          <h3 className='text-foreground text-xs font-semibold sm:text-sm'>
            Completion Rate by Program
          </h3>
          {handeViewProgramReport && (
            <button
              onClick={handeViewProgramReport}
              className='text-primary hover:text-primary/80 shrink-0 text-xs whitespace-nowrap transition-colors'
            >
              View Full Report
            </button>
          )}
        </div>

        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder='Search programs'
            className='w-full sm:max-w-sm'
          />

          {search.trim() !== '' && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setSearch('')}
              className='w-full justify-center sm:w-auto'
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className='space-y-2.5'>
        {filteredPrograms.length === 0 ? (
          <EmptyState
            icon={() => null}
            title='No matching programs'
            description='Try a different search term to find the program you want.'
            variant='card'
          />
        ) : (
          filteredPrograms.map(p => <ProgramBar key={p.name} {...p} />)
        )}
      </div>
    </div>
  );
}
