'use client';

import { useMemo, useState } from 'react';
import { AssignmentCard } from './AssignmentCard';
import { AssignmentHeader } from './AssignmentHeader';
import { AssignmentInsights } from './AssignmentInsights';
import { AssignmentQuickActions } from './AssignmentQuickActions';
import { AssignmentToolbar } from './AssignmentToolbar';
import { assignments } from './assignment-data';
import type { AssignmentStatus } from './assignment-types';

export function AssignmentPageClient() {
  const [activeFilter, setActiveFilter] = useState<AssignmentStatus>('all');
  const [search, setSearch] = useState('');

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments.filter(assignment => {
      const matchesFilter = activeFilter === 'all' || assignment.status === activeFilter;
      const matchesSearch =
        !query ||
        [assignment.lesson, assignment.subtitle, assignment.instructor]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search]);

  return (
    <main className='bg-background p-4 md:p-6'>
      <div className='mx-auto max-w-7xl space-y-5'>
        <AssignmentHeader />
        <AssignmentToolbar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          search={search}
          setSearch={setSearch}
        />

        <div className='grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]'>
          <section className='space-y-5'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2'>
              {filteredAssignments.map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>

            <div className='flex flex-wrap items-center justify-end gap-2'>
              {['<', '1', '2', '...', '12', '>'].map(item => (
                <button
                  key={item}
                  type='button'
                  className='border-border/60 hover:bg-muted h-9 min-w-9 rounded-lg border bg-white px-3 text-sm transition-colors'
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <aside className='space-y-4'>
            <AssignmentInsights />
            <AssignmentQuickActions />
          </aside>
        </div>
      </div>
    </main>
  );
}
