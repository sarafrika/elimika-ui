'use client';

import { CalendarDays, Clock3, GraduationCap, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';

import { useClassesByIds } from '../../../../../hooks/use-batched-lookups';
import { ClassDefinition } from '../../../../../services/client';
import { formatSessionSchedule } from '../../../../../src/features/dashboard/courses/components/availability-listing-layout';
import { stripHtml } from '../../../../../src/features/dashboard/courses/shared/_components/courses-data';
import { toAuthenticatedMediaUrl } from '../../../../../src/lib/media-url';
import type {
  LearningHubClassEnrollment,
  LearningHubData,
} from './useStudentLearningHubData';

type ClassFilter = 'all' | 'upcoming' | 'active' | 'completed';
type ClassDefinitionMap = Record<string, ClassDefinition>;

const CLASS_FILTERS: Array<{ id: ClassFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

interface LessonHubMyClassesTabProps {
  learningHubData: LearningHubData;
}

const getProgress = (item: LearningHubClassEnrollment, classDefinitionMap: ClassDefinitionMap) =>
  classDefinitionMap?.[item.class_definition_uuid]?.class_progress_percentage;

const isCompleted = (item: LearningHubClassEnrollment, classDefinitionMap: ClassDefinitionMap) => {
  const progress = getProgress(item, classDefinitionMap);
  if (progress != null) return progress === 100;
  return String(item.latest_enrollment_status ?? '').toUpperCase() === 'ATTENDED';
};

const isUpcoming = (item: LearningHubClassEnrollment, classDefinitionMap: ClassDefinitionMap) => {
  const progress = getProgress(item, classDefinitionMap);
  if (progress != null) return progress === 0;

  if (!item.latest_scheduled_instance_start_time) return false;
  const start = new Date(item.latest_scheduled_instance_start_time).getTime();
  return !Number.isNaN(start) && start > Date.now();
};

const isActive = (item: LearningHubClassEnrollment, classDefinitionMap: ClassDefinitionMap) => {
  const progress = getProgress(item, classDefinitionMap);
  if (progress != null) return progress > 0 && progress < 100;

  return (
    !isUpcoming(item, classDefinitionMap) &&
    !isCompleted(item, classDefinitionMap) &&
    String(item.latest_enrollment_status ?? '').toUpperCase() !== 'CANCELLED'
  );
};

export function LessonHubMyClassesTab({ learningHubData }: LessonHubMyClassesTabProps) {
  const [filter, setFilter] = useState<ClassFilter>('all');
  const rows = learningHubData.classEnrollments;

  const classDefinitionUuids = useMemo(
    () => Array.from(new Set(rows.map(r => r.class_definition_uuid).filter(Boolean))),
    [rows]
  );
  const { classDefinitionMap } = useClassesByIds(classDefinitionUuids);

  const totals = {
    all: learningHubData.classEnrollmentCount || rows.length,
    upcoming: rows.filter(item => isUpcoming(item, classDefinitionMap)).length,
    active: rows.filter(item => isActive(item, classDefinitionMap)).length,
    completed: rows.filter(item => isCompleted(item, classDefinitionMap)).length,
  };

  const filteredRows = useMemo(() => {
    switch (filter) {
      case 'upcoming':
        return rows.filter(item => isUpcoming(item, classDefinitionMap));
      case 'active':
        return rows.filter(item => isActive(item, classDefinitionMap));
      case 'completed':
        return rows.filter(item => isCompleted(item, classDefinitionMap));
      case 'all':
      default:
        return rows;
    }
  }, [filter, rows, classDefinitionMap]);

  const truncated = learningHubData.classEnrollmentCount > rows.length;

  if (learningHubData.loading) {
    return <ClassTabSkeleton />;
  }

  return (
    <div className='space-y-5'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-foreground text-lg font-semibold'>My Classes</h2>
          <p className='text-muted-foreground text-sm'>
            Review your enrolled classes, upcoming sessions, and recent activity.
          </p>
        </div>
        <div className='text-muted-foreground text-sm'>
          {truncated
            ? `Showing ${rows.length} of ${learningHubData.classEnrollmentCount}`
            : `${rows.length} enrolled class${rows.length === 1 ? '' : 'es'}`}
        </div>
      </div>

      <div className='flex flex-wrap gap-2'>
        {CLASS_FILTERS.map(item => {
          const active = item.id === filter;

          return (
            <Button
              key={item.id}
              type='button'
              size='sm'
              variant={active ? 'default' : 'outline'}
              onClick={() => setFilter(item.id)}
              className={cn('rounded-full', active && 'shadow-sm')}
            >
              {item.label}
              <span className='text-muted-foreground ml-2 tabular-nums'>
                ({totals[item.id]})
              </span>
            </Button>
          );
        })}
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState
          variant='plain'
          icon={Users}
          title='No classes in this view'
          description='Try another filter or visit the schedule to see your class sessions.'
          action={
            <Button asChild>
              <Link href='/dashboard/student/schedule'>
                Open schedule
              </Link>
            </Button>
          }
        />
      ) : (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {filteredRows.map(item => (
            <ClassCard key={item.id} item={item} classDefinitionMap={classDefinitionMap} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClassCard({
  item,
  classDefinitionMap,
}: {
  item: LearningHubClassEnrollment;
  classDefinitionMap: ClassDefinitionMap;
}) {
  const classObj = classDefinitionMap?.[item.class_definition_uuid];

  const upcoming = isUpcoming(item, classDefinitionMap);
  const completed = isCompleted(item, classDefinitionMap);
  const active = isActive(item, classDefinitionMap)

  return (
    <Card className='pt-0 pb-4 border-border/70 bg-card overflow-hidden shadow-sm transition-shadow hover:shadow-md'>
      <div
        className={`relative flex h-28 items-end justify-between bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 p-4 ${classObj?.thumbnail_url ? 'overflow-hidden' : ''
          }`}
      >
        {classObj?.thumbnail_url && (
          <img
            src={toAuthenticatedMediaUrl(classObj.thumbnail_url)!}
            alt={item.class_title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {classObj?.thumbnail_url && (
          <div className="absolute inset-0 bg-black/10" />
        )}

        <div className="bg-background/90 border-border/70 relative z-10 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur">
          <GraduationCap className="text-primary h-5 w-5" />
        </div>
        <Badge
          variant={
            completed
              ? 'success'
              : active
                ? 'default'
                : upcoming
                  ? 'outline'
                  : 'secondary'
          }
          className="relative z-10 shadow-sm"
        >
          {completed ? "Completed" : active ? "In Progress" : upcoming ? "Not started" : ""}
        </Badge>
      </div>

      <CardHeader className='space-y-2'>
        <CardTitle className="line-clamp-2 text-base">
          {item.class_definition_uuid === classObj?.uuid
            ? classObj?.title
            : item.class_title ?? ""}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {stripHtml(classObj?.description) ||
            (completed
              ? 'This class has been completed. You can revisit the learning hub or schedule.'
              : 'Check session timing, recent activity, and the latest enrolment status.')}
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-2 text-sm'>
          <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />

            <div
              className="min-w-0 line-clamp-2 text-sm leading-5"
              title={`${item.latestStartLabel}, ${item.sessionCountLabel}`}
            >
              <span>{item.latestStartLabel}</span>
              <span className="mx-1">·</span>
              <span>{item.sessionCountLabel}</span>
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />

            <span
              className="min-w-0 line-clamp-2 text-sm leading-5"
              title={formatSessionSchedule(classObj?.session_templates)}
            >
              {formatSessionSchedule(classObj?.session_templates)}
            </span>
          </div>

          <div className="text-muted-foreground inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />

            {classObj?.location_type?.toUpperCase() === "ONLINE" ? (
              classObj?.meeting_link ? (
                <a
                  href={classObj?.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {classObj?.meeting_link}
                </a>
              ) : (
                <span>Online</span>
              )
            ) : (
              <span>{classObj?.location_name ?? "Location not specified"}</span>
            )}
          </div>
        </div>

        <div className='flex flex-wrap items-center justify-between gap-2'>
          <Badge variant='outline' className='rounded-full text-success'>
            {classObj?.session_format}
          </Badge>

          <span className='min-w-0 line-clamp-2 text-sm leading-5 text-muted-foreground'>
            {classObj?.class_progress_percentage}% completed
          </span>
        </div>

        <div className='flex flex-wrap gap-2 pt-1'>
          <Button asChild size={"sm"} className='min-w-32 text-[13px]'>
            <Link href={item.href}>
              Open class
            </Link>
          </Button>
          <Button asChild variant='outline' size={'sm'} className='min-w-32 text-[13px]'>
            <Link href='/dashboard/student/calendar'>
              View schedule
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ClassTabSkeleton() {
  return (
    <div className='space-y-5'>
      <div className='space-y-2'>
        <Skeleton className='h-6 w-40' />
        <Skeleton className='h-4 w-full max-w-xl' />
      </div>

      <div className='flex flex-wrap gap-2'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-9 w-28 rounded-full' />
        ))}
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className='border-border/70'>
            <Skeleton className='h-24 w-full rounded-b-none rounded-t-lg' />
            <CardHeader className='space-y-2'>
              <Skeleton className='h-5 w-3/4' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
            </CardHeader>
            <CardContent className='space-y-3'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
              <div className='flex gap-2'>
                <Skeleton className='h-9 w-32 rounded-md' />
                <Skeleton className='h-9 w-32 rounded-md' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}