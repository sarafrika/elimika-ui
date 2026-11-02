'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAllDifficultyLevelsOptions,
  getClassDefinitionsForProgramOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { Course, TrainingProgram } from '@/services/client/types.gen';
import { formatPricingLabel } from '@/src/features/catalogue/format';

type ProgramDetailsAsideCardProps = {
  program?: TrainingProgram;
  currencyCode?: string;
  courses?: readonly Course[];
  loading?: boolean;
  coursesLoading?: boolean;
};

export function ProgramDetailsAsideCard({
  program,
  currencyCode,
  courses,
  loading,
  coursesLoading,
}: ProgramDetailsAsideCardProps) {
  const classesQuery = useQuery({
    ...getClassDefinitionsForProgramOptions({
      path: { programUuid: program?.uuid ?? '' },
      query: { activeOnly: true },
    }),
    enabled: Boolean(program?.uuid),
    staleTime: STALE_TIMES.live,
  });
  const levelsQuery = useQuery({
    ...getAllDifficultyLevelsOptions(),
    enabled: Boolean(courses?.some(course => course.difficulty_uuid)),
    staleTime: STALE_TIMES.reference,
  });
  const classes =
    classesQuery.isError || classesQuery.data?.error || classesQuery.data?.success === false
      ? undefined
      : classesQuery.data?.data;
  const deliveryCount = useMemo(
    () =>
      classes
        ? new Set(classes.flatMap(item => item.class_definition?.location_type ?? [])).size
        : undefined,
    [classes]
  );
  const level = useMemo(() => {
    if (levelsQuery.isError || levelsQuery.data?.error || levelsQuery.data?.success === false)
      return '—';
    const ids = new Set(courses?.map(course => course.difficulty_uuid));
    return (
      levelsQuery.data?.data
        ?.filter(item => ids.has(item.uuid))
        .map(item => item.name)
        .join(', ') || '—'
    );
  }, [courses, levelsQuery.data, levelsQuery.isError]);

  if (loading) {
    return (
      <Card className='gap-0 overflow-hidden py-0' aria-label='Loading programme details'>
        <Skeleton className='h-24 w-full rounded-none' />
        <CardContent className='space-y-3 py-5'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
        </CardContent>
      </Card>
    );
  }
  if (!program) return null;

  const price = formatPricingLabel({
    priceAmount: program.price ?? null,
    currencyCode: currencyCode ?? null,
    isFree: program.price == null || program.price === 0,
  });
  const created = program.created_date ? new Date(program.created_date) : null;
  const createdLabel =
    created && !Number.isNaN(created.getTime())
      ? new Intl.DateTimeFormat('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(created)
      : '—';
  const details = [
    ['Created', createdLabel],
    ['Level', level],
    ['Programme type', program.program_type || '—'],
  ];

  return (
    <Card className='gap-0 overflow-hidden py-0'>
      <div className='from-primary to-primary/80 text-primary-foreground bg-gradient-to-br p-5'>
        <div className='text-xs tracking-wide uppercase'>Programme price</div>
        <div className='mt-1 font-mono text-3xl font-semibold'>{price}</div>
        {classesQuery.isLoading ? (
          <Skeleton className='mt-1 h-4 w-48' aria-label='Loading delivery methods' />
        ) : deliveryCount !== undefined ? (
          <p className='mt-1 text-xs'>
            {deliveryCount} delivery method{deliveryCount === 1 ? '' : 's'} in active classes
          </p>
        ) : (
          <p className='mt-1 text-xs'>Delivery methods unavailable</p>
        )}
      </div>
      <CardContent className='py-5'>
        <dl className='space-y-3 text-sm'>
          {details.map(([label, value]) => (
            <div key={label} className='flex items-start justify-between gap-4'>
              <dt className='text-muted-foreground'>{label}</dt>
              <dd className='text-right font-medium'>
                {label === 'Level' && (coursesLoading || levelsQuery.isLoading) ? (
                  <Skeleton className='h-4 w-16' aria-label='Loading programme levels' />
                ) : value}
              </dd>
            </div>
          ))}
          <div className='flex items-center justify-between gap-4'>
            <dt className='text-muted-foreground'>Classes running</dt>
            <dd className='font-medium'>
              {classesQuery.isLoading ? (
                <Skeleton className='h-4 w-8' aria-label='Loading active classes' />
              ) : (
                classes?.length ?? '—'
              )}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
