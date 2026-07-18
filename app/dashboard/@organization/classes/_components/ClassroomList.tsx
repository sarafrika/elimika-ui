'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Plus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import {
  getClassDefinitionsForOrganisationOptions,
  listJobsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassDefinition, ClassMarketplaceJob } from '@/services/client/types.gen';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import { EnrollStudentDialog } from './EnrollStudentDialog';

const CLASS_JOB_PAGE_SIZE = 50;

type ClassMarketplaceJobWithProgram = ClassMarketplaceJob & {
  readonly program_uuid?: string | null;
};

function formatLabel(value?: string | null) {
  if (!value) return 'Not provided';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, letter => letter.toUpperCase());
}

function formatDate(value?: string | Date | null) {
  if (!value) return 'Not provided';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function shortId(value?: string | null) {
  if (!value) return 'Unknown';
  return value.slice(0, 8);
}

function getJobProgramUuid(job: ClassMarketplaceJobWithProgram) {
  return job.program_uuid ?? null;
}

function getContentLabel({
  courseUuid,
  programUuid,
  courseMap,
  programMap,
}: {
  courseUuid?: string | null;
  programUuid?: string | null;
  courseMap: ReturnType<typeof useCoursesByIds>['courseMap'];
  programMap: ReturnType<typeof useProgramsByIds>['programMap'];
}) {
  if (programUuid) {
    return programMap[programUuid]?.title ?? `Program ${shortId(programUuid)}`;
  }

  if (courseUuid) {
    return courseMap[courseUuid]?.name ?? `Course ${shortId(courseUuid)}`;
  }

  return 'Course or program';
}

function ClassBoardStats({
  totalClasses,
  activeClasses,
  openJobs,
  upcomingClasses,
}: {
  totalClasses: number;
  activeClasses: number;
  openJobs: number;
  upcomingClasses: number;
}) {
  const stats = [
    { label: 'Classes', value: totalClasses, icon: GraduationCap },
    { label: 'Active', value: activeClasses, icon: CheckCircle2 },
    { label: 'Open Jobs', value: openJobs, icon: BriefcaseBusiness },
    { label: 'Upcoming', value: upcomingClasses, icon: CalendarDays },
  ];

  return (
    <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      {stats.map(stat => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className='rounded-[14px] border border-border bg-card p-4'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  {stat.label}
                </p>
                <p className='mt-2 text-2xl font-semibold text-foreground'>{stat.value}</p>
              </div>
              <span className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                <Icon className='size-5' />
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className='grid gap-3 lg:grid-cols-2'>
      {[0, 1, 2, 3].map(item => (
        <Skeleton key={item} className='h-48 rounded-[14px]' />
      ))}
    </div>
  );
}

function ClassesSection({
  classes,
  isLoading,
  error,
  onRetry,
  courseMap,
  programMap,
}: {
  classes: ClassDefinition[];
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  courseMap: ReturnType<typeof useCoursesByIds>['courseMap'];
  programMap: ReturnType<typeof useProgramsByIds>['programMap'];
}) {
  return (
    <AsyncSection
      loading={isLoading}
      error={error}
      empty={!classes.length}
      onRetry={onRetry}
      skeleton={<SectionSkeleton />}
      emptyState={
        <EmptyState
          icon={GraduationCap}
          title='No classes yet'
          description='Assigned marketplace jobs will appear here once an instructor is selected.'
          variant='compact'
        />
      }
    >
      <div className='grid gap-3 lg:grid-cols-2'>
        {classes.map(classDefinition => (
        <Card
          key={classDefinition.uuid}
          className='rounded-[14px] border border-border bg-card p-4'
        >
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h3 className='truncate text-base font-semibold text-foreground'>
                {classDefinition.title}
              </h3>
              <p className='mt-1 text-sm text-muted-foreground'>
                {getContentLabel({
                  courseUuid: classDefinition.course_uuid,
                  programUuid: classDefinition.program_uuid,
                  courseMap,
                  programMap,
                })}
              </p>
            </div>
            <Badge variant={classDefinition.is_active ? 'success' : 'secondary'}>
              {classDefinition.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className='mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2'>
            <span className='inline-flex items-center gap-2'>
              <CalendarDays className='size-4 text-primary' />
              {formatDate(classDefinition.default_start_time)}
            </span>
            <span className='inline-flex items-center gap-2'>
              <MapPin className='size-4 text-primary' />
              {classDefinition.location_name || formatLabel(classDefinition.location_type)}
            </span>
            <span className='inline-flex items-center gap-2'>
              <Users className='size-4 text-primary' />
              {classDefinition.capacity_info ??
                (typeof classDefinition.max_participants === 'number'
                  ? `${classDefinition.max_participants} participants`
                  : 'Capacity not set')}
            </span>
            <span>{formatLabel(classDefinition.session_format)}</span>
          </div>

          {classDefinition.uuid ? (
            <div className='mt-4 flex justify-end border-t border-border/60 pt-3'>
              <EnrollStudentDialog
                classDefinitionUuid={classDefinition.uuid}
                classTitle={classDefinition.title ?? 'this class'}
              />
            </div>
          ) : null}
        </Card>
        ))}
      </div>
    </AsyncSection>
  );
}

function JobsSection({
  jobs,
  isLoading,
  error,
  onRetry,
  courseMap,
  programMap,
}: {
  jobs: ClassMarketplaceJobWithProgram[];
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
  courseMap: ReturnType<typeof useCoursesByIds>['courseMap'];
  programMap: ReturnType<typeof useProgramsByIds>['programMap'];
}) {
  return (
    <AsyncSection
      loading={isLoading}
      error={error}
      empty={!jobs.length}
      onRetry={onRetry}
      skeleton={<SectionSkeleton />}
      emptyState={
        <EmptyState
          icon={BriefcaseBusiness}
          title='No open classes'
          description='Create a class for an approved course; instructors can then apply and you assign one.'
          action={
            <Button asChild variant='outline'>
              <Link href='/dashboard/classes/new'>Create class</Link>
            </Button>
          }
          variant='compact'
        />
      }
    >
      <div className='grid gap-3 lg:grid-cols-2'>
        {jobs.map(job => (
        <Card key={job.uuid} className='rounded-[14px] border border-border bg-card p-4'>
          {job.thumbnail_url ? (
            <img
              src={job.thumbnail_url}
              alt={job.title ?? 'Class thumbnail'}
              className='mb-3 h-32 w-full rounded-[10px] object-cover'
            />
          ) : null}
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h3 className='truncate text-base font-semibold text-foreground'>
                {job.title ?? 'Untitled job'}
              </h3>
              <p className='mt-1 text-sm text-muted-foreground'>
                {getContentLabel({
                  courseUuid: job.course_uuid,
                  programUuid: getJobProgramUuid(job),
                  courseMap,
                  programMap,
                })}
              </p>
            </div>
            <Badge variant={job.status === 'open' ? 'secondary' : 'outline'}>
              {formatLabel(job.status)}
            </Badge>
          </div>

          <div className='mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2'>
            <span className='inline-flex items-center gap-2'>
              <CalendarDays className='size-4 text-primary' />
              {formatDate(job.default_start_time)}
            </span>
            <span className='inline-flex items-center gap-2'>
              <MapPin className='size-4 text-primary' />
              {job.location_name || formatLabel(job.location_type)}
            </span>
          </div>

          <div className='mt-4 flex flex-wrap gap-2'>
            {job.uuid ? (
              <Button asChild variant='outline' className='rounded-xl'>
                <Link href={`/dashboard/opportunities/${job.uuid}`}>View applications</Link>
              </Button>
            ) : null}
            <Button asChild variant='secondary' className='rounded-xl'>
              <Link href='/dashboard/opportunities'>Manage jobs</Link>
            </Button>
          </div>
        </Card>
        ))}
      </div>
    </AsyncSection>
  );
}

export default function ClassroomList() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({
      path: { organisationUuid },
    }),
    enabled: Boolean(organisationUuid),
  });

  const jobsQuery = useQuery({
    ...listJobsOptions({
      query: {
        organisation_uuid: organisationUuid,
        pageable: { page: 0, size: CLASS_JOB_PAGE_SIZE },
      },
    }),
    enabled: Boolean(organisationUuid),
  });

  const classes = useMemo(
    () =>
      (classesQuery.data?.data ?? [])
        .map(item => item.class_definition)
        .filter((item): item is ClassDefinition => Boolean(item?.uuid)),
    [classesQuery.data]
  );
  const jobs: ClassMarketplaceJobWithProgram[] = jobsQuery.data?.data?.content ?? [];

  const courseIds = useMemo(
    () => [
      ...classes.map(classDefinition => classDefinition.course_uuid ?? ''),
      ...jobs.map(job => job.course_uuid ?? ''),
    ],
    [classes, jobs]
  );
  const programIds = useMemo(
    () => [
      ...classes.map(classDefinition => classDefinition.program_uuid ?? ''),
      ...jobs.map(job => getJobProgramUuid(job) ?? ''),
    ],
    [classes, jobs]
  );
  const { courseMap } = useCoursesByIds(courseIds);
  const { programMap } = useProgramsByIds(programIds);

  const now = Date.now();
  const activeClasses = classes.filter(classDefinition => classDefinition.is_active).length;
  const upcomingClasses = classes.filter(classDefinition => {
    const start = classDefinition.default_start_time
      ? new Date(classDefinition.default_start_time).getTime()
      : 0;
    return start > now;
  }).length;
  const openJobs = jobs.filter(job => job.status === 'open');

  if (!organisationUuid) {
    return (
      <div className='mx-auto w-full max-w-3xl p-4 sm:p-6'>
        <EmptyState
          icon={GraduationCap}
          title='Organisation profile not available'
          description='An active organisation profile is required before classes can be reviewed.'
          variant='card'
        />
      </div>
    );
  }

  return (
    <main className='mx-auto w-full max-w-[1560px] space-y-6 px-3 py-4 sm:px-5 lg:px-7'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Classes</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Track assigned classes and the class jobs waiting for instructor applications.
          </p>
        </div>
        <Button asChild>
          <Link href='/dashboard/classes/new'>
            <Plus className='mr-2 size-4' />
            Create class
          </Link>
        </Button>
      </div>

      <ClassBoardStats
        totalClasses={classes.length}
        activeClasses={activeClasses}
        openJobs={openJobs.length}
        upcomingClasses={upcomingClasses}
      />

      <section className='space-y-3'>
        <div>
          <h2 className='text-lg font-semibold text-foreground'>Assigned classes</h2>
          <p className='text-sm text-muted-foreground'>
            Classes created after an approved instructor application is assigned.
          </p>
        </div>
        <ClassesSection
          classes={classes}
          isLoading={classesQuery.isLoading && !classesQuery.data}
          error={classesQuery.isError ? classesQuery.error : undefined}
          onRetry={classesQuery.refetch}
          courseMap={courseMap}
          programMap={programMap}
        />
      </section>

      <section className='space-y-3'>
        <div>
          <h2 className='text-lg font-semibold text-foreground'>Class jobs</h2>
          <p className='text-sm text-muted-foreground'>
            Open and historical marketplace adverts owned by this organisation.
          </p>
        </div>
        <JobsSection
          jobs={jobs}
          isLoading={jobsQuery.isLoading && !jobsQuery.data}
          error={jobsQuery.isError ? jobsQuery.error : undefined}
          onRetry={jobsQuery.refetch}
          courseMap={courseMap}
          programMap={programMap}
        />
      </section>
    </main>
  );
}
