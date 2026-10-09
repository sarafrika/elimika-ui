'use client';

import { useQuery } from '@tanstack/react-query';
import { ListChecks } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { getCoursePrerequisitesOptions } from '@/services/client/@tanstack/react-query.gen';
import type { CoursePrerequisite } from '@/services/client/types.gen';

/**
 * A learner-facing note of the courses to take first (`GET /courses/{uuid}/prerequisites`):
 * "Complete X first" for required ones, "Recommended: X" for the rest. Renders nothing
 * when the course has none, or when the list cannot be read; it is guidance, not a gate.
 */
export function CoursePrerequisitesNotice({
  courseUuid,
  hrefFor,
  className,
}: {
  courseUuid: string | null | undefined;
  /** Where a prerequisite course opens for this viewer's dashboard. */
  hrefFor: (courseUuid: string) => string;
  className?: string;
}) {
  const query = useQuery({
    ...getCoursePrerequisitesOptions({ path: { uuid: courseUuid ?? '' } }),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
  });

  if (!courseUuid) return null;
  if (query.isLoading) {
    return <Skeleton className={cn('h-14 w-full rounded-xl', className)} />;
  }

  const items = (query.data?.data ?? []).filter(
    (item): item is CoursePrerequisite & { prerequisite_course_uuid: string } =>
      Boolean(item.prerequisite_course_uuid)
  );
  if (items.length === 0) return null;

  const required = items.filter(item => item.is_mandatory !== false);
  const recommended = items.filter(item => item.is_mandatory === false);

  const courseLink = (item: CoursePrerequisite & { prerequisite_course_uuid: string }) => (
    <Link
      href={hrefFor(item.prerequisite_course_uuid)}
      className='text-primary font-medium underline-offset-4 hover:underline'
    >
      {item.prerequisite_course_name ?? 'this course'}
    </Link>
  );

  return (
    <section
      aria-label='Course prerequisites'
      className={cn('border-border bg-muted/40 flex gap-3 rounded-xl border p-4', className)}
    >
      <ListChecks className='text-primary mt-0.5 size-5 shrink-0' aria-hidden />
      <div className='min-w-0 space-y-1.5 text-sm'>
        <p className='font-medium'>Before you start</p>
        <ul className='space-y-1'>
          {required.map(item => (
            <li key={item.prerequisite_course_uuid}>Complete {courseLink(item)} first</li>
          ))}
          {recommended.map(item => (
            <li key={item.prerequisite_course_uuid} className='text-muted-foreground'>
              Recommended: {courseLink(item)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
