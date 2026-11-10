import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { AgeGroup, TrainingRequirementAnswer } from '@/services/client';

export function ClassApplicationResources({
  equipment,
  groups,
  selected,
  loading,
}: {
  equipment?: TrainingRequirementAnswer[] | null;
  groups?: AgeGroup[] | null;
  selected: boolean;
  loading: boolean;
}) {
  return (
    <section aria-label='Training application resources' className='space-y-3'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='min-w-0 space-y-2'>
          <h3 className='text-sm font-medium'>Equipment & requirements</h3>
          {loading ? (
            <Skeleton className='h-40 w-full rounded-md' />
          ) : equipment?.length ? (
            <ul className='border-border max-h-48 space-y-3 overflow-y-auto rounded-md border p-3'>
              {equipment.map((item, index) => (
                <li
                  key={item.requirement_uuid ?? index}
                  className='flex items-start justify-between gap-2 text-sm'
                >
                  <span>{item.requirement_name || 'Requirement no longer available'}</span>
                  <Badge variant='secondary' className='shrink-0'>
                    {item.has_it
                      ? 'Available'
                      : item.acquisition === 'lease'
                        ? 'Will lease'
                        : item.acquisition === 'hire'
                          ? 'Will hire'
                          : 'Not specified'}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={
                selected ? 'No equipment or requirements listed' : 'Choose a course or program'
              }
              description={
                selected
                  ? 'Your approved application has no requirement answers.'
                  : 'Its application details will appear here.'
              }
              variant='compact'
            />
          )}
        </div>
        <div className='min-w-0 space-y-2'>
          <h3 className='text-sm font-medium'>Target groups</h3>
          {loading ? (
            <Skeleton className='h-40 w-full rounded-md' />
          ) : groups?.length ? (
            <ul className='border-border max-h-48 space-y-3 overflow-y-auto rounded-md border p-3'>
              {groups.map((group, index) => (
                <li key={group.uuid ?? index} className='space-y-1 text-sm'>
                  <p className='font-medium'>{group.name || 'Unnamed group'}</p>
                  {group.min_age != null || group.max_age != null ? (
                    <p className='text-muted-foreground text-xs'>
                      {group.min_age != null && group.max_age != null
                        ? `Ages ${group.min_age}–${group.max_age}`
                        : group.min_age != null
                          ? `Ages ${group.min_age} and above`
                          : `Up to age ${group.max_age}`}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={selected ? 'No target groups listed' : 'Choose a course or program'}
              description={
                selected
                  ? 'Your approved application has no age groups.'
                  : 'Its target groups will appear here.'
              }
              variant='compact'
            />
          )}
        </div>
      </div>
    </section>
  );
}
