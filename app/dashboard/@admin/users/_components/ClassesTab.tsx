'use client';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock } from 'lucide-react';
import { STALE_TIMES } from '@/lib/query-client';
import { fetchInstructorClasses } from '@/services/admin/user-profile-360';
import { DetailGrid } from '../../_components/ui/DetailPanel';
import { SectionCard, SectionCardSkeleton } from '../../_components/ui/SectionCard';
import { StatusBadge } from '../../_components/ui/StatusBadge';

export function ClassesTab({ instructorUuid, active }: { instructorUuid: string; active: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ['instructor-classes', instructorUuid],
    queryFn: () => fetchInstructorClasses(instructorUuid),
    enabled: active,
    staleTime: STALE_TIMES.entity,
  });

  if (isLoading) return <SectionCardSkeleton rows={5} />;

  const classes = data ?? [];

  return (
    <SectionCard
      title='Classes'
      description='Classes this instructor delivers / has trained in.'
    >
      {classes.length ? (
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
      ) : (
        <p className='text-sm text-muted-foreground'>No classes found for this instructor.</p>
      )}
    </SectionCard>
  );
}
