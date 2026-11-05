'use client';

import { SearchUnavailable } from '@/components/search/search-unavailable';
import { EmptyState } from '@/components/ui/empty-state';
import { useOrganisationsByIds } from '@/hooks/use-batched-lookups';
import useBundledClassInfo from '@/hooks/use-course-classes';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { isSearchUnavailable } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import AvailabilityClassCard from '@/src/features/dashboard/courses/components/availability-listing-layout';
import { useClassCatalogue } from '@/src/features/find-classes/use-class-catalogue';
import { useNearMe } from '@/src/features/near-me/near-me';
import { DistanceBandBadge, NearMeControl } from '@/src/features/near-me/near-me-control';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '../../../../../components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../../../../components/ui/sheet';
import { Skeleton } from '../../../../../components/ui/skeleton';
import Spinner from '../../../../../components/ui/spinner';
import { useUserProfile } from '../../../profile/context/profile-context';
import { roleScopedDashboardPath } from '../../lib/active-domain-storage';
import { CourseDetailsSheet } from '../shared/_components/CourseDetailsSheet';
import { BundledClass } from '../types';
import {
  AVAILABLE_CLASS_VIEWS,
  type AvailableClassView,
  availableClassCounts,
  availableClassPage,
  availableClassStatus,
} from './available-class-views';

