'use client';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock } from 'lucide-react';
import { AsyncSection } from '@/components/data/async-section';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import { fetchInstructorClasses } from '@/services/admin/user-profile-360';
import { DetailGrid } from '../../_components/ui/DetailPanel';
import { SectionCard } from '../../_components/ui/SectionCard';
import { StatusBadge } from '../../_components/ui/StatusBadge';

export function ClassesTab({ instructorUuid, active }: { instructorUuid: string; active: boolean }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['instructor-classes', instructorUuid],
    queryFn: () => fetchInstructorClasses(instructorUuid),
    enabled: active,
    staleTime: STALE_TIMES.entity,
  });

  const classes = data ?? [];

  return (
    <SectionCard
      title='Classes'
      description='Classes this instructor delivers / has trained in.'
    >
      <AsyncSection
        loading={isLoading && !data}
        error={isError ? error : undefined}
        empty={classes.length === 0}
        onRetry={refetch}
        skeleton={
          <div className='space-y-3'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-20 w-full rounded-md' />
            ))}
          </div>
        }
        emptyState={
          <p className='text-sm text-muted-foreground'>No classes found for this instructor.</p>
        }
      >
        <div className='space-y-3'>
          {classes.map(klass => (
            <div key={klass.uuid} className='rounded-md border border-border/60 bg-muted/20 p-3'>
              <div className='mb-2 flex items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-2'>
                  <CalendarClock className='size-4 shrink-0 text-muted-foreground' />
                  <p className='truncate text-sm font-medium text-foreground'>{klass.title}</p>
                </div>
                <StatusBadge status={klass.isActive ? 'active' : 'inactive'} />
              </div>
              <DetailGrid
                columns={3}
                items={[
                  { label: 'Format', value: <span className='capitalize'>{klass.sessionFormat || '—'}</span> },
                  { label: 'Location', value: <span className='capitalize'>{klass.locationType || '—'}</span> },
                  { label: 'Capacity', value: klass.maxParticipants != null ? String(klass.maxParticipants) : '—' },
                ]}
              />
            </div>
          ))}
        </div>
      </AsyncSection>
    </SectionCard>
  );
}
