'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getAllDifficultyLevelsOptions,
  getClassDefinitionsForCourseOptions,
  getCourseByUuidOptions,
  getCurrentUserOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { Course } from '@/services/client/types.gen';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, PlusSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatCourseDuration, formatPricingLabel } from '../format';
import type { PublicCourseDetail, PublicCourseSummary } from '../types';

type CourseDetailsCardProps = {
  course: Pick<
    PublicCourseSummary,
    'uuid' | 'price' | 'duration_hours' | 'duration_minutes' | 'total_duration_display'
  > & Partial<Pick<Course, 'minimum_training_fee' | 'created_date'>>;
  currencyCode?: string | null;
  priceAmount?: number | null;
  isFree?: boolean;
  level?: string;
  classCount?: number;
  deliveryCount?: number;
  classesLoading?: boolean;
  dashboard?: 'organisation' | 'instructor';
};

export function CourseDetailsAsideCard(
  props: { detail: PublicCourseDetail } | CourseDetailsCardProps
) {
  // Dashboard records already own this data; only public pages need the queries.
  if (!('detail' in props)) return <CourseDetailsCard {...props} />;
  const { detail } = props;
  // Do not construct path-based queries until a course identifier is available.
  if (!detail.course.uuid) return null;
  return <PublicCourseDetailsCard detail={detail} courseUuid={detail.course.uuid} />;
}

function PublicCourseDetailsCard({
  detail,
  courseUuid,
}: {
  detail: PublicCourseDetail;
  courseUuid: string;
}) {
  const { status } = useSession();
  const authenticated = status === 'authenticated';
  const userQuery = useQuery({
    ...getCurrentUserOptions(),
    enabled: authenticated,
    staleTime: STALE_TIMES.entity,
  });
  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseUuid } }),
    enabled: authenticated,
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const course = authenticated ? courseQuery.data?.data : undefined;
  const levelsQuery = useQuery({
    ...getAllDifficultyLevelsOptions(),
    enabled: authenticated && Boolean(course?.difficulty_uuid),
    staleTime: STALE_TIMES.reference,
  });
  const classesQuery = useQuery({
    ...getClassDefinitionsForCourseOptions({
      path: { courseUuid },
      query: { activeOnly: true },
    }),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.live,
    retry: false,
  });
  const classes = classesQuery.data?.data;
  const deliveryCount = classes
    ? new Set(classes.flatMap(item => item.class_definition?.location_type ?? [])).size
    : null;
  const domains = authenticated ? userQuery.data?.data?.user_domain : undefined;
  const isOrganisation = domains?.includes('organisation_user') ?? false;
  const isInstructor = domains?.includes('instructor') ?? false;
  const level = levelsQuery.data?.data?.find(item => item.uuid === course?.difficulty_uuid);

  return (
    <CourseDetailsCard
      course={{ ...detail.course, ...course }}
      currencyCode={detail.currencyCode}
      priceAmount={detail.priceAmount}
      isFree={detail.isFree}
      level={level?.name}
      classCount={classes?.length}
      deliveryCount={deliveryCount ?? undefined}
      classesLoading={classesQuery.isPending}
      dashboard={isOrganisation ? 'organisation' : isInstructor ? 'instructor' : undefined}
    />
  );
}

function CourseDetailsCard({
  course,
  currencyCode,
  priceAmount = course.price,
  isFree = priceAmount === 0,
  level,
  classCount,
  deliveryCount,
  classesLoading,
  dashboard,
}: CourseDetailsCardProps) {
  const courseParams = new URLSearchParams({ courseUuid: course.uuid ?? '' }).toString();
  const trainingFee = course?.minimum_training_fee;
  const hasTrainingFee = typeof trainingFee === 'number' && Number.isFinite(trainingFee);
  const price = hasTrainingFee
    ? formatPricingLabel({
      priceAmount: trainingFee,
      currencyCode: currencyCode ?? null,
      isFree: trainingFee === 0,
    })
    : formatPricingLabel({
      priceAmount: priceAmount ?? null,
      currencyCode: currencyCode ?? null,
      isFree,
    });
  const created = course?.created_date ? new Date(course.created_date) : null;
  const createdLabel =
    created && !Number.isNaN(created.getTime())
      ? new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(created)
      : '—';
  return (
    <Card className='gap-0 overflow-hidden py-0'>
      <div className='from-primary to-primary/80 text-primary-foreground bg-gradient-to-br p-5'>
        <div className='text-xs tracking-wide uppercase'>
          Starting From
        </div>
        <div className='mt-1 font-mono text-3xl font-semibold'>{price}</div>
        {deliveryCount !== undefined && (
          <p className='mt-1 text-xs'>
            {deliveryCount} delivery method{deliveryCount === 1 ? '' : 's'} in active classes
          </p>
        )}

        {dashboard && course.uuid && (
          <Button asChild variant='secondary' className='mt-4 w-full'>
            <Link href={`/dashboard/${dashboard}/classes/new?${courseParams}`}>
              <PlusSquare className='size-4' aria-hidden='true' />
              Create class
            </Link>
          </Button>
        )}
        {dashboard === 'organisation' && course.uuid && (
          <Button
            asChild
            variant='outline'
            className='border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground mt-2 w-full bg-transparent dark:bg-transparent'
          >
            <Link href={`/dashboard/organisation/jobs/new?${courseParams}`}>
              <Briefcase className='size-4' aria-hidden='true' />
              Post a job
            </Link>
          </Button>
        )}
      </div>
      <CardContent className='py-5'>
        <dl className='space-y-3 text-sm'>
          {[
            ['Created', createdLabel],
            ['Duration', formatCourseDuration(course) ?? '—'],
            ['Level', level ?? '—'],
            // This record represents a standalone course; the API has no program type field.
            ['Program type', 'Course'],
          ].map(([label, value]) => (
            <div key={label} className='flex items-start justify-between gap-4'>
              <dt className='text-muted-foreground'>{label}</dt>
              <dd className='text-right font-medium'>{value}</dd>
            </div>
          ))}
          <div className='flex items-center justify-between gap-4'>
            <dt className='text-muted-foreground'>Classes running</dt>
            <dd className='font-medium'>
              {classesLoading ? (
                <Skeleton className='h-4 w-8' aria-label='Loading active classes' />
              ) : classCount !== undefined ? (
                classCount
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