export default function AvailableClassesPage({
  courseId,
}: {
  courseId: string;
  instructorView?: boolean;
}) {
  const { activeDomain } = useUserDomain();
  const user = useUserProfile();
  const student = user?.student;

  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [courseDetailsOpen, setCourseDetailsOpen] = useState(false);
  const [classDetailsOpen, setClassDetailsOpen] = useState(false);

  const [view, setView] = useState<AvailableClassView>('open');
  const [pagination, setPagination] = useState({ scope: '', page: 0 });
  const { classes = [], loading, isError } = useBundledClassInfo(courseId, student);
  // Same args as each card, so the cards join this wave-1 lesson request via one query key.
  useCourseLessonsWithContent({ courseUuid: courseId, contentEnabled: false });

  const course = classes[0]?.course;
  const filteredClasses = useMemo(
    () => classes.filter(cls => cls.is_active && cls.catalogue !== null),
    [classes]
  );

  // Near me: course-scoped index pages around the chosen point (IN_PERSON and HYBRID
  // only, nearest first), intersected with this course's classes. `near` stays in
  // component state and is never put in the URL.
  const nearMe = useNearMe();
  const nearQuery = useClassCatalogue(
    {
      ...nearMe.params,
      searchParams: { course_uuid: courseId },
    },
    { enabled: nearMe.active && Boolean(courseId), includeSchedules: false }
  );
  const nearUnavailable = nearMe.active && isSearchUnavailable(nearQuery.error);
  const nearBands = useMemo(() => {
    const bands = new Map<string, { band: string | undefined; rank: number }>();
    nearQuery.rows.forEach((item, index) => {
      const uuid = item.class_definition?.uuid;
      if (uuid) bands.set(uuid, { band: item.distance_band, rank: index });
    });
    return bands;
  }, [nearQuery.rows]);
  const listedClasses = useMemo(
    () =>
      nearMe.active
        ? filteredClasses
          .filter(cls => cls.uuid && nearBands.has(cls.uuid))
          .sort(
            (left, right) =>
              (nearBands.get(left.uuid ?? '')?.rank ?? 0) -
              (nearBands.get(right.uuid ?? '')?.rank ?? 0)
          )
        : filteredClasses,
    [filteredClasses, nearMe.active, nearBands]
  );
  const listLoading = loading || (nearMe.active && nearQuery.isLoading);
  const listError = isError || (nearMe.active && nearQuery.isError);
  const scope = `${courseId}:${nearMe.params.near ?? ''}:${nearMe.params.radius_km ?? ''}`;
  const statusClasses = useMemo(() => {
    const now = new Date();
    return listedClasses.map(cls => ({ cls, ...availableClassStatus(cls, now) }));
  }, [listedClasses]);
  const viewCounts = useMemo(() => availableClassCounts(statusClasses), [statusClasses]);
  const requestedPage = pagination.scope === scope ? pagination.page : 0;
  const pageResult = useMemo(
    () => availableClassPage(statusClasses, view, requestedPage, 20),
    [statusClasses, view, requestedPage]
  );
  const visibleClasses = useMemo(() => pageResult.items.map(item => item.cls), [pageResult.items]);

  // One organisation lookup for every card on screen instead of one per card.
  const organisationKey = [
    ...new Set(
      (listLoading || listError ? [] : visibleClasses)
        .map(cls => cls.organisation_uuid)
        .filter((id): id is string => !!id)
    ),
  ]
    .sort()
    .join(',');
  const organisationIds = useMemo(
    () => (organisationKey ? organisationKey.split(',') : []),
    [organisationKey]
  );
  const { organisationMap } = useOrganisationsByIds(organisationIds);

  function toggle(id: string) {
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  }

  return (
    <div className='space-y-4 p-4'>
      <Link
        href='/dashboard/student/courses'
        className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm'
      >
        <ArrowLeft className='h-4 w-4' /> Back to Start Course
      </Link>

      <div className='mt-3 flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>Available Classes</h2>

          {loading ? (
            <Spinner className='mt-1 h-4 w-4' />
          ) : (
            <p className='text-muted-foreground text-sm'>{course?.name || ''}</p>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <NearMeControl nearMe={nearMe} />
          <Button variant='outline' size='sm' onClick={() => setCourseDetailsOpen(true)}>
            <BookOpen className='mr-1 h-4 w-4' /> Course Details
          </Button>

          <Sheet open={compareOpen} onOpenChange={setCompareOpen}>
            <SheetTrigger asChild>
              <Button variant='outline' size='sm' disabled={selected.length < 2}>
                Compare ({selected.length})
              </Button>
            </SheetTrigger>

            <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-4xl'>
              <SheetHeader>
                <SheetTitle>Compare Classes</SheetTitle>
                <p className='text-muted-foreground text-xs'>
                  Differences are highlighted in amber.
                </p>
              </SheetHeader>
              {filteredClasses.length >= 2 && (
                <CompareTable classes={filteredClasses} onRemove={(id: string) => toggle(id)} />
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <nav
        aria-label='Class views'
        className='thin-scrollbar flex gap-6 overflow-x-auto shadow-[inset_0_-1px_0_0_var(--color-border)]'
      >
        {AVAILABLE_CLASS_VIEWS.map(option => {
          const active = option.id === view;
          return (
            <button
              key={option.id}
              type='button'
              aria-pressed={active}
              onClick={() => {
                setView(option.id);
                setPagination({ scope, page: 0 });
              }}
              className={cn(
                'text-muted-foreground hover:text-foreground flex h-11 flex-none items-center gap-2 border-b-2 border-transparent text-sm font-medium',
                active && 'border-primary text-primary font-semibold'
              )}
            >
              {option.label}
              <span
                className={cn(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold tabular-nums',
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {listLoading ? '…' : listError ? '—' : viewCounts[option.id]}
              </span>
            </button>
          );
        })}
      </nav>

      {!listLoading && !listError && (
        <p className='text-muted-foreground text-sm' aria-live='polite'>
          {pageResult.total} {pageResult.total === 1 ? 'class' : 'classes'}
          {pageResult.total > 20
            ? ` · Showing ${pageResult.page * 20 + 1}–${pageResult.page * 20 + visibleClasses.length}`
            : ''}
        </p>
      )}

      <div className='space-y-4'>
        {nearUnavailable ? (
          <SearchUnavailable
            variant='card'
            description='Near-me search is unavailable right now. Clear it to see every class for this course, or try again in a moment.'
            onClear={nearMe.clear}
            onRetry={() => void nearQuery.refetch()}
          />
        ) : nearMe.active && nearQuery.isError ? (
          <div className='rounded-xl border border-dashed p-8 text-center' role='alert'>
            <p className='text-foreground text-sm font-medium'>Could not search near you</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              {nearQuery.error instanceof Error
                ? nearQuery.error.message
                : 'Try again, or clear the near-me search to see every class.'}
            </p>
            <div className='mt-3 flex justify-center gap-2'>
              <Button variant='outline' size='sm' onClick={() => void nearQuery.refetch()}>
                Try again
              </Button>
              <Button variant='ghost' size='sm' onClick={nearMe.clear}>
                Clear near me
              </Button>
            </div>
          </div>
        ) : isError ? (
          <EmptyState title='Could not load classes' description='Please try again in a moment.' />
        ) : listLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className='space-y-3 rounded-xl border p-4'>
              <Skeleton className='h-6 w-2/3' />
              <Skeleton className='h-4 w-1/2' />
              <Skeleton className='h-4 w-full' />

              <div className='flex items-center justify-between pt-2'>
                <Skeleton className='h-8 w-24' />
                <Skeleton className='h-8 w-20' />
              </div>
            </div>
          ))
        ) : visibleClasses.length > 0 ? (
          visibleClasses.map((item, index) => (
            <div key={item.uuid} className='space-y-2'>
              {nearMe.active ? (
                <DistanceBandBadge band={nearBands.get(item.uuid as string)?.band} />
              ) : null}
              <AvailabilityClassCard
                cls={item}
                priority={index < 4}
                organisation={
                  item.organisation_uuid ? (organisationMap[item.organisation_uuid] ?? null) : null
                }
                onViewCourse={() => setCourseDetailsOpen(true)}
                onViewClass={() => setClassDetailsOpen(true)}
                onEnroll={selectedClass => {
                  window.location.href = roleScopedDashboardPath(
                    activeDomain,
                    `/dashboard/courses/available-classes/${courseId}/enroll?id=${selectedClass.uuid}`
                  );
                }}
              />
            </div>
          ))
        ) : nearMe.active && listedClasses.length === 0 ? (
          <div className='rounded-xl border border-dashed p-8 text-center'>
            <p className='text-foreground text-sm font-medium'>
              No classes near {nearMe.point?.label} within {nearMe.radiusKm} km
            </p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Only in-person and hybrid classes have a location. Try a wider radius, or clear the
              near-me search to see online classes too.
            </p>
          </div>
        ) : (
          <EmptyState
            title={view === 'enrolled' ? 'No enrolled classes' : 'No classes in this view'}
            description={
              view === 'enrolled'
                ? 'You are not enrolled in any of the listed classes for this course.'
                : 'Try another tab or change the near-me filter.'
            }
          />
        )}
      </div>

      {!listLoading && !listError && pageResult.totalPages > 1 && (
        <nav className='flex items-center justify-center gap-3 pt-2' aria-label='Pages'>
          <Button
            variant='outline'
            size='sm'
            disabled={pageResult.page <= 0}
            onClick={() => setPagination({ scope, page: pageResult.page - 1 })}
          >
            <ChevronLeft className='size-4' /> Previous
          </Button>
          <span className='text-muted-foreground text-sm tabular-nums'>
            Page {pageResult.page + 1} of {pageResult.totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={pageResult.page + 1 >= pageResult.totalPages}
            onClick={() => setPagination({ scope, page: pageResult.page + 1 })}
          >
            Next <ChevronRight className='size-4' />
          </Button>
        </nav>
      )}

      <CourseDetailsSheet
        key={courseId}
        itemId={courseId}
        type={'course'}
        open={courseDetailsOpen}
        onOpenChange={value => {
          setCourseDetailsOpen(value);

          if (!value) {
            setTimeout(() => setDetailId(null), 200);
          }
        }}
      />
    </div>
  );
}

export function CompareTable({
  classes,
  onRemove,
}: {
  classes: BundledClass[];
  onRemove: (id: string) => void;
}) {
  const rows: { key: string; label: string; get: (c: BundledClass) => string }[] = [
    { key: 'institution_name', label: 'Institution', get: c => c?.institution_name ?? '—' },
    { key: 'instructor', label: 'Instructor', get: c => c.instructor?.name ?? '—' },
    { key: 'delivery_mode', label: 'Delivery mode', get: c => c.delivery_mode ?? '—' },
    { key: 'class_type', label: 'Class type', get: c => c.class_type ?? '—' },
    { key: 'academic_period', label: 'Academic period', get: c => c.academic_period ?? '—' },
    { key: 'weekly_schedule', label: 'Weekly schedule', get: c => c.weekly_schedule ?? '—' },
    {
      key: 'capacity',
      label: 'Capacity',
      get: c => `${c.seats_available ?? 0} / ${c.capacity ?? 0} seats`,
    },
    {
      key: 'tuition_fee_kes',
      label: 'Tuition',
      get: c => `KES ${Number(c.tuition_fee_kes ?? 0).toLocaleString()}`,
    },
    {
      key: 'skills_fund_eligible',
      label: 'Skills Fund',
      get: c => (c.skills_fund_eligible ? 'Eligible' : 'Not eligible'),
    },
    { key: 'age_group', label: 'Age group', get: c => c.age_group ?? '—' },
    { key: 'prerequisite_level', label: 'Prerequisite', get: c => c.prerequisite_level ?? '—' },
    { key: 'rating', label: 'Rating', get: c => (c.rating != null ? `${c.rating} ★` : '—') },
  ];

  return (
    <div className='mt-4 overflow-x-auto'>
      <table className='w-full border-collapse text-sm'>
        <thead>
          <tr>
            <th className='bg-card text-muted-foreground sticky left-0 z-10 p-2 text-left text-xs font-medium'>
              Attribute
            </th>
            {classes.map(c => (
              <th key={c.uuid} className='min-w-[180px] border-b p-2 text-left align-top'>
                <div className='text-foreground font-semibold'>{c.title}</div>
                <button
                  className='text-destructive mt-1 text-xs hover:underline'
                  onClick={() => onRemove(c.uuid as string)}
                >
                  Remove
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const values = classes.map(c => row.get(c));
            const differs = new Set(values).size > 1;
            return (
              <tr key={row.key} className='border-b last:border-0'>
                <td className='bg-card text-muted-foreground sticky left-0 z-10 p-2 text-xs font-medium'>
                  {row.label}
                </td>
                {values.map((v, i) => (
                  <td
                    key={i}
                    className={`p-2 align-top ${differs ? 'bg-warning/10 text-warning' : 'text-foreground'}`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
